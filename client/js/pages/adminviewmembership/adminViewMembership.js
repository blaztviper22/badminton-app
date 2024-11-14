// Import necessary CSS (assuming a modular environment)
import '../../../css/components/preloader.css';
import '../../../css/components/sideNavAdmin.css';
import '../../../css/pages/adminviewMembership/adminviewMembership.css';
import { startSessionChecks } from '../../../utils/sessionUtils.js';
import '../../components/sideNavAdmin.js';

// Variables
const cardContainer = document.getElementById('cardContainer');
const modal = document.getElementById('editModal');
const subscribersModal = document.getElementById('subscribersModal');
const confirmationModal = document.getElementById('confirmationModal');
const subscriberTableBody = document.getElementById('subscriberTableBody');
const confirmRevokeBtn = document.getElementById('confirmRevokeBtn');

// For tracking the editing card
let editingCardIndex = null;
let revokeDetails = null;
const cards = [];

// Render cards to the DOM
function renderCards() {
  cardContainer.innerHTML = '';
  cards.forEach((card, index) => {
    const cardElement = document.createElement('div');
    cardElement.classList.add('membership-card');
    cardElement.innerHTML = `
      <i class="fas fa-trash-alt delete-icon" data-index="${index}"></i>
      <img src="${card.imageUrl}" alt="Card Image">
      <div class="card-content">
        <div class="card-name">${card.cardName}</div>
        <div class="card-description">${card.cardDescription}</div>
        <div class="price">₱${card.cardPrice}</div>
        <button class="status-btn ${card.isActive ? 'active-btn' : 'inactive-btn'}" data-index="${index}">
          ${card.isActive ? 'Active' : 'Inactive'}
        </button>
        <button class="edit-btn" data-index="${index}">Edit</button>
        <button class="subscriber-btn" data-index="${index}">View Subscribers</button>
      </div>
    `;
    cardContainer.appendChild(cardElement);
  }); 

  document.querySelectorAll('.delete-icon').forEach(btn =>
    btn.addEventListener('click', (e) => deleteCard(e.target.dataset.index))
  );
  document.querySelectorAll('.status-btn').forEach(btn =>
    btn.addEventListener('click', (e) => toggleStatus(e.target.dataset.index))
  );
  document.querySelectorAll('.edit-btn').forEach(btn =>
    btn.addEventListener('click', (e) => editCard(e.target.dataset.index))
  );
  document.querySelectorAll('.subscriber-btn').forEach(btn =>
    btn.addEventListener('click', (e) => viewSubscribers(e.target.dataset.index))
  );
}

// Delete card
function deleteCard(index) {
  cards.splice(index, 1);
  renderCards();
}

// Toggle card status
function toggleStatus(index) {
  cards[index].isActive = !cards[index].isActive;
  renderCards();
}

// Open edit modal for selected card
function editCard(index) {
  const card = cards[index];
  editingCardIndex = index;
  document.getElementById('editCardName').value = card.cardName;
  document.getElementById('editCardDescription').value = card.cardDescription;
  document.getElementById('editCardPrice').value = card.cardPrice;
  document.getElementById('editImagePreview').style.display = 'inline-block';
  document.getElementById('editImagePreview').src = card.imageUrl;
  openModal(modal);
}

// Open and close modals
function openModal(modal) {
  document.body.classList.add('no-scroll');
  modal.style.display = 'flex';
}

function closeModal(modal) {
  document.body.classList.remove('no-scroll');
  modal.style.display = 'none';
}

// Image preview
function previewImage(event, isEdit = false) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    const imgSrc = e.target.result;
    if (isEdit) {
      document.getElementById('editImagePreview').src = imgSrc;
      document.getElementById('editImagePreview').style.display = 'inline-block';
    } else {
      const imagePreview = document.createElement('img');
      imagePreview.src = imgSrc;
      imagePreview.classList.add('image-preview');
      document.getElementById('membershipForm').appendChild(imagePreview);
    }
  };
  reader.readAsDataURL(file);
}

// Add new card
document.getElementById('membershipForm').addEventListener('submit', function(e) {
  e.preventDefault();
  const imageUrl = document.getElementById('imageUrl').files[0];
  const cardName = document.getElementById('cardName').value;
  const cardDescription = document.getElementById('cardDescription').value;
  const cardPrice = document.getElementById('cardPrice').value;

  const newCard = {
    imageUrl: URL.createObjectURL(imageUrl),
    cardName,
    cardDescription,
    cardPrice,
    isActive: true,
    subscribers: [{ username: 'SampleUser1', date: '2024-10-01' }]
  };

  cards.push(newCard);
  renderCards();
  document.getElementById('membershipForm').reset();
});

// Update existing card
document.getElementById('editForm').addEventListener('submit', function(e) {
  e.preventDefault();

  const cardName = document.getElementById('editCardName').value;
  const cardDescription = document.getElementById('editCardDescription').value;
  const cardPrice = document.getElementById('editCardPrice').value;
  const imageUrl = document.getElementById('editImageUrl').files[0];

  const updatedCard = {
    imageUrl: imageUrl ? URL.createObjectURL(imageUrl) : cards[editingCardIndex].imageUrl,
    cardName,
    cardDescription,
    cardPrice,
    isActive: cards[editingCardIndex].isActive,
    subscribers: cards[editingCardIndex].subscribers
  };

  cards[editingCardIndex] = updatedCard;
  renderCards();
  closeModal(modal);
});

// View subscribers for a card
function viewSubscribers(index) {
  subscriberTableBody.innerHTML = '';  
  cards[index].subscribers.forEach((subscriber, subIndex) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${subscriber.username}</td>
      <td>${subscriber.date}</td>
      <td><button class="revoke-btn" data-card-index="${index}" data-subscriber-index="${subIndex}">Revoke</button></td>
    `;
    subscriberTableBody.appendChild(row);
  });

  document.querySelectorAll('.revoke-btn').forEach((btn) => {
    btn.addEventListener('click', (event) => {
      const cardIndex = event.target.getAttribute('data-card-index');
      const subscriberIndex = event.target.getAttribute('data-subscriber-index');
      openConfirmationModal(cardIndex, subscriberIndex);
    });
  });

  openModal(subscribersModal);
}

// Open confirmation modal to confirm the revocation
function openConfirmationModal(cardIndex, subscriberIndex) {
  revokeDetails = { cardIndex, subscriberIndex };
  openModal(confirmationModal);
}

// Close confirmation modal
function closeConfirmationModal() {
  closeModal(confirmationModal);
  revokeDetails = null;
}

// Confirm the revocation action
confirmRevokeBtn.addEventListener('click', function() {
  if (revokeDetails) {
    const { cardIndex, subscriberIndex } = revokeDetails;
    cards[cardIndex].subscribers.splice(subscriberIndex, 1);
    renderCards();
    viewSubscribers(cardIndex);
    closeConfirmationModal();
  }
});

// Attach event listeners to the close buttons in modals
document.querySelector('#editModal .close-btn').addEventListener('click', () => closeModal(modal));
document.querySelector('#subscribersModal .close-btn').addEventListener('click', () => closeModal(subscribersModal));
document.querySelector('#confirmationModal .close-btn').addEventListener('click', () => closeConfirmationModal());

startSessionChecks();
