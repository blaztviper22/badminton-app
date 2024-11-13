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

doc.addEventListener('DOMContentLoaded', async () => {
  await fetchPopularHashtags();
  await fetchPosts();

  // Add listener to the 'Post' button
  const postButton = getById('create-post-container').querySelector('button');
  postButton.addEventListener('click', createPost);
});

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
      postInput.value = ''; // clear the input after posting
    } else {
      alert(data.message || 'Failed to create the post.');
    }
  } catch (err) {
    error('Error creating post:', err);
    alert('Error creating post. Please try again later.');
  }
}

async function fetchPopularHashtags() {
  try {
    const response = await fetch('/user/community/posts/popular');
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
      label.innerHTML = `
        <input type="checkbox" class="hashtag-filter" value="${hashtag.hashtag}" />
        #${hashtag.hashtag} (${hashtag.count})
      `;
      hashtagsContainer.appendChild(label);
    });
  } catch (err) {
    error('Error fetching popular hashtags:', err);
  }
}

async function fetchPosts() {
  try {
    const response = await fetch('/user/community/posts'); // Request posts without any filter
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
    postElement.innerHTML = `
      <div class="post-header">
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

    // Append the post element to the feed
    postFeed.appendChild(postElement);

    // Attach event listeners
    // const likeButton = postElement.querySelector('.like-action');
    // const commentButton = postElement.querySelector('.comment-action');
    // const postCommentButton = postElement.querySelector('.post-comment');

    // likeButton.addEventListener('click', handleLikePost);
    // commentButton.addEventListener('click', toggleCommentBox);
    // postCommentButton.addEventListener('click', addComment);
  });
}

function formatDate(dateString) {
  const date = new Date(dateString);
  const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
  return date.toLocaleDateString('en-US', options);
}
