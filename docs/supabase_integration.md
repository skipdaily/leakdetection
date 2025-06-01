# Supabase Integration for Leak Detection Website

This document provides instructions on how to integrate the Leak Detection website with your Supabase database.

## Prerequisites

1. Node.js and npm installed
2. A Supabase account and project set up
3. Your Supabase connection details

## Setup Instructions

### 1. Create the Database Schema

1. Login to your Supabase dashboard
2. Go to the SQL Editor
3. Copy and paste the contents of `docs/database_schema.sql` into the SQL Editor
4. Execute the SQL to create all necessary tables and functions

### 2. Configure Environment Variables

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Edit the `.env` file with your Supabase credentials:
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

### 3. Install Dependencies and Start the Server

Run the setup script:
```bash
./setup.sh
```

Or manually:
```bash
npm install
npm start
```

## Testing the Integration

1. Fill out the form on the Schedule page
2. Submit the form
3. Check your email for the submission
4. Verify the data was saved in Supabase

## Viewing Submissions in Supabase

1. Login to your Supabase dashboard
2. Go to the Table Editor
3. View the `service_requests` table to see all submissions
4. Use the SQL Editor to query the `complete_service_requests` view:
   ```sql
   SELECT * FROM complete_service_requests ORDER BY created_at DESC;
   ```

## Troubleshooting

If you encounter issues:

1. Check the server logs for error messages
2. Verify your Supabase credentials in the `.env` file
3. Make sure the database schema was created correctly
4. Ensure the email service is properly configured

## Admin Interface

A simple admin interface is available at `/admin/index.html`. This allows you to:

1. View all form submissions
2. Filter and search submissions
3. Update the status of submissions (pending, confirmed, completed, cancelled)

To access the admin interface, you need to be authenticated with Supabase.
