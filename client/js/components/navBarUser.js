import { capitalizeFirstLetter, fetchUserData } from '../../utils/userData.js';

const doc = document;
const { log, error } = console;

const getById = (id) => doc.getElementById(id);

(async () => {
  try {
    const userData = await fetchUserData();
    if (userData && userData.username) {
      const usernameElement = getById('username');
      usernameElement.textContent = `Hello, ${capitalizeFirstLetter(userData.username)}!`;
    } else {
      error('User data not found');
    }
  } catch (err) {
    error('Failed to update username', err);
  }
})();
