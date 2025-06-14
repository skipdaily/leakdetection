# Leak Detection Website

A comprehensive website for a professional leak detection service that allows users to schedule inspections for water leaks, gas leaks, and carbon monoxide detection.

## Features

- **Service Selection**: Users can select individual services or choose a comprehensive package with a discount
- **Dynamic Pricing**: Real-time price calculation based on service type, property size, and other factors
- **Appointment Scheduling**: Users can select date, time, and provide special instructions
- **Form Submission**: Email notifications and database storage of all form submissions
- **Admin Dashboard**: Manage service requests and customers (no authentication required)
- **Mobile Responsive**: Fully responsive design for all device sizes
- **Emergency Contact**: Quick access to emergency services

## Technologies Used

- HTML5
- CSS3 with Tailwind CSS
- JavaScript (vanilla)
- Node.js and Express for the server
- EmailJS for form submission notifications
- Local JSON storage for form submissions
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

2. Create `.env` file (optional for email configuration):
   ```bash
   cp .env.example .env
   ```
   ```bash
3. Start the server:
   ```bash
   npm start
   ```

### Admin Dashboard

The admin dashboard allows you to manage service requests and customers without requiring any authentication. All submitted forms are stored locally and can be viewed and managed directly through the dashboard.

Access the admin dashboard at `/admin/index.html`

## Documentation

- `docs/form_submission_setup.md` - Instructions for setting up form submission
- `docs/emailjs-setup.html` - EmailJS configuration guide

## License

© 2025 Leak Detection. All rights reserved.

## Form Submission Troubleshooting

If you're experiencing issues with form submissions, here are some common solutions:

### EmailJS Configuration

1. **Check EmailJS Configuration**
   - Ensure the EmailJS service ID and template ID are correct in `js/schedule-form.js`
   - The current configuration points to: `dglezauqgxybwiyfriz.supabase.co`

2. **CORS Issues**
   - If you see "Failed to fetch" errors, it may be a CORS issue
   - Make sure your Supabase project has the correct allowed origins:
     - Go to Supabase Dashboard → Project Settings → API → CORS Origins
     - Add your domain (e.g., `http://localhost:3000`, `https://yoursite.com`)

3. **Database Permissions**
   - Check Row Level Security (RLS) policies in Supabase
   - Ensure anon users have INSERT permissions on the required tables

### Local Development

For local development, you can use the included API endpoint:

1. Install dependencies:
   ```
   npm install express cors
   ```

2. Start the local API server:
   ```
   node api/submit-form.js
   ```

3. Access the site at `http://localhost:3000`

Form submissions will be saved to the `data` directory when using the local API.

### Database Structure

The form is designed to work with the following Supabase database structure:

- `customers` - Customer information
- `addresses` - Property addresses
- `service_requests` - Main form submissions
- `service_request_services` - Service types for each request
- `service_types` - Available service types
- `property_types` - Available property types
- `property_sizes` - Available property sizes

See `docs/database_schema.sql` for the complete database schema.
