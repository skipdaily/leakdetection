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
- Supabase for database storage
- EmailJS for form submission
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

### Basic Setup

Simply clone the repository and open the HTML files in your browser, or serve it using a local development server.

```bash
# Example using Python's built-in HTTP server
python -m http.server 8000
```

Then navigate to `http://localhost:8000` in your browser.

### Form Submission Setup

To enable form submission functionality:

1. Follow the instructions in `docs/form_submission_setup.md` to set up the database
2. Configure EmailJS by following `docs/emailjs-setup.html`
3. Create the database tables using the SQL in `docs/database_schema.sql`

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
