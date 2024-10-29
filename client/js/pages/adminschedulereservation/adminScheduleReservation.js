import '../../../css/components/preloader.css';
import '../../../css/components/sideNavAdmin.css';
import '../../../css/pages/adminschedulereservation/adminScheduleReservation.css';
import { startSessionChecks } from '../../../utils/sessionUtils.js';
import '../../components/sideNavAdmin.js';

startSessionChecks();

const doc = document;
const { log, error } = console;

const getById = (id) => doc.getElementById(id);
const getAll = (selector) => doc.querySelectorAll(selector);
const get = (selector) => doc.querySelector(selector);

let reservationDates = [];
let currentIndex = 0;

async function fetchReservationDates() {
  try {
    const response = await fetch('/user/admin/reservations?dateOnly=true');
    const data = await response.json();

    if (data.status === 'success') {
      reservationDates = data.dates;
      log(reservationDates);
      if (reservationDates.length > 0) {
        fetchReservations(reservationDates[currentIndex]);
      }
    } else {
      log('No dates found');
      reservationDates = [];
    }
  } catch (err) {
    error('Error fetching dates:', err);
    reservationDates = [];
  }
}

async function fetchReservations(reservationDate) {
  try {
    const response = await fetch(`/user/admin/reservations?date=${reservationDate}`);
    const data = await response.json();

    if (data.status === 'success' && data.reservationDates) {
      console.log('Fetched reservationDates:', data.reservationDates);
      displayDate();
      populateTable(data.reservationDates);
    } else {
      error('Unexpected response structure:', data);
    }
  } catch (error) {
    error('Error fetching reservations:', error);
  }
}

function populateTable(reservationDates) {
  const dateKeys = Object.keys(reservationDates);

  dateKeys.forEach((date) => {
    const reservations = reservationDates[date];

    // create a map to store court selections by time slot
    const courtSelections = {};

    // create a map to store the user info for each reservation
    const userInfoMap = {};

    reservations.forEach((reservation) => {
      const { timeSlot, selectedCourts, totalCourts, user, operatingHours } = reservation;

      // store user info in the map keyed by reservationId
      userInfoMap[reservation.reservationId] = user;

      const courts = Math.max(6, totalCourts || 6);
      const startHour = parseTime(operatingHours.from);
      const endHour = parseTime(operatingHours.to);
      const timeSlots = generateTimeSlots(startHour, endHour);

      // store court selections for this reservation
      selectedCourts.forEach((courtIndex) => {
        const fromTime = convertTo24Hour(timeSlot.from);
        const toTime = convertTo24Hour(timeSlot.to);

        if (!courtSelections[courtIndex]) {
          courtSelections[courtIndex] = [];
        }
        courtSelections[courtIndex].push({ from: fromTime, to: toTime });
      });

      const tbody = get('tbody');
      const thead = get('thead tr');
      tbody.innerHTML = '';
      thead.innerHTML = '<th>Time</th>';

      // add headers for each court
      for (let i = 1; i <= courts; i++) {
        const th = document.createElement('th');
        th.textContent = `Court ${i}`;
        th.setAttribute('data-court', i);
        thead.appendChild(th);
      }

      timeSlots.forEach((slot, index) => {
        const tr = document.createElement('tr');
        const timeCell = document.createElement('td');

        const startTime = slot; // Current slot
        const endTime = timeSlots[index + 1]; // Next slot

        timeCell.setAttribute('data-time', `${startTime} - ${endTime}`);

        if (endTime) {
          timeCell.innerHTML = `
            <div class="time-container">
              <span class="hour">${startTime}</span>
            </div>
            <div class="time-container">
              <span class="hour">${endTime}</span>
            </div>
          `;
        } else {
          // if no next slot, do not add it (skip)
          return; // Skip adding this row
        }

        timeCell.className = 'time-cell';
        tr.appendChild(timeCell);

        for (let courtIndex = 0; courtIndex < courts; courtIndex++) {
          const courtCell = document.createElement('td');
          courtCell.setAttribute('data-court', courtIndex + 1);

          const reservationStart = convertTo24Hour(timeSlot.from);
          const reservationEnd = convertTo24Hour(timeSlot.to);
          const slotTimeStart = convertTo24Hour(startTime);
          const slotTimeEnd = convertTo24Hour(endTime);

          // check if the current time slot overlaps with any reservations for this court
          const isReserved =
            courtSelections[courtIndex] &&
            courtSelections[courtIndex].some(({ from, to }) => isWithinTimeRange(slotTimeStart, slotTimeEnd, from, to));

          if (isReserved) {
            // find the reservation that caused the overlap
            const overlappingReservation = reservations.find(
              (reservation) =>
                reservation.selectedCourts.includes(courtIndex) &&
                isWithinTimeRange(
                  slotTimeStart,
                  slotTimeEnd,
                  convertTo24Hour(reservation.timeSlot.from),
                  convertTo24Hour(reservation.timeSlot.to)
                )
            );

            if (overlappingReservation) {
              courtCell.classList.add('highlight');
              const user = userInfoMap[overlappingReservation.reservationId];
              courtCell.innerHTML = `
              <div class="court-info">${user.firstName} ${user.lastName}</div>
              <div class="payment-status">${overlappingReservation.paymentStatus}</div>
            `;
            }
          }

          tr.appendChild(courtCell);
        }

        tbody.appendChild(tr);
      });
    });
  });
}

function isWithinTimeRange(slotStart, slotEnd, reservationStart, reservationEnd) {
  return slotStart < reservationEnd && slotEnd > reservationStart;
}

function displayDate() {
  log(reservationDates);
  const dateDisplay = get('.date');
  if (reservationDates.length > 0 && reservationDates[currentIndex]) {
    dateDisplay.textContent = new Date(reservationDates[currentIndex]).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  } else {
    dateDisplay.textContent = 'No available dates';
  }
}
getAll('.nav-button').forEach((button, index) => {
  button.addEventListener('click', () => {
    const newIndex =
      index === 0 ? Math.max(0, currentIndex - 1) : Math.min(reservationDates.length - 1, currentIndex + 1);

    // check if moving to a different index
    if (newIndex !== currentIndex) {
      currentIndex = newIndex; // update currentIndex to the new value
      displayDate(); // update the displayed date

      // only fetch reservations if the newIndex is valid
      if (currentIndex < reservationDates.length && currentIndex >= 0) {
        fetchReservations(reservationDates[currentIndex]);
      } else {
        console.log('No more dates to fetch.');
      }
    }
  });
});

function clearTable() {
  getAll('tbody td').forEach((cell) => {
    cell.innerHTML = '';
    cell.classList.remove('highlight');
  });
}

const fetchReservationsByUsername = async (username) => {
  const date = reservationDates[currentIndex];
  if (username) {
    try {
      const response = await fetch(`/user/admin/reservations?username=${username}&date=${date}`, {
        withPreloader: false
      });
      const data = await response.json();
      if (data.status === 'success') {
        clearTable();
        populateTable(data.reservationDates);
      } else {
        removeTableHeader();
        const tbody = get('tbody');
        tbody.innerHTML = '<tr><td colspan="100%" class="no-reservation">No reservations found</td></tr>';
      }
    } catch (err) {
      error('Error fetching reservations by username:', err);
    }
  } else {
    // when the input is cleared, fetch reservations for the current index
    removeTableHeader();
    fetchReservations(reservationDates[currentIndex]);
    generateTableHeader();
  }
};
const generateTableHeader = () => {
  const thead = document.createElement('thead');
  const headerRow = document.createElement('tr');

  headerRow.innerHTML = '';

  thead.appendChild(headerRow);
  document.querySelector('table').prepend(thead);
};
const removeTableHeader = () => {
  const thead = document.querySelector('thead');
  if (thead) {
    thead.remove();
  }
};

window.onload = () => {
  const searchInput = get('search');
  if (searchInput) {
    searchInput.value = '';
  }
};

const debouncedFetchReservations = debounce(fetchReservationsByUsername, 300);

getById('search').addEventListener('input', (event) => {
  const username = event.target.value;
  debouncedFetchReservations(username);
});
function debounce(func, delay) {
  let timeoutId;
  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      func.apply(this, args);
    }, delay);
  };
}

function parseTime(time) {
  const [hours, modifier] = time.split(' ');
  let [hour, minute] = hours.split(':').map(Number);
  if (modifier === 'PM' && hour !== 12) hour += 12;
  if (modifier === 'AM' && hour === 12) hour = 0;
  return `${hour}:${minute < 10 ? '0' : ''}${minute}`;
}

fetchReservationDates();

function generateTimeSlots(start, end, interval = 60) {
  const slots = [];

  const startDate = new Date(`1970-01-01T${convertTo24Hour(start)}`);
  const endDate = new Date(`1970-01-01T${convertTo24Hour(end)}`);

  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    console.error('Invalid start or end time provided:', start, end);
    return slots;
  }

  while (startDate <= endDate) {
    const hours = startDate.getHours();
    const minutes = startDate.getMinutes();
    const formattedTime = `${hours % 12 || 12}:${minutes < 10 ? '0' : ''}${minutes} ${hours >= 12 ? 'PM' : 'AM'}`;
    slots.push(formattedTime);

    startDate.setMinutes(startDate.getMinutes() + interval);
  }

  return slots;
}

function convertTo24Hour(time) {
  const [timePart, modifier] = time.split(' ');
  let [hours, minutes] = timePart.split(':').map(Number);
  if (modifier === 'PM' && hours !== 12) {
    hours += 12;
  } else if (modifier === 'AM' && hours === 12) {
    hours = 0;
  }
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}
