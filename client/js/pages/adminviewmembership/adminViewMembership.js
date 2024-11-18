import '../../../css/components/preloader.css';
import '../../../css/components/sideNavAdmin.css';
import '../../../css/pages/adminviewmembership/adminViewMembership.css';
import { startSessionChecks } from '../../../utils/sessionUtils.js';
import '../../components/sideNavAdmin.js';

document.addEventListener('DOMContentLoaded', () => {
  const cardContainer = document.getElementById('cardContainer');
  const editModal = document.getElementById('editModal');
  const subscribersModal = document.getElementById('subscribersModal');
  const subscriberTableBody = document.getElementById('subscriberTableBody');
  const closeEditModal = document.getElementById('closeEditModal');
  const closeSubscribersModal = document.getElementById('closeSubscribersModal');
  const confirmationModal = document.getElementById('confirmationModal');
  const confirmRevokeBtn = document.getElementById('confirmRevokeBtn');
  const closeConfirmationModal = document.getElementById('closeConfirmationModal');
  let editingCardIndex = null;
  let revokeDetails = null;
  const cards = [];

  // Render the cards
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
          <button class="edit-btn" data-index="${index}">Edit</button>
          <button class="subscriber-btn" data-index="${index}">View Subscribers</button>
        </div>
      `;
      cardContainer.appendChild(cardElement);
    });

    // Add event listeners for delete, status, edit, and view subscribers buttons
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

  // Open modal function
  function openModal(modal) {
    modal.style.display = 'flex';
    document.body.classList.add('no-scroll');
  }

  // Close modal function
  function closeModal(modal) {
    modal.style.display = 'none';
    document.body.classList.remove('no-scroll');
  }

  // Edit a card
  function editCard(index) {
    const card = cards[index];
    editingCardIndex = index;

    // Populate the form inputs with the current card data
    document.getElementById('editCardName').value = card.cardName;
    document.getElementById('editCardDescription').value = card.cardDescription;
    document.getElementById('editCardPrice').value = card.cardPrice;

    // Display the existing image preview
    document.getElementById('editImagePreview').style.display = 'inline-block';
    document.getElementById('editImagePreview').src = card.imageUrl;

    // Open the edit modal
    openModal(editModal);
  }

  // Add a new membership card
  document.getElementById('membershipForm').addEventListener('submit', (e) => {
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
        {
          username: 'sampleUser',
          dateSubscribed: new Date().toLocaleDateString()
        }
      ] // Adding a sample subscriber
    };

    cards.push(newCard);
    renderCards();
    document.getElementById('membershipForm').reset();
  });

  // Update an existing card
  document.getElementById('editForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const cardName = document.getElementById('editCardName').value;
    const cardDescription = document.getElementById('editCardDescription').value;
    const cardPrice = document.getElementById('editCardPrice').value;
    const imageUrl = document.getElementById('editImageUrl').files[0];

    // Update the card data
    cards[editingCardIndex] = {
      imageUrl: imageUrl ? URL.createObjectURL(imageUrl) : cards[editingCardIndex].imageUrl,
      cardName,
      cardDescription,
      cardPrice,
      isActive: cards[editingCardIndex].isActive,
      subscribers: cards[editingCardIndex].subscribers
    };

    // Re-render the cards to reflect the changes
    renderCards();
    closeModal(editModal);
  });

  // Event listener to close the edit modal
  closeEditModal.addEventListener('click', () => closeModal(editModal));

  // View subscribers of a card
  function viewSubscribers(cardIndex) {
    const card = cards[cardIndex];
    subscriberTableBody.innerHTML = '';
    card.subscribers.forEach((subscriber, index) => {
      const row = document.createElement('tr');
      row.innerHTML = ` 
        <td>${subscriber.username}</td>
        <td>${subscriber.dateSubscribed}</td>
        <td><button class="revoke-btn" data-card-index="${cardIndex}" data-subscriber-index="${index}">Revoke</button></td>
      `;
      subscriberTableBody.appendChild(row);
    });

    openModal(subscribersModal);
  }

  // Revoke a subscriber
  function revokeSubscription(cardIndex, subscriberIndex) {
    const card = cards[cardIndex];
    card.subscribers.splice(subscriberIndex, 1); // Remove the subscriber
    renderCards(); // Re-render the cards to reflect the change
    updateSubscriberList(cardIndex); // Update the subscribers modal
    closeModal(confirmationModal); // Close the confirmation modal after revoking
  }

  // Update the subscriber list in the subscribers modal after revoking
  function updateSubscriberList(cardIndex) {
    const card = cards[cardIndex];
    subscriberTableBody.innerHTML = '';
    card.subscribers.forEach((subscriber, index) => {
      const row = document.createElement('tr');
      row.innerHTML = ` 
        <td>${subscriber.username}</td>
        <td>${subscriber.dateSubscribed}</td>
        <td><button class="revoke-btn" data-card-index="${cardIndex}" data-subscriber-index="${index}">Revoke</button></td>
      `;
      subscriberTableBody.appendChild(row);
    });
  }

  // Handle revoke confirmation
  confirmRevokeBtn.addEventListener('click', () => {
    if (revokeDetails) {
      revokeSubscription(revokeDetails.cardIndex, revokeDetails.subscriberIndex);
      revokeDetails = null; // Reset revokeDetails after the action
    }
  });

  // Handle revoke cancel
  closeConfirmationModal.addEventListener('click', () => {
    revokeDetails = null; // Reset revokeDetails if the user cancels
    closeModal(confirmationModal);
  });

  // Revoke subscription prompt
  document.addEventListener('click', (e) => {
    if (e.target && e.target.classList.contains('revoke-btn')) {
      const cardIndex = e.target.dataset.cardIndex;
      const subscriberIndex = e.target.dataset.subscriberIndex;
      revokeDetails = { cardIndex, subscriberIndex }; // Store the revoke details
      openModal(confirmationModal); // Open the confirmation modal
    }
  });

  // Close subscribers modal
  closeSubscribersModal.addEventListener('click', () => closeModal(subscribersModal));

  renderCards();
});
