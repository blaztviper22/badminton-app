import '../../../css/components/navBarUser.css';
import '../../../css/components/preloader.css';
import '../../../css/pages/community/community.css';
import { startSessionChecks, validateSessionAndNavigate } from '../../../utils/sessionUtils.js';
import { setupLogoutListener } from '../../global/logout.js';

let posts = [];  // Array to store post data
let filterActive = false;  // Variable to keep track of filter status

// Function to render all posts in both the post feed and the manage posts section
function renderPosts() {
    const postFeed = document.getElementById('post-feed');
    const managePosts = document.getElementById('manage-posts');
    const sideBox2 = document.getElementById('side-box2');

    // Clear current content
    postFeed.innerHTML = `<div class="create-post">
        <div class="profile-pic"><i class="fas fa-user"></i></div>
        <input type="text" id="post-input" placeholder="What's on your mind?">
        <button id="create-post-button">Post</button>
    </div>`;
    managePosts.innerHTML = '';

    // Filter posts if the filter is active
    const displayedPosts = filterActive ? posts.filter(post => post.content.includes("filterKeyword")) : posts;

    if (displayedPosts.length === 0) {
        // Display placeholder if there are no posts
        const placeholderPostFeed = document.createElement('div');
        placeholderPostFeed.classList.add('placeholder');
        placeholderPostFeed.textContent = "No posts to display.";
        postFeed.appendChild(placeholderPostFeed);

        const placeholderManagePosts = document.createElement('div');
        placeholderManagePosts.classList.add('placeholder');
        placeholderManagePosts.textContent = "No posts to manage.";
        managePosts.appendChild(placeholderManagePosts);
    } else {
        // Loop through displayed posts array to create elements for each post
        displayedPosts.forEach((post, index) => {
            // Main post feed entry
            const postElement = document.createElement('div');
            postElement.classList.add('post');
            postElement.innerHTML = `
                <div class="post-header">
                    <div class="profile-pic"><i class="fas fa-user"></i></div>
                    <div class="name-date">
                        <div class="name">${post.name}</div>
                        <div class="date">${post.date}</div>
                    </div>
                    <div class="options"><i class="fas fa-ellipsis-v"></i></div>
                </div>
                <div class="post-content">${post.content}</div>
                <div class="post-footer">
                    <span class="action" onclick="likePost(${index})"><i class="fas fa-thumbs-up"></i> Like (${post.likes})</span>
                    <span class="action" onclick="toggleCommentBox(${index})"><i class="fas fa-comment"></i> Comment</span>
                    <div id="comment-box-${index}" class="comment-box" style="display: none;">
                        <textarea id="comment-input-${index}" placeholder="Add a comment..."></textarea>
                        <button onclick="addComment(${index})">Post Comment</button>
                    </div>
                </div>
            `;
            postFeed.appendChild(postElement);

            // Manage posts entry
            const managePostElement = document.createElement('div');
            managePostElement.classList.add('post-list');
            managePostElement.innerHTML = `
                <div class="post-info">
                    <p>${post.date}</p>
                    <p>${post.content.slice(0, 50)}...</p>
                    <p>Likes: ${post.likes}</p>
                </div>
                <div class="post-actions">
                    <button class="edit-btn" data-index="${index}">Edit</button>
                    <button class="delete-btn" data-index="${index}">Delete</button>
                </div>
            `;
            managePosts.appendChild(managePostElement);
        });

        // Attach event listeners to buttons after rendering
        const editButtons = document.querySelectorAll('.edit-btn');
        const deleteButtons = document.querySelectorAll('.delete-btn');

        editButtons.forEach(button => {
            button.addEventListener('click', () => {
                const index = button.getAttribute('data-index');
                editPost(index);
            });
        });

        deleteButtons.forEach(button => {
            button.addEventListener('click', () => {
                const index = button.getAttribute('data-index');
                deletePost(index);
            });
        });
    }

    // Update the total like count in the side-box2 dynamically
    updateLikeCountDisplay();

    // Add event listener for the create post button
    const createPostButton = document.getElementById('create-post-button');
    createPostButton.addEventListener('click', createPost);
}

// Function to create a new post
async function createPost() {
    const input = document.getElementById('post-input');
    const content = input.value.trim();
    if (!content) return;

    /*const newPost = {
        name: "Your Name",  // Placeholder name, could replace with user info if available
        content: content,
        date: new Date().toLocaleString(),
        likes: 0,  // Ensure the new post starts with 0 likes
        comments: []  // Initialize with an empty comment array
    };*/

    /*posts.unshift(newPost);  // Add new post to the beginning of the array
    input.value = '';  // Clear the input field
    renderPosts();  // Re-render posts*/

    try {
        // Send the new post to the backend
        const response = await fetch('/user/post', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ content })
        });
  
        console.log(response)
        if (!response.ok) {
          throw new Error('Failed to create post');
        }
  
        // Clear the content field
        input.value = '';
  
        // Fetch and update the post list after posting
        /*fetchPosts();*/
      } catch (error) {
        console.error('Error:', error);
      }
}

// Function to delete a post
function deletePost(index) {
    posts.splice(index, 1);  // Remove post from the array
    renderPosts();  // Re-render posts
}

// Function to edit a post (simple content change, could be enhanced)
function editPost(index) {
    const newContent = prompt("Edit your post:", posts[index].content);
    if (newContent) {
        posts[index].content = newContent.trim();
        renderPosts();  // Re-render posts
    }
}

// Function to toggle filter (e.g., show posts containing a specific keyword)
function toggleFilter() {
    filterActive = !filterActive;  // Toggle filter status
    renderPosts();  // Re-render posts with the filter applied
}

// Function to sort posts (e.g., by date or content)
function sortData(criteria) {
    if (criteria === 'date') {
        posts.sort((a, b) => new Date(b.date) - new Date(a.date));  // Sort by date (newest first)
    } else if (criteria === 'content') {
        posts.sort((a, b) => a.content.localeCompare(b.content));  // Sort alphabetically by content
    }
    renderPosts();  // Re-render posts with the sorted order
}

// Function to like a post
function likePost(index) {
    posts[index].likes += 1;  // Increment the like count for the post
    renderPosts();  // Re-render posts to update the like count
}

// Function to update the like count in the side-box2
function updateLikeCountDisplay() {
    const totalLikes = posts.reduce((total, post) => total + post.likes, 0);  // Sum up all likes
    const likeCountElement = document.getElementById('like-count');
    if (likeCountElement) {
        likeCountElement.textContent = `Total Likes: ${totalLikes}`;  // Update the display
    }
}

// Function to show/hide comment box for a post
function toggleCommentBox(index) {
    const commentBox = document.getElementById(`comment-box-${index}`);
    if (commentBox) {
        commentBox.style.display = commentBox.style.display === 'none' ? 'block' : 'none';
    }
}

// Function to add a comment to a post
function addComment(index) {
    const commentInput = document.getElementById(`comment-input-${index}`);
    const commentText = commentInput.value.trim();
    if (commentText) {
        posts[index].comments.push(commentText);  // Add the comment to the post
        commentInput.value = '';  // Clear the input field
        renderPosts();  // Re-render posts to display the new comment
    }
}

// Initial rendering of posts
document.addEventListener('DOMContentLoaded', () => {
    startSessionChecks();
    setupLogoutListener();
    renderPosts();
});

export { toggleFilter, sortData, createPost, deletePost, editPost, likePost, addComment };
