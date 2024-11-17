import '../../../css/components/preloader.css';
import '../../../css/pages/superadmindashboard/superAdminDashboard.css';
import { startSessionChecks, validateSessionAndNavigate } from '../../../utils/sessionUtils.js';
import { openModal } from '../../components/modal.js';
import { setupLogoutListener } from '../../global/logout.js';

startSessionChecks();
setupLogoutListener();

const doc = document;
const { log, error } = console;

const getById = (id) => doc.getElementById(id);
const getAll = (selector) => doc.querySelectorAll(selector);
const get = (selector) => doc.querySelector(selector);

document.addEventListener('DOMContentLoaded', () => {
  const tabs = getAll('.nav-link');
  const tabContents = getAll('.tab-content');
  const viewDetailsModal = getById('viewDetailsModal');
  const closeViewModalBtn = get('#viewDetailsModal .close');
  const courtOwnersTableBody = get('#courtOwnersTable tbody');

  // Handle tab switching
  tabs.forEach((tab) => {
    tab.addEventListener('click', (e) => {
      e.preventDefault();
      tabs.forEach((t) => t.classList.remove('active'));
      tabContents.forEach((content) => content.classList.remove('active'));
      tab.classList.add('active');
      const target = getById(tab.dataset.tab);
      target.classList.add('active');
    });
  });

  // handle actions (View Details, Approve, Reject)
  doc.body.addEventListener('click', (e) => {
    if (e.target.classList.contains('btn-view')) {
      const courtId = e.target.dataset.id;
      showViewDetailsModal(courtId);
    } else if (e.target.classList.contains('btn-approve')) {
      const courtId = e.target.dataset.id;
      openModal(
        'confirm',
        'Approve Court Owner',
        'Are you sure you want to approve?',
        () => onConfirmApprove(courtId), // Pass courtId here
        onCancelApprove,
        'Approve',
        'Cancel'
      );
    } else if (e.target.classList.contains('btn-reject')) {
      const courtId = e.target.dataset.id;
      openModal(
        'confirm',
        'Reject Court Owner',
        'Are you sure you want to reject?',
        () => onConfirmReject(courtId), // Pass courtId here
        onCancelReject,
        'Reject',
        'Cancel'
      );
    }
  });

  function onCancelReject() {
    log('Superadmin canceled reject.');
  }

  async function onConfirmReject(courtId) {
    log('Superadmin confirmed reject.');
    await handleAction(courtId, 'reject');
    fetchCourtData('/superadmin/courts?status=pending', courtOwnersTableBody);
  }

  function onCancelApprove() {
    log('Superadmin canceled approve.');
  }

  async function onConfirmApprove(courtId) {
    log('Superadmin confirmed approve.');
    // Call handleAction to approve the court
    await handleAction(courtId, 'approve');
    fetchCourtData('/superadmin/courts?status=pending', courtOwnersTableBody);
  }

  // function to show the View Details modal and set data
  const showViewDetailsModal = async (courtId) => {
    // Fetch court details by courtId
    const response = await fetch(`/superadmin/court-details/${courtId}`);
    const result = await response.json();

    if (result.success) {
      const court = result.data;

      // Set the content dynamically using innerHTML
      const modalContent = `
      <span class="close">&times;</span>
      <h2>Details</h2>

      <!-- Logo -->
      <div class="modal-logo-container">
        <img id="logoImage" src="${court.business_logo}" alt="Logo" />
      </div>

      <!-- Modal Body -->
      <div class="modal-body">
        <div class="column">
          <label>Business Name:</label>
          <input type="text" id="businessName" value="${court.business_name}" readonly />

          <label>Operating Hours:</label>
          <input type="text" id="operatingHours" value="From: ${court.operating_hours.from} To: ${
        court.operating_hours.to
      }" readonly />

          <label>Rate:</label>
          <input type="text" id="rate" value="₱${court.hourly_rate}" readonly />
        </div>

        <div class="column">
          <label>Location:</label>
          <input type="text" id="location" value="${court.address}" readonly />

          <label>Total Courts:</label>
          <input type="text" id="availableCourts" value="${court.totalCourts}" readonly />
        </div>
      </div>

<!-- Uploaded Files -->
<div class="file-uploads">
  <label>Uploaded Files:</label>
  <div class="file-areas">
    <!-- Dynamically loop through files -->
    ${Object.values(court.documents)
      .map((fileArray, index) =>
        fileArray
          .map(
            (file, fileIndex) => `
        <div class="file-area" id="file${index * 7 + fileIndex + 1}">
          <a href="${file}" download>Download File ${index * 7 + fileIndex + 1}</a>
        </div>
      `
          )
          .join('')
      )
      .join('')}

    `;

      const modalContentContainer = get('.modal-content');
      modalContentContainer.innerHTML = modalContent;

      const viewDetailsModal = getById('viewDetailsModal');
      viewDetailsModal.style.display = 'block';

      const closeModalBtn = modalContentContainer.querySelector('.close');
      closeModalBtn.addEventListener('click', () => {
        viewDetailsModal.style.display = 'none';
      });
    } else {
      console.error('Error fetching court details:', result.message);
    }
  };
});

const handleAction = async (courtId, action) => {
  try {
    const res = await fetch(`/superadmin/court/${action}/${courtId}`, { method: 'PATCH' });
    const result = await res.json();

    if (result.success === true) {
      log(`${action} action successful`);
    } else {
      error(`${action} action failed:`, result.message);
    }
  } catch (err) {
    error('Error processing action:', err);
  }
};

function fetchCourtData(apiUrl, tableBody) {
  fetch(apiUrl)
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        // Clear the existing table content before adding new rows
        tableBody.innerHTML = '';

        // Check if data is empty
        if (data.data.length === 0) {
          // Add a row indicating no data available
          const noDataRow = document.createElement('tr');
          noDataRow.innerHTML = `
            <td colspan="7" style="text-align: center;">No pending approval</td>
          `;
          tableBody.appendChild(noDataRow);
          return;
        }

        // Populate the table with court data
        data.data.forEach(async (court, index) => {
          const row = document.createElement('tr');

          // Log the court object for debugging
          console.log(court);

          // Access the necessary data from the court object
          const courtOwnerName = `${court.user.first_name} ${court.user.middle_name} ${court.user.last_name}`;
          const businessName = court.business_name;
          const address = court.address;
          const courtEmail = court.user.email;
          const courtContact = court.user.contact_number;
          const registrationDate = new Date(court.user.createdAt).toLocaleDateString();

          // Create the row HTML
          row.innerHTML = `
            <td>${index + 1}</td>
            <td>${courtOwnerName}</td>
            <td>${businessName}</td>
            <td>${address}</td>
            <td>${courtEmail}</td>
            <td>${courtContact}</td>
            <td>${registrationDate}</td>
            <td>
              <button class="btn btn-view" data-id="${court._id}">View Details</button>
              <button class="btn btn-approve" data-id="${court._id}">Approve</button>
              <button class="btn btn-reject" data-id="${court._id}">Reject</button>
            </td>
          `;

          // append the row to the table body
          tableBody.appendChild(row);
        });
      } else {
        console.error('Failed to load court data');
      }
    })
    .catch((error) => console.error('Error fetching court data:', error));
}

const courtOwnersTableBody = get('#courtOwnersTable tbody');
fetchCourtData('/superadmin/courts?status=pending', courtOwnersTableBody);
