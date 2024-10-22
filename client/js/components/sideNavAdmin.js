import { capitalizeFirstLetter, fetchUserData } from '../../utils/userData.js';
import { setupLogoutListener } from '../global/logout.js';

setupLogoutListener();

const doc = document;
const { log, error } = console;

const getById = (id) => doc.getElementById(id);

// function to update the profile details in the sidebar
const updateProfileDetails = (data) => {
  const profileName = getById('profile-name');
  const profileRole = getById('profile-role');
  const profileImg = getById('profile-img');

  if (profileName && profileRole && profileImg) {
    profileName.textContent = capitalizeFirstLetter(data.first_name);
    profileRole.textContent = capitalizeFirstLetter(data.role);
    profileImg.src = data.court.business_logo;
  } else {
    error('Profile elements not found!');
  }
};

// fetch user data and update profile details
const loadUserProfile = async () => {
  try {
    const userData = await fetchUserData(); // fetch user data from API
    log(userData);
    updateProfileDetails(userData); // update the sidebar profile
  } catch (err) {
    error('Failed to fetch or update profile details:', err);
  }
};

document.addEventListener('DOMContentLoaded', () => {
  // Initialize sidebar on DOMContentLoaded
  initializeSidebar();

  // Fetch and update profile details
  loadUserProfile();

  // Highlight active link in the sidebar
  setActiveLinkInSidebar();
});

function initializeSidebar() {
  const sidebar = document.querySelector('.sidebar');
  const closeBtn = document.querySelector('#btn');

  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      sidebar.classList.toggle('open');
      menuBtnChange();
    });
  }

  function menuBtnChange() {
    if (sidebar.classList.contains('open')) {
      closeBtn.classList.replace('bx-menu', 'bx-menu-alt-right');
    } else {
      closeBtn.classList.replace('bx-menu-alt-right', 'bx-menu');
    }
  }

  menuBtnChange(); // Initialize the menu icon based on the sidebar state
}

function setActiveLinkInSidebar() {
  const links = document.querySelectorAll('.sidebar .nav-list li a');
  const currentUrl = window.location.href;

  links.forEach((link) => {
    if (link.href === currentUrl) {
      link.classList.add('active');
    }
  });
}
