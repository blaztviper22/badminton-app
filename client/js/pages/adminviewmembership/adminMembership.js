import '../../../css/components/preloader.css';
import '../../../css/components/sideNavAdmin.css';
import '../../../css/pages/adminviewmembership/adminmembership.css';
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
  let cards = [];

  // Fetch and display all membership cards
  function fetchCards() {
    fetch('/admin/membership', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    })
      .then((response) => response.json())
      .then((data) => {
        cards = data.cards || [];
        renderCards();
      })
      .catch((err) => {
        console.error('Error fetching cards:', err);
        alert('Failed to load cards.');
      });
  }

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
    getAll('.delete-icon').forEach((btn) => btn.addEventListener('click', (e) => deleteCard(e.target.dataset.index)));
    getAll('.edit-btn').forEach((btn) => btn.addEventListener('click', (e) => editCard(e.target.dataset.index)));
    getAll('.subscriber-btn').forEach((btn) =>
      btn.addEventListener('click', (e) => viewSubscribers(e.target.dataset.index))
    );
  }

  // Delete a card from the database
  function deleteCard(index) {
    const cardId = cards[index]._id; // Assuming each card has an _id field

    const confirmed = confirm('Are you sure you want to delete this card?');
    if (confirmed) {
      fetch(`/admin/membership/${cardId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      })
        .then((response) => {
          if (response.ok) {
            cards.splice(index, 1);
            renderCards();
          } else {
            alert('Error deleting the card.');
          }
        })
        .catch((err) => {
          console.error('Error deleting card:', err);
          alert('Failed to delete card.');
        });
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

    const formData = new FormData();
    formData.append('imageUrl', imageUrl);
    formData.append('cardName', cardName);
    formData.append('cardDescription', cardDescription);
    formData.append('cardPrice', cardPrice);

    fetch('/admin/membership', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      },
      body: formData
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.message === 'Membership card created successfully') {
          fetchCards(); // Re-fetch the list of cards
        } else {
          alert('Failed to add card.');
        }
      })
      .catch((err) => {
        console.error('Error adding card:', err);
        alert('Failed to add card.');
      });
  });

  // Update an existing card
  getById('editForm').addEventListener('submit', (e) => {
    e.preventDefault();

    const cardName = getById('editCardName').value;
    const cardDescription = getById('editCardDescription').value;
    const cardPrice = getById('editCardPrice').value;
    const imageUrl = getById('editImageUrl').files[0];

    const updatedCard = {
      cardName,
      cardDescription,
      cardPrice,
      imageUrl: imageUrl ? URL.createObjectURL(imageUrl) : undefined
    };

    const cardId = cards[editingCardIndex]._id;

    fetch(`/admin/membership/${cardId}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updatedCard)
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.message === 'Membership card updated successfully') {
          fetchCards(); // Re-fetch the list of cards
          closeModal(editModal);
        } else {
          alert('Failed to update card.');
        }
      })
      .catch((err) => {
        console.error('Error updating card:', err);
        alert('Failed to update card.');
      });
  });

  // View subscribers for a card
  function viewSubscribers(cardIndex) {
    const card = cards[cardIndex];
    const cardId = card._id;

    fetch(`/admin/membership/${cardId}/subscribers`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    })
      .then((response) => response.json())
      .then((data) => {
        const subscribers = data.subscribers || [];
        subscriberTableBody.innerHTML = '';
        subscribers.forEach((subscriber, index) => {
          const row = document.createElement('tr');
          row.innerHTML = `
          <td>${subscriber.username}</td>
          <td>${subscriber.dateSubscribed}</td>
          <td><button class="revoke-btn" data-card-index="${cardIndex}" data-subscriber-index="${index}">Revoke</button></td>
        `;
          subscriberTableBody.appendChild(row);
        });

        openModal(subscribersModal);
      })
      .catch((err) => {
        console.error('Error fetching subscribers:', err);
        alert('Failed to fetch subscribers.');
      });
  }

  // Revoke a subscriber's subscription
  function revokeSubscription(cardIndex, subscriberIndex) {
    const cardId = cards[cardIndex]._id;
    const subscriberId = cards[cardIndex].subscribers[subscriberIndex]._id;

    fetch(`/admin/membership/${cardId}/subscribers/${subscriberId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    })
      .then((response) => {
        if (response.ok) {
          cards[cardIndex].subscribers.splice(subscriberIndex, 1); // Remove the subscriber
          renderCards();
          closeModal(confirmationModal);
        } else {
          alert('Error revoking subscriber.');
        }
      })
      .catch((err) => {
        console.error('Error revoking subscriber:', err);
        alert('Failed to revoke subscriber.');
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

  // Initial fetch to load all cards
  fetchCards();
});
