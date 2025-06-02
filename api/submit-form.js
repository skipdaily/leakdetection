/**
 * Simple API endpoint for local development
 * 
 * To use this:
 * 1. Install Node.js if not already installed
 * 2. Run `npm install express cors` in the leakdetection directory
 * 3. Run `node api/submit-form.js` to start the API server
 */

const express = require('express');
const cors = require('cors');

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const nodemailer = require('nodemailer');

// Try to load environment variables if .env file exists
try {
  require('dotenv').config();
} catch (e) {
  console.log("No .env file found or dotenv not installed. Using default values.");
}

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS for local development
app.use(cors());
app.use(express.json());

// Serve static files from the root directory
app.use(express.static(path.join(__dirname, '..')));


// Initialize Supabase client
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// Initialize Nodemailer transporter
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// API endpoint to handle form submissions
app.post('/api/submit-form', async (req, res) => {
  const formData = req.body;
  console.log('Received form submission:', formData);

  // Save the form data to a JSON file (optional, for backup)
  try {
    const dataDir = path.join(__dirname, '../data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir);
    }
    const filename = `submission_${Date.now()}.json`;
    fs.writeFileSync(
      path.join(dataDir, filename),
      JSON.stringify(formData, null, 2)
    );
  } catch (err) {
    console.error('Failed to save local backup:', err);
  }

  // Transform nested form data to the flat structure Supabase expects
  // Map services to an array of service names
  const selectedServices = [];
  if (formData.services) {
    if (formData.services.water) selectedServices.push('Water Leak Detection');
    if (formData.services.gas) selectedServices.push('Gas Leak Detection');
    if (formData.services.co) selectedServices.push('Carbon Monoxide Detection');
    if (formData.services.comprehensive) selectedServices.push('Comprehensive Package');
  }
  
  console.log('Transformed data for Supabase:', {
    services: selectedServices,
    firstName: formData.contact?.firstName,
    lastName: formData.contact?.lastName,
    // Log other fields to help debug
  });
  
  // Insert into Supabase using the stored procedure
  let supabaseResult = null;
  try {
    const { data, error } = await supabase.rpc('save_service_request', {
      p_first_name: formData.contact?.firstName || '',
      p_last_name: formData.contact?.lastName || '',
      p_email: formData.contact?.email || '',
      p_phone: formData.contact?.phone || '',
      p_street_address: formData.property?.address || '',
      p_city: formData.property?.city || '',
      p_zip_code: formData.property?.zipCode || '',
      p_property_type: formData.property?.type || '',
      p_property_size: formData.property?.size || '',
      p_preferred_date: formData.appointment?.date || new Date().toISOString().split('T')[0],
      p_preferred_time: formData.appointment?.time || '',
      p_special_notes: formData.property?.specialNotes || '',
      p_how_heard: formData.contact?.howHeard || '',
      p_services: selectedServices,
      p_base_inspection_fee: formData.pricing?.baseInspectionFee || 0,
      p_service_type_fee: formData.pricing?.serviceTypeFee || 0,
      p_property_size_fee: formData.pricing?.propertySizeFee || 0,
      p_weekend_fee: formData.pricing?.weekendFee || 0,
      p_total_price: formData.pricing?.totalPrice || 0,
    });
    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ success: false, message: 'Database error', error });
    }
    supabaseResult = data;
  } catch (err) {
    console.error('Supabase exception:', err);
    return res.status(500).json({ success: false, message: 'Database exception', error: err });
  }

  // Send email notification
  let emailResult = null;
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_RECIPIENT,
      subject: 'New Leak Detection Schedule Form Submission',
      text: `A new schedule form was submitted:\n\n${JSON.stringify(formData, null, 2)}`,
    };
    emailResult = await transporter.sendMail(mailOptions);
    console.log('Email sent:', emailResult.response);
  } catch (err) {
    console.error('Email send error:', err);
    // Don't fail the whole request if email fails
  }

  res.json({
    success: true,
    message: 'Form submitted successfully',
    supabase_id: supabaseResult,
    email_sent: !!emailResult,
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Local development server running at http://localhost:${PORT}`);
  console.log(`Form submissions will be saved to the 'data' directory`);
});

// Test endpoint to check Supabase connection
app.get('/api/test-supabase', async (req, res) => {
  console.log('Testing Supabase connection...');
  try {
    const { data, error } = await supabase.from('customers').select('*').limit(5);
    if (error) {
      console.error('Supabase test error:', error);
      return res.status(500).json({ success: false, error });
    }
    console.log('Supabase connection successful!');
    console.log('Retrieved data:', data);
    res.json({ success: true, data });
  } catch (err) {
    console.error('Exception during Supabase test:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});
