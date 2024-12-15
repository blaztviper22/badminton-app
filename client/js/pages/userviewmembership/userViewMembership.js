import { io } from 'socket.io-client';
import '../../../css/components/navBarUser.css';
import '../../../css/components/preloader.css';
import '../../../css/pages/userviewmembership/userViewMembership.css';
import { startSessionChecks } from '../../../utils/sessionUtils.js';
import { setupLogoutListener } from '../../global/logout.js';

// Initialize
startSessionChecks();
setupLogoutListener();
const socket = io();
const doc = document;
let membershipToCancel = '';

// Modal Functions
function toggleModal(modalId, show) {
  const modal = doc.getElementById(modalId);
  modal.style.display = show ? 'flex' : 'none';
  if (show && modalId === 'listModal') updateSubscriptionList();
}

// Modal Event Handlers
doc.querySelector('.list-icon').addEventListener('click', () => toggleModal('listModal', true));
doc.querySelector('.close-btn').addEventListener('click', () => toggleModal('listModal', false));
doc.querySelector('.modal-confirmation .cancel-btn').addEventListener('click', () => toggleModal('confirmationModal', false));

// Subscription Handlers
async function handleSubscribe(membershipId) {
  try {
    const response = await fetch(`/user/memberships/subscribe/${membershipId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    
    const data = await response.json();
    
    if (response.ok && data.approvalUrl) {
      // Redirect to PayPal for payment
      window.location.href = data.approvalUrl;
    } else {
      alert(data.message || 'Failed to initiate subscription');
    }
  } catch (error) {
    console.error('Subscription error:', error);
    alert('Failed to subscribe. Please try again.');
  }
}

async function handleCancelSubscription(membershipId) {
  try {
    const response = await fetch(`/user/memberships/revoke/${membershipId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });

    if (response.ok) {
      const row = doc.getElementById(`membership-${membershipId}`);
      row?.remove();

      const btn = doc.querySelector(`[data-membership-id="${membershipId}"]`);
      if (btn) {
        btn.textContent = 'Subscribe';
        btn.disabled = false;
      }

      socket.emit('subscriptionCancelled', { membershipId, status: 'success' });
      toggleModal('confirmationModal', false);
      alert('Subscription cancelled successfully');
    } else {
      const data = await response.json();
      alert(data.message || 'Failed to cancel subscription');
    }
  } catch (error) {
    console.error('Cancellation error:', error);
    alert('Failed to cancel subscription. Please try again.');
  }
}

// UI Update Functions
function displayMembershipCards(memberships) {
  const container = doc.querySelector('.card-container');
  if (!container) return;

  console.log('Received memberships:', memberships); // Debug log

  container.innerHTML = memberships.map(membership => {
    // Fix image path handling
    let imagePath = membership.imageUrl;
    
    // If imagePath doesn't start with /user/data/, prepend it
    if (imagePath && !imagePath.startsWith('/user/data/')) {
      imagePath = `/user/data/${imagePath.split('/').pop()}`;
    }

    // Debug log
    console.log('Card image path:', imagePath);

    const isSubscribed = membership.subscribers.some(sub => sub.status === 'active');
    
    return `
      <div class="membership-card">
        <img src="${imagePath}" 
             alt="${membership.cardName}" 
             onerror="this.src='/assets/images/OIP.jpg'"
             loading="lazy" />
        <div class="card-content">
          <div class="card-description">${membership.cardDescription}</div>
          <div class="price">₱${membership.cardPrice}</div>
        </div>
        <button class="subscribe-btn" data-membership-id="${membership._id}" 
          ${isSubscribed ? 'disabled' : ''}>
          ${isSubscribed ? 'Subscribed' : 'Subscribe'}
        </button>
      </div>
    `;
  }).join('');

  // Add event listeners to new subscribe buttons
  container.querySelectorAll('.subscribe-btn').forEach(btn => {
    if (!btn.disabled) {
      btn.addEventListener('click', () => handleSubscribe(btn.dataset.membershipId));
    }
  });
}

async function updateSubscriptionList() {
  try {
    const response = await fetch('/user/get-memberships');
    const data = await response.json();
    
    if (data.status === 'success') {
      const tbody = doc.querySelector('#membershipTable tbody');
      tbody.innerHTML = data.data
        .filter(m => m.subscribers.some(sub => sub.status === 'active'))
        .map(m => {
          const subscription = m.subscribers.find(sub => sub.status === 'active');
          return `
            <tr id="membership-${m._id}">
              <td>${m.cardName}</td>
              <td>₱${m.cardPrice}</td>
              <td>
                <span class="payment-badge ${subscription.paymentStatus}">
                  ${subscription.paymentStatus.toUpperCase()}
                </span>
              </td>
              <td>
                <button class="cancel-btn" data-membership-id="${m._id}">
                  Cancel
                </button>
              </td>
            </tr>
          `;
        }).join('');

      addCancelListeners();
    }
  } catch (error) {
    console.error('Error updating subscription list:', error);
  }
};

// Confirmation Modal Handler
doc.getElementById('confirmCancelBtn').addEventListener('click', () => {
  if (membershipToCancel) handleCancelSubscription(membershipToCancel);
});

// Socket Event Listeners
['newSubscription', 'subscriptionCancelled', 'newMembershipCard', 'membershipUpdated']
  .forEach(event => {
    socket.on(event, () => {
      fetch('/user/get-memberships')
        .then(r => r.json())
        .then(data => {
          if (data.status === 'success') {
            displayMembershipCards(data.data);
            updateSubscriptionList();
          }
        });
    });
  });

// Initial Load
fetch('/user/get-memberships')
  .then(r => r.json())
  .then(data => {
    if (data.status === 'success') {
      displayMembershipCards(data.data);
      updateSubscriptionList();
    }
  })
  .catch(error => {
    console.error('Error loading memberships:', error);
    doc.querySelector('.card-container').innerHTML = 
      '<div class="error-message">Unable to load membership cards. Please try again later.</div>';
  });

// Add this to your existing frontend JavaScript
document.addEventListener('DOMContentLoaded', function() {
  // Check for URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const status = urlParams.get('status');
  
  if (status === 'cancelled') {
    alert('Payment was cancelled. You can try subscribing again if you wish.');
  } else if (status === 'success') {
    alert('Successfully subscribed to membership!');
  } else if (status === 'error') {
    alert('There was an error processing your request. Please try again.');
  }
  
  // Clear the URL parameters after showing the message
  if (status) {
    window.history.replaceState({}, document.title, window.location.pathname);
  }
});