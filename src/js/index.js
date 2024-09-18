import '../css/index-ui.css';
import '../css/style.css';

const doc = document;
const { log } = console;
const { error } = console;

const getById = (id) => doc.getElementById(id);
const getAll = (selector) => doc.querySelectorAll(selector);
const get = (selector) => doc.querySelector(selector);

// handle redirection to sign up page
const handleSignUpRedirect = () => {
  window.location.href = '/signup';
};

// handle redirection to sign in page
const handleSignInRedirect = () => {
  window.location.href = '/signin';
};

doc.addEventListener('DOMContentLoaded', () => {
  const signUpButton = get('.button-container button:first-of-type');
  const signInButton = get('.button-container button:last-of-type');

  if (signUpButton) {
    signUpButton.addEventListener('click', (e) => {
      e.preventDefault(); // prevent default button behavior
      handleSignUpRedirect(); // redirect to sign up page
    });
  }

  if (signInButton) {
    signInButton.addEventListener('click', (e) => {
      e.preventDefault(); // prevent default button behavior
      handleSignInRedirect(); // redirect to sign-in page
    });
  }
});
