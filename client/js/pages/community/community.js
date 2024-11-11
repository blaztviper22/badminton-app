import '../../../css/components/navBarUser.css';
import '../../../css/components/preloader.css';
import '../../../css/pages/community/community.css';
import { startSessionChecks, validateSessionAndNavigate } from '../../../utils/sessionUtils.js';
import { setupLogoutListener } from '../../global/logout.js';

let posts = [];  
let filterActive = false;  

async function fetchPosts() {
    try {
        const response = await fetch('/user/community/posts', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!response.ok) throw new Error('Failed to fetch posts');
        const data = await response.json();
        posts = data.posts || [];
        renderPosts();
    } catch (error) {
        console.error('Error fetching posts:', error);
    }
}

function renderPosts() {
    const postFeed = document.getElementById('post-feed');
    const managePosts = document.getElementById('manage-posts');

    postFeed.innerHTML = `<div class="create-post">
        <div class="profile-pic"><i class="fas fa-user"></i></div>
        <input type="text" id="post-input" placeholder="What's on your mind?">
        <button id="create-post-button">Post</button>
    </div>`;
    managePosts.innerHTML = '';

    const displayedPosts = filterActive ? posts.filter(post => post.content.includes("filterKeyword")) : posts;

    if (displayedPosts.length === 0) {
        postFeed.innerHTML += `<div class="placeholder">No posts to display.</div>`;
        managePosts.innerHTML += `<div class="placeholder">No posts to manage.</div>`;
    } else {
        displayedPosts.forEach((post, index) => {
            postFeed.innerHTML += `<div class="post">
                <div class="post-header">
                    <div class="profile-pic"><i class="fas fa-user"></i></div>
                    <div class="name-date">
                        <div class="name">${post.userId.username}</div>
                        <div class="date">${post.date}</div>
                    </div>
                    <div class="options"><i class="fas fa-ellipsis-v"></i></div>
                </div>
                <div class="post-content">${post.content}</div>
                <div class="post-footer">
                    <span class="action ${post.liked ? 'liked' : ''}" onclick="likePost(${index})">
                        <i class="fas fa-thumbs-up"></i> Like (${post.likes})
                    </span>
                    <span class="action" onclick="toggleCommentBox(${index})"><i class="fas fa-comment"></i> Comment</span>
                    <div id="comment-box-${index}" class="comment-box" style="display: none;">
                        <textarea id="comment-input-${index}" placeholder="Add a comment..."></textarea>
                        <button onclick="addComment(${index})">Post Comment</button>
                    </div>
                </div>
            </div>`;

            managePosts.innerHTML += `<div class="post-list">
                <div class="post-info">
                    <p>${post.date}</p>
                    <p>${post.content.slice(0, 50)}...</p>
                    <p>Likes: ${post.likes}</p>
                </div>
                <div class="post-actions">
                    <button class="edit-btn" data-index="${index}">Edit</button>
                    <button class="delete-btn" data-index="${index}">Delete</button>
                </div>
            </div>`;
        });

        document.querySelectorAll('.edit-btn').forEach(button => button.addEventListener('click', () => editPost(button.getAttribute('data-index'))));
        document.querySelectorAll('.delete-btn').forEach(button => button.addEventListener('click', () => deletePost(button.getAttribute('data-index'))));
    }

    updateLikeCountDisplay();
    document.getElementById('create-post-button').addEventListener('click', createPost);
}

async function createPost() {
    const content = document.getElementById('post-input').value.trim();
    if (!content) return;

    try {
        const response = await fetch('/user/community/post', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ content })
        });

        if (response.ok) {
            document.getElementById('post-input').value = '';
            fetchPosts();
        } else throw new Error('Failed to create post');
    } catch (error) {
        console.error('Error creating post:', error);
    }
}

async function deletePost(index) {
    const postId = posts[index]._id;
    try {
        const response = await fetch(`/user/community/post/${postId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (response.ok) fetchPosts();
        else throw new Error('Failed to delete post');
    } catch (error) {
        console.error('Error deleting post:', error);
    }
}

async function editPost(index) {
    const postId = posts[index]._id;
    const newContent = prompt("Edit your post:", posts[index].content).trim();

    if (newContent) {
        try {
            const response = await fetch(`/user/community/post/${postId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ content: newContent })
            });

            if (response.ok) fetchPosts();
            else throw new Error('Failed to edit post');
        } catch (error) {
            console.error('Error editing post:', error);
        }
    }
}

startSessionChecks();
validateSessionAndNavigate();
fetchPosts();
