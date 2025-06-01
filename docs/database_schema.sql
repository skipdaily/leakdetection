-- Database Schema for Leak Detection Form Submissions
-- This SQL can be directly executed in Supabase SQL Editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create service_types table to store the different types of services
CREATE TABLE service_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  base_fee DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create property_types table
CREATE TABLE property_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  base_fee DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create property_sizes table
CREATE TABLE property_sizes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  size_range TEXT,
  additional_fee DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create customers table
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT customers_email_unique UNIQUE (email)
);

-- Create addresses table
CREATE TABLE addresses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID REFERENCES customers(id),
  street_address TEXT NOT NULL,
  city TEXT NOT NULL,
  zip_code TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create service_requests table (main form submissions)
CREATE TABLE service_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID REFERENCES customers(id) NOT NULL,
  address_id UUID REFERENCES addresses(id) NOT NULL,
  property_type_id UUID REFERENCES property_types(id) NOT NULL,
  property_size_id UUID REFERENCES property_sizes(id) NOT NULL,
  preferred_date DATE NOT NULL,
  preferred_time TEXT NOT NULL,
  special_notes TEXT,
  how_heard TEXT,
  terms_accepted BOOLEAN NOT NULL DEFAULT FALSE,
  base_inspection_fee DECIMAL(10, 2) NOT NULL,
  service_type_fee DECIMAL(10, 2) NOT NULL,
  property_size_fee DECIMAL(10, 2) NOT NULL,
  weekend_fee DECIMAL(10, 2) NOT NULL DEFAULT 0,
  total_price DECIMAL(10, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, confirmed, completed, cancelled
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create service_request_services junction table (for many-to-many relationship)
CREATE TABLE service_request_services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  service_request_id UUID REFERENCES service_requests(id) NOT NULL,
  service_type_id UUID REFERENCES service_types(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT service_request_services_unique UNIQUE (service_request_id, service_type_id)
);

-- Create email_logs table to track email communications
CREATE TABLE email_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  service_request_id UUID REFERENCES service_requests(id),
  recipient TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL, -- sent, failed
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create stored function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for all tables with updated_at column
CREATE TRIGGER update_customers_updated_at
BEFORE UPDATE ON customers
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_addresses_updated_at
BEFORE UPDATE ON addresses
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_service_requests_updated_at
BEFORE UPDATE ON service_requests
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_service_types_updated_at
BEFORE UPDATE ON service_types
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_property_types_updated_at
BEFORE UPDATE ON property_types
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_property_sizes_updated_at
BEFORE UPDATE ON property_sizes
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Insert initial data for service types
INSERT INTO service_types (name, description, base_fee) VALUES
('Water Leak Detection', 'Our comprehensive water leak detection service uses advanced acoustic technology to identify hidden leaks without damaging your property.', 50.00),
('Gas Leak Detection', 'Our gas leak detection service identifies dangerous gas leaks quickly and accurately to keep your home and family safe.', 75.00),
('Carbon Monoxide Detection', 'Our carbon monoxide detection service helps protect against this invisible, odorless, and potentially lethal gas.', 40.00),
('Comprehensive Package', 'A complete inspection covering water leaks, gas leaks, and carbon monoxide detection at a discounted price.', 125.00);

-- Insert initial data for property types
INSERT INTO property_types (name, description, base_fee) VALUES
('apartment', 'Apartment/Condo', 125.00),
('house', 'Single Family Home', 150.00),
('townhouse', 'Townhouse', 140.00),
('commercial', 'Commercial Property', 225.00);

-- Insert initial data for property sizes
INSERT INTO property_sizes (name, description, size_range, additional_fee) VALUES
('1bed', 'Small', 'Up to 1,000 sq ft', 0.00),
('2bed', 'Medium', '1,000-2,000 sq ft', 25.00),
('3bed', 'Large', '2,000-3,500 sq ft', 50.00),
('large', 'Extra Large', '3,500+ sq ft', 100.00);

-- Create view for easier querying of complete service requests
CREATE OR REPLACE VIEW complete_service_requests AS
SELECT 
  sr.id,
  c.first_name,
  c.last_name,
  c.email,
  c.phone,
  a.street_address,
  a.city,
  a.zip_code,
  pt.name AS property_type,
  ps.name AS property_size,
  sr.preferred_date,
  sr.preferred_time,
  sr.special_notes,
  sr.how_heard,
  sr.base_inspection_fee,
  sr.service_type_fee,
  sr.property_size_fee,
  sr.weekend_fee,
  sr.total_price,
  sr.status,
  sr.created_at,
  ARRAY_AGG(st.name) AS services
FROM service_requests sr
JOIN customers c ON sr.customer_id = c.id
JOIN addresses a ON sr.address_id = a.id
JOIN property_types pt ON sr.property_type_id = pt.id
JOIN property_sizes ps ON sr.property_size_id = ps.id
JOIN service_request_services srs ON sr.id = srs.service_request_id
JOIN service_types st ON srs.service_type_id = st.id
GROUP BY sr.id, c.id, a.id, pt.id, ps.id;

-- Enable Row Level Security (RLS)
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_request_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;

-- Create policy that allows anon users to insert
CREATE POLICY "Allow anon users to insert customers" 
ON customers
FOR INSERT 
TO anon
WITH CHECK (true);

CREATE POLICY "Allow anon users to insert addresses" 
ON addresses
FOR INSERT 
TO anon
WITH CHECK (true);

CREATE POLICY "Allow anon users to insert service_requests" 
ON service_requests
FOR INSERT 
TO anon
WITH CHECK (true);

CREATE POLICY "Allow anon users to insert service_request_services" 
ON service_request_services
FOR INSERT 
TO anon
WITH CHECK (true);

CREATE POLICY "Allow anon users to insert email_logs" 
ON email_logs
FOR INSERT 
TO anon
WITH CHECK (true);

-- Create policies that allow only authenticated users to view data
CREATE POLICY "Allow authenticated users to view customers" 
ON customers
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated users to view addresses" 
ON addresses
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated users to view service_requests" 
ON service_requests
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated users to view service_request_services" 
ON service_request_services
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated users to view email_logs" 
ON email_logs
FOR SELECT 
TO authenticated
USING (true);

-- Create policies that allow only authenticated users to update data
CREATE POLICY "Allow authenticated users to update service_requests" 
ON service_requests
FOR UPDATE 
TO authenticated
USING (true)
WITH CHECK (true);

-- Example stored procedure for saving a complete form submission
CREATE OR REPLACE FUNCTION save_service_request(
  p_first_name TEXT,
  p_last_name TEXT,
  p_email TEXT,
  p_phone TEXT,
  p_street_address TEXT,
  p_city TEXT,
  p_zip_code TEXT,
  p_property_type TEXT,
  p_property_size TEXT,
  p_preferred_date DATE,
  p_preferred_time TEXT,
  p_special_notes TEXT,
  p_how_heard TEXT,
  p_services TEXT[],
  p_base_inspection_fee DECIMAL,
  p_service_type_fee DECIMAL,
  p_property_size_fee DECIMAL,
  p_weekend_fee DECIMAL,
  p_total_price DECIMAL
) RETURNS UUID AS $$
DECLARE
  v_customer_id UUID;
  v_address_id UUID;
  v_service_request_id UUID;
  v_property_type_id UUID;
  v_property_size_id UUID;
  v_service_type_id UUID;
  v_service TEXT;
BEGIN
  -- Check if customer already exists
  SELECT id INTO v_customer_id FROM customers WHERE email = p_email;
  
  -- If customer doesn't exist, create a new one
  IF v_customer_id IS NULL THEN
    INSERT INTO customers (first_name, last_name, email, phone)
    VALUES (p_first_name, p_last_name, p_email, p_phone)
    RETURNING id INTO v_customer_id;
  END IF;
  
  -- Create address
  INSERT INTO addresses (customer_id, street_address, city, zip_code)
  VALUES (v_customer_id, p_street_address, p_city, p_zip_code)
  RETURNING id INTO v_address_id;
  
  -- Get property type and size IDs
  SELECT id INTO v_property_type_id FROM property_types WHERE name = p_property_type;
  SELECT id INTO v_property_size_id FROM property_sizes WHERE name = p_property_size;
  
  -- Create service request
  INSERT INTO service_requests (
    customer_id, 
    address_id, 
    property_type_id, 
    property_size_id, 
    preferred_date, 
    preferred_time, 
    special_notes, 
    how_heard, 
    terms_accepted,
    base_inspection_fee,
    service_type_fee,
    property_size_fee,
    weekend_fee,
    total_price
  )
  VALUES (
    v_customer_id, 
    v_address_id, 
    v_property_type_id, 
    v_property_size_id, 
    p_preferred_date, 
    p_preferred_time, 
    p_special_notes, 
    p_how_heard, 
    TRUE,
    p_base_inspection_fee,
    p_service_type_fee,
    p_property_size_fee,
    p_weekend_fee,
    p_total_price
  )
  RETURNING id INTO v_service_request_id;
  
  -- Add services
  FOREACH v_service IN ARRAY p_services LOOP
    SELECT id INTO v_service_type_id FROM service_types WHERE name = v_service;
    
    IF v_service_type_id IS NOT NULL THEN
      INSERT INTO service_request_services (service_request_id, service_type_id)
      VALUES (v_service_request_id, v_service_type_id);
    END IF;
  END LOOP;
  
  RETURN v_service_request_id;
END;
$$ LANGUAGE plpgsql;

-- Example of how to call the stored procedure from your application:
/*
SELECT save_service_request(
  'John', -- first_name
  'Doe', -- last_name
  'john.doe@example.com', -- email
  '555-123-4567', -- phone
  '123 Main St', -- street_address
  'Sacramento', -- city
  '95814', -- zip_code
  'house', -- property_type
  '2bed', -- property_size
  '2025-06-15', -- preferred_date
  'Morning (8am - 12pm)', -- preferred_time
  'There is a small puddle in the basement.', -- special_notes
  'Search Engine', -- how_heard
  ARRAY['Water Leak Detection', 'Gas Leak Detection'], -- services
  150.00, -- base_inspection_fee
  125.00, -- service_type_fee
  25.00, -- property_size_fee
  0.00, -- weekend_fee
  300.00 -- total_price
);
*/
