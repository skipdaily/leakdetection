/**
 * Serverless function handler for form submissions
 * This file is designed to be deployed to serverless platforms like Vercel, Netlify, etc.
 */

const nodemailer = require('nodemailer');
const { createClient } = require('@supabase/supabase-js');

// Load environment variables
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const supabase = SUPABASE_URL && SUPABASE_KEY ? createClient(SUPABASE_URL, SUPABASE_KEY) : null;

// Handler function for form submission
exports.handler = async function (event, context) {
  try {
    // Parse the request body
    const body = JSON.parse(event.body);

    // Save to Supabase if configured
    let dbResponse = null;
    if (supabase) {
      dbResponse = await saveToSupabase(body);
    }

    // Send email if configured
    let emailResponse = null;
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      emailResponse = await sendEmail(body);
    }

    // Return success response
    return {
      statusCode: 200,
      body: JSON.stringify({ 
        message: 'Form submitted successfully',
        dbSaved: !!dbResponse,
        emailSent: !!emailResponse
      })
    };
  } catch (error) {
    console.error('Error processing form submission:', error);

    // Return error response
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        message: 'Error processing form submission', 
        error: error.message 
      })
    };
  }
};

// Function to send email
async function sendEmail(formData) {
  // Create a nodemailer transporter
  const transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  // Format the email content
  const emailContent = formatEmailContent(formData);

  // Configure email options
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: process.env.EMAIL_RECIPIENT || process.env.EMAIL_USER,
    subject: 'New Leak Detection Service Request',
    html: emailContent
  };

  // Send the email
  return await transporter.sendMail(mailOptions);
}

// Function to save data to Supabase
async function saveToSupabase(formData) {
  try {
    // Format services array
    const services = [];
    if (formData.services) {
      if (serviceAll.checked) {
        services.push('Comprehensive Package');
      } else {
        if (formData.services.includes('Water Leak Detection')) services.push('Water Leak Detection');
        if (formData.services.includes('Gas Leak Detection')) services.push('Gas Leak Detection');
        if (formData.services.includes('Carbon Monoxide Detection')) services.push('Carbon Monoxide Detection');
      }
    }

    // Call the stored procedure
    const { data, error } = await supabase.rpc('save_service_request', {
      p_first_name: formData.first_name,
      p_last_name: formData.last_name,
      p_email: formData.email,
      p_phone: formData.phone,
      p_street_address: formData.street_address,
      p_city: formData.city,
      p_zip_code: formData.zip_code,
      p_property_type: formData.property_type,
      p_property_size: formData.property_size,
      p_preferred_date: formData.preferred_date,
      p_preferred_time: formData.preferred_time,
      p_special_notes: formData.special_notes || '',
      p_how_heard: formData.how_heard || '',
      p_services: services,
      p_base_inspection_fee: formData.base_inspection_fee,
      p_service_type_fee: formData.service_type_fee,
      p_property_size_fee: formData.property_size_fee,
      p_weekend_fee: formData.weekend_fee,
      p_total_price: formData.total_price
    });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error saving to Supabase:', error);
    throw error;
  }
}

// Function to format email content
function formatEmailContent(formData) {
  return `
    <h1>New Leak Detection Service Request</h1>
    
    <h2>Customer Information</h2>
    <p><strong>Name:</strong> ${formData.first_name} ${formData.last_name}</p>
    <p><strong>Email:</strong> ${formData.email}</p>
    <p><strong>Phone:</strong> ${formData.phone}</p>
    <p><strong>How they heard about us:</strong> ${formData.how_heard || 'Not specified'}</p>
    
    <h2>Property Information</h2>
    <p><strong>Address:</strong> ${formData.street_address}, ${formData.city}, ${formData.zip_code}</p>
    <p><strong>Property Type:</strong> ${formData.property_type}</p>
    <p><strong>Property Size:</strong> ${formData.property_size}</p>
    
    <h2>Appointment Details</h2>
    <p><strong>Date:</strong> ${formData.preferred_date}</p>
    <p><strong>Time:</strong> ${formData.preferred_time}</p>
    <p><strong>Services Requested:</strong> ${formData.services.join(', ')}</p>
    <p><strong>Special Notes:</strong> ${formData.special_notes || 'None'}</p>
    
    <h2>Price Estimate</h2>
    <p><strong>Base Inspection Fee:</strong> $${formData.base_inspection_fee.toFixed(2)}</p>
    <p><strong>Service Fee:</strong> $${formData.service_type_fee.toFixed(2)}</p>
    <p><strong>Property Size Fee:</strong> $${formData.property_size_fee.toFixed(2)}</p>
    <p><strong>Weekend Fee:</strong> $${formData.weekend_fee.toFixed(2)}</p>
    <p><strong>Total Estimate:</strong> $${formData.total_price.toFixed(2)}</p>
  `;
}
