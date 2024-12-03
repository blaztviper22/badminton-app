import { io } from 'socket.io-client';
import '../../../css/components/navBarUser.css';
import '../../../css/components/preloader.css';
import '../../../css/pages/userviewmembership/userViewMembership.css';
import { startSessionChecks, validateSessionAndNavigate } from '../../../utils/sessionUtils.js';
import '../../components/navBarUser.js';
import { setupLogoutListener } from '../../global/logout.js';

startSessionChecks();
setupLogoutListener(); // Assuming this handles user logout when necessary

// Initialize Socket.io for real-time updates
const socket = io(); // Establish WebSocket connection

let membershipToCancel = '';
let rowToRemove = '';
const doc = document;

// Function to open and close the subscription list modal
function openModalList() {
  const modal = doc.getElementById('listModal');
  modal.style.display = 'flex'; // Open modal when list icon is clicked
}

function closeModalList() {
  const modal = doc.getElementById('listModal');
  modal.style.display = 'none'; // Close modal when close button is clicked
}

// Open and close the confirmation modal with details for canceling a specific membership
function openConfirmationModal(membershipName, rowId) {
  membershipToCancel = membershipName;
  rowToRemove = rowId;
  const confirmationModal = doc.getElementById('confirmationModal');
  confirmationModal.style.display = 'flex'; // Open the confirmation modal
}

function closeConfirmationModal() {
  const confirmationModal = doc.getElementById('confirmationModal');
  confirmationModal.style.display = 'none'; // Close the confirmation modal
}

// Handle the cancel confirmation by removing the specified row
doc.getElementById('confirmCancelBtn').addEventListener('click', function () {
  if (membershipToCancel) {
    handleCancelSubscription(membershipToCancel);
  }
});

// Add event listeners to the cancel buttons in each row of the membership table
const cancelButtons = doc.querySelectorAll('.cancel-btn');
cancelButtons.forEach((button) => {
  button.addEventListener('click', function (event) {
    const row = event.target.closest('tr'); // Get the parent row of the clicked cancel button
    const membershipName = row.querySelector('td:first-child').innerText; // Get the membership name
    const rowId = row.id;
    openConfirmationModal(membershipName, rowId); // Open the confirmation modal
  });
});

// Close the confirmation modal if "No, Keep" button is clicked
const cancelConfirmationBtn = doc.querySelector('.modal-confirmation .cancel-btn');
cancelConfirmationBtn.addEventListener('click', function () {
  closeConfirmationModal(); // Close the confirmation modal
});

// Real-time listener for new membership card events from the admin
socket.on('newMembershipCard', (newCard) => {
  fetchMembershipCards(); // Refetch and display the updated list of membership cards
});

// Socket event listeners for real-time updates
socket.on('newSubscription', (data) => {
  fetchMembershipCards(); // Refresh membership cards when new subscription is added
});

socket.on('subscriptionCancelled', (data) => {
  // Remove the specific row if it exists
  const row = document.getElementById(`membership-${data.membershipId}`);
  if (row) {
    row.remove();
  }
});

socket.on('newMembershipCard', (newCard) => {
  fetchMembershipCards(); // Refetch when admin adds new membership card
});

socket.on('membershipUpdated', (updatedCard) => {
  fetchMembershipCards(); // Refetch when admin updates a membership card
});

// Initial fetch of membership cards on page load
// Initial fetch of membership cards on page load
async function fetchMembershipCards() {
  try {
    const response = await fetch('/user/get-memberships');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    
    if (data.status === 'success' && Array.isArray(data.data)) {
      displayMembershipCards(data.data);
      updateSubscriptionList(data.data);
    } else {
      console.error('Invalid data format received:', data);
    }
  } catch (error) {
    console.error('Error fetching membership cards:', error);
    // Optionally show a user-friendly error message
    const cardContainer = document.querySelector('.card-container');
    if (cardContainer) {
      cardContainer.innerHTML = `
        <div class="error-message">
          Unable to load membership cards. Please try again later.
        </div>
      `;
    }
  }
};

// Function to handle subscription
async function handleSubscribe(membershipId) {
  try {
    const response = await fetch(`/user/memberships/subscribe/${membershipId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ membershipId })
    });

    const data = await response.json();

    if (response.ok) {
      // Socket will handle the UI update through 'newSubscription' event
      socket.emit('newSubscription', {
        membershipId,
        status: 'success'
      });
    } else {
      alert(data.message || 'Failed to subscribe');
    }
  } catch (error) {
    console.error('Error subscribing to membership:', error);
    alert('Failed to subscribe. Please try again.');
  }
};

// Function to cancel subscription
async function handleCancelSubscription(membershipId) {
  try {
    const response = await fetch(`/user/memberships/revoke/${membershipId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();

    if (response.ok) {
      // Socket will handle the UI update through 'subscriptionCancelled' event
      socket.emit('subscriptionCancelled', {
        membershipId,
        status: 'success'
      });
      closeConfirmationModal();
    } else {
      alert(data.message || 'Failed to cancel subscription');
    }
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    alert('Failed to cancel subscription. Please try again.');
  }
};


// Function to display membership cards in the UI
function displayMembershipCards(memberships) {
  const cardContainer = document.querySelector('.card-container');
  if (!cardContainer) {
    console.error('Card container not found');
    return;
  }

  // Check if memberships exists and is an array
  if (!memberships || !Array.isArray(memberships)) {
    console.error('No memberships data available');
    return;
  }

  cardContainer.innerHTML = '';

  memberships.forEach((membership) => {
    const card = document.createElement('div');
    card.className = 'membership-card';

    // Add /user prefix to the image URL path
    const imagePath = membership.imageUrl.startsWith('/user')
      ? membership.imageUrl
      : `/user${membership.imageUrl}`;

    card.innerHTML = `
          <img src="${imagePath}" alt="${membership.cardName}" onerror="this.src='/assets/images/OIP.jpg'" />
          <div class="card-content">
              <div class="card-description">${membership.cardDescription}</div>
              <div class="price">₱${membership.cardPrice}</div>
          </div>
          <button class="subscribe-btn" data-membership-id="${membership._id}">Subscribe</button>
      `;

    const subscribeBtn = card.querySelector('.subscribe-btn');
    if (subscribeBtn) {
      subscribeBtn.addEventListener('click', () => handleSubscribe(membership._id));
    }

    cardContainer.appendChild(card);
  });
}

// Function to update subscription list in modal
function updateSubscriptionList(memberships) {
  const tableBody = document.querySelector('#membershipTable tbody');
  tableBody.innerHTML = '';

  memberships.forEach(membership => {
    if (membership.subscribers.some(sub => sub.status === 'active')) {
      const row = document.createElement('tr');
      row.id = `membership-${membership._id}`;
      row.innerHTML = `
        <td>${membership.cardName}</td>
        <td>₱${membership.cardPrice}</td>
        <td>
          <button class="cancel-btn" data-membership-id="${membership._id}">Cancel</button>
        </td>
      `;
      tableBody.appendChild(row);

      // Add click event for the cancel button
      const cancelBtn = row.querySelector('.cancel-btn');
      cancelBtn.addEventListener('click', (e) => {
        const row = e.target.closest('tr');
        if (row) {
          const membershipName = row.querySelector('td:first-child').textContent;
          const rowId = row.id;
          openConfirmationModal(membershipName, rowId);
        }
      });
    }
  });
};

// Initial call to fetch and display membership cards on page load
fetchMembershipCards();

// Add event listeners to the list icon and close buttons
doc.querySelector('.list-icon').addEventListener('click', openModalList); // Open modal on list icon click
doc.querySelector('.close-btn').addEventListener('click', closeModalList); // Close modal on close button click

document.addEventListener('DOMContentLoaded', function() {
  // Get all buttons and elements that need event listeners
  const cancelButtons = document.querySelectorAll('.cancel-btn');
  const closeBtn = document.querySelector('.close-btn');
  const listIcon = document.querySelector('.list-icon');
  const confirmCancelBtn = document.getElementById('confirmCancelBtn');
  const noKeepBtn = document.querySelector('.modal-confirmation .cancel-btn');
  const staticSubscribeBtn = document.getElementById('subscribeBtn');

  if (staticSubscribeBtn) {
    staticSubscribeBtn.addEventListener('click', async function () {
      const card = this.closest('.membership-card');
      const membershipId = this.getAttribute('data-membership-id') || 'basicMembership';

      try {
        await handleSubscribe(membershipId);
        // After successful subscription, fetch updated membership cards
        fetchMembershipCards();
      } catch (error) {
        console.error('Error in subscription:', error);
      }
    });
  }

  // Add event listener for each cancel button
  cancelButtons.forEach(button => {
      button.addEventListener('click', function(e) {
          const row = e.target.closest('tr');
          if (row) {
              const membershipName = row.querySelector('td:first-child').textContent;
              const rowId = row.id;
              openConfirmationModal(membershipName, rowId);
          }
      });
  });

  // Close button listener
  closeBtn?.addEventListener('click', closeModalList);

  // List icon listener
  listIcon?.addEventListener('click', openModalList);

  // Confirm cancel button listener
  confirmCancelBtn?.addEventListener('click', cancelConfirmationBtn);

  // No, Keep button listener
  noKeepBtn?.addEventListener('click', closeConfirmationModal);

  fetchMembershipCards();
});