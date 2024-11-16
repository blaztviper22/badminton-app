import '../../../css/components/preloader.css';
import '../../../css/pages/superadmindashboard/superAdminDashboard.css';
import { startSessionChecks, validateSessionAndNavigate } from '../../../utils/sessionUtils.js';
import { setupLogoutListener } from '../../global/logout.js';

// Data for court owners
const courtOwners = [
    { 
        id: 1, 
        name: 'John Doe', 
        contactInfo: 'johndoe@email.com', 
        registrationDate: '2024-11-06',
        courtDetails: {
            courtName: 'Doe Sports Complex',
            courtAddress: '123 Main St, City Center',
            files: [
                { name: 'file1.pdf', url: 'https://www.example.com/file1.pdf' },
                { name: 'file2.jpg', url: 'https://www.example.com/file2.jpg' }
            ]
        },
        status: 'Pending'
    },
    { 
        id: 2, 
        name: 'Jane Smith', 
        contactInfo: 'janesmith@email.com', 
        registrationDate: '2024-11-05',
        courtDetails: {
            courtName: 'Smith Court',
            courtAddress: '456 Park Ave, Midtown',
            files: [
                { name: 'file3.pdf', url: 'https://www.example.com/file3.pdf' }
            ]
        },
        status: 'Pending'
    }
];

const transactionHistory = [];

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

window.onclick = function(event) {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });
}