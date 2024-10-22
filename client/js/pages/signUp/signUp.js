import validator from 'validator';
import '../../../css/pages/signUp/signUp.css';

const doc = document;
const { log, error } = console;

const getById = (id) => doc.getElementById(id);
const getAll = (selector) => doc.querySelectorAll(selector);
const get = (selector) => doc.querySelector(selector);

doc.addEventListener('DOMContentLoaded', function () {
  const courtOwnerLink = getById('courtOwnerLink');
  const userLink = getById('userLink');
  const courtOwnerFormContainer = getById('courtOwnerFormContainer');
  const userFormContainer = getById('userFormContainer');
  const closeCourtOwnerForm = getById('closeCourtOwnerForm');
  const closeUserForm = getById('closeUserForm');
  const courtOwnerForm = getById('ownerSignUpForm');
  const userForm = getById('userSignUpForm');
  const userSubmitBtn = getById('submitUser');
  const ownerSubmitBtn = getById('submitOwner');

  userSubmitBtn.disabled = true;
  ownerSubmitBtn.disabled = true;

  // Show Court Owner Form
  courtOwnerLink.addEventListener('click', function (event) {
    event.preventDefault();
    courtOwnerFormContainer.classList.add('show');
    userFormContainer.classList.remove('show');
  });

  // Show User Form
  userLink.addEventListener('click', function (event) {
    event.preventDefault();
    resetForms();
    userFormContainer.classList.add('show');
    courtOwnerFormContainer.classList.remove('show');
  });

  // Close Court Owner Form
  closeCourtOwnerForm.addEventListener('click', function () {
    resetForms();
    courtOwnerFormContainer.classList.remove('show');
  });

  // Close User Form
  closeUserForm.addEventListener('click', function () {
    resetForms();
    userFormContainer.classList.remove('show');
  });

  // Event listener for user form submission
  userForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const formData = new FormData(userForm);
    const roleType = formData.get('user_type').toLowerCase();

    userSubmitBtn.disabled = true;
    await handleFormSubmit(userForm, roleType);
    userSubmitBtn.disabled = false;
  });

  // Event listener for courtOwner form submission
  courtOwnerForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const roleType = 'admin';

    ownerSubmitBtn.disabled = true;
    await handleFormSubmit(courtOwnerForm, roleType);

    ownerSubmitBtn.disabled = false;
  });

  const handleFormSubmit = async (form, role) => {
    const formData = new FormData(form);
    const userObject = buildUserObject(formData, role);
    log(userObject);

    try {
      const response = await fetch('/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userObject)
      });

      const result = await response.json();
      if (response.status === 201) {
        alert('Registration successful!');
        // form.reset();
        resetForms();
        // redirect to verification page with base64 email
        window.location.href = result.redirectUrl;
      } else {
        // Check if the email already exists
        if (result.message === 'Email already exists') {
          alert('The email is already registered. Please try another one.');
        } else {
          alert('Registration failed. Please try again.');
        }

        ownerSubmitBtn.disabled = false;
        userSubmitBtn.disabled = false;
      }
    } catch (err) {
      error('Error:', err);
      alert('An error occurred. Please try again later.');
      ownerSubmitBtn.disabled = false;
      userSubmitBtn.disabled = false;
    }
  };

  // Helper functions for showing and clearing error messages
  function showError(inputId, message) {
    const errorDiv = document.getElementById(inputId + '-error');
    errorDiv.innerText = message;
    errorDiv.classList.add('show'); // Show the error message
  }

  function clearError(inputId) {
    const inputElement = getById(inputId);
    const errorElement = getById(`${inputId}-error`);

    if (inputElement && errorElement) {
      inputElement.classList.remove('is-invalid');
      errorElement.textContent = '';
    }
  }

  const suffixUser = '-user';
  const suffixOwner = '-owner';
  const userFields = [
    `first-name${suffixUser}`,
    `middle-name${suffixUser}`,
    `last-name${suffixUser}`,
    `email${suffixUser}`,
    `contact-number${suffixUser}`,
    `username${suffixUser}`,
    `password1${suffixUser}`,
    `password2${suffixUser}`
  ];

  const ownerFields = [
    `first-name${suffixOwner}`,
    `middle-name${suffixOwner}`,
    `last-name${suffixOwner}`,
    `email${suffixOwner}`,
    `contact-number${suffixOwner}`,
    `username${suffixOwner}`,
    `password1${suffixOwner}`,
    `password2${suffixOwner}`
  ];

  const userFieldValidity = {};
  const ownerFieldValidity = {};

  // Initialize validity state for each field
  userFields.forEach((field) => (userFieldValidity[field] = false));
  ownerFields.forEach((field) => (ownerFieldValidity[field] = false));

  function validateField(inputId, prefix) {
    const value = getById(inputId).value.trim();
    let isValid = true;

    // Validate based on the specific inputId
    switch (inputId) {
      case `first-name${prefix}`:
        // Check if the length of first name is less than 2 or greater than 30
        if (value.length < 2) {
          showError(inputId, 'First name must be at least 2 characters long.');
          isValid = false;
        } else if (value.length > 30) {
          showError(inputId, 'First name cannot be longer than 30 characters.');
          isValid = false;
        } else if (!validator.isAlpha(value.replace(/\s/g, ''))) {
          showError(inputId, 'First name must only contain alphabetic characters and spaces.');
          isValid = false;
        }
        break;

      case `middle-name${prefix}`:
        // Optional middle name: just check the length
        if (value.length > 30) {
          showError(inputId, 'Middle name cannot be longer than 30 characters.');
          isValid = false;
        } else if (value.length < 2 && value.length > 0) {
          showError(inputId, 'Middle name must be at least 2 characters long if provided.');
          isValid = false;
        } else if (value.length > 0 && !validator.isAlpha(value.replace(/\s/g, ''))) {
          showError(inputId, 'Middle name must only contain alphabetic characters and spaces.');
          isValid = false;
        }
        break;

      case `last-name${prefix}`:
        if (value.length < 2 || value.length > 30 || !validator.isAlpha(value.replace(/\s/g, ''))) {
          showError(inputId, 'Last name must be 2-30 alphabetic characters.');
          isValid = false;
        }
        break;

      case `email${prefix}`:
        if (!validator.isEmail(value)) {
          showError(inputId, 'Please enter a valid email address.');
          isValid = false;
        } else {
          const validDomains = ['gmail.com', 'yahoo.com', 'googlemail.com'];
          const domain = value.split('@')[1];
          if (!validDomains.includes(domain)) {
            showError(inputId, 'Email must be from Gmail, Yahoo, or Googlemail.');
            isValid = false;
          }
        }
        break;

      case `contact-number${prefix}`:
        // Regex for Philippine numbers that start with +63 or 0
        if (!validator.matches(value, /^(?:\+63|0)\d{10}$/)) {
          showError(inputId, 'Please enter a valid contact number (e.g., +639XXXXXXXX or 09XXXXXXXXX).');
          isValid = false;
        }
        break;

      case `username${prefix}`:
        if (value.length < 4 || value.length > 30) {
          showError(inputId, 'Username must be between 4 and 30 characters long.');
          isValid = false;
        } else if (!validator.isAlphanumeric(value)) {
          showError(inputId, 'Username can only contain letters and numbers.');
          isValid = false;
        }
        break;

      case `password1${prefix}`:
        if (value.length < 8 || !validator.matches(value, /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])/)) {
          showError(
            inputId,
            'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character.'
          );
          isValid = false;
        }
        break;

      case `password2${prefix}`:
        const passwordValue = getById(`password1${prefix}`).value.trim();
        if (value !== passwordValue) {
          showError(inputId, 'Confirm password must match password.');
          isValid = false;
        }
        break;

      default:
        break;
    }

    // Clear errors if the field is valid
    if (isValid) {
      clearError(inputId);
    }

    // Update the validity state for the field
    if (prefix === suffixUser) {
      userFieldValidity[inputId] = isValid;
    } else if (prefix === suffixOwner) {
      ownerFieldValidity[inputId] = isValid;
    }
  }

  function checkAllFields(validityState, submitBtn, form) {
    // Check if all fields are valid based on the validity state
    const allValid = Object.values(validityState).every((isValid) => isValid);
    const formValid = form.checkValidity();

    log('allValid: ', allValid);
    log('formValid: ', formValid);

    // Enable/disable the submit button based on validity
    submitBtn.disabled = !(allValid && formValid);
  }

  // Add input listeners and enable/disable submit buttons based on validation
  userFields.forEach((field) => {
    const inputElement = getById(field);
    inputElement.addEventListener('input', () => {
      validateField(field, suffixUser);
      // Check overall validity to enable/disable submit button
      checkAllFields(userFieldValidity, userSubmitBtn, userForm);
    });
  });

  ownerFields.forEach((field) => {
    const inputElement = getById(field);
    inputElement.addEventListener('input', () => {
      validateField(field, suffixOwner);
      // Check overall validity to enable/disable submit button
      checkAllFields(ownerFieldValidity, ownerSubmitBtn, courtOwnerForm);
    });
  });

  // Reset forms and clear validation states
  const resetForms = () => {
    courtOwnerForm.reset();
    userForm.reset();
    getAll('.error-message').forEach((errorElement) => {
      errorElement.textContent = '';
      errorElement.classList.remove('show');
    });
    userSubmitBtn.disabled = true;
    ownerSubmitBtn.disabled = true;

    // Reset validation states
    Object.keys(userFieldValidity).forEach((key) => (userFieldValidity[key] = false));
    Object.keys(ownerFieldValidity).forEach((key) => (ownerFieldValidity[key] = false));
  };

  resetForms();

  const buildUserObject = (formData, role) => {
    const isAdmin = role === 'admin';
    const suffix = isAdmin ? '_owner' : '_user';

    const userObject = {
      first_name: formData.get(`first_name${suffix}`).trim(),
      middle_name: formData.get(`middle_name${suffix}`).trim(),
      last_name: formData.get(`last_name${suffix}`).trim(),
      email: formData.get(`email${suffix}`).trim(),
      username: formData.get(`username${suffix}`).trim(),
      password: formData.get(`password1${suffix}`).trim(),
      confirm_password: formData.get(`password2${suffix}`).trim(),
      gender: formData.get(`gender${suffix}`).trim(),
      date_of_birth: formData.get(`date_of_birth${suffix}`).trim(),
      municipality: formData.get(`municipality${suffix}`).trim(),
      contact_number: formData.get(`contact_number${suffix}`).trim(),
      role: role || formData.get(`role${suffix}`).trim()
    };

    // Add status_owner only if the role is 'Admin'
    if (isAdmin) {
      userObject.status_owner = formData.get(`status${suffix}`);
    }

    return userObject;
  };
});
