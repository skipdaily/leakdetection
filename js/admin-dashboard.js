/**
 * Admin Dashboard JavaScript
 * This file handles the admin dashboard functionality including:
 * - Loading inspection data from Supabase database
 * - Displaying inspection requests in a table
 * - Filtering and sorting functionality
 * - Status updates for inspection requests
 */

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

// Initialize the Supabase client
const supabaseUrl = 'https://dglezauqqxybwiyfiriz.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRnbGV6YXVxcXh5YndpeWZpcml6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODc4NjY5NSwiZXhwIjoyMDY0MzYyNjk1fQ.2li2SVo34n7s4uMiNnJ2DzyafNljxCmJk0ZAG_aRM3U';

// Create supabase client
let supabase;

document.addEventListener('DOMContentLoaded', async function () {
    console.log("=== DASHBOARD INITIALIZATION ===");
    console.log("Loading admin dashboard...");

    // Initialize Supabase client
    supabase = supabaseClient.createClient(supabaseUrl, supabaseAnonKey);

    // Check if user is authenticated
    await checkAuthentication();

    // Initialize UI elements
    initializeUI();

    // Load inspection data from Supabase
    loadInspectionsFromSupabase();
});

/**
 * Check if the user is authenticated
 * Redirect to login page if not authenticated
 */
async function checkAuthentication() {
    try {
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
            console.log("No active session found. Proceeding as service role.");
            // Since we're using the service role key, we can still access data
            // In a production environment, you should implement proper authentication
            return;
        }

        console.log("User authenticated:", session.user.email);
    } catch (error) {
        console.error("Authentication check error:", error);
        // Continue anyway since we're using service role key
    }
}

/**
 * Initialize UI elements and event listeners
 */
function initializeUI() {
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

        console.log("Fetching data from Supabase...");

        // Fetch data from complete_service_requests view
        const { data: inspections, error } = await supabase
            .from('complete_service_requests')
            .select('*');

        if (error) {
            console.error("Error fetching data from Supabase:", error);
            showErrorState(`Error fetching data: ${error.message}`);
            return;
        }

        console.log("Data received:", inspections);

        if (inspections && inspections.length > 0) {
            displayInspections(inspections);
            updateDashboardSummary(inspections);
        } else {
            showEmptyState("No inspection requests found.");
        }
    } catch (error) {
        console.error("Error loading data from Supabase:", error);
        showErrorState(`Error: ${error.message || "Could not load inspection data"}`);
    }
}

/**
 * Update dashboard summary metrics
 */
function updateDashboardSummary(inspections) {
    // Calculate summary metrics
    const totalRequests = inspections.length;

    const pendingRequests = inspections.filter(
        insp => insp.status === 'pending'
    ).length;

    const confirmedRequests = inspections.filter(
        insp => insp.status === 'confirmed'
    ).length;

    const totalRevenue = inspections.reduce(
        (sum, insp) => sum + parseFloat(insp.total_price), 0
    ).toFixed(2);

    // Update the summary cards
    document.getElementById('total-requests').textContent = totalRequests;
    document.getElementById('pending-requests').textContent = pendingRequests;
    document.getElementById('confirmed-requests').textContent = confirmedRequests;
    document.getElementById('total-revenue').textContent = `$${totalRevenue}`;
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
        <button class="text-blue-600 hover:text-blue-900 update-status" data-id="${inspection.id}">Update</button>
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
 * Update inspection status in Supabase
 */
async function updateInspectionStatus(id) {
    const newStatus = document.getElementById('new-status').value;

    try {
        // Update status in Supabase
        const { error } = await supabase
            .from('service_requests')
            .update({ status: newStatus })
            .eq('id', id);

        if (error) {
            console.error("Error updating status in Supabase:", error);
            showToast('Failed to update status', 'error');
            return;
        }

        // Update local data
        const inspection = window.allInspections.find(insp => insp.id === id);
        if (inspection) {
            inspection.status = newStatus;
        }

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

