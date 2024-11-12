import { io } from 'socket.io-client';
import '../../../css/components/navBarUser.css';
import '../../../css/components/preloader.css';
import '../../../css/pages/userviewmembership/userViewMembership.css';
import { startSessionChecks, validateSessionAndNavigate } from '../../../utils/sessionUtils.js';
import { setupLogoutListener } from '../../global/logout.js';

let membershipToCancel = '';
let rowToRemove = '';

// Create WebSocket connection
const socket = new WebSocket('ws://yourserveraddress:port');  // Replace with your actual WebSocket server URL

// Event listeners for WebSocket messages
socket.onopen = () => {
  console.log('WebSocket connection established');
};

socket.onmessage = (event) => {
  const data = JSON.parse(event.data);  // Assuming the data is sent as JSON

  if (data.status === 'success') {
    if (data.event === 'membershipCanceled') {
      // Handle membership cancellation
      console.log('WebSocket: Membership canceled:', data);
      removeMembershipFromList(data.membershipId);  // Function to remove the membership from the UI
    } 
    else if (data.event === 'newMembership') {
      // Handle new membership added
      console.log('WebSocket: New membership added:', data);
      addNewMembershipToList(data.membership);  // Function to add new membership to the list
    }
  }
};

// Function to open the subscription list modal
function openModalList() {
  document.getElementById('listModal').style.display = 'flex';
}

// Function to close the subscription list modal
function closeModalList() {
  document.getElementById('listModal').style.display = 'none';
}

// Function to open the confirmation modal
function openConfirmationModal(membershipName, rowId) {
  membershipToCancel = membershipName;
  rowToRemove = rowId;
  document.getElementById('confirmationModal').style.display = 'flex';
}

// Function to close the confirmation modal
function closeConfirmationModal() {
  document.getElementById('confirmationModal').style.display = 'none';
}

// Handle the cancel confirmation
document.getElementById('confirmCancelBtn').addEventListener('click', function() {
  console.log('Cancel button clicked');
  console.log('membershipToCancel:', membershipToCancel);
  console.log('rowToRemove:', rowToRemove);

  if (membershipToCancel && rowToRemove) {
    // Sending cancellation event to the server via WebSocket
    socket.send(JSON.stringify({
      event: 'cancelMembership',
      membershipId: membershipToCancel
    }));

    // Remove the row from the table on UI
    document.getElementById(rowToRemove).remove(); 
    closeConfirmationModal();
  } else {
    console.log('Missing membership or row to remove');
  }
});

// Function to remove membership from the list (called after canceling)
function removeMembershipFromList(membershipId) {
  const row = document.getElementById(membershipId);
  if (row) {
    row.remove();  // Remove the canceled membership from the UI
  }
}

// Function to add new membership to the list
function addNewMembershipToList(membership) {
  const tableBody = document.getElementById('membershipTable').getElementsByTagName('tbody')[0];

  const newRow = document.createElement('tr');
  newRow.id = membership.id;  // Assuming `id` is a unique identifier

  const cellName = document.createElement('td');
  cellName.textContent = membership.name;

  const cellPrice = document.createElement('td');
  cellPrice.textContent = membership.price;

  const cellAction = document.createElement('td');
  const cancelButton = document.createElement('button');
  cancelButton.classList.add('cancel-btn');
  cancelButton.textContent = 'Cancel';
  cancelButton.addEventListener('click', () => openConfirmationModal(membership.name, newRow.id));

  cellAction.appendChild(cancelButton);

  newRow.appendChild(cellName);
  newRow.appendChild(cellPrice);
  newRow.appendChild(cellAction);

  tableBody.appendChild(newRow);
}

// Example of how to open the modal list and close it
document.getElementById('openListModalBtn').addEventListener('click', openModalList);
document.getElementById('closeListModalBtn').addEventListener('click', closeModalList);
