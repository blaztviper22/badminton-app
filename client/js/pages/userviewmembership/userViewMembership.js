// Import necessary modules and CSS
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

// Open the subscription list modal
function openModalList() {
  doc.getElementById('listModal').style.display = 'flex';
}

// Close the subscription list modal
function closeModalList() {
  doc.getElementById('listModal').style.display = 'none';
}

// Open the confirmation modal with details for canceling a specific membership
function openConfirmationModal(membershipName, rowId) {
  membershipToCancel = membershipName;
  rowToRemove = rowId;
  doc.getElementById('confirmationModal').style.display = 'flex';
}

// Close the confirmation modal
function closeConfirmationModal() {
  doc.getElementById('confirmationModal').style.display = 'none';
}

// Handle the cancel confirmation
doc.getElementById('confirmCancelBtn').addEventListener('click', function() {
  // Remove the row from the table
  doc.getElementById(rowToRemove).remove();
  
  // Close the confirmation modal
  closeConfirmationModal();
});

// Add event listener to close the list modal when cancel button is clicked
doc.getElementById('cancelListBtn').addEventListener('click', closeModalList);

// Function to fetch and display the updated list of membership cards
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

// Real-time listener for new membership card events from the admin
socket.on('newMembershipCard', (newCard) => {
  // When a new membership card is added, refetch and display the updated list
  fetchMembershipCards();
});

// Initial fetch of membership cards on page load
fetchMembershipCards();
