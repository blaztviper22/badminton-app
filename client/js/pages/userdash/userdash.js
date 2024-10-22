import '../../../css/components/navBarUser.css';
import '../../../css/components/preloader.css';
import '../../../css/pages/userdash/userDash.css';
import { startSessionChecks, validateSessionAndNavigate } from '../../../utils/sessionUtils.js';
import { setupLogoutListener } from '../../global/logout.js';

setupLogoutListener();

// start session checks on page load
startSessionChecks();

const doc = document;
const { log, error } = console;

const getById = (id) => doc.getElementById(id);
const getAll = (selector) => doc.querySelectorAll(selector);
const get = (selector) => doc.querySelector(selector);

const editProfileLink = get('a[href="/user/edit-profile"]');
if (editProfileLink) {
  editProfileLink.addEventListener('click', function (event) {
    event.preventDefault();
    validateSessionAndNavigate('/user/edit-profile'); // validate session before navigation
  });
}
