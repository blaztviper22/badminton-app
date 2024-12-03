import '../../../css/components/preloader.css';
import '../../../css/components/sideNavAdmin.css';
import '../../../css/pages/adminviewmembership/adminmembership.css';
import { startSessionChecks } from '../../../utils/sessionUtils.js';
import '../../components/sideNavAdmin.js';

startSessionChecks();
const cardContainer = document.getElementById('cardContainer');
const modal = document.getElementById('editModal');
const subscribersModal = document.getElementById('subscribersModal');
const subscriberTableBody = document.getElementById('subscriberTableBody');
let editingCardIndex = null;
const cards = [];

function renderCards() {
  cardContainer.innerHTML = '';
  cards.forEach((card, index) => {
    const cardElement = document.createElement('div');
    cardElement.classList.add('membership-card');
    cardElement.innerHTML = `
      <i class="fas fa-trash-alt delete-icon"></i>
      <img src="${card.imageUrl}" alt="Card Image">
      <div class="card-content">
        <div class="card-name">${card.cardName}</div>
        <div class="card-description">${card.cardDescription}</div>
        <div class="price">₱${card.cardPrice}</div>
        <button class="edit-btn">Edit</button>
        <br><br>
        <button class="subscriber-btn">View Subscribers</button>
      </div>
    `;
    
    const deleteIcon = cardElement.querySelector('.delete-icon');
    const editButton = cardElement.querySelector('.edit-btn');
    const subscriberButton = cardElement.querySelector('.subscriber-btn');
    
    deleteIcon.addEventListener('click', () => deleteCard(index));
    editButton.addEventListener('click', () => editCard(index));
    subscriberButton.addEventListener('click', () => viewSubscribers(index));
    
    cardContainer.appendChild(cardElement);
  });
}

function deleteCard(index) {
  cards.splice(index, 1);
  renderCards();
}

function toggleStatus(index) {
  cards[index].isActive = !cards[index].isActive;
  renderCards();
}

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

function openModal() {
  document.body.classList.add('no-scroll');  // Prevent scrolling on the body
  modal.style.display = 'flex';              // Show the modal
}

function closeModal() {
  document.body.classList.remove('no-scroll');  // Allow scrolling on the body again
  modal.style.display = 'none';                 // Close the modal
}

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

document.getElementById('membershipForm').addEventListener('submit', async function(e) {
  e.preventDefault();

  const formData = new FormData();
  formData.append('imageUrl', document.getElementById('imageUrl').files[0]);
  formData.append('cardName', document.getElementById('cardName').value);
  formData.append('cardDescription', document.getElementById('cardDescription').value);
  formData.append('cardPrice', document.getElementById('cardPrice').value);

  console.log(formData);

  try {
    const response = await fetch('/user/create', {
      method: 'POST',
      body: formData
    });

    const data = await response.json();
    console.log(data);

    if (response.ok) {
      // Add the new card to the display
      const card = {
        imageUrl: data.data.imageUrl,
        cardName: data.data.cardName,
        cardDescription: data.data.cardDescription,
        cardPrice: data.data.cardPrice,
        _id: data.data._id,
        subscribers: []
      };
      cards.push(card);
      renderCards();
      
      // Reset form
      document.getElementById('membershipForm').reset();
      document.getElementById('newImagePreview').style.display = 'none';
    } else {
      alert(data.message || 'Error creating membership card');
    }
  } catch (err) {
    console.error('Error:', err);
    alert('Error creating membership card');
  }
});

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
});

function viewSubscribers(index) {
  subscriberTableBody.innerHTML = ''; // Clear previous entries

  cards[index].subscribers.forEach((subscriber, subIndex) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${subscriber.username}</td>
      <td>${subscriber.date}</td>
      <td><button class="revoke-btn">Revoke</button></td>
    `;
    
    const revokeButton = row.querySelector('.revoke-btn');
    revokeButton.addEventListener('click', () => openConfirmationModal(index, subIndex));
    
    subscriberTableBody.appendChild(row);
  });

  subscribersModal.style.display = 'flex';
}

// Open the confirmation modal
let revokeDetails = {};
function openConfirmationModal(cardIndex, subscriberIndex) {
  revokeDetails = { cardIndex, subscriberIndex };

  document.getElementById('confirmationModal').style.display = 'flex';
  document.body.classList.add('no-scroll');  // Prevent scrolling while modal is open
}

// Close the confirmation modal
function closeConfirmationModal() {
  document.getElementById('confirmationModal').style.display = 'none';
  document.body.classList.remove('no-scroll');  // Allow scrolling again
}

// When the user confirms revocation, remove the subscriber
document.getElementById('confirmRevokeBtn').addEventListener('click', async function() {
  if (revokeDetails.cardIndex !== undefined && revokeDetails.subscriberIndex !== undefined) {
    const card = cards[revokeDetails.cardIndex];
    const subscriber = card.subscribers[revokeDetails.subscriberIndex];
    
    await revokeSubscription(card._id, subscriber._id);
  }

  closeConfirmationModal();  // Close the confirmation modal after action is taken
});

// Function to render the subscriber list (called after a subscriber is revoked)
function renderSubscribers(index) {
  subscriberTableBody.innerHTML = ''; // Clear previous entries

  cards[index].subscribers.forEach((subscriber, subIndex) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${subscriber.username}</td>
      <td>${subscriber.date}</td>
      <td><button class="revoke-btn">Revoke</button></td>
    `;
    const revokeButton = row.querySelector('.revoke-btn');
    revokeButton.addEventListener('click', () => openConfirmationModal(index, subIndex));

    subscriberTableBody.appendChild(row);
  });
}

// Update the confirmation modal handler
async function revokeSubscription(membershipId, subscriberId) {
  try {
    const response = await fetch(`/user/${membershipId}/revoke/${subscriberId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();

    if (response.ok) {
      // Update the UI to reflect the revoked subscription
      const cardIndex = cards.findIndex(card => card._id === membershipId);
      if (cardIndex !== -1) {
        const subscriberIndex = cards[cardIndex].subscribers.findIndex(sub => sub._id === subscriberId);
        if (subscriberIndex !== -1) {
          cards[cardIndex].subscribers.splice(subscriberIndex, 1);
          renderSubscribers(cardIndex);
        }
      }
    } else {
      alert(data.message || 'Error revoking subscription');
    }
  } catch (err) {
    console.error('Error:', err);
    alert('Error revoking subscription');
  }
}


// Close the subscriber modal
function closeSubscribersModal() {
  subscribersModal.style.display = 'none';
  document.body.classList.remove('no-scroll');  // Allow scrolling again
}
