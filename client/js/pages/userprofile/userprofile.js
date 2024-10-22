import '../../../css/components/navBarUser.css';
import '../../../css/components/preloader.css';
import '../../../css/pages/userprofile/userProfile.css';
import { startSessionChecks, validateSessionAndNavigate } from '../../../utils/sessionUtils.js';
import { setupLogoutListener } from '../../global/logout.js';

setupLogoutListener();

const doc = document;
const { log, error } = console;

const getById = (id) => doc.getElementById(id);
const getAll = (selector) => doc.querySelectorAll(selector);
const get = (selector) => doc.querySelector(selector);

// start session checks on page load
startSessionChecks();

// initialize input fields and store them in a variable
const userProfileFields = {
  username: getById('username'),
  firstName: getById('firstName'),
  middleName: getById('middleName'),
  lastName: getById('lastName'),
  gender: getById('gender'),
  birthday: getById('birthday'),
  phoneNumber: getById('phoneNumber'),
  email: getById('email'),
  status: getById('status'),
  municipality: getById('municipality'),
  userType: getById('user-type'),
  profilePic: getById('profilePic')
};

function capitalizeFirstLetter(string) {
  if (!string) return '';
  return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
}

// function to fetch user profile data and populate fields
function fetchUserProfile() {
  fetch('/user/me', {
    method: 'GET',
    credentials: 'include' // Ensures cookies are sent
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then((data) => {
      // use the userProfileFields object to set values for each input field
      userProfileFields.username.value = data.username || 'Username'; // Default username
      userProfileFields.firstName.value = data.first_name || '';
      userProfileFields.middleName.value = data.middle_name || '';
      userProfileFields.lastName.value = data.last_name || '';
      userProfileFields.gender.value = data.gender ? capitalizeFirstLetter(data.gender) : '';
      userProfileFields.birthday.value = data.date_of_birth
        ? new Date(data.date_of_birth).toISOString().split('T')[0]
        : '';
      userProfileFields.phoneNumber.value = data.contact_number || '';
      userProfileFields.email.value = data.email || '';
      userProfileFields.status.value = data.status || 'Single';
      userProfileFields.municipality.value = data.municipality || '';
      userProfileFields.userType.value = data.role ? capitalizeFirstLetter(data.role) : '';
      userProfileFields.profilePic.src = data.profile_photo || '/assets/images/pic_placeholder.png';
    })
    .catch((err) => {
      error('Error fetching user profile:', err);
      // optionally handle the error, e.g., show a message to the user
    });
}

// Call the function to fetch user profile on page load
doc.addEventListener('DOMContentLoaded', () => {
  fetchUserProfile();
});
