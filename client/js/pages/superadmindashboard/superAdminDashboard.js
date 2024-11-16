import '../../../css/components/preloader.css';
import '../../../css/pages/superadmindashboard/superAdminDashboard.css';
import { startSessionChecks, validateSessionAndNavigate } from '../../../utils/sessionUtils.js';
import { openModal } from '../../components/modal.js';
import { setupLogoutListener } from '../../global/logout.js';

startSessionChecks();
setupLogoutListener();

const doc = document;
const { log, error } = console;

const getById = (id) => doc.getElementById(id);
const getAll = (selector) => doc.querySelectorAll(selector);
const get = (selector) => doc.querySelector(selector);

document.addEventListener('DOMContentLoaded', () => {
  const tabs = getAll('.nav-link');
  const tabContents = getAll('.tab-content');
  const viewDetailsModal = getById('viewDetailsModal');
  const closeViewModalBtn = get('#viewDetailsModal .close');

  // Handle tab switching
  tabs.forEach((tab) => {
    tab.addEventListener('click', (e) => {
      e.preventDefault();
      tabs.forEach((t) => t.classList.remove('active'));
      tabContents.forEach((content) => content.classList.remove('active'));
      tab.classList.add('active');
      const target = getById(tab.dataset.tab);
      target.classList.add('active');
    });
  });

  // Handle actions (View Details, Approve, Reject)
  doc.body.addEventListener('click', (e) => {
    if (e.target.classList.contains('btn-view')) {
      const name = e.target.dataset.name;
      showViewDetailsModal(name);
    } else if (e.target.classList.contains('btn-approve')) {
      openModal(
        'confirm',
        'Approve Court Owner',
        'Are you sure you want to approve?',
        onConfirmApprove,
        onCancelApprove,
        'Approve',
        'Cancel'
      );
    } else if (e.target.classList.contains('btn-reject')) {
      openModal(
        'confirm',
        'Reject Court Owner',
        'Are you sure you want to reject?',
        onConfirmReject,
        onCancelReject,
        'Reject',
        'Cancel'
      );
    }
  });

  function onCancelReject() {
    log('Superadmin canceled reject.');
  }
  function onConfirmReject() {
    log('Superadmin confirmed reject.');
  }
  function onCancelApprove() {
    log('Superadmin canceled approve.');
  }
  function onConfirmApprove() {
    log('Superadmin confirmed approve.');
  }

  // Function to show the View Details modal and set data
  const showViewDetailsModal = (name) => {
    getById('businessName').value = name; // Dynamically set business name
    viewDetailsModal.style.display = 'block'; // Show the modal
  };

  // Close View Details Modal
  closeViewModalBtn.addEventListener('click', () => {
    viewDetailsModal.style.display = 'none';
  });
});
