import { fileTypeFromBlob } from 'file-type';
import '../../../css/components/preloader.css';
import '../../../css/components/sideNavAdmin.css';
import '../../../css/pages/viewadminpost/viewAdminPost.css';
import { startSessionChecks } from '../../../utils/sessionUtils.js';
import '../../components/sideNavAdmin.js';

startSessionChecks();

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

// Client-side listener for real-time updates when a new membership card is added
socket.on('newMembershipCard', (data) => {
  if (data.status === 'success') {
    fetchMembershipCards(); // Function to fetch and display the updated membership cards
  }
});

// Function to fetch and display the updated list of membership cards
async function fetchMembershipCards() {
  try {
    const response = await fetch('/user/memberships'); // Assuming this is the API endpoint
    const memberships = await response.json();
    
    // Render the new membership cards in the UI
    displayMembershipCards(memberships);
  } catch (error) {
    console.error('Error fetching membership cards:', error);
  }
}

// Function to display membership cards in the UI
function displayMembershipCards(memberships) {
  const cardContainer = doc.getElementById('membershipCardContainer');
  cardContainer.innerHTML = ''; // Clear the current cards

  memberships.forEach((membership) => {
    const card = document.createElement('div');
    card.className = 'membership-card';
    card.innerHTML = `
      <h3>${membership.name}</h3>
      <p>${membership.description}</p>
      <p>Fee: ${membership.fee}</p>
    `;
    cardContainer.appendChild(card);
  });
}
a