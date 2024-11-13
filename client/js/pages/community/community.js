import '../../../css/components/navBarUser.css';
import '../../../css/components/preloader.css';
import '../../../css/pages/community/community.css';
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

async function fetchPopularHashtags() {
  try {
    const response = await fetch('/user/community/posts/popular');

    const data = await response.json();

    log(data);

    // Check if the response status is success
    if (data.status !== 'success') {
      throw new Error('Failed to fetch popular hashtags');
    }

    const popularHashtags = data.data.hashtags; // Access the hashtags array
    const hashtagsContainer = getById('popular-hashtags');
    hashtagsContainer.innerHTML = ''; // Clear any existing content

    popularHashtags.forEach((hashtag) => {
      const label = doc.createElement('label');
      label.innerHTML = `
        <input type="checkbox" class="hashtag-filter" value="${hashtag.hashtag}" />
        #${hashtag.hashtag} (${hashtag.count})
      `;
      hashtagsContainer.appendChild(label);
    });
  } catch (err) {
    error('Error fetching popular hashtags:', err);
  }
}

fetchPopularHashtags();
