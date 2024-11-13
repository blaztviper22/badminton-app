import { io } from 'socket.io-client';
import '../../../css/components/navBarUser.css';
import '../../../css/components/preloader.css';
import '../../../css/pages/community/community.css';
import { startSessionChecks, validateSessionAndNavigate } from '../../../utils/sessionUtils.js';
import { setupLogoutListener } from '../../global/logout.js';

setupLogoutListener();

// start session checks on page load
startSessionChecks();

const doc = document;
const { log, error } = console;

const getById = (id) => doc.getElementById(id);
const getAll = (selector) => doc.querySelectorAll(selector);
const get = (selector) => doc.querySelector(selector);

getCurrentUserId().then((userId) => {
  if (userId) {
    const socket = io({ query: { userId } });

    socket.on('newPost', (data) => {
      if (data.status === 'success') {
        fetchPosts(false);
        fetchPopularHashtags(false);
      }
    });
  } else {
    error('User ID could not be retrieved.');
  }
});

doc.addEventListener('DOMContentLoaded', async () => {
  await fetchPopularHashtags();
  await fetchPosts();

  // Add listener to the 'Post' button
  const postButton = getById('create-post-container').querySelector('button');
  postButton.addEventListener('click', createPost);

  // Add listeners for filters
  setupFilters();
});

function setupFilters() {
  // date filter listeners
  getAll('input[name="date-filter"]').forEach((checkbox) => {
    checkbox.addEventListener('change', (e) => {
      console.log('Date filter changed', e.target.value);
      handleDateFilterChange(e.target);
      fetchPosts();
    });
  });

  // sort filter listeners
  getAll('input[name="sort-filter"]').forEach((checkbox) => {
    checkbox.addEventListener('change', (e) => {
      console.log('Sort filter changed', e.target.value);
      handleSortFilterChange(e.target);
      fetchPosts();
    });
  });

  // hashtag filter listeners
  getAll('.hashtag-filter').forEach((checkbox) => {
    checkbox.addEventListener('change', () => {
      console.log('Hashtag filter changed');
      fetchPosts(); // re-fetch posts when hashtags change
    });
  });
}

async function createPost() {
  const postInput = getById('post-input');
  const content = postInput.value.trim();

  if (!content) {
    alert('Content is required to create a post.');
    return;
  }

  try {
    const response = await fetch('/user/community/post', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ content })
    });

    const data = await response.json();

    if (data.status === 'success') {
      // update the UI with the new post
      fetchPosts();
      fetchPopularHashtags();
      postInput.value = ''; // clear the input after posting
    } else {
      alert(data.message || 'Failed to create the post.');
    }
  } catch (err) {
    error('Error creating post:', err);
    alert('Error creating post. Please try again later.');
  }
}

async function fetchPopularHashtags(withPreloader = true) {
  try {
    const response = await fetch('/user/community/posts/popular', {
      withPreloader
    });
    const data = await response.json();
    log(data);

    if (data.status !== 'success') {
      throw new Error('Failed to fetch popular hashtags');
    }

    const popularHashtags = data.data.hashtags;
    const hashtagsContainer = getById('popular-hashtags');
    hashtagsContainer.innerHTML = ''; // Clear any existing content

    popularHashtags.forEach((hashtag) => {
      const label = doc.createElement('label');
      label.innerHTML = `<input type="checkbox" class="hashtag-filter" value="${hashtag.hashtag}" />
        #${hashtag.hashtag} (${hashtag.count})`;
      hashtagsContainer.appendChild(label);
    });
  } catch (err) {
    error('Error fetching popular hashtags:', err);
  }
}

async function fetchPosts(withPreloader = true) {
  try {
    const selectedDateFilter = getSelectedDateFilter();
    const selectedSort = getSelectedSort();
    const selectedHashtags = getSelectedHashtags();

    // Build the query params dynamically based on selected filters
    const params = new URLSearchParams();
    if (selectedDateFilter) {
      params.append('dateFilter', selectedDateFilter);
    }
    if (selectedSort) {
      params.append('sort', selectedSort);
    }
    if (selectedHashtags.length > 0) {
      params.append('hashtag', selectedHashtags.join(','));
    }

    const response = await fetch(`/user/community/posts?${params.toString()}`, { withPreloader });
    const data = await response.json();

    if (data.status !== 'success') {
      throw new Error('Failed to fetch posts');
    }

    const posts = data.data.posts;
    renderPosts(posts);
  } catch (err) {
    error('Error fetching posts:', err);
  }
}

function getSelectedDateFilter() {
  const selectedDateFilter = Array.from(getAll('input[name="date-filter"]:checked')).map((checkbox) => checkbox.value);

  if (selectedDateFilter.length === 1) {
    return selectedDateFilter[0];
  }

  return null;
}

function getSelectedSort() {
  const selectedSort = Array.from(getAll('input[name="sort-filter"]:checked')).map((checkbox) => checkbox.value);

  if (selectedSort.length === 1) {
    return selectedSort[0];
  }

  return null;
}

function getSelectedHashtags() {
  return Array.from(getAll('.hashtag-filter:checked')).map((checkbox) => checkbox.value);
}

function handleDateFilterChange(target) {
  if (target.checked) {
    getAll('input[name="date-filter"]').forEach((checkbox) => {
      if (checkbox !== target) {
        checkbox.checked = false;
      }
    });
    fetchPosts();
  }
}

function handleSortFilterChange(target) {
  if (target.checked) {
    getAll('input[name="sort-filter"]').forEach((checkbox) => {
      if (checkbox !== target) {
        checkbox.checked = false;
      }
    });
    fetchPosts();
  }
}

function renderPosts(posts) {
  const postFeed = getById('post-feed');
  const createPostContainer = getById('create-post-container');
  postFeed.innerHTML = ''; // Clear existing posts

  if (posts.length === 0) {
    postFeed.innerHTML = '<div class="placeholder">No posts to display</div>';
    return;
  }

  postFeed.appendChild(createPostContainer);

  posts.forEach((post) => {
    const postElement = doc.createElement('div');
    postElement.classList.add('post');
    postElement.innerHTML = `<div class="post-header">
        <div class="profile-pic"><i class="fas fa-user"></i></div>
        <div class="name-date">
          <div class="name">${post.userId.username}</div>
          <div class="date">${formatDate(post.createdAt)}</div>
        </div>
        <div class="options"><i class="fas fa-ellipsis-v"></i></div>
      </div>
      <div class="post-content">${post.content}</div>
      <div class="post-footer">
        <span class="action" data-post-id="${post._id}" class="like-action"><i class="fas fa-thumbs-up"></i> Like (${
      post.likesCount
    })</span>
        <span class="action" data-post-id="${
          post._id
        }" class="comment-action"><i class="fas fa-comment"></i> Comment</span>
        <div id="comment-box-${post._id}" class="comment-box" style="display: none;">
          <textarea id="comment-input-${post._id}" placeholder="Add a comment..."></textarea>
          <button class="post-comment" data-post-id="${post._id}">Post Comment</button>
        </div>
      </div>
    `;
    postFeed.appendChild(postElement);
  });
}

function formatDate(dateString) {
  const date = new Date(dateString);
  const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
  return date.toLocaleDateString('en-US', options);
}

async function getCurrentUserId() {
  try {
    const response = await fetch('/user/me', {
      method: 'GET',
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error('Failed to fetch user info');
    }

    const userData = await response.json();
    return userData.id;
  } catch (err) {
    error('Error fetching user ID:', err);
    return null;
  }
}
