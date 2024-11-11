import '../../../css/components/preloader.css';
import '../../../css/components/sideNavAdmin.css';
import '../../../css/pages/adminviewMembership/adminviewMembership.css';
import { startSessionChecks } from '../../../utils/sessionUtils.js';
import '../../components/sideNavAdmin.js';
const cardContainer = document.getElementById('cardContainer');
const modal = document.getElementById('editModal');
const subscribersModal = document.getElementById('subscribersModal');
const subscriberTableBody = document.getElementById('subscriberTableBody');
let editingCardIndex = null;
const cards = [];

// Initialize WebSocket connection
const socket = new WebSocket('ws://localhost:8080'); // Replace with your WebSocket server URL

// Handle WebSocket connection open
socket.onopen = function() {
  console.log('Connected to the WebSocket server');
};

// Handle incoming WebSocket messages
socket.onmessage = function(event) {
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
socket.onerror = function(error) {
  console.error('WebSocket Error:', error);
};

// Handle WebSocket connection close
socket.onclose = function() {
  console.log('WebSocket connection closed');
};

// Render cards
function renderCards() {
  cardContainer.innerHTML = '';
  cards.forEach((card, index) => {
    const cardElement = document.createElement('div');
    cardElement.classList.add('membership-card');
    cardElement.innerHTML = `
      <i class="fas fa-trash-alt delete-icon" onclick="deleteCard(${index})"></i>
      <img src="${card.imageUrl}" alt="Card Image">
      <div class="card-content">
        <div class="card-name">${card.cardName}</div>
        <div class="card-description">${card.cardDescription}</div>
        <div class="price">₱${card.cardPrice}</div>
        <button class="status-btn ${card.isActive ? 'active-btn' : 'inactive-btn'}" onclick="toggleStatus(${index})">
          ${card.isActive ? 'Active' : 'Inactive'}
        </button>
        <button class="edit-btn" onclick="editCard(${index})">Edit</button>
        <br><br>
        <button class="subscriber-btn" onclick="viewSubscribers(${index})">View Subscribers</button>
      </div>
    `;
    cardContainer.appendChild(cardElement);
  });
}

// Delete card and notify WebSocket server
function deleteCard(index) {
  cards.splice(index, 1);
  renderCards();

  // Send delete card request via WebSocket
  socket.send(JSON.stringify({
    type: 'deleteCard',
    index: index
  }));
}

// Toggle card status and notify WebSocket server
function toggleStatus(index) {
  cards[index].isActive = !cards[index].isActive;
  renderCards();

  // Send updated status to WebSocket server
  socket.send(JSON.stringify({
    type: 'toggleStatus',
    index: index,
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
  modal.style.display = 'flex';
}

// Open the modal
function openModal() {
  document.body.classList.add('no-scroll');
  modal.style.display = 'flex';
}

// Close the modal
function closeModal() {
  document.body.classList.remove('no-scroll');
  modal.style.display = 'none';
}

// Preview uploaded image
function previewImage(event, isEdit = false) {
  const file = event.target.files[0];
  const reader = new FileReader();

  reader.onload = function(e) {
    if (isEdit) {
      document.getElementById('editImagePreview').src = e.target.result;
      document.getElementById('editImagePreview').style.display = 'inline-block';
    } else {
      const imagePreview = document.createElement('img');
      imagePreview.src = e.target.result;
      imagePreview.classList.add('image-preview');
      document.getElementById('membershipForm').appendChild(imagePreview);
    }
  };

  reader.readAsDataURL(file);
}

// Add new card and notify WebSocket server
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
    subscribers: [
      { username: 'SampleUser1', date: '2024-10-01' }
    ]
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

// Update existing card and notify WebSocket server
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
  closeModal();

  // Send updated card data via WebSocket
  socket.send(JSON.stringify({
    type: 'updateCard',
    index: editingCardIndex,
    card: updatedCard
  }));
});

// View subscribers for a card
function viewSubscribers(index) {
  subscriberTableBody.innerHTML = '';

  cards[index].subscribers.forEach((subscriber, subIndex) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${subscriber.username}</td>
      <td>${subscriber.date}</td>
      <td><button class="revoke-btn" onclick="openConfirmationModal(${index}, ${subIndex})">Revoke</button></td>
    `;
    subscriberTableBody.appendChild(row);
  });

  subscribersModal.style.display = 'flex';
}

// Open confirmation modal to revoke subscriber
function openConfirmationModal(cardIndex, subscriberIndex) {
  revokeDetails = { cardIndex, subscriberIndex };
  document.getElementById('confirmationModal').style.display = 'flex';
  document.body.classList.add('no-scroll');
}

// Close the confirmation modal
function closeConfirmationModal() {
  document.getElementById('confirmationModal').style.display = 'none';
  document.body.classList.remove('no-scroll');
}

// Confirm revocation of subscriber
document.getElementById('confirmRevokeBtn').addEventListener('click', function() {
  if (revokeDetails.cardIndex !== undefined && revokeDetails.subscriberIndex !== undefined) {
    const { cardIndex, subscriberIndex } = revokeDetails;
    cards[cardIndex].subscribers.splice(subscriberIndex, 1);
    renderSubscribers(cardIndex);
  }
  closeConfirmationModal();
});

// Render the subscriber list after revocation
function renderSubscribers(index) {
  subscriberTableBody.innerHTML = '';

  cards[index].subscribers.forEach((subscriber, subIndex) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${subscriber.username}</td>
      <td>${subscriber.date}</td>
      <td><button class="revoke-btn" onclick="openConfirmationModal(${index}, ${subIndex})">Revoke</button></td>
    `;
    subscriberTableBody.appendChild(row);
  });
}

// Close the subscriber modal
function closeSubscribersModal() {
  subscribersModal.style.display = 'none';
  document.body.classList.remove('no-scroll');
}
