import { fileTypeFromBlob } from 'file-type';
import '../../../css/components/preloader.css';
import '../../../css/components/sideNavAdmin.css';
import '../../../css/pages/viewadminpost/viewAdminPost.css';
import { startSessionChecks } from '../../../utils/sessionUtils.js';
import '../../components/sideNavAdmin.js';

startSessionChecks();

const doc = document;
const { log, error } = console;

const getById = (id) => doc.getElementById(id);
const getAll = (selector) => doc.querySelectorAll(selector);
const get = (selector) => doc.querySelector(selector);

const modal = getById('addModal');
const btn = getById('add-post');
const categorySelect = getById('category');
const eventFields = getById('event-fields');
const tournamentFields = getById('tournament-fields');
const membershipFields = getById('membership-fields');
const previewContainer = getById('imagePreviewContainer');
const cancelButton = getById('cancelModal');

const allowedImageTypes = ['image/jpeg', 'image/png', 'image/gif'];

const input = createFileInput();
const uploadButton = getById('uploadButton');

let images = [];

uploadButton.addEventListener('click', () => input.click());
input.addEventListener('change', handleFileInputChange);

cancelButton.onclick = function () {
  closeModal();
};

function clearForm() {
  getById('heading').value = '';
  getById('details').value = '';

  categorySelect.selectedIndex = 0;
  images = [];
  previewContainer.innerHTML = '';
  hideAllFields();
}

function closeModal() {
  modal.style.display = 'none';
  clearForm();
  localStorage.removeItem('selectedCategory');
}

btn.onclick = () => {
  modal.style.display = 'flex';
  clearForm();
  hideAllFields();
};

categorySelect.onchange = function () {
  hideAllFields();
  showFields(this.value);
  localStorage.setItem('selectedCategory', this.value);
};

window.onload = function () {
  const savedCategory = localStorage.getItem('selectedCategory');
  if (savedCategory) {
    categorySelect.value = savedCategory;
    showFields(savedCategory);
  }
};

// function to hide all fields
function hideAllFields() {
  eventFields.style.display = 'none';
  tournamentFields.style.display = 'none';
  membershipFields.style.display = 'none';
}

// function to show fields based on category
function showFields(value) {
  if (value === 'event') {
    eventFields.style.display = 'block';
  } else if (value === 'tournament') {
    tournamentFields.style.display = 'block';
  } else if (value === 'membership') {
    membershipFields.style.display = 'block';
  }
}

// function to create and return a file input element
function createFileInput() {
  const fileInput = doc.createElement('input');
  fileInput.type = 'file';
  fileInput.id = 'imageInput';
  fileInput.accept = 'image/*';
  fileInput.multiple = true;
  fileInput.style.display = 'none';
  doc.body.appendChild(fileInput);
  return fileInput;
}

async function handleFileInputChange() {
  const maxImages = 5;
  const previousImageCount = images.length;
  const totalImagesAfterUpload = previousImageCount + this.files.length;
  let hasInvalidFile = false;

  previewContainer.innerHTML = '';

  if (totalImagesAfterUpload > maxImages) {
    alert(`You can upload a maximum of ${maxImages} images. You currently have ${previousImageCount} images uploaded.`);
    return;
  }

  for (const file of Array.from(this.files)) {
    // check file size (limit to 5MB)
    if (file.size > 5 * 1024 * 1024) {
      // 5MB in bytes
      hasInvalidFile = true;
      continue;
    }

    // check file type using fileTypeFromBlob
    const fileType = await fileTypeFromBlob(file);
    if (!fileType || !allowedImageTypes.includes(fileType.mime)) {
      hasInvalidFile = true; // Mark invalid file
      continue;
    }

    // if the file is valid, read it
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const id = Date.now().toString();
      images.push({ id, src: reader.result, file });
      updateImagePreviews(images, previewContainer);
    };
  }

  if (hasInvalidFile) {
    alert('Please upload valid image files (JPEG, PNG, GIF) that are less than 5MB in size.');
  }
}

function updateImagePreviews(images, container) {
  container.innerHTML = '';
  images.forEach((image) => {
    const div = doc.createElement('div');
    div.classList.add('image-preview');
    div.innerHTML = `
      <img src="${image.src}" alt="Image Preview">
      <button type="button" class="btn btn-danger btn-sm" data-id="${image.id}">
        <i class="fas fa-times"></i>
      </button>
    `;
    container.appendChild(div);
  });

  const removeButtons = container.querySelectorAll('.btn-danger');
  removeButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const id = button.getAttribute('data-id');
      removeImage(id);
    });
  });
}

function removeImage(id) {
  images = images.filter((image) => image.id !== id);
  updateImagePreviews(images, previewContainer);
}

window.removeImage = function (id) {
  images = images.filter((image) => image.id !== id);
  updateImagePreviews(images, previewContainer);
};

function showPopupMenu(event, postCard) {
  const popupMenu = postCard.querySelector('.popup-menu');
  const threeDotsRect = event.target.closest('.three-dots').getBoundingClientRect();

  popupMenu.innerHTML = `
    <ul>
      <li id="editPost">Edit</li>
      <li id="deletePost" data-post-id="${postCard.getAttribute('data-announcement-id')}">Delete</li>
    </ul>
  `;

  popupMenu.style.display = 'block';
  popupMenu.style.position = 'fixed';
  const offset = 10; // Optional offset for better appearance
  popupMenu.style.left = `${threeDotsRect.right + offset}px`; // Place to the right of the icon
  popupMenu.style.top = `${threeDotsRect.top}px`; // Align with the top of the icon

  // event listener for the delete post action
  popupMenu.querySelector('#deletePost').addEventListener('click', () => {
    const postId = postCard.getAttribute('data-announcement-id');
    deletePost(postId); // Call the delete function
  });

  popupMenu.addEventListener('transitionend', () => {
    doc.body.classList.add('no-scroll');
  });

  // close the menu when clicking outside of it
  doc.addEventListener('click', (e) => {
    if (!postCard.contains(e.target)) {
      closePopupMenu(popupMenu);
    }
  });
}

function closePopupMenu(popupMenu) {
  if (popupMenu) {
    popupMenu.style.display = 'none';
    doc.body.classList.remove('no-scroll');
  }
}

async function submitForm() {
  const formData = new FormData();
  const heading = getById('heading').value.trim();
  const details = getById('details').value.trim();

  // check if heading is at least 5 characters long
  if (!heading || heading.length < 5) {
    alert('Please enter a heading with at least 5 characters.');
    return;
  }

  // check if details are at least 10 characters long
  if (!details || details.length < 10) {
    alert('Please enter details with at least 10 characters.');
    return;
  }

  // append heading and details to the formData object
  formData.append('heading', heading);
  formData.append('details', details);

  // append each image file to the FormData object
  images.forEach((image) => {
    formData.append('images', image.file);
  });

  // determine the endpoint based on the selected category
  const selectedCategory = categorySelect.value;
  let endpoint = '';

  switch (selectedCategory) {
    case 'announcement':
      endpoint = '/user/admin/announcement';
      break;
    case 'event':
      endpoint = '/user/admin/event';
      break;
    case 'tournament':
      endpoint = '/user/admin/tournament';
      break;
    case 'membership':
      endpoint = '/user/admin/membership';
      break;
    default:
      alert('Please select a valid category.');
      return;
  }
  log('Endpoint: ', endpoint);

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      body: formData
    });

    if (response.status === 201) {
      const result = await response.json();
      log('Upload successful:', result);
      await fetchPosts();
      localStorage.removeItem('selectedCategory');
    } else {
      const errorResult = await response.json();
      alert(`Upload failed: ${errorResult.message}`);
      error('Upload failed:', errorResult.message);
    }
  } catch (err) {
    alert('Error uploading files: ' + err.message);
    error('Error uploading files:', err);
  }
}

const submitButton = getById('postNow');
submitButton.addEventListener('click', submitForm);

function displayAnnouncements(response) {
  if (response.status === 'success' && Array.isArray(response.data)) {
    const announcements = response.data;
    const box = get('.box');
    box.innerHTML = '';

    if (announcements.length === 0) {
      const noPostsMessage = document.createElement('div');
      noPostsMessage.classList.add('no-posts-message');
      noPostsMessage.textContent = 'No posts yet';
      noPostsMessage.style.textAlign = 'center';
      box.appendChild(noPostsMessage);
      return;
    }

    //  loop through each announcement
    Object.keys(announcements).forEach((key) => {
      const announcement = announcements[key];

      const postCard = document.createElement('div');
      postCard.classList.add('post-card');
      postCard.setAttribute('data-announcement-id', announcement._id);

      // convert the createdAt date to Philippine time
      const createdAt = new Date(announcement.createdAt);
      const options = {
        timeZone: 'Asia/Manila',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      };
      const formattedDate = createdAt.toLocaleString('en-PH', options).replace(',', '');
      log(formattedDate);

      // constructing the images HTML
      const imagesHtml = (announcement.images || []).map((image) => `<img src="${image}" alt="Post Image" />`).join('');

      postCard.innerHTML = `
        <i class="fas fa-ellipsis-v three-dots" id="three-dots"></i>
        <div class="popup-menu" id="popup-menu" style="display: none"></div>
        <div class="user-info">
          <img src="${
            announcement.court?.business_logo || '/assets/images/placeholder_50x50.png'
          }" alt="Business Logo" class="profile-pic" />
          <div class="name-and-time">
            <span class="name">${announcement.postedBy.first_name} ${announcement.postedBy.last_name}</span>
            <span class="time">${formattedDate}</span> <!-- Displaying the formatted date -->
          </div>
        </div>
        <hr />
        <h2>${announcement.heading}</h2>
        <p class="body-text">${announcement.details}</p>
        <div class="post-images">
          ${imagesHtml} <!-- Dynamically adding images -->
        </div>
        <hr />
        <div class="view-more">
          <button>View More</button>
        </div>
      `;

      box.appendChild(postCard);
      postCard.querySelector('.three-dots').addEventListener('click', (event) => {
        event.stopPropagation();
        closeAllPopupMenus();
        showPopupMenu(event, postCard);
      });
    });
  } else {
    error('Failed to load announcements or invalid response format.');
    const noPostsMessage = document.createElement('div');
    noPostsMessage.classList.add('no-posts-message');
    noPostsMessage.textContent = 'No posts yet';
    noPostsMessage.style.textAlign = 'center';
    box.appendChild(noPostsMessage);
  }
}
function closeAllPopupMenus() {
  const allPopupMenus = doc.querySelectorAll('.popup-menu');
  allPopupMenus.forEach((menu) => {
    menu.style.display = 'none';
  });
}

async function fetchPosts() {
  try {
    const response = await fetch('/user/admin/posts');
    if (!response.ok) {
      throw new Error('Failed to fetch announcements');
    }
    const announcements = await response.json();
    displayAnnouncements(announcements);
  } catch (err) {
    error('Error fetching announcements:', err);
    alert('Failed to load announcements. Please try again later.');
  }
}

fetchPosts();

async function deletePost(postId) {
  try {
    const response = await fetch(`/user/admin/announcement/${postId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const data = await response.json();
      if (data.status === 'success') {
        fetchPosts();
      } else {
        error(`Failed to delete post: ${data.message}`);
      }
    } else {
      error('Error occurred while deleting the post.');
    }
  } catch (err) {
    error('Error:', err);
    error('An error occurred while trying to delete the post.');
  }
}
