let sessionCheckIntervalId = null;

const doc = document;
const { log, error } = console;

const getById = (id) => doc.getElementById(id);

// show the preloader
export function showPreloader() {
  const preloader = getById('preloader');
  if (preloader) preloader.style.display = 'flex';
  const root = getById('root');
  if (root) root.style.opacity = '0.2';
}

// Hide the preloader
export function hidePreloader() {
  const preloader = getById('preloader');
  if (preloader) preloader.style.display = 'none';

  const root = getById('root');
  if (root) root.style.opacity = '1';
}

// Function to check session validity and refresh token if necessary
export function checkSessionValidity() {
  fetch('/ping', {
    method: 'GET',
    credentials: 'include', // Ensures cookies are sent
    withPreloader: false
  })
    .then((response) => {
      if (response.status === 401) {
        log('Session invalid. Attempting to refresh token...');
        return refreshToken();
      } else {
        log('Session is valid.');
      }
    })
    .catch((err) => {
      error('Error during session validation:', err);
    });
}

// Function to refresh the token
function refreshToken() {
  return fetch('/auth/refresh', {
    method: 'POST',
    credentials: 'include',
    withPreloader: false
  }).then((refreshResponse) => {
    if (refreshResponse.ok) {
      log('Token refreshed successfully.');
      return;
    } else if (refreshResponse.status === 401 || refreshResponse.status === 403) {
      error('Failed to refresh token. Redirecting to login...');
      // Redirect to login or handle logout
      window.location.href = '/login'; // Redirect to login page
      throw new Error('Refresh token failed');
    } else {
      error('Unexpected error while refreshing token.');
      throw new Error('Unexpected error');
    }
  });
}

// Create a Proxy for fetch to retry on 401 error
const originalFetch = window.fetch;
window.fetch = new Proxy(originalFetch, {
  apply(fetch, that, args) {
    const options = args[1] || {};
    const withPreloader = options.withPreloader !== false;
    if (withPreloader) showPreloader();
    return fetch(...args)
      .then((response) => {
        if (response.status === 401) {
          log('Token expired or invalid, attempting to refresh...');
          return refreshToken().then(() => {
            log('Retrying original request...');
            return fetch(...args).finally(() => {
              if (withPreloader) hidePreloader();
            });
          });
        }

        if (withPreloader) hidePreloader();
        return response;
      })
      .catch((err) => {
        error('Fetch error:', err);
        if (withPreloader) hidePreloader();
      });
  }
});

// function to validate session and navigate to a URL
export function validateSessionAndNavigate(url) {
  fetch('/ping', {
    method: 'GET',
    credentials: 'include',
    withPreloader: false
  })
    .then((response) => {
      if (response.status === 401) {
        return fetch('/auth/refresh', {
          method: 'POST',
          credentials: 'include',
          withPreloader: false
        }).then((refreshResponse) => {
          if (refreshResponse.ok) {
            log('Token refreshed, proceeding to page...');
            window.location.href = url; // navigate to the intended page
          } else {
            error('Failed to refresh token. Redirecting to login...');
            window.location.href = '/login';
          }
          hidePreloader();
        });
      } else if (response.ok) {
        log('Session is valid. Navigating to page...');
        window.location.href = url;
      } else {
        error('Error validating session:', response.status);
        window.location.href = '/login';
      }
      hidePreloader();
    })
    .catch((err) => {
      error('Error during session validation:', err);
      window.location.href = '/login';
      hidePreloader();
    });
}

// function to start session checks
export function startSessionChecks() {
  if (sessionCheckIntervalId) {
    clearInterval(sessionCheckIntervalId);
  }

  // check session validity every 40 seconds
  sessionCheckIntervalId = setInterval(checkSessionValidity, 50000);

  // initial session check on page load
  document.addEventListener('DOMContentLoaded', () => {
    checkSessionValidity();
  });
}
