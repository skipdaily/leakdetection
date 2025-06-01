# Leak Detection Form Submission System

This document provides instructions for setting up and using the form submission functionality for the Leak Detection website.

## Overview

The form submission system allows customers to schedule leak detection services and saves their information to a Supabase database. It includes:

1. Client-side form validation
2. Email notifications when forms are submitted
3. Database storage for all form submissions
4. Admin dashboard to manage submissions

## Quick Start

For the quickest setup, simply run:

```bash
./run.sh
```

This script will:
1. Check if the `.env` file exists and create it if needed
2. Install dependencies
3. Offer to apply the Supabase schema
4. Start the server

## Database Setup

### 1. Supabase Setup

1. Create a [Supabase](https://supabase.com/) account if you don't have one
2. Create a new project in Supabase
3. Go to the SQL Editor in Supabase
4. Copy the contents of `docs/database_schema.sql` and run it in the SQL Editor
5. Or use our automated script:
   ```bash
   ./scripts/apply-schema.sh
   ```
6. Note your Supabase URL and anon key (found in Project Settings > API)
### 2. Environment Variables

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Edit the `.env` file with your credentials:
   ```
   SUPABASE_URL=https://dglezauqqxybwiyfiriz.supabase.co
   SUPABASE_KEY=your-supabase-anon-key
   SUPABASE_SERVICE_KEY=your-supabase-service-key
   
   EMAIL_SERVICE=gmail
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-app-password
   EMAIL_RECIPIENT=tomgouldmaui@gmail.com
   
   PORT=3000
   ```

## Running the Server

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the server:
   ```bash
   npm start
   ```

Or simply use the provided script:
```bash
./run.sh
```

## Deployment Options

### Option 1: EmailJS (Simple, Client-Side Only)

This option requires no backend server and is used as a fallback:

1. Create an [EmailJS](https://www.emailjs.com/) account
2. Follow the instructions in `docs/emailjs-setup.html`
3. Update the EmailJS configuration in `schedule.html`

### Option 2: Node.js Server (Included)

Our project already includes a Node.js server setup:

1. Make sure you've configured the `.env` file
2. Start the server:
   ```bash
   npm start
   ```
3. The server will handle form submissions at `/api/submit-form`

### Option 3: Serverless Functions (Production Recommended)

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
