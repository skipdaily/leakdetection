// API endpoint to handle form submissions
// This file would typically be hosted on a server (Node.js, Vercel, Netlify, etc.)

const nodemailer = require('nodemailer');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Supabase configuration
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://dglezauqqxybwiyfiriz.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_KEY || 'your-supabase-anon-key';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Create a nodemailer transporter for sending emails
// This is configured for Gmail, but you can use any email service
const transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: {
        user: process.env.EMAIL_USER || 'your-email@gmail.com', // Replace with your email
        pass: process.env.EMAIL_PASS || 'your-app-password'     // Replace with your app password (not your regular password)
    }
});

// Handler function for form submission
exports.handler = async function (event, context) {
    try {
        // Parse the request body
        const body = JSON.parse(event.body);

        // Send email
        await sendEmail(body);

        // Save to Supabase (optional)
        if (SUPABASE_URL && SUPABASE_KEY) {
            await saveToSupabase(body);
        }

        // Return success response
        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Form submitted successfully' })
        };
    } catch (error) {
        console.error('Error processing form submission:', error);

        // Return error response
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Error processing form submission', error: error.message })
        };
    }
};

// Function to send email
async function sendEmail(formData) {
    // Format the email content
    const emailContent = formatEmailContent(formData);

    // Configure email options
    const mailOptions = {
        from: 'your-email@gmail.com',  // Replace with your email
        to: formData.recipientEmail,
        subject: 'New Leak Detection Service Request',
        html: emailContent
    };

    // Send the email
    return new Promise((resolve, reject) => {
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error('Error sending email:', error);
                reject(error);
            } else {
                console.log('Email sent successfully:', info.response);
                resolve(info);
            }
        });
    });
}

// Function to save data to Supabase
async function saveToSupabase(formData) {
    try {
        // Create arrays of services
        const servicesList = [];
        if (formData.services.comprehensive) {
            servicesList.push('Comprehensive Package');
        } else {
            if (formData.services.water) servicesList.push('Water Leak Detection');
            if (formData.services.gas) servicesList.push('Gas Leak Detection');
            if (formData.services.co) servicesList.push('Carbon Monoxide Detection');
        }

        // Call the stored procedure to save all data in a transaction
        const { data, error } = await supabase.rpc('save_service_request', {
            p_first_name: formData.contact.firstName,
            p_last_name: formData.contact.lastName,
            p_email: formData.contact.email,
            p_phone: formData.contact.phone,
            p_street_address: formData.property.address,
            p_city: formData.property.city,
            p_zip_code: formData.property.zipCode,
            p_property_type: formData.property.type,
            p_property_size: formData.property.size,
            p_preferred_date: formData.appointment.date,
            p_preferred_time: formData.appointment.time,
            p_special_notes: formData.property.specialNotes || '',
            p_how_heard: formData.contact.howHeard || '',
            p_services: servicesList,
            p_base_inspection_fee: formData.pricing.baseInspectionFee,
            p_service_type_fee: formData.pricing.serviceTypeFee,
            p_property_size_fee: formData.pricing.propertySizeFee,
            p_weekend_fee: formData.pricing.weekendFee,
            p_total_price: formData.pricing.totalPrice
        });

        if (error) throw error;

        // Log the email
        await supabase
            .from('email_logs')
            .insert([{
                service_request_id: data,
                recipient: formData.recipientEmail,
                subject: 'New Leak Detection Service Request',
                message: JSON.stringify(formData, null, 2),
                status: 'sent'
            }]);

        return data;
    } catch (error) {
        console.error('Error saving to Supabase:', error);

        // Log the failed email
        try {
            await supabase
                .from('email_logs')
                .insert([{
                    recipient: formData.recipientEmail,
                    subject: 'New Leak Detection Service Request',
                    message: JSON.stringify(formData, null, 2),
                    status: 'failed',
                    error_message: error.message
                }]);
        } catch (logError) {
            console.error('Error logging failed email:', logError);
        }

        throw error;
    }
}

// Function to format email content
function formatEmailContent(formData) {
    // Get service types
    const services = [];
    if (formData.services.comprehensive) {
        services.push('Comprehensive Package (All Services)');
    } else {
        if (formData.services.water) services.push('Water Leak Detection');
        if (formData.services.gas) services.push('Gas Leak Detection');
        if (formData.services.co) services.push('Carbon Monoxide Detection');
    }

    // Format the email content
    return `
    <h1>New Leak Detection Service Request</h1>
    
    <h2>Customer Information</h2>
    <p><strong>Name:</strong> ${formData.contact.firstName} ${formData.contact.lastName}</p>
    <p><strong>Email:</strong> ${formData.contact.email}</p>
    <p><strong>Phone:</strong> ${formData.contact.phone}</p>
    <p><strong>How they heard about us:</strong> ${formData.contact.howHeard || 'Not specified'}</p>
    
    <h2>Property Information</h2>
    <p><strong>Address:</strong> ${formData.property.address}, ${formData.property.city}, ${formData.property.zipCode}</p>
    <p><strong>Property Type:</strong> ${formData.property.type}</p>
    <p><strong>Property Size:</strong> ${formData.property.size}</p>
    
    <h2>Appointment Details</h2>
    <p><strong>Date:</strong> ${formData.appointment.date}</p>
    <p><strong>Time:</strong> ${formData.appointment.time}</p>
    <p><strong>Services Requested:</strong> ${services.join(', ')}</p>
    <p><strong>Special Notes:</strong> ${formData.property.specialNotes || 'None'}</p>
    
    <h2>Price Estimate</h2>
    <p><strong>Base Inspection Fee:</strong> $${formData.pricing.baseInspectionFee.toFixed(2)}</p>
    <p><strong>Service Fee:</strong> $${formData.pricing.serviceTypeFee.toFixed(2)}</p>
    <p><strong>Property Size Fee:</strong> $${formData.pricing.propertySizeFee.toFixed(2)}</p>
    <p><strong>Weekend Fee:</strong> $${formData.pricing.weekendFee.toFixed(2)}</p>
    <p><strong>Total Estimate:</strong> $${formData.pricing.totalPrice.toFixed(2)}</p>
  `;
}
