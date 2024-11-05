import '../../../css/components/navBarUser.css';
import '../../../css/components/preloader.css';
import '../../../css/pages/userprofile/userProfile.css';
import { startSessionChecks, validateSessionAndNavigate } from '../../../utils/sessionUtils.js';
import { setupLogoutListener } from '../../global/logout.js';

setupLogoutListener();

const doc = document;
const { error } = console;

const getById = (id) => doc.getElementById(id);
const getAll = (selector) => doc.querySelectorAll(selector);
const get = (selector) => doc.querySelector(selector);

// Start session checks on page load
startSessionChecks();

// Initialize input fields and store them in a variable
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
  profilePic: getById('profilePic'),
  imageUpload: getById('imageUpload'),
  cameraIcon: getById('cameraIcon')
};

// Function to capitalize the first letter of a string
function capitalizeFirstLetter(string) {
  if (!string) return '';
  return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
}

// Function to fetch user profile data and populate fields
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
      // Optionally handle the error, e.g., show a message to the user
    });
}

// Call the function to fetch user profile on page load
doc.addEventListener('DOMContentLoaded', () => {
  fetchUserProfile();

  // Set up event listeners
  userProfileFields.cameraIcon.addEventListener('click', () => {
    userProfileFields.imageUpload.click();
  });

  userProfileFields.imageUpload.addEventListener('change', (event) => {
    previewImage(event); // Make sure to define this function if it exists
  });

  getAll('.navbar-item').forEach((item) => {
    item.addEventListener('click', () => {
      const sectionId = item.getAttribute('data-section');
      showSection(sectionId);
    });
  });
});

document.addEventListener('DOMContentLoaded', () => {
  const personalInfoBtn = getById('personalInfoBtn');
  const skillLevelBtn = getById('skillLevelBtn');
  const settingsBtn = getById('settingsBtn');

  if (personalInfoBtn) personalInfoBtn.addEventListener('click', () => showSection('personalInfo'));
  if (skillLevelBtn) skillLevelBtn.addEventListener('click', () => showSection('skillLevel'));
  if (settingsBtn) settingsBtn.addEventListener('click', () => showSection('settings'));
});

function showSection(sectionId) {
  getAll('.content-section').forEach((section) => section.classList.remove('active'));
  getById(sectionId).classList.add('active');

  getAll('.navbar-item').forEach((item) => item.classList.remove('active'));
  get(`[data-section="${sectionId}"]`).classList.add('active');
}

// function to handle account deletion confirmation and API request
const handleAccountDeletion = () => {
  const confirmation = window.confirm('Are you sure you want to delete your account? This action is irreversible.');
  if (confirmation) {
    fetch('/auth/delete', {
      method: 'DELETE'
    })
      .then((response) => {
        if (response.ok) {
          alert('Your account has been deleted successfully.');
          // Optionally redirect to a logout or landing page after deletion
          window.location.href = '/login';
        } else {
          return response.json().then((data) => {
            error(data);
            alert(`Failed to delete account: ${data.message}`);
          });
        }
      })
      .catch((err) => {
        error('Error during account deletion:', err);
        alert('An error occurred while trying to delete your account. Please try again later.');
      });
  } else {
    log('User canceled account deletion.');
  }
};

doc.addEventListener('DOMContentLoaded', () => {
  const deleteButton = getById('deleteButton');
  if (deleteButton) {
    deleteButton.addEventListener('click', handleAccountDeletion);
  } else {
    error('Delete button not found.');
  }
});
