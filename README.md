# Leak Detection Website

A comprehensive website for a professional leak detection service that allows users to schedule inspections for water leaks, gas leaks, and carbon monoxide detection.

## Features

- **Service Selection**: Users can select individual services or choose a comprehensive package with a discount
- **Dynamic Pricing**: Real-time price calculation based on service type, property size, and other factors
- **Appointment Scheduling**: Users can select date, time, and provide special instructions
- **Form Submission**: Email notifications and database storage of all form submissions
- **Admin Dashboard**: Manage service requests and customers
- **Mobile Responsive**: Fully responsive design for all device sizes
- **Emergency Contact**: Quick access to emergency services

## Technologies Used

- HTML5
- CSS3 with Tailwind CSS
- JavaScript (vanilla)
- Node.js and Express for the server
- Supabase for database storage
- EmailJS as a fallback for form submission
- Nodemailer for email notifications
- Responsive Design

## Pages

- Home (index.html)
- Find Your Service (find-service.html)
- How It Works (how-it-works.html)
- Resources (resources.html)
- Emergency (emergency.html)
- Schedule Inspection (schedule.html)
- Admin Dashboard (admin/index.html)

## Setup

### Quick Start

Run the setup script to install dependencies, configure environment, and start the server:

```bash
./run.sh
```

Then visit `http://localhost:3000` in your browser.

### Manual Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create `.env` file:
   ```bash
   cp .env.example .env
   ```
   Then edit with your Supabase credentials:
   ```
   SUPABASE_URL=https://dglezauqqxybwiyfiriz.supabase.co
   SUPABASE_KEY=your-supabase-anon-key
   SUPABASE_SERVICE_KEY=your-supabase-service-key
   ```

3. Apply the database schema to Supabase:
   ```bash
   ./scripts/apply-schema.sh
   ```

4. Start the server:
   ```bash
   npm start
   ```

### Admin Dashboard

The admin dashboard allows you to manage service requests and customers:

1. Set up authentication in Supabase as described in the documentation
2. Access the admin dashboard at `/admin/index.html`

## Documentation

- `docs/form_submission_setup.md` - Instructions for setting up form submission
- `docs/emailjs-setup.html` - EmailJS configuration guide
- `docs/database_schema.sql` - SQL schema for the database
- `docs/supabase-setup.md` - Supabase configuration guide

## License

© 2025 Leak Detection. All rights reserved.
