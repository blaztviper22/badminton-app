import '../../../css/components/preloader.css';
import '../../../css/components/sideNavAdmin.css';
import '../../../css/pages/adminviewmembership/adminViewMembership.css';
import { startSessionChecks } from '../../../utils/sessionUtils.js';
import '../../components/sideNavAdmin.js';

startSessionChecks();

const doc = document;
const { log, error } = console;

const getById = (id) => doc.getElementById(id);
const getAll = (selector) => doc.querySelectorAll(selector);
const get = (selector) => doc.querySelector(selector);

document.addEventListener('DOMContentLoaded', () => {
  const cardContainer = getById('cardContainer');
  const editModal = getById('editModal');
  const subscribersModal = getById('subscribersModal');
  const subscriberTableBody = getById('subscriberTableBody');
  const confirmationModal = getById('confirmationModal');
  const confirmRevokeBtn = getById('confirmRevokeBtn');
  const closeEditModal = getById('closeEditModal');
  const closeSubscribersModal = getById('closeSubscribersModal');
  const closeConfirmationModal = getById('closeConfirmationModal');
  
  let editingCardIndex = null;
  let revokeDetails = null;
  const cards = [];

  // Render the cards in the container
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

    // Add event listeners to buttons
    getAll('.delete-icon').forEach((btn) =>
      btn.addEventListener('click', (e) => deleteCard(e.target.dataset.index))
    );
    getAll('.edit-btn').forEach((btn) =>
      btn.addEventListener('click', (e) => editCard(e.target.dataset.index))
    );
    getAll('.subscriber-btn').forEach((btn) =>
      btn.addEventListener('click', (e) => viewSubscribers(e.target.dataset.index))
    );
  }

  // Delete a card from the cards array
  function deleteCard(index) {
    // Confirm with the user before deleting
    const confirmed = confirm("Are you sure you want to delete this card?");
    if (confirmed) {
      // Remove the card from the array
      cards.splice(index, 1);

      // Re-render the cards after deletion
      renderCards();
    }
  }

  // Open modal function
  function openModal(modal) {
    modal.style.display = 'flex';
    doc.body.classList.add('no-scroll');
  }

  // Close modal function
  function closeModal(modal) {
    modal.style.display = 'none';
    doc.body.classList.remove('no-scroll');
  }

  // Edit a card's details
  function editCard(index) {
    const card = cards[index];
    editingCardIndex = index;

    // Populate the form with the current card details
    getById('editCardName').value = card.cardName;
    getById('editCardDescription').value = card.cardDescription;
    getById('editCardPrice').value = card.cardPrice;
    getById('editImagePreview').style.display = 'inline-block';
    getById('editImagePreview').src = card.imageUrl;

    openModal(editModal);
  }

  // Add a new membership card
  getById('membershipForm').addEventListener('submit', (e) => {
    e.preventDefault();

    const imageUrl = getById('imageUrl').files[0];
    const cardName = getById('cardName').value;
    const cardDescription = getById('cardDescription').value;
    const cardPrice = getById('cardPrice').value;

    const newCard = {
      imageUrl: URL.createObjectURL(imageUrl),
      cardName,
      cardDescription,
      cardPrice,
      isActive: true,
      subscribers: [
        {
          username: 'sampleUser',
          dateSubscribed: new Date().toLocaleDateString(),
        },
      ],
    };

    cards.push(newCard);
    renderCards();
    getById('membershipForm').reset();
  });

  // Update an existing card
  getById('editForm').addEventListener('submit', (e) => {
    e.preventDefault();

    const cardName = getById('editCardName').value;
    const cardDescription = getById('editCardDescription').value;
    const cardPrice = getById('editCardPrice').value;
    const imageUrl = getById('editImageUrl').files[0];

    cards[editingCardIndex] = {
      imageUrl: imageUrl ? URL.createObjectURL(imageUrl) : cards[editingCardIndex].imageUrl,
      cardName,
      cardDescription,
      cardPrice,
      isActive: cards[editingCardIndex].isActive,
      subscribers: cards[editingCardIndex].subscribers,
    };

    renderCards();
    closeModal(editModal);
  });

  // Event listener to close the edit modal
  closeEditModal.addEventListener('click', () => closeModal(editModal));

  // View subscribers for a card
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

  // Revoke a subscriber's subscription
  function revokeSubscription(cardIndex, subscriberIndex) {
    const card = cards[cardIndex];
    card.subscribers.splice(subscriberIndex, 1); // Remove the subscriber
    renderCards();
    updateSubscriberList(cardIndex); // Update the subscriber list in modal
    closeModal(confirmationModal);
  }

  // Update the subscriber list after revoking
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
      revokeDetails = null;
    }
  });

  // Handle revoke cancel
  closeConfirmationModal.addEventListener('click', () => {
    revokeDetails = null; // Reset revokeDetails if canceled
    closeModal(confirmationModal);
  });

  // Revoke subscription prompt
  document.addEventListener('click', (e) => {
    if (e.target && e.target.classList.contains('revoke-btn')) {
      const cardIndex = e.target.dataset.cardIndex;
      const subscriberIndex = e.target.dataset.subscriberIndex;
      revokeDetails = { cardIndex, subscriberIndex }; // Store revoke details
      openModal(confirmationModal); // Open confirmation modal
    }
  });

  // Close subscribers modal
  closeSubscribersModal.addEventListener('click', () => closeModal(subscribersModal));

  renderCards();
});
