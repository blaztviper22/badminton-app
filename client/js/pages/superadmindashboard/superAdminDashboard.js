import '../../../css/components/preloader.css';
import '../../../css/pages/superadmindashboard/superAdminDashboard.css';
import { startSessionChecks, validateSessionAndNavigate } from '../../../utils/sessionUtils.js';
import { setupLogoutListener } from '../../global/logout.js';

// Add event listeners for the buttons
document.addEventListener('DOMContentLoaded', () => {
    // Transaction History Button
    document.querySelector('.transaction-history-btn').addEventListener('click', viewTransactionHistory);

    // Court Owner Details, Approve, Reject Buttons
    const approveButtons = document.querySelectorAll('.btn-approve');
    approveButtons.forEach(button => {
        button.addEventListener('click', () => approveCourtOwner(getOwnerId(button)));
    });

    const rejectButtons = document.querySelectorAll('.btn-reject');
    rejectButtons.forEach(button => {
        button.addEventListener('click', () => rejectCourtOwner(getOwnerId(button)));
    });

    const viewButtons = document.querySelectorAll('.btn-view');
    viewButtons.forEach(button => {
        button.addEventListener('click', () => viewCourtOwnerDetails(getOwnerId(button)));
    });

    // Close buttons for modals
    document.querySelectorAll('#transactionHistoryModal button').forEach(button => {
        button.addEventListener('click', closeTransactionHistory);
    });

    document.querySelectorAll('#detailsModal button').forEach(button => {
        button.addEventListener('click', closeDetailsModal);
    });

    // Click outside modal to close
    window.addEventListener('click', (event) => {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            if (event.target === modal) {
                modal.style.display = 'none';
            }
        });
    });
});

// Helper function to get owner ID from button's parent row
function getOwnerId(button) {
    const row = button.closest('tr');
    return parseInt(row.querySelector('td').textContent); // Assumes the first column contains the ID
}

function approveCourtOwner(id) {
    const courtOwner = courtOwners.find(owner => owner.id === id);
    transactionHistory.push({
        id,
        name: courtOwner.name,
        action: 'Approved',
        date: new Date().toLocaleDateString(),
        details: courtOwner.courtDetails
    });
    alert('Court Owner Approved');
    removeFromTable(id);
}

function rejectCourtOwner(id) {
    const courtOwner = courtOwners.find(owner => owner.id === id);
    transactionHistory.push({
        id,
        name: courtOwner.name,
        action: 'Rejected',
        date: new Date().toLocaleDateString(),
        details: courtOwner.courtDetails
    });
    alert('Court Owner Rejected');
    removeFromTable(id);
}

function removeFromTable(id) {
    const row = document.querySelector(`#courtOwnersTable tbody tr:nth-child(${id})`);
    if (row) row.remove();
}

function viewCourtOwnerDetails(id) {
    const courtOwner = courtOwners.find(owner => owner.id === id);
    if (courtOwner) {
        document.getElementById('owner-name').value = courtOwner.name;
        document.getElementById('contact-info').value = courtOwner.contactInfo;
        document.getElementById('court-name').value = courtOwner.courtDetails.courtName;
        document.getElementById('court-address').value = courtOwner.courtDetails.courtAddress;

        const fileList = document.getElementById('uploaded-files');
        fileList.innerHTML = '';
        courtOwner.courtDetails.files.forEach(file => {
            const fileItem = document.createElement('li');
            const fileLink = document.createElement('a');
            fileLink.href = file.url;
            fileLink.target = '_blank';
            fileLink.textContent = file.name;
            fileItem.appendChild(fileLink);
            fileList.appendChild(fileItem);
        });

        document.getElementById('detailsModal').style.display = 'flex';
    }
}

function viewTransactionHistory() {
    const historyTableBody = document.getElementById('transactionHistoryTable').querySelector('tbody');
    historyTableBody.innerHTML = '';
    transactionHistory.forEach((transaction, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${transaction.name}</td>
            <td>${transaction.action}</td>
            <td>${transaction.date}</td>
            <td><button onclick="viewCourtOwnerDetails(${transaction.id})">View Details</button></td>
        `;
        historyTableBody.appendChild(row);
    });

    document.getElementById('transactionHistoryModal').style.display = 'flex';
}

function closeTransactionHistory() {
    document.getElementById('transactionHistoryModal').style.display = 'none';
}

function closeDetailsModal() {
    document.getElementById('detailsModal').style.display = 'none';
}
