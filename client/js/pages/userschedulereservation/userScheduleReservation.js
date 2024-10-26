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

// Start session checks on page load
startSessionChecks();

document.querySelectorAll('.filter-button').forEach((button) => {
  button.addEventListener('click', function () {
    document.querySelector('.filter-button.active')?.classList.remove('active');
    this.classList.add('active');
  });
});

function toggleFilter(checkbox) {
  const selectedFiltersContainer = document.getElementById('selected-filters');
  const filterValue = checkbox.value;

  if (checkbox.checked) {
    // Create a filter badge
    const filterBadge = document.createElement('div');
    filterBadge.className = 'selected-filter';
    filterBadge.setAttribute('data-filter', filterValue);
    filterBadge.innerHTML = `${filterValue} <span class="remove-filter" onclick="removeFilter('${filterValue}')">&times;</span>`;
    selectedFiltersContainer.appendChild(filterBadge);
  } else {
    // Uncheck the filter and remove badge
    removeFilter(filterValue);
  }
}

function removeFilter(filterValue) {
  const filterBadge = document.querySelector(`.selected-filter[data-filter="${filterValue}"]`);
  if (filterBadge) {
    filterBadge.remove();
  }

  // Uncheck the corresponding checkbox
  const filterCheckbox = document.querySelector(`input[value="${filterValue}"]`);
  if (filterCheckbox) {
    filterCheckbox.checked = false;
  }
}
