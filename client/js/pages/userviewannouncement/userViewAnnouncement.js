import { io } from 'socket.io-client';
import '../../../css/components/navBarUser.css';
import '../../../css/components/preloader.css';
import '../../../css/pages/userviewannouncement/userViewAnnouncement.css';
import { startSessionChecks, validateSessionAndNavigate } from '../../../utils/sessionUtils.js';
import { setupLogoutListener } from '../../global/logout.js';

const doc = document;
const { log, error } = console;

const getById = (id) => doc.getElementById(id);
const getAll = (selector) => doc.querySelectorAll(selector);
const get = (selector) => doc.querySelector(selector);

setupLogoutListener();

// start session checks on page load
startSessionChecks();

getCurrentUserId().then((userId) => {
  if (userId) {
    const socket = io({ query: { userId } });

    socket.on('newAnnouncement', (data) => {
      if (data.status === 'success') {
        log('websocket:', data);
        fetchPost(false);
      }
    });
    socket.on('newEvent', (data) => {
      if (data.status === 'success') {
        log('websocket:', data);
        fetchPost(false);
      }
    });
    socket.on('deleteAnnouncement', (data) => {
      if (data.status === 'success') {
        log('websocket:', data);
        fetchPost(false);
      }
    });
    socket.on('deleteEvent', (data) => {
      if (data.status === 'success') {
        log('websocket:', data);
        fetchPost(false);
      }
    });
  } else {
    error('User ID could not be retrieved.');
  }
});

async function fetchPost(withPreloader = true) {
  try {
    const response = await fetch('/user/posts', {
      withPreloader
    });

    if (!response.ok) {
      throw new Error('Failed to fetch posts');
    }
    const posts = await response.json();
    displayPosts(posts);
  } catch (err) {
    error('Error fetching posts:', err);
    alert('Failed to load posts. Please try again later.');
  }
}

function displayPosts(response) {
  if (response.status === 'success' && Array.isArray(response.data)) {
    const posts = response.data;
    const box = get('.box');
    box.innerHTML = '';

    if (posts.length === 0) {
      const noPostsMessage = document.createElement('div');
      noPostsMessage.classList.add('no-posts-message');
      noPostsMessage.textContent = 'No posts yet';
      noPostsMessage.style.textAlign = 'center';
      box.appendChild(noPostsMessage);
      return;
    }

    // loop through each announcement
    Object.keys(posts).forEach((key) => {
      const post = posts[key];

      log(post);

      const postCard = document.createElement('div');
      postCard.classList.add('post-card');

      const isEvent = post.__t !== undefined;
      postCard.setAttribute('data-post-id', post._id + (isEvent ? '-event' : ''));

      // convert the createdAt date to Philippine time
      const createdAt = new Date(post.createdAt);
      const options = {
        timeZone: 'Asia/Manila',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      };
      const formattedDate = createdAt.toLocaleString('en-PH', options).replace(',', '');
      log(formattedDate);

      // constructing the images HTML
      const imagesHtml = (post.images || []).map((image) => `<img src="${image}" alt="Post Image" />`).join('');

      let buttonText = isEvent ? 'Join' : 'View More';

      postCard.innerHTML = `
        <i class="fas fa-ellipsis-v three-dots" id="three-dots"></i>
        <div class="popup-menu" id="popup-menu" style="display: none"></div>
        <div class="user-info">
          <img src="${
            post.court?.business_logo || '/assets/images/placeholder_50x50.png'
          }" alt="Business Logo" class="profile-pic" />
          <div class="name-and-time">
            <span class="name">${post.postedBy.first_name} ${post.postedBy.last_name}</span>
            <span class="time">${formattedDate}</span>
          </div>
        </div>
        <hr />
        <h2>${post.heading}</h2>
        <p class="body-text">${post.details}</p>
        <div class="post-images">
          ${imagesHtml}
        </div>
        <hr />
        <div class="view-more">
          <button class="join-button" data-id="${post._id}" data-reservation-fee="${
        post.reservationFee
      }" data-event-fee="${post.eventFee}">${buttonText}</button>
        </div>
      `;

      box.appendChild(postCard);
      postCard.querySelector('.three-dots').addEventListener('click', (event) => {
        event.stopPropagation();
        // closeAllPopupMenus();
        // showPopupMenu(event, postCard);
      });
      postCard.querySelector('.join-button').addEventListener('click', handleJoinButtonClick);
    });
  } else {
    error('Failed to load posts or invalid response format.');
    const noPostsMessage = document.createElement('div');
    noPostsMessage.classList.add('no-posts-message');
    noPostsMessage.textContent = 'No posts yet';
    noPostsMessage.style.textAlign = 'center';
    box.appendChild(noPostsMessage);
  }
}

async function handleJoinButtonClick(event) {
  const button = event.currentTarget;
  const eventId = button.getAttribute('data-id');
  const reservationFee = parseFloat(button.getAttribute('data-reservation-fee')) || 0;
  const eventFee = parseFloat(button.getAttribute('data-event-fee')) || 0;

  log(eventId);
  log(reservationFee);
  log(eventFee);

  // check if payment is required
  if (reservationFee > 0 || eventFee > 0) {
    showJoinModal(eventId, reservationFee + eventFee);
  } else {
    // if no fees, proceed to join directly
    // await joinEvent(eventId);
  }
}

function showJoinModal(eventId, totalAmount) {
  const joinModal = get('#joinModal');
  const payNowButton = get('#payNowButton');
  const privacyCheckbox = get('#privacyPolicy');

  joinModal.style.display = 'block';

  payNowButton.disabled = true;

  privacyCheckbox.addEventListener('change', () => {
    payNowButton.disabled = !privacyCheckbox.checked;
  });

  payNowButton.onclick = async () => {
    await handlePayment(totalAmount, eventId);
    joinModal.style.display = 'none';
  };

  get('#cancelButton').onclick = () => {
    joinModal.style.display = 'none';
  };
}

fetchPost();

async function getCurrentUserId() {
  try {
    const response = await fetch('/user/me', {
      method: 'GET',
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error('Failed to fetch user info');
    }

    const userData = await response.json();
    return userData.id;
  } catch (err) {
    error('Error fetching user ID:', err);
    return null;
  }
}

async function joinEvent(eventId) {
  try {
    const response = await fetch(`/user/event/join/${eventId}`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const result = await response.json();
    if (result.status === 'success') {
      alert('Successfully joined the event!');
      // Update UI or perform further actions if needed
    } else {
      alert('Failed to join the event: ' + result.message);
    }
  } catch (err) {
    error('Error joining the event:', err);
    alert('Failed to join the event. Please try again later.');
  }
}
