# Leak Detection Form Submission System

This document provides instructions for setting up and using the form submission functionality for the Leak Detection website.

## Overview

The form submission system allows customers to schedule leak detection services and saves their information to a Supabase database. It includes:

1. Client-side form validation
2. Email notifications when forms are submitted
3. Database storage for all form submissions
4. Admin dashboard to manage submissions

## Database Setup

### 1. Supabase Setup

1. Create a [Supabase](https://supabase.com/) account if you don't have one
2. Create a new project in Supabase
3. Go to the SQL Editor in Supabase
4. Copy the contents of `docs/database_schema.sql` and run it in the SQL Editor
5. Note your Supabase URL and anon key (found in Project Settings > API)

### 2. Update API Configuration

1. Open `api/submit-form.js`
2. Replace the placeholder values with your actual Supabase credentials:
   ```javascript
   const SUPABASE_URL = 'your-supabase-url';
   const SUPABASE_KEY = 'your-supabase-anon-key';
   ```

3. Set up email configuration:
   ```javascript
   const transporter = nodemailer.createTransport({
     service: 'gmail',
     auth: {
       user: 'your-email@gmail.com', // Replace with your email
       pass: 'your-app-password'     // Replace with your app password
     }
   });
   ```

## Deployment Options

### Option 1: EmailJS (Simple, Client-Side Only)

This option requires no backend server:

1. Create an [EmailJS](https://www.emailjs.com/) account
2. Follow the instructions in `docs/emailjs-setup.html`
3. Update the EmailJS configuration in `schedule.html`

### Option 2: Node.js Server with API Endpoint

1. Install Node.js dependencies:
   ```bash
   npm init -y
   npm install express nodemailer @supabase/supabase-js cors dotenv
   ```

2. Create a `.env` file with your credentials:
   ```
   SUPABASE_URL=your-supabase-url
   SUPABASE_KEY=your-supabase-anon-key
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-app-password
   ```

3. Create a server.js file:
   ```javascript
   const express = require('express');
   const cors = require('cors');
   const { handler } = require('./api/submit-form');
   
   const app = express();
   const PORT = process.env.PORT || 3001;
   
   app.use(cors());
   app.use(express.json());
   
   app.post('/api/submit-form', async (req, res) => {
     try {
       const result = await handler({ body: JSON.stringify(req.body) });
       res.status(result.statusCode).json(JSON.parse(result.body));
     } catch (error) {
       res.status(500).json({ error: error.message });
     }
   });
   
   app.listen(PORT, () => {
     console.log(`Server running on port ${PORT}`);
   });
   ```

4. Start the server:
   ```bash
   node server.js
   ```

### Option 3: Serverless Functions (Recommended)

Deploy the API endpoint as a serverless function:

1. **Vercel**:
   - Create a `vercel.json` file with:
     ```json
     {
       "version": 2,
       "functions": {
         "api/submit-form.js": {
           "memory": 1024,
           "maxDuration": 10
         }
       },
       "routes": [
         {
           "src": "/api/submit-form",
           "dest": "/api/submit-form.js"
         }
       ]
     }
     ```
   - Deploy to Vercel: `vercel`

2. **Netlify**:
   - Create a `netlify.toml` file with:
     ```toml
     [functions]
       directory = "api"
     
     [[redirects]]
       from = "/api/*"
       to = "/.netlify/functions/:splat"
       status = 200
     ```
   - Deploy to Netlify: `netlify deploy`

## Admin Dashboard

The admin dashboard allows you to view and manage form submissions:

1. Set up authentication in Supabase:
   - Go to Authentication > Settings
   - Set up Email Provider
   - Create a user in Authentication > Users

2. Update admin dashboard credentials:
   - Open `admin/index.html`
   - Replace the placeholder values with your Supabase credentials:
     ```javascript
     const supabaseUrl = 'YOUR_SUPABASE_URL';
     const supabaseKey = 'YOUR_SUPABASE_ANON_KEY';
     ```

3. Access the admin dashboard at `/admin`
   - Log in with the email and password you created in Supabase

## Fallback Email Method

If both the API endpoint and EmailJS fail, the system will fall back to opening the user's email client with the form data pre-filled. This ensures that the form submission is always captured in some way.

## Troubleshooting

- **Form not submitting**: Check browser console for errors
- **Emails not sending**: Verify email credentials and check spam folder
- **Database errors**: Check Supabase credentials and logs

## Need Help?

Contact: tomgouldmaui@gmail.com
