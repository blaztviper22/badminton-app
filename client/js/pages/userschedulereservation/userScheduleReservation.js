import '../../../css/components/navBarUser.css';
import '../../../css/components/preloader.css';
import '../../../css/pages/userschedulereservation/userScheduleReservation.css';
import { startSessionChecks, validateSessionAndNavigate } from '../../../utils/sessionUtils.js';
import { setupLogoutListener } from '../../global/logout.js';

const doc = document;
const { log, error } = console;

const getById = (id) => doc.getElementById(id);
const getAll = (selector) => doc.querySelectorAll(selector);
const get = (selector) => doc.querySelector(selector);

setupLogoutListener();
startSessionChecks();

// Fetch reservations based on filters
const fetchReservations = async () => {
  const dateFilter = get('input[name="dateFilter"]:checked')?.value || '';
  const statusFilter = get('input[name="statusFilter"]:checked')?.value.toLowerCase() || '';
  const sortOrder = get('input[name="sortOrder"]:checked')?.value.toLowerCase() || '';

  const queryParams = new URLSearchParams();
  if (dateFilter) queryParams.append('dateFilter', dateFilter);
  if (statusFilter) queryParams.append('statusFilter', statusFilter);
  if (sortOrder) queryParams.append('sortOrder', sortOrder);

  const response = await fetch(`/user/reservations?${queryParams.toString()}`);
  const data = await response.json();

  if (data.status === 'success') {
    const reservations = Array.isArray(data.reservations) ? data.reservations : [];
    renderReservations(reservations);
  } else {
    log('Failed to fetch reservations:', data);
  }
};

// Render reservations dynamically
const renderReservations = (reservations) => {
  const reservationsContainer = getById('reservations-container');
  reservationsContainer.innerHTML = ''; // Clear previous content

  if (!Array.isArray(reservations) || reservations.length === 0) {
    const noReservationsMessage = document.createElement('div');
    noReservationsMessage.className = 'no-reservations';
    noReservationsMessage.innerHTML = `
      <h3>No reservations found.</h3>
      <p>Please check back later or make a new reservation.</p>
    `;
    reservationsContainer.appendChild(noReservationsMessage);
    return; // Exit the function
  }

  reservations.forEach((reservation) => {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <div class="details">
        <h2>${reservation.businessName}</h2>
        <div class="icon-text">
          <i class="fas fa-map-marker-alt"></i>
          <p>${reservation.location}</p>
        </div>
        <div class="icon-text">
          <i class="fas fa-calendar-alt"></i>
          <p>${reservation.date}</p>
        </div>
        <div class="icon-text">
          <i class="fas fa-clock"></i>
          <p>${reservation.timeSlot.from} - ${reservation.timeSlot.to}</p>
        </div>
      </div>
      <div class="footer-actions">
        <div class="status-group">
          <span class="status ${reservation.status.toLowerCase()}">${reservation.status}</span>
        </div>
        <button class="cancel-button" data-reservation-id="${reservation.reservationId}">Cancel Reservation</button>
      </div>
    `;
    reservationsContainer.appendChild(card);
  });

  // Add event listeners to cancel buttons
  addCancelListeners();
};

// Function to add event listeners to cancel buttons
const addCancelListeners = () => {
  const cancelButtons = getAll('.cancel-button');
  cancelButtons.forEach((button) => {
    button.addEventListener('click', async () => {
      const reservationId = button.getAttribute('data-reservation-id');
      try {
        const response = await cancelReservation(reservationId);
        if (response.status === 'success') {
          log(`Reservation ${reservationId} cancelled successfully.`);
          fetchReservations(); // Refresh reservations after cancellation
        } else {
          error(`Failed to cancel reservation: ${response.message}`);
        }
      } catch (err) {
        error('Error cancelling reservation:', err);
      }
    });
  });
};

// Function to cancel a reservation
const cancelReservation = async (reservationId) => {
  const response = await fetch('/user/reservations/cancel', {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ reservationId })
  });

  const data = await response.json();
  return data;
};

getAll('input[type="radio"]').forEach((radio) => {
  radio.addEventListener('change', fetchReservations);
});

fetchReservations();
