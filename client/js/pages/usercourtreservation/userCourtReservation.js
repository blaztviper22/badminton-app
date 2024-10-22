import { io } from 'socket.io-client';
import '../../../css/components/navBarUser.css';
import '../../../css/components/preloader.css';
import '../../../css/pages/usercourtreservation/userCourtReservation.css';
import { startSessionChecks, validateSessionAndNavigate } from '../../../utils/sessionUtils.js';
import { setupLogoutListener } from '../../global/logout.js';

let selectedCourts = [];
let selectedDate = null;
let reservedDates = [];
let hourlyRate = 0;
let calendar;

function calculateTotalAmount() {
  const selectedSlots = Array.from(getAll('.time-slot.selected'));
  const totalHours = calculateDuration(groupTimeSlots(selectedSlots));
  const totalCourts = selectedCourts.length;
  const calculatedAmount = totalHours * hourlyRate * totalCourts;
  return calculatedAmount * 100;
}

const socket = io();
socket.on('reservationCreated', (data) => {
  // refresh the court data and UI based on the received data
  fetchCourtData(data.courtId, data.date).then(({ courtData, availabilityData, reservedDates }) => {
    populateCourtImagesAndLocation(courtData);
    generateTimeSlots(availabilityData);
    reservedDates = reservedDates;
    highlightReservedDates(reservedDates);
    calendar.render();
  });
});

const doc = document;
const { log, error } = console;

const getById = (id) => doc.getElementById(id);
const getAll = (selector) => doc.querySelectorAll(selector);
const get = (selector) => doc.querySelector(selector);

setupLogoutListener();

// Start session checks on page load
startSessionChecks();

// Get address from coordinates
export async function getAddressFromCoordinates(coordinates) {
  const [lon, lat] = coordinates;

  if (typeof lat !== 'number' || typeof lon !== 'number') {
    console.error('Latitude and Longitude must be numbers');
    return 'Invalid coordinates';
  }

  const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data.display_name || 'Address not found';
  } catch (err) {
    error('Error fetching address:', err);
    return 'Address not available';
  }
}

// Parse time string (e.g., "11:22 AM") to 24-hour format
function parseTime(timeStr) {
  const [time, modifier] = timeStr.split(' ');
  let [hours, minutes] = time.split(':').map(Number);
  if (modifier === 'PM' && hours < 12) hours += 12;
  if (modifier === 'AM' && hours === 12) hours = 0;
  return hours;
}

function populateCourtImagesAndLocation(courtData) {
  const courtImagesContainer = getById('courtImages');
  courtImagesContainer.innerHTML = '';

  const locationField = get('.location-field input');
  const coordinates = courtData.location.coordinates;
  getAddressFromCoordinates(coordinates).then((address) => {
    locationField.value = address;
  });

  hourlyRate = courtData.hourly_rate;

  courtData.court_images.forEach((image, index) => {
    const imgContainer = document.createElement('div');
    imgContainer.classList.add('court-image');
    imgContainer.innerHTML = `<img src="${image}" alt="Court Image ${index + 1}" />`;

    imgContainer.addEventListener('click', function () {
      const selectedIndex = selectedCourts.indexOf(index);

      if (selectedIndex === -1) {
        selectedCourts.push(index);
        this.classList.add('selected');
      } else {
        selectedCourts.splice(selectedIndex, 1);
        this.classList.remove('selected');
      }

      handleTimeSlotSelection(); // Update payment when courts are selected
    });

    courtImagesContainer.appendChild(imgContainer);
  });
}

doc.addEventListener('DOMContentLoaded', async function () {
  var calendarEl = getById('calendar');

  // Get the current date in the Philippines timezone
  const options = { timeZone: 'Asia/Manila', year: 'numeric', month: '2-digit', day: '2-digit' };
  const formatter = new Intl.DateTimeFormat('en-CA', options); // Use 'en-CA' to get YYYY-MM-DD format
  const currentDate = formatter.format(new Date()).replace(/\//g, '-');

  calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: 'dayGridMonth',
    validRange: {
      start: currentDate
    },
    dateClick: async function (info) {
      doc.querySelectorAll('.fc-daygrid-day').forEach((day) => day.classList.remove('selected-date'));
      info.dayEl.classList.add('selected-date');
      selectedDate = info.dateStr;
      log('Selected date:', selectedDate);

      resetPaymentUI();

      // Fetch data for the selected date
      const { availabilityData } = await fetchCourtData(courtId, selectedDate);
      if (availabilityData) {
        generateTimeSlots(availabilityData);
      }
    },
    datesSet: async function (dateInfo) {
      // Highlight reserved dates every time the view changes
      highlightReservedDates(reservedDates);
    }
  });
  calendar.render();

  // Get court ID from URL
  const queryParams = new URLSearchParams(window.location.search);
  const courtId = queryParams.get('id');

  console.log('Current Date in Philippines:', currentDate);

  if (courtId) {
    const {
      courtData,
      availabilityData,
      reservedDates: fetchedReservedDates
    } = await fetchCourtData(courtId, currentDate);
    if (courtData) {
      populateCourtImagesAndLocation(courtData);
      generateTimeSlots(availabilityData); // Generate time slots

      // Store reserved dates globally
      reservedDates = fetchedReservedDates;
      highlightReservedDates(reservedDates); // Highlight reserved dates
    }
  }
});

// function to check if time slots are continuous
function areTimeSlotsContinuous(selectedSlots) {
  // extract the hour data
  const hours = selectedSlots.map((slot) => parseInt(slot.getAttribute('data-hour')));

  // sort the hours and check if they are consecutive
  hours.sort((a, b) => a - b);

  for (let i = 1; i < hours.length; i++) {
    if (hours[i] !== hours[i - 1] + 1) {
      return false; // Time slots are not continuous
    }
  }
  return true;
}

// function to group time slots
function groupTimeSlots(selectedSlots) {
  if (selectedSlots.length === 0) return null;

  const hours = selectedSlots.map((slot) => parseInt(slot.getAttribute('data-hour')));
  hours.sort((a, b) => a - b);

  const firstHour = hours[0];
  const lastHour = hours[hours.length - 1];

  const fromTimeSlot = selectedSlots.find((slot) => parseInt(slot.getAttribute('data-hour')) === firstHour);
  const toTimeSlot = selectedSlots.find((slot) => parseInt(slot.getAttribute('data-hour')) === lastHour);

  return {
    from: fromTimeSlot.textContent.split(' - ')[0],
    to: toTimeSlot.textContent.split(' - ')[1]
  };
}
function updateCourtSelectionDisplay() {
  const courtElements = getAll('.court-image');
  courtElements.forEach((court) => {
    court.classList.remove('selected');
  });
}

getById('reserveButton').addEventListener('click', function () {
  const selectedSlots = Array.from(getAll('.time-slot.selected'));

  log(selectedSlots);

  if (selectedSlots.length === 0) {
    alert('Please select at least one time slot.');
    return;
  }

  // group time slots into one reservation
  const groupedTimeSlot = groupTimeSlots(selectedSlots);

  const totalHours = calculateDuration(groupedTimeSlot);

  const totalCourts = selectedCourts.length;

  if (totalCourts === 0) {
    alert('Please select at least one court.');
    return;
  }

  log('totalHours', totalHours);

  // send the grouped time slot to the backend
  submitReservation(groupedTimeSlot);

  // remove 'selected' class from all selected time slots to reset selection
  selectedSlots.forEach((slot) => {
    slot.classList.remove('selected');
  });
  // updateCourtSelectionDisplay();
});

async function fetchCourtData(courtId, selectedDate) {
  try {
    const response = await fetch(`/user/court/${courtId}`);
    if (!response.ok) {
      throw new Error(`Error fetching court data: ${response.status}`);
    }
    const courtData = await response.json();

    // Fetch availability for the selected date
    const availabilityResponse = await fetch(`/user/availability?date=${selectedDate}&courtId=${courtId}`);
    if (!availabilityResponse.ok) {
      throw new Error(`Error fetching availability: ${availabilityResponse.status}`);
    }
    const availabilityData = await availabilityResponse.json();

    // Return both court data and availability data, including reserved dates
    return { courtData, availabilityData, reservedDates: availabilityData.reservedDates };
  } catch (err) {
    error(err);
    return null;
  }
}

// Function to highlight reserved dates
function highlightReservedDates(reservedDates) {
  const calendarDays = getAll('.fc-daygrid-day');

  calendarDays.forEach((day) => {
    const date = day.getAttribute('data-date'); // Get the date attribute
    if (reservedDates.includes(date)) {
      day.classList.add('reserved'); // Add reserved class if the date is reserved
    } else {
      day.classList.remove('reserved'); // Remove reserved class if the date is not reserved
    }
  });
}
// function to calculate the duration in hours based on the grouped time slots
function calculateDuration(groupedTimeSlot) {
  if (!groupedTimeSlot) {
    return 0;
  }

  const fromHour = parseTime(groupedTimeSlot.from);
  const toHour = parseTime(groupedTimeSlot.to);

  return toHour - fromHour;
}

// function to submit reservation to the backend
async function submitReservation(timeSlot) {
  log(timeSlot);
  log(selectedCourts);
  log(selectedDate);

  const queryParams = new URLSearchParams(window.location.search);
  const courtId = queryParams.get('id');

  const options = { timeZone: 'Asia/Manila', year: 'numeric', month: '2-digit', day: '2-digit' };
  const formatter = new Intl.DateTimeFormat('en-CA', options);
  const currentDate = formatter.format(new Date()).replace(/\//g, '-');

  // check if the selected date is valid; if not, use the current date
  const isSelectedDateValid = new Date(selectedDate) >= new Date(currentDate);
  const finalDate = isSelectedDateValid ? selectedDate : currentDate;

  const reservationData = {
    courtId: courtId,
    date: finalDate,
    timeSlot: timeSlot,
    selectedCourt: selectedCourts
  };

  try {
    const response = await fetch('/user/reserve', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(reservationData)
    });

    if (!response.ok) {
      const errorData = await response.json();
      const errorMessage = errorData.message || 'Failed to reserve time slot. Please try again.';
      resetPaymentUI();
      throw new Error(errorMessage);
    }

    alert('Reservation successful!');

    doc.querySelectorAll('.fc-daygrid-day').forEach((day) => day.classList.remove('selected-date'));

    // fetch data again to refresh  reserved dates
    const { reservedDates: fetchedReservedDates } = await fetchCourtData(courtId, finalDate);

    if (fetchedReservedDates) {
      reservedDates = fetchedReservedDates;
      highlightReservedDates(reservedDates);
    }
  } catch (err) {
    error(err);
    alert(`An error occurred: ${err.message}`);
    resetPaymentUI();
  }
}

function formatCurrency(amount) {
  // parse the amount as a float and format it to two decimal places
  return `₱${parseFloat(amount)
    .toFixed(2)
    .replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
}
function initializePaymentDisplay() {
  getAll('.payment-row .payment-value')[0].textContent = formatCurrency(0);
  getAll('.payment-row .payment-value')[1].textContent = formatCurrency(0);
  getAll('.payment-row .total-payment-value')[0].textContent = formatCurrency(0);
}

function resetPaymentUI() {
  getAll('.payment-row .payment-value')[0].textContent = formatCurrency(0);
  getAll('.payment-row .payment-value')[1].textContent = formatCurrency(0);
  getAll('.payment-row .total-payment-value')[0].textContent = formatCurrency(0);
}

document.addEventListener('DOMContentLoaded', () => {
  initializePaymentDisplay();
});

function updatePaymentUI(totalHours, totalCourts) {
  const calculatedAmount = totalHours * hourlyRate * totalCourts;
  const reservationFee = (calculatedAmount * 0.1).toFixed(2);
  const totalPayment = (calculatedAmount - reservationFee).toFixed(2);

  getAll('.payment-row .payment-value')[0].textContent = formatCurrency(calculatedAmount);
  getAll('.payment-row .payment-value')[1].textContent = formatCurrency(reservationFee);
  getAll('.payment-row .total-payment-value')[0].textContent = formatCurrency(totalPayment);
}

function handleTimeSlotSelection() {
  const selectedSlots = Array.from(getAll('.time-slot.selected'));
  const totalHours = calculateDuration(groupTimeSlots(selectedSlots));
  const totalCourts = selectedCourts.length;

  if (totalCourts > 0 && totalHours > 0) {
    updatePaymentUI(totalHours, totalCourts);
  } else {
    updatePaymentUI(0, 0);
  }
}

function generateTimeSlots(availabilityData) {
  const timeSlotsContainer = getById('timeSlots');
  timeSlotsContainer.innerHTML = '';

  const availableSlots = availabilityData.courts[0].timeSlot.available;
  const unavailableSlots = availabilityData.courts[0].timeSlot.unavailable;

  unavailableSlots.forEach((slot) => {
    const timeSlot = document.createElement('div');
    timeSlot.classList.add('time-slot', 'disabled');
    timeSlot.textContent = slot;
    timeSlotsContainer.appendChild(timeSlot);
  });

  availableSlots.forEach((slot) => {
    const timeSlot = document.createElement('div');
    timeSlot.classList.add('time-slot');
    timeSlot.textContent = slot;

    const hour = parseTime(slot);
    timeSlot.setAttribute('data-hour', hour);

    timeSlot.addEventListener('click', function () {
      this.classList.toggle('selected');
      handleTimeSlotSelection(); // Call to update the UI after selecting a slot
    });

    timeSlotsContainer.appendChild(timeSlot);
  });
}
async function fetchClientKey() {
  try {
    const response = await fetch('/user/client-key', {
      method: 'GET',
      credentials: 'include'
    });
    if (!response.ok) {
      throw new Error(`Error fetching client key: ${response.status}`);
    }
    const data = await response.json();
    return data.clientKey;
  } catch (error) {
    console.error(error);
    throw new Error('Failed to fetch client key');
  }
}
