const doc = document;
const { log, error } = console;

const getById = (id) => doc.getElementById(id);
const getAll = (selector) => doc.querySelectorAll(selector);
const get = (selector) => doc.querySelector(selector);

// Function to set up logout listener
export function setupLogoutListener() {
  getById('logoutBtn').addEventListener('click', function () {
    // Confirm logout action
    const confirmLogout = confirm('Are you sure you want to logout?');

    if (confirmLogout) {
      fetch('/auth/logout', {
        method: 'POST',
        credentials: 'include' // Include cookies
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error(`Logout failed: ${response.status}`);
          }
          // Redirect to login upon successful logout
          window.location.href = '/login';
        })
        .catch((err) => {
          error('Error during logout:', err);
          // Optionally handle the error, e.g., show a message to the user
        });
    } else {
      // User canceled the logout, you can optionally log this action
      log('User canceled logout.');
    }
  });
}
