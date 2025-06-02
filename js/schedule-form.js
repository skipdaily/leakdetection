// Initialize Supabase client
const SUPABASE_URL = 'https://dglezauqgxybwiyfriz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRnbGV6YXVxZ3h5YndpeWZyaXoiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTcxNjIwMjkxOCwiZXhwIjoyMDMxNzc4OTE4fQ.vOvbxaK8EZCbMxEXeObvX4MWM2ZPmkj9rMLODVH85j8'; // Example anon key - replace with your actual key
let supabase;

// Debug flag - set to true to see detailed console logs
const DEBUG = true;

document.addEventListener('DOMContentLoaded', function() {
  // Try to initialize Supabase client
  try {
    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    if (DEBUG) {
      console.log("Supabase client initialized successfully");
    }
  } catch (error) {
    console.error("Failed to initialize Supabase client:", error);
  }

  // Get form elements
  const scheduleForm = document.querySelector('.schedule-form');
  const contactForm = document.querySelector('.contact-form');
  const scheduleButton = document.getElementById('schedule-inspection-button');

  // Handle checkbox interactions for service types
  const serviceAll = document.getElementById('service-all');
  const serviceTypeCheckboxes = document.querySelectorAll('.service-type-checkbox');
  
  // When "all services" is checked, check all individual services
  serviceAll.addEventListener('change', function() {
    serviceTypeCheckboxes.forEach(checkbox => {
      checkbox.checked = this.checked;
      checkbox.disabled = this.checked;
    });
    updatePriceEstimate();
  });
  
  // When individual services are checked/unchecked, update "all services" checkbox
  serviceTypeCheckboxes.forEach(checkbox => {
    checkbox.addEventListener('change', function() {
      updatePriceEstimate();
    });
  });
  
  // Add event listeners for price calculation
  document.getElementById('property-type').addEventListener('change', updatePriceEstimate);
  document.getElementById('property-size').addEventListener('change', updatePriceEstimate);
  document.getElementById('preferred-date').addEventListener('change', updatePriceEstimate);
  
  // Price estimate calculation
  function updatePriceEstimate() {
    // Get selected services
    const selectedServices = [];
    if (serviceAll.checked) {
      selectedServices.push('Comprehensive Package');
    } else {
      serviceTypeCheckboxes.forEach(checkbox => {
        if (checkbox.checked) {
          switch(checkbox.value) {
            case 'water':
              selectedServices.push('Water Leak Detection');
              break;
            case 'gas':
              selectedServices.push('Gas Leak Detection');
              break;
            case 'co':
              selectedServices.push('Carbon Monoxide Detection');
              break;
          }
        }
      });
    }
    
    // Calculate service fee based on selected services
    let serviceFee = 0;
    if (serviceAll.checked) {
      serviceFee = 125.00; // Comprehensive Package fee
    } else {
      selectedServices.forEach(service => {
        if (service === 'Water Leak Detection') serviceFee += 50.00;
        if (service === 'Gas Leak Detection') serviceFee += 75.00;
        if (service === 'Carbon Monoxide Detection') serviceFee += 40.00;
      });
    }
    
    // Get property type fee
    const propertyType = document.getElementById('property-type').value;
    let baseInspectionFee = 150.00; // Default
    if (propertyType === 'apartment') baseInspectionFee = 125.00;
    if (propertyType === 'house') baseInspectionFee = 150.00;
    if (propertyType === 'townhouse') baseInspectionFee = 140.00;
    if (propertyType === 'commercial') baseInspectionFee = 225.00;
    
    // Get property size fee
    const propertySize = document.getElementById('property-size').value;
    let propertySizeFee = 0.00;
    if (propertySize === '2bed') propertySizeFee = 25.00;
    if (propertySize === '3bed') propertySizeFee = 50.00;
    if (propertySize === 'large') propertySizeFee = 100.00;
    
    // Check if weekend fee applies
    let weekendFee = 0.00;
    const preferredDate = document.getElementById('preferred-date').value;
    if (preferredDate) {
      const date = new Date(preferredDate);
      const day = date.getDay();
      if (day === 0 || day === 6) {
        weekendFee = 50.00;
        document.getElementById('weekend-fee-row').style.display = 'flex';
        document.getElementById('weekend-fee').textContent = '$50.00';
      } else {
        document.getElementById('weekend-fee-row').style.display = 'none';
      }
    }
    
    // Update the displayed prices
    document.getElementById('base-inspection-fee').textContent = `$${baseInspectionFee.toFixed(2)}`;
    document.getElementById('service-type-fee').textContent = `$${serviceFee.toFixed(2)}`;
    document.getElementById('property-size-fee').textContent = `$${propertySizeFee.toFixed(2)}`;
    
    // Calculate total
    const totalPrice = baseInspectionFee + serviceFee + propertySizeFee + weekendFee;
    document.getElementById('total-price').textContent = `$${totalPrice.toFixed(2)}`;
  }

  // Handle form submission
  scheduleButton.addEventListener('click', async function(e) {
    e.preventDefault();
    
    // Validate forms
    if (!validateForms()) {
      return;
    }
    
    // Show loading state
    scheduleButton.disabled = true;
    scheduleButton.textContent = 'Submitting...';
    
    try {
      // Collect form data
      const formData = collectFormData();
      
      if (DEBUG) {
        console.log('Collected form data:', formData);
      }
      
      // Check if Supabase is available
      if (!supabase) {
        throw new Error("Supabase client is not initialized. Please check your internet connection.");
      }
      
      // Try submitting to local endpoint first if in development
      let useLocalEndpoint = false;
      if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
        try {
          const response = await fetch('/api/submit-form', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
          });
          
          if (response.ok) {
            const result = await response.json();
            console.log("Local submission successful:", result);
            useLocalEndpoint = true;
            
            // Show success message
            alert('Your appointment has been scheduled successfully! You will receive a confirmation email shortly.');
            
            // Reset forms
            scheduleForm.reset();
            contactForm.reset();
            updatePriceEstimate();
            return;
          }
        } catch (localError) {
          console.log("Local endpoint not available, falling back to Supabase");
        }
      }
      
      if (!useLocalEndpoint) {
        // First, try to insert customer
        const { data: customerData, error: customerError } = await supabase
          .from('customers')
          .insert({
            first_name: formData.first_name,
            last_name: formData.last_name,
            email: formData.email,
            phone: formData.phone
          })
          .select();
        
        if (customerError && customerError.code !== '23505') { // Ignore unique constraint violation (customer may already exist)
          throw new Error(`Customer creation error: ${customerError.message}`);
        }
        
        if (DEBUG) {
          console.log('Customer data response:', customerData);
        }
        
        // Get customer ID (either from insert or query)
        let customerId;
        if (customerData && customerData.length > 0) {
          customerId = customerData[0].id;
        } else {
          // Customer already exists, get ID
          const { data: existingCustomer, error: queryError } = await supabase
            .from('customers')
            .select('id')
            .eq('email', formData.email)
            .single();
            
          if (queryError) {
            throw new Error(`Error finding existing customer: ${queryError.message}`);
          }
          
          customerId = existingCustomer.id;
        }
        
        if (DEBUG) {
          console.log('Customer ID:', customerId);
        }
        
        // Insert address
        const { data: addressData, error: addressError } = await supabase
          .from('addresses')
          .insert({
            customer_id: customerId,
            street_address: formData.street_address,
            city: formData.city,
            zip_code: formData.zip_code
          })
          .select();
        
        if (addressError) {
          throw new Error(`Address creation error: ${addressError.message}`);
        }
        
        const addressId = addressData[0].id;
        
        if (DEBUG) {
          console.log('Address ID:', addressId);
        }
        
        // Get property type ID and property size ID
        const { data: propertyTypeData, error: propertyTypeError } = await supabase
          .from('property_types')
          .select('id')
          .eq('name', formData.property_type)
          .single();
          
        if (propertyTypeError) {
          throw new Error(`Error finding property type: ${propertyTypeError.message}`);
        }
        
        const { data: propertySizeData, error: propertySizeError } = await supabase
          .from('property_sizes')
          .select('id')
          .eq('name', formData.property_size)
          .single();
          
        if (propertySizeError) {
          throw new Error(`Error finding property size: ${propertySizeError.message}`);
        }
        
        const propertyTypeId = propertyTypeData.id;
        const propertySizeId = propertySizeData.id;
        
        if (DEBUG) {
          console.log('Property Type ID:', propertyTypeId);
          console.log('Property Size ID:', propertySizeId);
        }
        
        // Insert service request
        const { data: serviceRequestData, error: serviceRequestError } = await supabase
          .from('service_requests')
          .insert({
            customer_id: customerId,
            address_id: addressId,
            property_type_id: propertyTypeId,
            property_size_id: propertySizeId,
            preferred_date: formData.preferred_date,
            preferred_time: formData.preferred_time,
            special_notes: formData.special_notes,
            how_heard: formData.how_heard,
            terms_accepted: true,
            base_inspection_fee: formData.base_inspection_fee,
            service_type_fee: formData.service_type_fee,
            property_size_fee: formData.property_size_fee,
            weekend_fee: formData.weekend_fee,
            total_price: formData.total_price
          })
          .select();
          
        if (serviceRequestError) {
          throw new Error(`Service request creation error: ${serviceRequestError.message}`);
        }
        
        const serviceRequestId = serviceRequestData[0].id;
        
        if (DEBUG) {
          console.log('Service Request ID:', serviceRequestId);
        }
        
        // Insert service types
        for (const serviceName of formData.services) {
          // Get service type ID
          const { data: serviceTypeData, error: serviceTypeError } = await supabase
            .from('service_types')
            .select('id')
            .eq('name', serviceName)
            .single();
            
          if (serviceTypeError) {
            throw new Error(`Error finding service type ${serviceName}: ${serviceTypeError.message}`);
          }
          
          const serviceTypeId = serviceTypeData.id;
          
          // Insert into junction table
          const { error: junctionError } = await supabase
            .from('service_request_services')
            .insert({
              service_request_id: serviceRequestId,
              service_type_id: serviceTypeId
            });
            
          if (junctionError) {
            throw new Error(`Error linking service ${serviceName}: ${junctionError.message}`);
          }
        }
        
        // Show success message
        alert('Your appointment has been scheduled successfully! You will receive a confirmation email shortly.');
        
        // Reset forms
        scheduleForm.reset();
        contactForm.reset();
        updatePriceEstimate();
        
      } catch (error) {
        console.error('Error submitting form:', error);
        
        // More user-friendly error message with troubleshooting advice
        if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
          alert(`Network connection error. Please check your internet connection and try again. If the problem persists, please contact us directly at support@leakdetection.com or call (555) 123-4567.`);
        } else {
          alert(`There was an error scheduling your appointment: ${error.message}. Please try again or contact us directly.`);
        }
      } finally {
        // Reset button state
        scheduleButton.disabled = false;
        scheduleButton.textContent = 'Schedule Inspection';
      }
  });
  
  function validateForms() {
    // Validate required fields
    const firstName = document.getElementById('first-name').value.trim();
    const lastName = document.getElementById('last-name').value.trim();
    const email = document.getElementById('email').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const address = document.getElementById('address').value.trim();
    const city = document.querySelector('input[placeholder="City"]').value.trim();
    const zipCode = document.querySelector('input[placeholder="Zip Code"]').value.trim();
    const propertyType = document.getElementById('property-type').value;
    const propertySize = document.getElementById('property-size').value;
    const preferredDate = document.getElementById('preferred-date').value;
    const preferredTime = document.getElementById('preferred-time').value;
    const termsAccepted = document.getElementById('terms').checked;
    
    // Check if at least one service is selected
    let serviceSelected = serviceAll.checked;
    if (!serviceSelected) {
      serviceTypeCheckboxes.forEach(checkbox => {
        if (checkbox.checked) {
          serviceSelected = true;
        }
      });
    }
    
    // Validation checks
    if (!serviceSelected) {
      alert('Please select at least one service type.');
      return false;
    }
    
    if (!firstName || !lastName) {
      alert('Please enter your full name.');
      return false;
    }
    
    if (!email) {
      alert('Please enter your email address.');
      return false;
    }
    
    if (!phone) {
      alert('Please enter your phone number.');
      return false;
    }
    
    if (!address || !city || !zipCode) {
      alert('Please enter your complete property address.');
      return false;
    }
    
    if (!propertyType) {
      alert('Please select a property type.');
      return false;
    }
    
    if (!propertySize) {
      alert('Please select a property size.');
      return false;
    }
    
    if (!preferredDate) {
      alert('Please select a preferred date.');
      return false;
    }
    
    if (!preferredTime) {
      alert('Please select a preferred time.');
      return false;
    }
    
    if (!termsAccepted) {
      alert('Please agree to the Terms of Service and Privacy Policy.');
      return false;
    }
    
    return true;
  }
  
  function collectFormData() {
    // Get selected services as array for the stored procedure
    const services = [];
    if (serviceAll.checked) {
      services.push('Comprehensive Package');
    } else {
      if (document.getElementById('service-water').checked) services.push('Water Leak Detection');
      if (document.getElementById('service-gas').checked) services.push('Gas Leak Detection');
      if (document.getElementById('service-co').checked) services.push('Carbon Monoxide Detection');
    }
    
    // Get fee values from the displayed price estimate
    const baseInspectionFee = parseFloat(document.getElementById('base-inspection-fee').textContent.replace('$', ''));
    const serviceTypeFee = parseFloat(document.getElementById('service-type-fee').textContent.replace('$', ''));
    const propertySizeFee = parseFloat(document.getElementById('property-size-fee').textContent.replace('$', ''));
    const weekendFee = document.getElementById('weekend-fee-row').style.display === 'none' ? 0 : 
                     parseFloat(document.getElementById('weekend-fee').textContent.replace('$', ''));
    const totalPrice = parseFloat(document.getElementById('total-price').textContent.replace('$', ''));
    
    // Format the date for PostgreSQL
    const rawDate = document.getElementById('preferred-date').value;
    const formattedDate = rawDate; // In YYYY-MM-DD format, which PostgreSQL accepts
    
    return {
      first_name: document.getElementById('first-name').value.trim(),
      last_name: document.getElementById('last-name').value.trim(),
      email: document.getElementById('email').value.trim(),
      phone: document.getElementById('phone').value.trim(),
      street_address: document.getElementById('address').value.trim(),
      city: document.querySelector('input[placeholder="City"]').value.trim(),
      zip_code: document.querySelector('input[placeholder="Zip Code"]').value.trim(),
      property_type: document.getElementById('property-type').value,
      property_size: document.getElementById('property-size').value,
      preferred_date: formattedDate,
      preferred_time: document.getElementById('preferred-time').value,
      special_notes: document.getElementById('special-notes').value.trim(),
      how_heard: document.getElementById('how-hear').value,
      services: services,
      base_inspection_fee: baseInspectionFee,
      service_type_fee: serviceTypeFee,
      property_size_fee: propertySizeFee,
      weekend_fee: weekendFee,
      total_price: totalPrice
    };
  }
  
  // Initialize the price estimate on page load
  updatePriceEstimate();
});
