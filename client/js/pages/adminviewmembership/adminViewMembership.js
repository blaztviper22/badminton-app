import '../../../css/components/preloader.css';
import '../../../css/components/sideNavAdmin.css';
import '../../../css/pages/adminviewMembership/adminviewMembership.css';
import { startSessionChecks } from '../../../utils/sessionUtils.js';
import '../../components/sideNavAdmin.js';

const cardContainer = document.getElementById('cardContainer');
const modal = document.getElementById('editModal');
const subscribersModal = document.getElementById('subscribersModal');
const subscriberTableBody = document.getElementById('subscriberTableBody');
const confirmationModal = document.getElementById('confirmationModal');
const confirmRevokeBtn = document.getElementById('confirmRevokeBtn');
const closeSubscribersModalBtn = document.getElementById('closeSubscribersModal');
const closeConfirmationModalBtn = document.getElementById('closeConfirmationModal');
let editingCardIndex = null;
let revokeDetails = null;
const cards = [];

// Initialize WebSocket connection
const socket = new WebSocket('ws://localhost:8080');

// Handle WebSocket connection open
socket.onopen = () => {
  console.log('Connected to the WebSocket server');
};

// Handle incoming WebSocket messages
socket.onmessage = (event) => {
  const message = JSON.parse(event.data);

  switch (message.type) {
    case 'addCard':
      cards.push(message.card);
      renderCards();
      break;
    case 'updateCard':
      cards[message.index] = message.card;
      renderCards();
      break;
    case 'deleteCard':
      cards.splice(message.index, 1);
      renderCards();
      break;
    case 'toggleStatus':
      cards[message.index].isActive = message.isActive;
      renderCards();
      break;
  }
};

// Error handling for WebSocket
socket.onerror = (error) => {
  console.error('WebSocket Error:', error);
};

// Handle WebSocket connection close
socket.onclose = () => {
  console.log('WebSocket connection closed');
};

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
        <br><br>
        <button class="subscriber-btn" data-index="${index}">View Subscribers</button>
      </div>
    `;
    cardContainer.appendChild(cardElement);
  });

  // Attach event listeners to buttons after rendering
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

// Delete card and notify WebSocket server
function deleteCard(index) {
  cards.splice(index, 1);
  renderCards();

  // Send delete card request via WebSocket
  socket.send(JSON.stringify({
    type: 'deleteCard',
    index: parseInt(index)
  }));
}

// Toggle card status and notify WebSocket server
function toggleStatus(index) {
  cards[index].isActive = !cards[index].isActive;
  renderCards();

  // Send updated status to WebSocket server
  socket.send(JSON.stringify({
    type: 'toggleStatus',
    index: parseInt(index),
    isActive: cards[index].isActive
  }));
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

  // Send new card data via WebSocket
  socket.send(JSON.stringify({
    type: 'addCard',
    card: newCard
  }));
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

  // Send updated card data via WebSocket
  socket.send(JSON.stringify({
    type: 'updateCard',
    index: editingCardIndex,
    card: updatedCard
  }));
});

// View subscribers for a card
function viewSubscribers(index) {
  subscriberTableBody.innerHTML = '';  // Clear previous subscriber rows
  cards[index].subscribers.forEach((subscriber, subIndex) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${subscriber.username}</td>
      <td>${subscriber.date}</td>
      <td><button class="revoke-btn" data-card-index="${index}" data-subscriber-index="${subIndex}">Revoke</button></td>
    `;
    subscriberTableBody.appendChild(row);
  });

  // Re-attach event listeners for the "Revoke" buttons
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
  revokeDetails = { cardIndex, subscriberIndex };  // Set the details
  confirmationModal.style.display = 'flex';  // Show the modal
  document.body.classList.add('no-scroll');  // Prevent body scrolling when modal is open
}

// Close confirmation modal
function closeConfirmationModal() {
  const confirmationModal = document.getElementById('confirmationModal');
  confirmationModal.style.display = 'none';  // Hide the modal
  document.body.classList.remove('no-scroll');  // Allow scrolling again
  revokeDetails = null;  // Clear revoke details
}

// Confirm the revocation action
confirmRevokeBtn.addEventListener('click', function() {
  if (revokeDetails) {
    const { cardIndex, subscriberIndex } = revokeDetails;

    // Remove the subscriber
    cards[cardIndex].subscribers.splice(subscriberIndex, 1);

    // Re-render the cards to update the subscriber count and details
    renderCards();

    // Re-render the subscribers modal
    viewSubscribers(cardIndex);

    // Close the confirmation modal
    closeConfirmationModal();

    // Clear revoke details
    revokeDetails = null;
  }
});

// Close modals
closeSubscribersModalBtn.addEventListener('click', () => closeModal(subscribersModal));
closeConfirmationModalBtn.addEventListener('click', () => closeConfirmationModal());


// Start session checks
startSessionChecks();
closeConfirmationModalBtn.addEventListener('click', () => {
  console.log('Close button clicked');
  closeConfirmationModal();
});
