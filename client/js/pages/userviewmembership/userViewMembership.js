import { io } from 'socket.io-client';
import '../../../css/components/navBarUser.css';
import '../../../css/components/preloader.css';
import '../../../css/pages/userviewmembership/userViewMembership.css';
import { startSessionChecks, validateSessionAndNavigate } from '../../../utils/sessionUtils.js';
import { setupLogoutListener } from '../../global/logout.js';

startSessionChecks();
setupLogoutListener();  // Assuming this handles user logout when necessary

// Initialize Socket.io for real-time updates
const socket = io();  // Establish WebSocket connection

let membershipToCancel = ''; 
let rowToRemove = '';
const doc = document;

// Function to open and close the subscription list modal
function openModalList() {
  const modal = doc.getElementById('listModal');
  modal.style.display = 'flex';  // Open modal when list icon is clicked
}

function closeModalList() {
  const modal = doc.getElementById('listModal');
  modal.style.display = 'none';  // Close modal when close button is clicked
}

// Open and close the confirmation modal with details for canceling a specific membership
function openConfirmationModal(membershipName, rowId) {
  membershipToCancel = membershipName;
  rowToRemove = rowId;
  const confirmationModal = doc.getElementById('confirmationModal');
  confirmationModal.style.display = 'flex';  // Open the confirmation modal
}

function closeConfirmationModal() {
  const confirmationModal = doc.getElementById('confirmationModal');
  confirmationModal.style.display = 'none';  // Close the confirmation modal
}

// Handle the cancel confirmation by removing the specified row
doc.getElementById('confirmCancelBtn').addEventListener('click', function() {
  if (rowToRemove) {
    const row = doc.getElementById(rowToRemove);
    if (row) {
      row.remove();  // Remove the row from the table
    }
  }
  closeConfirmationModal();  // Close the confirmation modal
});

// Add event listeners to the cancel buttons in each row of the membership table
const cancelButtons = doc.querySelectorAll('.cancel-btn');
cancelButtons.forEach(button => {
  button.addEventListener('click', function(event) {
    const row = event.target.closest('tr');  // Get the parent row of the clicked cancel button
    const membershipName = row.querySelector('td:first-child').innerText;  // Get the membership name
    const rowId = row.id;
    openConfirmationModal(membershipName, rowId);  // Open the confirmation modal
  });
});

// Close the confirmation modal if "No, Keep" button is clicked
const cancelConfirmationBtn = doc.querySelector('.modal-confirmation .cancel-btn');
cancelConfirmationBtn.addEventListener('click', function() {
  closeConfirmationModal();  // Close the confirmation modal
});

// Real-time listener for new membership card events from the admin
socket.on('newMembershipCard', (newCard) => {
  fetchMembershipCards();  // Refetch and display the updated list of membership cards
});

// Initial fetch of membership cards on page load
async function fetchMembershipCards() {
  try {
    const response = await fetch('/user/memberships');  // Fetch existing memberships
    const memberships = await response.json();
    displayMembershipCards(memberships);  // Render the membership cards
  } catch (error) {
    console.error('Error fetching membership cards:', error);
  }
}

// Function to display membership cards in the UI
function displayMembershipCards(memberships) {
  const cardContainer = doc.getElementById('membershipCardContainer');
  cardContainer.innerHTML = '';  // Clear existing cards

  memberships.forEach((membership) => {
    const card = document.createElement('div');
    card.className = 'membership-card';
    card.innerHTML = `
      <h3>${membership.name || membership.cardName}</h3>
      <p>${membership.description || membership.cardDescription}</p>
      <p>Fee: ${membership.fee || membership.cardPrice}</p>
    `;
    cardContainer.appendChild(card);
  });
}

// Initial call to fetch and display membership cards on page load
fetchMembershipCards();

// Add event listeners to the list icon and close buttons
doc.querySelector(".list-icon").addEventListener('click', openModalList);  // Open modal on list icon click
doc.querySelector(".close-btn").addEventListener('click', closeModalList);  // Close modal on close button click
