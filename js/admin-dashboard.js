/**
 * Admin Dashboard JavaScript
 * This file handles the admin dashboard functionality including:
 * - Loading inspection data from Supabase or local JSON files
 * - Displaying inspection requests in a table
 * - Filtering and sorting functionality
 * - Status updates for inspection requests
 */

// Initialize Supabase client
const SUPABASE_URL = 'https://dglezauqgxybwiyfriz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRnbGV6YXVxZ3h5YndpeWZyaXoiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTcxNjIwMjkxOCwiZXhwIjoyMDMxNzc4OTE4fQ.vOvbxaK8EZCbMxEXeObvX4MWM2ZPmkj9rMLODVH85j8';
let supabase;

// Status colors for badges
const statusColors = {
    'pending': 'bg-yellow-100 text-yellow-800',
    'confirmed': 'bg-blue-100 text-blue-800',
    'completed': 'bg-green-100 text-green-800',
    'cancelled': 'bg-red-100 text-red-800'
};

// Current sort state
let currentSort = {
    column: 'created_at',
    direction: 'desc' // desc = newest first
};

// Current filter state
let currentFilter = 'all';

document.addEventListener('DOMContentLoaded', async function () {
    // Initialize UI elements
    initializeUI();

    // Show dashboard content without requiring login
    document.getElementById('login-section').classList.add('hidden');
    document.getElementById('dashboard-content').classList.remove('hidden');

    // Try to initialize Supabase client
    try {
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log("Supabase client initialized successfully");

        // Check if user is authenticated
        const { data: { session } } = await supabase.auth.getSession();

        if (session) {
            // User is logged in, load data from Supabase
            loadInspectionsFromSupabase();

            // Show logout button, hide login button
            document.getElementById('logout-button').classList.remove('hidden');
            document.getElementById('show-login-button').classList.add('hidden');            // Enable edit mode
            window.isAdminMode = true;

            // Update UI for admin mode
            updateUIForAdminMode(true);
        } else {
            // User is not logged in, load from local data
            loadInspectionsFromLocalData();

            // Hide login prompt as we're showing the dashboard without login
            if (document.getElementById('login-prompt')) {
                document.getElementById('login-prompt').classList.add('hidden');
            }

            // Disable edit mode
            window.isAdminMode = false;

            // Update UI for view-only mode
            updateUIForAdminMode(false);
        }
    } catch (error) {
        console.error("Failed to initialize Supabase client:", error);
        // Fall back to local data
        loadInspectionsFromLocalData();
    }
});

/**
 * Initialize UI elements and event listeners
 */
function initializeUI() {
    // Initialize login button
    const showLoginButton = document.getElementById('show-login-button');
    if (showLoginButton) {
        showLoginButton.addEventListener('click', function () {
            // Show login section when login button is clicked
            document.getElementById('login-section').classList.remove('hidden');
            // Scroll to login section
            document.getElementById('login-section').scrollIntoView({ behavior: 'smooth' });
        });
    }

    // Initialize login form
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async function (e) {
            e.preventDefault();
            await handleLogin();
        });
    }

    // Initialize logout button
    const logoutButton = document.getElementById('logout-button');
    if (logoutButton) {
        logoutButton.addEventListener('click', handleLogout);
    }

    // Initialize filter buttons
    document.querySelectorAll('.status-filter').forEach(button => {
        button.addEventListener('click', function () {
            const status = this.dataset.status;
            currentFilter = status;

            // Update active button
            document.querySelectorAll('.status-filter').forEach(btn => {
                btn.classList.remove('bg-blue-600', 'text-white');
                btn.classList.add('bg-white', 'text-gray-700');
            });

            this.classList.remove('bg-white', 'text-gray-700');
            this.classList.add('bg-blue-600', 'text-white');

            // Apply filter
            applyFiltersAndSort();
        });
    });

    // Initialize sort headers
    document.querySelectorAll('th[data-sort]').forEach(header => {
        header.addEventListener('click', function () {
            const column = this.dataset.sort;

            // Toggle sort direction if same column
            if (currentSort.column === column) {
                currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
            } else {
                currentSort.column = column;
                currentSort.direction = 'asc';
            }

            // Update header indicators
            updateSortIndicators();

            // Apply sort
            applyFiltersAndSort();
        });
    });
}

/**
 * Update UI elements based on admin mode
 */
function updateUIForAdminMode(isAdmin) {
    // Update mode indicators
    const viewModeIndicator = document.getElementById('view-mode-indicator');
    const adminModeIndicator = document.getElementById('admin-mode-indicator');

    if (viewModeIndicator && adminModeIndicator) {
        if (isAdmin) {
            viewModeIndicator.classList.add('hidden');
            adminModeIndicator.classList.remove('hidden');
        } else {
            viewModeIndicator.classList.remove('hidden');
            adminModeIndicator.classList.add('hidden');
        }
    }

    // Update login/logout buttons
    const showLoginButton = document.getElementById('show-login-button');
    const logoutButton = document.getElementById('logout-button');

    if (showLoginButton && logoutButton) {
        if (isAdmin) {
            showLoginButton.classList.add('hidden');
            logoutButton.classList.remove('hidden');
        } else {
            showLoginButton.classList.remove('hidden');
            logoutButton.classList.add('hidden');
        }
    }
}

/**
 * Handle user login
 */
async function handleLogin() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const loginError = document.getElementById('login-error');

    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (error) {
            loginError.textContent = error.message;
            loginError.classList.remove('hidden');
            return;
        }        // Hide login section
        document.getElementById('login-section').classList.add('hidden');

        // Update UI for admin mode
        updateUIForAdminMode(true);

        // Enable edit mode
        window.isAdminMode = true;

        // Load data from Supabase instead of local files
        loadInspectionsFromSupabase();

        // Show toast notification
        showToast('Successfully logged in as admin. You now have full access.');
    } catch (error) {
        loginError.textContent = error.message || 'Login failed. Please try again.';
        loginError.classList.remove('hidden');
    }
}

/**
 * Handle user logout
 */
async function handleLogout() {
    try {
        await supabase.auth.signOut();

        // Update UI for view-only mode
        updateUIForAdminMode(false);

        // Disable edit mode
        window.isAdminMode = false;

        // Reload data from local files
        loadInspectionsFromLocalData();

        // Show toast notification
        showToast('Successfully logged out. You are now in view-only mode.');
    } catch (error) {
        console.error('Error logging out:', error);
    }
}

/**
 * Show a toast notification
 */
function showToast(message, type = 'success', duration = 3000) {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toast-message');

    if (!toast || !toastMessage) return;

    // Set message
    toastMessage.textContent = message;

    // Set color based on type
    toast.className = 'fixed bottom-4 right-4 px-4 py-2 rounded-md shadow-lg z-50';

    if (type === 'success') {
        toast.classList.add('bg-green-500', 'text-white');
    } else if (type === 'error') {
        toast.classList.add('bg-red-500', 'text-white');
    } else if (type === 'warning') {
        toast.classList.add('bg-yellow-500', 'text-white');
    } else {
        toast.classList.add('bg-blue-500', 'text-white');
    }

    // Show toast
    toast.classList.remove('hidden');

    // Hide after duration
    setTimeout(() => {
        toast.classList.add('hidden');
    }, duration);
}

/**
 * Update sort indicators in table headers
 */
function updateSortIndicators() {
    // Remove all indicators
    document.querySelectorAll('th[data-sort] .sort-indicator').forEach(indicator => {
        indicator.textContent = '';
    });

    // Add indicator to current sort column
    const currentHeader = document.querySelector(`th[data-sort="${currentSort.column}"] .sort-indicator`);
    if (currentHeader) {
        currentHeader.textContent = currentSort.direction === 'asc' ? ' ↑' : ' ↓';
    }
}

/**
 * Load inspections from Supabase database
 */
async function loadInspectionsFromSupabase() {
    try {
        showLoadingState();

        // Query the complete_service_requests view
        const { data, error } = await supabase
            .from('complete_service_requests')
            .select('*');

        if (error) throw error;

        if (data && data.length > 0) {
            displayInspections(data);
        } else {
            showEmptyState("No inspection requests found in the database.");
        }
    } catch (error) {
        console.error("Error loading data from Supabase:", error);
        showErrorState("Could not load data from the database. Falling back to local data.");
        loadInspectionsFromLocalData();
    }
}

/**
 * Load inspections from local JSON files
 */
async function loadInspectionsFromLocalData() {
    try {
        showLoadingState();

        // Fetch all submission files from the data directory
        const response = await fetch('../api/local-submissions');

        // If API endpoint isn't available, use hardcoded data paths
        let submissions = [];

        if (response.ok) {
            submissions = await response.json();
        } else {
            // Hardcoded paths to sample data files
            const samplePaths = [
                '../data/submission_1748820750520.json',
                '../data/submission_1748820907565.json',
                '../data/submission_1748888053502.json',
                '../data/submission_1748888184785.json'
            ];

            // Load sample data files
            submissions = await Promise.all(
                samplePaths.map(async path => {
                    try {
                        const resp = await fetch(path);
                        if (resp.ok) {
                            const data = await resp.json();
                            // Convert to a format similar to the Supabase data
                            return formatLocalSubmission(data, path);
                        }
                        return null;
                    } catch (e) {
                        console.error(`Error loading ${path}:`, e);
                        return null;
                    }
                })
            );

            // Filter out nulls from failed loads
            submissions = submissions.filter(sub => sub !== null);
        }

        if (submissions && submissions.length > 0) {
            displayInspections(submissions);
        } else {
            showEmptyState("No inspection requests found.");
        }
    } catch (error) {
        console.error("Error loading local data:", error);
        showErrorState("Could not load inspection data. Please try again later.");
    }
}

/**
 * Format a local submission to match the Supabase data structure
 */
function formatLocalSubmission(data, filePath) {
    // Extract ID from filename
    const id = filePath.split('_').pop().split('.')[0];
    const timestamp = parseInt(id);
    const date = new Date(timestamp);

    return {
        id: id,
        first_name: data.contact.firstName,
        last_name: data.contact.lastName,
        email: data.contact.email,
        phone: data.contact.phone,
        street_address: data.property.address,
        city: data.property.city,
        zip_code: data.property.zipCode,
        property_type: data.property.type,
        property_size: data.property.size,
        preferred_date: data.appointment.date,
        preferred_time: data.appointment.time,
        special_notes: data.property.specialNotes || '',
        how_heard: data.contact.howHeard,
        base_inspection_fee: data.pricing.baseInspectionFee,
        service_type_fee: data.pricing.serviceTypeFee,
        property_size_fee: data.pricing.propertySizeFee,
        weekend_fee: data.pricing.weekendFee,
        total_price: data.pricing.totalPrice,
        status: 'pending',
        created_at: date.toISOString(),
        services: Object.keys(data.services).filter(key => data.services[key]).map(key => {
            if (key === 'water') return 'Water Leak Detection';
            if (key === 'gas') return 'Gas Leak Detection';
            if (key === 'co') return 'Carbon Monoxide Detection';
            if (key === 'comprehensive') return 'Comprehensive Package';
            return key;
        })
    };
}

/**
 * Display inspections in the table
 */
function displayInspections(inspections) {
    const tableBody = document.getElementById('inspections-table-body');

    // Store the inspections in a global variable for filtering/sorting
    window.allInspections = inspections;

    // Apply initial filters and sorting
    applyFiltersAndSort();

    // Hide loading state
    hideLoadingState();

    // Update counts
    updateStatusCounts(inspections);
}

/**
 * Apply filters and sorting to the inspections
 */
function applyFiltersAndSort() {
    if (!window.allInspections) return;

    let filtered = [...window.allInspections];

    // Apply status filter
    if (currentFilter !== 'all') {
        filtered = filtered.filter(inspection => inspection.status === currentFilter);
    }

    // Apply sorting
    filtered.sort((a, b) => {
        let valueA = a[currentSort.column];
        let valueB = b[currentSort.column];

        // Handle date comparisons
        if (currentSort.column === 'created_at' || currentSort.column === 'preferred_date') {
            valueA = new Date(valueA);
            valueB = new Date(valueB);
        }

        // Handle string comparisons
        if (typeof valueA === 'string' && typeof valueB === 'string') {
            valueA = valueA.toLowerCase();
            valueB = valueB.toLowerCase();
        }

        // Compare values
        if (valueA < valueB) return currentSort.direction === 'asc' ? -1 : 1;
        if (valueA > valueB) return currentSort.direction === 'asc' ? 1 : -1;
        return 0;
    });

    // Update the table
    renderTable(filtered);
}

/**
 * Render the inspections table
 */
function renderTable(inspections) {
    const tableBody = document.getElementById('inspections-table-body');
    tableBody.innerHTML = '';

    if (inspections.length === 0) {
        // Show empty state in table
        const emptyRow = document.createElement('tr');
        emptyRow.innerHTML = `
      <td colspan="7" class="px-6 py-4 text-center text-gray-500">
        No inspection requests match the current filter.
      </td>
    `;
        tableBody.appendChild(emptyRow);
        return;
    }

    inspections.forEach(inspection => {
        const row = document.createElement('tr');
        row.className = 'hover:bg-gray-50';

        // Format the services into a string
        const servicesText = Array.isArray(inspection.services)
            ? inspection.services.join(', ')
            : 'No services specified';

        // Format the date
        const createdDate = new Date(inspection.created_at).toLocaleDateString();
        const preferredDate = new Date(inspection.preferred_date).toLocaleDateString();

        row.innerHTML = `
      <td class="px-6 py-4 whitespace-nowrap">
        <div class="flex items-center">
          <div>
            <div class="text-sm font-medium text-gray-900">${inspection.first_name} ${inspection.last_name}</div>
            <div class="text-sm text-gray-500">${inspection.email}</div>
          </div>
        </div>
      </td>
      <td class="px-6 py-4 whitespace-nowrap">
        <div class="text-sm text-gray-900">${preferredDate}</div>
        <div class="text-sm text-gray-500">${inspection.preferred_time}</div>
      </td>
      <td class="px-6 py-4">
        <div class="text-sm text-gray-900">${servicesText}</div>
      </td>
      <td class="px-6 py-4 whitespace-nowrap">
        <div class="text-sm text-gray-900">$${inspection.total_price}</div>
      </td>
      <td class="px-6 py-4 whitespace-nowrap">
        <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColors[inspection.status] || 'bg-gray-100 text-gray-800'}">
          ${inspection.status || 'Unknown'}
        </span>
      </td>
      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        ${createdDate}
      </td>
      <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <button class="text-indigo-600 hover:text-indigo-900 mr-2 view-details" data-id="${inspection.id}">View</button>
        ${window.isAdminMode ?
                `<button class="text-blue-600 hover:text-blue-900 update-status" data-id="${inspection.id}">Update</button>` :
                `<button class="text-gray-400 cursor-not-allowed" title="Login as admin to update status">Update</button>`
            }
      </td>
    `;

        tableBody.appendChild(row);
    });

    // Add event listeners to buttons
    document.querySelectorAll('.view-details').forEach(button => {
        button.addEventListener('click', function () {
            const id = this.dataset.id;
            viewInspectionDetails(id);
        });
    });

    document.querySelectorAll('.update-status').forEach(button => {
        button.addEventListener('click', function () {
            // Only allow status updates when in admin mode
            if (!window.isAdminMode) {
                showToast('Please login as admin to update inspection status.');
                // Show login section
                document.getElementById('login-section').classList.remove('hidden');
                // Scroll to login section
                document.getElementById('login-section').scrollIntoView({ behavior: 'smooth' });
                return;
            }

            const id = this.dataset.id;
            showStatusUpdateModal(id);
        });
    });
}

/**
 * View inspection details
 */
function viewInspectionDetails(id) {
    const inspection = window.allInspections.find(insp => insp.id === id);
    if (!inspection) return;

    // Populate modal with inspection details
    const modal = document.getElementById('details-modal');
    const modalContent = document.getElementById('details-content');

    // Format services
    const servicesHtml = Array.isArray(inspection.services)
        ? inspection.services.map(service => `<li>${service}</li>`).join('')
        : '<li>No services specified</li>';

    // Format dates
    const createdDate = new Date(inspection.created_at).toLocaleString();
    const preferredDate = new Date(inspection.preferred_date).toLocaleDateString();

    modalContent.innerHTML = `
    <h3 class="text-lg font-medium text-gray-900 mb-4">Inspection Details</h3>
    
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
      <div>
        <h4 class="font-medium text-gray-700">Customer Information</h4>
        <p>${inspection.first_name} ${inspection.last_name}</p>
        <p>Email: ${inspection.email}</p>
        <p>Phone: ${inspection.phone}</p>
        <p>How they heard about us: ${inspection.how_heard || 'Not specified'}</p>
      </div>
      
      <div>
        <h4 class="font-medium text-gray-700">Property Information</h4>
        <p>${inspection.street_address}</p>
        <p>${inspection.city}, ${inspection.zip_code}</p>
        <p>Type: ${inspection.property_type}</p>
        <p>Size: ${inspection.property_size}</p>
      </div>
    </div>
    
    <div class="mb-6">
      <h4 class="font-medium text-gray-700">Appointment Details</h4>
      <p>Preferred Date: ${preferredDate}</p>
      <p>Preferred Time: ${inspection.preferred_time}</p>
      <p>Special Notes: ${inspection.special_notes || 'None'}</p>
    </div>
    
    <div class="mb-6">
      <h4 class="font-medium text-gray-700">Services Requested</h4>
      <ul class="list-disc pl-5">
        ${servicesHtml}
      </ul>
    </div>
    
    <div class="mb-6">
      <h4 class="font-medium text-gray-700">Pricing</h4>
      <p>Base Inspection Fee: $${inspection.base_inspection_fee}</p>
      <p>Service Type Fee: $${inspection.service_type_fee}</p>
      <p>Property Size Fee: $${inspection.property_size_fee}</p>
      <p>Weekend Fee: $${inspection.weekend_fee}</p>
      <p class="font-medium">Total Price: $${inspection.total_price}</p>
    </div>
    
    <div>
      <h4 class="font-medium text-gray-700">Status Information</h4>
      <p>Current Status: 
        <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColors[inspection.status] || 'bg-gray-100 text-gray-800'}">
          ${inspection.status || 'Unknown'}
        </span>
      </p>
      <p>Submitted on: ${createdDate}</p>
    </div>
  `;

    // Show modal
    modal.classList.remove('hidden');
}

/**
 * Show status update modal
 */
function showStatusUpdateModal(id) {
    const inspection = window.allInspections.find(insp => insp.id === id);
    if (!inspection) return;

    // Populate modal
    const modal = document.getElementById('status-modal');
    const modalContent = document.getElementById('status-content');

    modalContent.innerHTML = `
    <h3 class="text-lg font-medium text-gray-900 mb-4">Update Status</h3>
    <p class="mb-4">Current status for ${inspection.first_name} ${inspection.last_name}'s inspection:</p>
    
    <div class="mb-4">
      <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColors[inspection.status] || 'bg-gray-100 text-gray-800'}">
        ${inspection.status || 'Unknown'}
      </span>
    </div>
    
    <div class="mb-4">
      <label class="block text-sm font-medium text-gray-700 mb-1">New Status:</label>
      <select id="new-status" class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md">
        <option value="pending" ${inspection.status === 'pending' ? 'selected' : ''}>Pending</option>
        <option value="confirmed" ${inspection.status === 'confirmed' ? 'selected' : ''}>Confirmed</option>
        <option value="completed" ${inspection.status === 'completed' ? 'selected' : ''}>Completed</option>
        <option value="cancelled" ${inspection.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
      </select>
    </div>
    
    <div class="flex justify-end">
      <button type="button" class="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 mr-3" onclick="closeModal('status-modal')">
        Cancel
      </button>
      <button type="button" class="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500" onclick="updateInspectionStatus('${id}')">
        Update Status
      </button>
    </div>
  `;

    // Show modal
    modal.classList.remove('hidden');

    // Make the updateInspectionStatus function available globally
    window.updateInspectionStatus = updateInspectionStatus;
}

/**
 * Update inspection status
 */
async function updateInspectionStatus(id) {
    // Verify user is in admin mode before allowing updates
    if (!window.isAdminMode) {
        showToast('You need to be logged in as admin to update inspection status.');
        closeModal('status-modal');

        // Show login section
        document.getElementById('login-section').classList.remove('hidden');
        document.getElementById('login-section').scrollIntoView({ behavior: 'smooth' });
        return;
    }

    const newStatus = document.getElementById('new-status').value;
    const inspection = window.allInspections.find(insp => insp.id === id);

    if (!inspection) return;

    try {
        if (supabase) {
            // Update in Supabase
            const { data, error } = await supabase
                .from('service_requests')
                .update({ status: newStatus })
                .eq('id', id);

            if (error) throw error;
        }

        // Update in local data
        inspection.status = newStatus;

        // Close modal
        closeModal('status-modal');

        // Refresh table
        applyFiltersAndSort();

        // Update counts
        updateStatusCounts(window.allInspections);

        // Show success message
        showToast('Status updated successfully');
    } catch (error) {
        console.error("Error updating status:", error);
        showToast('Failed to update status', 'error');
    }
}

/**
 * Close a modal by ID
 */
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('hidden');
    }
}

// Make closeModal available globally
window.closeModal = closeModal;

/**
 * Update status counts in the filter buttons
 */
function updateStatusCounts(inspections) {
    // Count inspections by status
    const counts = {
        all: inspections.length,
        pending: 0,
        confirmed: 0,
        completed: 0,
        cancelled: 0
    };

    inspections.forEach(inspection => {
        if (inspection.status && counts.hasOwnProperty(inspection.status)) {
            counts[inspection.status]++;
        }
    });

    // Update the count in each filter button
    Object.entries(counts).forEach(([status, count]) => {
        const countElement = document.querySelector(`.status-filter[data-status="${status}"] .count`);
        if (countElement) {
            countElement.textContent = count;
        }
    });
}

/**
 * Show loading state
 */
function showLoadingState() {
    document.getElementById('loading-indicator').classList.remove('hidden');
    document.getElementById('inspections-table').classList.add('hidden');
    document.getElementById('empty-state').classList.add('hidden');
    document.getElementById('error-state').classList.add('hidden');
}

/**
 * Hide loading state
 */
function hideLoadingState() {
    document.getElementById('loading-indicator').classList.add('hidden');
    document.getElementById('inspections-table').classList.remove('hidden');
}

/**
 * Show empty state
 */
function showEmptyState(message) {
    document.getElementById('loading-indicator').classList.add('hidden');
    document.getElementById('inspections-table').classList.add('hidden');

    const emptyState = document.getElementById('empty-state');
    emptyState.classList.remove('hidden');
    emptyState.querySelector('p').textContent = message;
}

/**
 * Show error state
 */
function showErrorState(message) {
    document.getElementById('loading-indicator').classList.add('hidden');
    document.getElementById('inspections-table').classList.add('hidden');

    const errorState = document.getElementById('error-state');
    errorState.classList.remove('hidden');
    errorState.querySelector('p').textContent = message;
}

/**
 * Show a message toast
 */
function showMessage(message, type = 'info') {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toast-message');

    // Set message and color based on type
    toastMessage.textContent = message;

    if (type === 'success') {
        toast.classList.add('bg-green-500');
        toast.classList.remove('bg-red-500', 'bg-blue-500');
    } else if (type === 'error') {
        toast.classList.add('bg-red-500');
        toast.classList.remove('bg-green-500', 'bg-blue-500');
    } else {
        toast.classList.add('bg-blue-500');
        toast.classList.remove('bg-green-500', 'bg-red-500');
    }

    // Show toast
    toast.classList.remove('hidden');

    // Hide after 3 seconds
    setTimeout(() => {
        toast.classList.add('hidden');
    }, 3000);
}

/**
 * Close a modal
 */
function closeModal(modalId) {
    document.getElementById(modalId).classList.add('hidden');
}

// Make closeModal function available globally
window.closeModal = closeModal;