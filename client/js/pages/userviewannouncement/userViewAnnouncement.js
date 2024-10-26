import '../../../css/components/navBarUser.css';
import '../../../css/components/preloader.css';
import '../../../css/pages/userviewannouncement/userViewAnnouncement.css';
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

// Get modal and close button elements
const modal = document.getElementById('joinModal');
const closeModal = document.getElementsByClassName('close')[0];

// Get all Join buttons
const joinButtons = document.querySelectorAll('.view-more button');

// Add click event listener to each Join button
joinButtons.forEach((button) => {
  button.addEventListener('click', function () {
    modal.style.display = 'block';
  });
});

// Close the modal when the close button is clicked
closeModal.onclick = function () {
  modal.style.display = 'none';
};

// Close the modal when clicking anywhere outside of the modal
window.onclick = function (event) {
  if (event.target == modal) {
    modal.style.display = 'none';
  }
};
