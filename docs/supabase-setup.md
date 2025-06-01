# Supabase Setup Guide for Leak Detection Form

This guide provides instructions for setting up Supabase to store form submissions from the Leak Detection website.

## Step 1: Create a Supabase Account

1. Go to [Supabase](https://supabase.com/) and sign up for an account
2. Create a new project and note your project URL and anon key

## Step 2: Create the Service Requests Table

Run the following SQL in the Supabase SQL editor:

```sql
-- Create a table for service requests
CREATE TABLE service_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  services JSONB NOT NULL,
  property JSONB NOT NULL,
  appointment JSONB NOT NULL,
  contact JSONB NOT NULL,
  pricing JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create a function to update the updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to call the function
CREATE TRIGGER update_service_requests_updated_at
BEFORE UPDATE ON service_requests
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE service_requests ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows only authenticated users to view
CREATE POLICY "Allow authenticated users to view" 
ON service_requests
FOR SELECT 
USING (auth.role() = 'authenticated');

-- Create a policy that allows anon users to insert
CREATE POLICY "Allow anon users to insert" 
ON service_requests
FOR INSERT 
TO anon
WITH CHECK (true);
```

## Step 3: Update Environment Variables

Add the following to your .env file:

```
SUPABASE_URL=your-supabase-url
SUPABASE_KEY=your-supabase-anon-key
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

## Step 4: Email Setup with Gmail

1. Use a Gmail account for sending emails
2. Create an App Password:
   - Go to [Google Account Security](https://myaccount.google.com/security)
   - Enable 2-Step Verification if not already enabled
   - Go to App Passwords
   - Select "Mail" as the app and "Other" as the device
   - Enter "Leak Detection" as the name
   - Copy the generated password and use it as EMAIL_PASS

## Step 5: Deploy the API

You can deploy the API endpoint using:

1. **Vercel**:
   - Sign up at [Vercel](https://vercel.com/)
   - Connect your GitHub repository
   - Set environment variables
   - Deploy

2. **Netlify**:
   - Sign up at [Netlify](https://www.netlify.com/)
   - Connect your GitHub repository
   - Set environment variables
   - Deploy

3. **Node.js/Express Server**:
   - Set up a simple Express server
   - Host on a service like Heroku, Digital Ocean, or AWS

## Step 6: Testing

Test the form submission by:

1. Filling out the form on the website
2. Check the email delivery
3. Verify data is stored in Supabase

## Step 7: Monitor and Maintain

1. Set up logging to monitor form submissions
2. Regularly check Supabase for data integrity
3. Update API keys and passwords periodically for security
