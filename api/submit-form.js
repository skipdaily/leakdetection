// API endpoint to handle form submissions
// This file would typically be hosted on a server (Node.js, Vercel, Netlify, etc.)

const nodemailer = require('nodemailer');
const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
// Replace these with your actual Supabase credentials
const SUPABASE_URL = 'your-supabase-url';
const SUPABASE_KEY = 'your-supabase-anon-key';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Create a nodemailer transporter for sending emails
// This is configured for Gmail, but you can use any email service
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'your-email@gmail.com', // Replace with your email
    pass: 'your-app-password'     // Replace with your app password (not your regular password)
  }
});

// Handler function for form submission
exports.handler = async function(event, context) {
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
    // Insert the form data into a 'service_requests' table
    const { data, error } = await supabase
      .from('service_requests')
      .insert([
        {
          services: formData.services,
          property: formData.property,
          appointment: formData.appointment,
          contact: formData.contact,
          pricing: formData.pricing,
          created_at: new Date().toISOString()
        }
      ]);
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error saving to Supabase:', error);
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
