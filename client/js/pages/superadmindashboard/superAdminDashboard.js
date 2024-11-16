import '../../../css/components/preloader.css';
import '../../../css/pages/superadmindashboard/superAdminDashboard.css';
import { startSessionChecks, validateSessionAndNavigate } from '../../../utils/sessionUtils.js';
import { setupLogoutListener } from '../../global/logout.js';
document.addEventListener('DOMContentLoaded', () => {
    const tabs = document.querySelectorAll('.nav-link');
    const tabContents = document.querySelectorAll('.tab-content');
    const logoutBtn = document.getElementById('logout-btn');
    const modal = document.getElementById('modal');
    const modalTitle = document.getElementById('modal-title');
    const modalMessage = document.getElementById('modal-message');
    const confirmBtn = document.getElementById('confirm-btn');
    const closeBtn = document.getElementById('close-btn');
    const viewDetailsModal = document.getElementById('viewDetailsModal');
    const closeViewModalBtn = document.querySelector('#viewDetailsModal .close');

    // Handle tab switching
    tabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            e.preventDefault();
            tabs.forEach(t => t.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            tab.classList.add('active');
            const target = document.getElementById(tab.dataset.tab);
            target.classList.add('active');
        });
    });

    // Handle logout
    logoutBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to logout?')) {
            window.location.href = '/login'; // Redirect to login page
        }
    });

    // Handle actions (View Details, Approve, Reject)
    document.body.addEventListener('click', (e) => {
        if (e.target.classList.contains('btn-view')) {
            // Set data attributes from the clicked button and show the modal
            const name = e.target.dataset.name;
            // You can set other modal content here if needed
            showViewDetailsModal(name);
        } else if (e.target.classList.contains('btn-approve')) {
            showModal('Approve Court Owner', `Are you sure you want to approve ${e.target.dataset.name}?`);
        } else if (e.target.classList.contains('btn-reject')) {
            showModal('Reject Court Owner', `Are you sure you want to reject ${e.target.dataset.name}?`);
        }
    });

    closeViewModalBtn.addEventListener('click', () => {
        viewDetailsModal.style.display = 'none'; // Hide modal
    });

    // Function to show the View Details modal and set data
    const showViewDetailsModal = (name) => {
        // You can set data from the button's data attributes here
        // For example, you can fill in business name or other details dynamically
        document.getElementById('businessName').value = name; // example to set business name
        // Add other data population as needed

        viewDetailsModal.style.display = 'block'; // Show the modal
    };

    // Generic Modal for Approve/Reject
    const showModal = (title, message) => {
        modalTitle.textContent = title;
        modalMessage.textContent = message;
        modal.classList.add('active');
    };

    const closeModal = () => {
        modal.classList.remove('active');
    };

    confirmBtn.addEventListener('click', () => {
        alert('Action confirmed!');
        closeModal();
    });

    closeBtn.addEventListener('click', closeModal);
});
