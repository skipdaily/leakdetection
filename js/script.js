// Main JavaScript file for Leak Detection website

// Sticky header functionality
document.addEventListener('DOMContentLoaded', function () {
    const header = document.getElementById('stickyHeader');

    if (header) {
        window.addEventListener('scroll', function () {
            if (window.scrollY > 10) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        });
    }
});

// Pricing structure for leak detection services
const pricingStructure = {
    // Base inspection fees based on property type
    baseInspectionFee: {
        'apartment': 125,      // Apartment/Condo
        'house': 150,          // Single Family Home
        'townhouse': 140,      // Townhouse
        'commercial': 225      // Commercial Property
    },

    // Additional fees based on service type
    serviceTypeFee: {
        'water': 50,           // Water Leak Detection
        'gas': 75,             // Gas Leak Detection
        'co': 40,              // Carbon Monoxide Detection
        'all': 125             // Comprehensive Inspection (All Services)
    },

    // Additional fees based on property size
    propertySizeFee: {
        '1bed': 0,             // Up to 1,000 sq ft - No additional fee
        '2bed': 25,            // 1,000-2,000 sq ft
        '3bed': 50,            // 2,000-3,500 sq ft
        'large': 100           // 3,500+ sq ft
    },

    // Emergency service premium
    emergencyFee: 100,

    // Weekend appointment premium
    weekendFee: 50
};

// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function () {
    // Service Finder Form Handler
    const serviceFinderForm = document.querySelector('.service-finder-form');
    if (serviceFinderForm) {
        serviceFinderForm.addEventListener('submit', function (e) {
            e.preventDefault();
            // Add your form submission logic here
            alert('Thank you for your submission. We will contact you shortly.');
        });
    }

    // Schedule Form Handler
    const scheduleForm = document.querySelector('.schedule-form');
    const contactForm = document.querySelector('.contact-form');
    const submitButton = document.querySelector('.price-estimate-section button[type="submit"]');

    if (submitButton) {
        submitButton.addEventListener('click', function (e) {
            e.preventDefault();

            // Validate forms
            if (!validateForms()) {
                alert('Please fill out all required fields.');
                return;
            }

            // Collect form data
            const formData = collectFormData();

            // Show loading state
            this.innerHTML = '<span class="animate-pulse">Processing...</span>';
            this.disabled = true;

            // Send form data
            submitFormData(formData)
                .then(response => {
                    // Reset button state
                    this.innerHTML = 'Schedule Inspection';
                    this.disabled = false;

                    // Show success message
                    alert('Thank you for scheduling an inspection. We will confirm your appointment shortly.');

                    // Reset forms
                    document.querySelector('.schedule-form').reset();
                    document.querySelector('.contact-form').reset();
                })
                .catch(error => {
                    // Reset button state
                    this.innerHTML = 'Schedule Inspection';
                    this.disabled = false;

                    // Show error message
                    alert('There was an error submitting your request. Please try again or contact us directly.');
                    console.error('Form submission error:', error);
                });
        });
    }

    // Setup the price calculator for the scheduling page
    setupPriceCalculator();

    // Ensure the price display is updated on page load
    updatePriceDisplay();

    // FAQ Accordion
    const faqItems = document.querySelectorAll('.faq-item');
    if (faqItems.length > 0) {
        faqItems.forEach(item => {
            const question = item.querySelector('.faq-question');
            question.addEventListener('click', () => {
                // Close all other items
                faqItems.forEach(otherItem => {
                    if (otherItem !== item && otherItem.classList.contains('active')) {
                        otherItem.classList.remove('active');
                    }
                });

                // Toggle current item
                item.classList.toggle('active');
            });
        });
    }

    // Mobile Menu Toggle
    const mobileMenuButton = document.querySelector('.mobile-menu-button');
    const mobileMenu = document.querySelector('.mobile-menu');
    if (mobileMenuButton && mobileMenu) {
        mobileMenuButton.addEventListener('click', () => {
            mobileMenu.classList.toggle('hidden');
        });
    }

    // Emergency Contact Modal
    const emergencyButtons = document.querySelectorAll('.emergency-button');
    const emergencyModal = document.querySelector('.emergency-modal');
    const closeModalButton = document.querySelector('.close-modal');

    if (emergencyButtons.length > 0 && emergencyModal) {
        emergencyButtons.forEach(button => {
            button.addEventListener('click', () => {
                emergencyModal.classList.remove('hidden');
            });
        });

        if (closeModalButton) {
            closeModalButton.addEventListener('click', () => {
                emergencyModal.classList.add('hidden');
            });
        }
    }

    // Service Type Filter
    const serviceTypeSelect = document.getElementById('service-type');
    const serviceCards = document.querySelectorAll('.service-card');

    if (serviceTypeSelect && serviceCards.length > 0) {
        serviceTypeSelect.addEventListener('change', function () {
            const selectedValue = this.value;

            if (selectedValue === 'all' || selectedValue === '') {
                // Show all cards
                serviceCards.forEach(card => {
                    card.style.display = 'flex';
                });
            } else {
                // Filter cards
                serviceCards.forEach(card => {
                    if (card.dataset.serviceType === selectedValue) {
                        card.style.display = 'flex';
                    } else {
                        card.style.display = 'none';
                    }
                });
            }
        });
    }
});

// Function to calculate price based on selected options
function calculatePrice() {
    // Check for service type checkboxes
    const serviceWater = document.getElementById('service-water')?.checked || false;
    const serviceGas = document.getElementById('service-gas')?.checked || false;
    const serviceCO = document.getElementById('service-co')?.checked || false;
    const serviceAll = document.getElementById('service-all')?.checked || false;

    const propertyType = document.getElementById('property-type').value;
    const propertySize = document.getElementById('property-size').value;
    const preferredDate = document.getElementById('preferred-date').value;

    // Initialize price components
    let baseInspectionFee = 0;
    let serviceTypeFee = 0;
    let propertySizeFee = 0;
    let weekendFee = 0;

    // Calculate base fee based on property type
    if (propertyType && pricingStructure.baseInspectionFee[propertyType]) {
        baseInspectionFee = pricingStructure.baseInspectionFee[propertyType];
    } else {
        // Default to house if not selected
        baseInspectionFee = pricingStructure.baseInspectionFee['house'];
    }

    // Add service type fees based on checkboxes
    if (serviceAll) {
        // Comprehensive package (all services with discount)
        serviceTypeFee = pricingStructure.serviceTypeFee['all'];
    } else {
        // Add up individual service fees
        if (serviceWater) serviceTypeFee += pricingStructure.serviceTypeFee['water'];
        if (serviceGas) serviceTypeFee += pricingStructure.serviceTypeFee['gas'];
        if (serviceCO) serviceTypeFee += pricingStructure.serviceTypeFee['co'];
    }

    // Add property size fee
    if (propertySize && pricingStructure.propertySizeFee[propertySize]) {
        propertySizeFee = pricingStructure.propertySizeFee[propertySize];
    }

    // Check if weekend and add weekend fee if applicable
    if (preferredDate) {
        const selectedDate = new Date(preferredDate);
        const day = selectedDate.getDay();
        // 0 is Sunday, 6 is Saturday
        if (day === 0 || day === 6) {
            weekendFee = pricingStructure.weekendFee;
        }
    }

    // Calculate total
    const totalPrice = baseInspectionFee + serviceTypeFee + propertySizeFee + weekendFee;

    return {
        baseInspectionFee,
        serviceTypeFee,
        propertySizeFee,
        weekendFee,
        totalPrice,
        selectedServices: {
            water: serviceWater,
            gas: serviceGas,
            co: serviceCO,
            all: serviceAll
        }
    };
}

// Function to set up the price calculator on the schedule page
function setupPriceCalculator() {
    // Check if we're on the schedule page
    const priceEstimateSection = document.querySelector('.price-estimate-section');
    if (!priceEstimateSection) return;

    // Get all the input elements that affect pricing
    const serviceCheckboxes = document.querySelectorAll('.service-type-checkbox');
    const serviceAllCheckbox = document.getElementById('service-all');
    const propertyTypeSelect = document.getElementById('property-type');
    const propertySizeSelect = document.getElementById('property-size');
    const preferredDateInput = document.getElementById('preferred-date');

    // Add event listeners to service checkboxes
    serviceCheckboxes.forEach(checkbox => {
        if (checkbox) {
            checkbox.addEventListener('change', function () {
                // If any individual service is unchecked, uncheck the "All" option
                if (!this.checked && serviceAllCheckbox && serviceAllCheckbox.checked) {
                    serviceAllCheckbox.checked = false;
                }

                // Check if all individual services are checked
                const allIndividualChecked = Array.from(serviceCheckboxes).every(cb => cb.checked);

                // If all individual services are selected, check the "All" option and uncheck individuals
                if (allIndividualChecked && serviceAllCheckbox && !serviceAllCheckbox.checked) {
                    serviceAllCheckbox.checked = true;
                    // Uncheck individuals since we're now using the comprehensive package
                    serviceCheckboxes.forEach(checkbox => {
                        if (checkbox) checkbox.checked = false;
                    });
                }

                updatePriceDisplay();
            });
        }
    });

    // Add event listener to the "All" option
    if (serviceAllCheckbox) {
        serviceAllCheckbox.addEventListener('change', function () {
            if (this.checked) {
                // If "All" is selected, check all individual services for visual feedback
                // but keep them disabled to show they're part of the package
                serviceCheckboxes.forEach(checkbox => {
                    if (checkbox) {
                        checkbox.checked = true;
                        checkbox.disabled = true;
                    }
                });
            } else {
                // If "All" is unselected, enable all individual services but leave them unchecked
                serviceCheckboxes.forEach(checkbox => {
                    if (checkbox) {
                        checkbox.checked = false;
                        checkbox.disabled = false;
                    }
                });
            }
            updatePriceDisplay();
        });
    }

    // Add event listeners to other inputs
    const otherInputs = [propertyTypeSelect, propertySizeSelect, preferredDateInput];
    otherInputs.forEach(input => {
        if (input) {
            input.addEventListener('change', updatePriceDisplay);
        }
    });

    // Initial price calculation
    updatePriceDisplay();
}

// Update the price display in the UI
function updatePriceDisplay() {
    const priceBreakdown = calculatePrice();

    // Update the price elements in the DOM
    const baseInspectionElement = document.getElementById('base-inspection-fee');
    const serviceTypeElement = document.getElementById('service-type-fee');
    const weekendFeeElement = document.getElementById('weekend-fee');
    const totalPriceElement = document.getElementById('total-price');

    if (baseInspectionElement) {
        baseInspectionElement.textContent = `$${priceBreakdown.baseInspectionFee.toFixed(2)}`;
    }

    // Update service type fee and label
    if (serviceTypeElement) {
        let serviceLabel = 'Service Fee';

        if (priceBreakdown.selectedServices.all) {
            serviceLabel = 'Comprehensive Package (All Services)';
        } else {
            const selectedServiceTypes = [];
            if (priceBreakdown.selectedServices.water) selectedServiceTypes.push('Water');
            if (priceBreakdown.selectedServices.gas) selectedServiceTypes.push('Gas');
            if (priceBreakdown.selectedServices.co) selectedServiceTypes.push('CO');

            if (selectedServiceTypes.length > 0) {
                serviceLabel = `Service Fee (${selectedServiceTypes.join(', ')})`;
            }
        }

        // Update the service type label
        const serviceTypeLabelElement = document.getElementById('service-type-label');
        if (serviceTypeLabelElement) {
            serviceTypeLabelElement.textContent = serviceLabel;
        }

        // Only show the service fee if there's an actual fee (services selected)
        if (priceBreakdown.serviceTypeFee > 0) {
            serviceTypeElement.parentElement.style.display = 'flex';
            serviceTypeElement.textContent = `$${priceBreakdown.serviceTypeFee.toFixed(2)}`;
        } else {
            serviceTypeElement.parentElement.style.display = 'none';
        }
    }

    // Show or hide weekend fee row based on whether it applies
    const weekendFeeRow = document.getElementById('weekend-fee-row');
    if (weekendFeeRow && weekendFeeElement) {
        if (priceBreakdown.weekendFee > 0) {
            weekendFeeRow.style.display = 'flex';
            weekendFeeElement.textContent = `$${priceBreakdown.weekendFee.toFixed(2)}`;
        } else {
            weekendFeeRow.style.display = 'none';
        }
    }

    // Add property size fee if applicable
    const propertySizeFeeRow = document.getElementById('property-size-fee-row');
    const propertySizeFeeElement = document.getElementById('property-size-fee');

    if (propertySizeFeeRow && propertySizeFeeElement) {
        if (priceBreakdown.propertySizeFee > 0) {
            propertySizeFeeRow.style.display = 'flex';
            propertySizeFeeElement.textContent = `$${priceBreakdown.propertySizeFee.toFixed(2)}`;
        } else {
            propertySizeFeeRow.style.display = 'none';
        }
    }

    if (totalPriceElement) {
        totalPriceElement.textContent = `$${priceBreakdown.totalPrice.toFixed(2)}`;
    }
}

// Function to validate the forms
function validateForms() {
    // Validate schedule form
    const scheduleForm = document.querySelector('.schedule-form');
    const serviceTypes = document.querySelectorAll('.service-type-checkbox, #service-all');
    let serviceSelected = false;

    serviceTypes.forEach(checkbox => {
        if (checkbox.checked) {
            serviceSelected = true;
        }
    });

    if (!serviceSelected) {
        return false;
    }

    const propertyType = document.getElementById('property-type').value;
    const propertySize = document.getElementById('property-size').value;
    const preferredDate = document.getElementById('preferred-date').value;
    const preferredTime = document.getElementById('preferred-time').value;

    if (!propertyType || !propertySize || !preferredDate || !preferredTime) {
        return false;
    }

    // Validate contact form
    const contactForm = document.querySelector('.contact-form');
    const firstName = document.getElementById('first-name').value;
    const lastName = document.getElementById('last-name').value;
    const email = document.getElementById('email').value;
    const phone = document.getElementById('phone').value;
    const address = document.getElementById('address').value;
    const termsAccepted = document.getElementById('terms').checked;

    if (!firstName || !lastName || !email || !phone || !address || !termsAccepted) {
        return false;
    }

    return true;
}

// Function to collect form data
function collectFormData() {
    // Get service selections
    const serviceWater = document.getElementById('service-water')?.checked || false;
    const serviceGas = document.getElementById('service-gas')?.checked || false;
    const serviceCO = document.getElementById('service-co')?.checked || false;
    const serviceAll = document.getElementById('service-all')?.checked || false;

    // Get property details
    const propertyType = document.getElementById('property-type').value;
    const propertySize = document.getElementById('property-size').value;
    const preferredDate = document.getElementById('preferred-date').value;
    const preferredTime = document.getElementById('preferred-time').value;
    const specialNotes = document.getElementById('special-notes').value;

    // Get contact information
    const firstName = document.getElementById('first-name').value;
    const lastName = document.getElementById('last-name').value;
    const email = document.getElementById('email').value;
    const phone = document.getElementById('phone').value;
    const address = document.getElementById('address').value;
    const city = document.querySelector('input[placeholder="City"]').value;
    const zipCode = document.querySelector('input[placeholder="Zip Code"]').value;
    const howHear = document.getElementById('how-hear').value;

    // Get price breakdown
    const priceBreakdown = calculatePrice();

    // Create form data object
    return {
        services: {
            water: serviceWater,
            gas: serviceGas,
            co: serviceCO,
            comprehensive: serviceAll
        },
        property: {
            type: propertyType,
            size: propertySize,
            address: address,
            city: city,
            zipCode: zipCode,
            specialNotes: specialNotes
        },
        appointment: {
            date: preferredDate,
            time: preferredTime
        },
        contact: {
            firstName: firstName,
            lastName: lastName,
            email: email,
            phone: phone,
            howHeard: howHear
        },
        pricing: {
            baseInspectionFee: priceBreakdown.baseInspectionFee,
            serviceTypeFee: priceBreakdown.serviceTypeFee,
            propertySizeFee: priceBreakdown.propertySizeFee,
            weekendFee: priceBreakdown.weekendFee,
            totalPrice: priceBreakdown.totalPrice
        },
        recipientEmail: "tomgouldmaui@gmail.com" // The email to send the form data to
    };
}

// Function to submit form data
async function submitFormData(formData) {
    try {
        // First approach: EmailJS (client-side)
        // This is a simple solution that works without a backend

        // Call your submission endpoint
        const response = await fetch('/api/submit-form', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        if (!response.ok) {
            // If the server-side submission fails, fallback to EmailJS
            return await submitViaEmailJS(formData);
        }

        return await response.json();
    } catch (error) {
        console.error('Error submitting form:', error);
        // Fallback to EmailJS if the server endpoint is unavailable
        return await submitViaEmailJS(formData);
    }
}

// Fallback function to submit via EmailJS (client-side)
async function submitViaEmailJS(formData) {
    // For this to work, you need to include the EmailJS SDK and set up an account
    // This is just a placeholder - you'll need to implement this with actual EmailJS code

    // Format the data for email
    const emailParams = {
        to_email: formData.recipientEmail,
        from_name: `${formData.contact.firstName} ${formData.contact.lastName}`,
        subject: "New Leak Detection Service Request",
        message: JSON.stringify(formData, null, 2) // Pretty print the JSON
    };

    // Simple email sending via mailto as a last resort
    // This will open the user's email client with the form data
    const mailtoLink = `mailto:${formData.recipientEmail}?subject=Leak Detection Service Request&body=${encodeURIComponent(JSON.stringify(formData, null, 2))}`;

    // Open the mailto link in a new window
    window.open(mailtoLink, '_blank');

    return { success: true, method: "mailto" };
}
