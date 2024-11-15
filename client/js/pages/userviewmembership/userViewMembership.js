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

// Function to open and close the subscription list modal
function openModalList() {
  doc.getElementById('listModal').style.display = 'flex';
}

function closeModalList() {
  doc.getElementById('listModal').style.display = 'none';
}

// Open and close the confirmation modal with details for canceling a specific membership
function openConfirmationModal(membershipName, rowId) {
  membershipToCancel = membershipName;
  rowToRemove = rowId;
  doc.getElementById('confirmationModal').style.display = 'flex';
}

function closeConfirmationModal() {
  doc.getElementById('confirmationModal').style.display = 'none';
}

// Handle the cancel confirmation by removing the specified row
doc.getElementById('confirmCancelBtn').addEventListener('click', function() {
  if (rowToRemove) {
    doc.getElementById(rowToRemove).remove();  // Remove the row from the table
  }
  closeConfirmationModal();  // Close the confirmation modal
});

// Add event listeners to the list and close buttons
doc.getElementById('openListBtn').addEventListener('click', openModalList);

// Close the list modal
doc.getElementById('cancelListBtn').addEventListener('click', closeModalList);

// Add event listeners to cancel buttons in each row of the membership table
const cancelButtons = doc.querySelectorAll('.cancel-btn');
cancelButtons.forEach(button => {
  button.addEventListener('click', function(event) {
    const row = event.target.closest('tr');  // Get the parent row of the clicked cancel button
    const membershipName = row.querySelector('td:first-child').innerText;  // Get the membership name
    openConfirmationModal(membershipName, row.id);  // Open the confirmation modal
  });
});

// Close the confirmation modal if "No, Keep" button is clicked
const cancelConfirmationBtn = doc.querySelector('.modal-confirmation .cancel-btn');
cancelConfirmationBtn.addEventListener('click', function() {
  closeConfirmationModal();  // Close the confirmation modal
});

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
  fetchMembershipCards();  // Refetch and display the updated list
});

// Initial fetch of membership cards on page load
fetchMembershipCards();  
