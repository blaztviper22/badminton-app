import '../../../css/pages/index/style.css';

const doc = document;
const { log, error } = console;

const getById = (id) => doc.getElementById(id);
const getAll = (selector) => doc.querySelectorAll(selector);
const get = (selector) => doc.querySelector(selector);

// handle redirection to sign up page
const handleSignUpRedirect = () => {
  window.location.href = '/register';
};

// handle redirection to sign in page
const handleSignInRedirect = () => {
  window.location.href = '/login';
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
