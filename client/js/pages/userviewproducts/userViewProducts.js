import { io } from 'socket.io-client';
import '../../../css/components/navBarUser.css';
import '../../../css/components/preloader.css';
import '../../../css/pages/userviewproducts/userViewProducts.css';
import { startSessionChecks, validateSessionAndNavigate } from '../../../utils/sessionUtils.js';
import { setupLogoutListener } from '../../global/logout.js';

let cart = [];
let totalPrice = 0;

const cartIcon = document.getElementById('cart-icon');
const cartItemCount = document.getElementById('cart-item-count');
const cartContainer = document.getElementById('cart');
const closeCartBtn = document.getElementById('close-cart');
const clearCartBtn = document.getElementById('clear-cart');
const totalElement = document.getElementById('total-price');
const cartItemsElement = document.getElementById('cart-items');
const productList = document.getElementById('product-list');
const checkoutBtn = document.getElementById('checkout');
const searchBar = document.getElementById('search-bar');
const categoryFilter = document.getElementById('category-filter');
const shopFilter = document.getElementById('shop-filter');

// Show/Hide cart
cartIcon.addEventListener('click', () => {
cartContainer.classList.toggle('open');
updateCart();
});

closeCartBtn.addEventListener('click', () => {
cartContainer.classList.remove('open');
});

// Add item to cart (only once)
productList.addEventListener('click', (e) => {
if (e.target.tagName === 'BUTTON') {
const productName = e.target.getAttribute('data-name');
const productPrice = parseInt(e.target.getAttribute('data-price'));
const productImage = e.target.getAttribute('data-image');
const productShop = e.target.closest('.product-card').getAttribute('data-shop');

// Check if item already exists in cart
const existingItem = cart.find(item => item.name === productName);
if (existingItem) {
    existingItem.quantity += 1;
} else {
    cart.push({ name: productName, price: productPrice, quantity: 1, image: productImage, shopName: productShop });
}

// Save and update cart
saveCartToLocalStorage();
updateCart();

// Show a message after adding to the cart
showPopupMessage(`${productName} has been added to the cart!`);
}
});

// Clear Cart
clearCartBtn.addEventListener('click', () => {
cart = [];
totalPrice = 0;
saveCartToLocalStorage();
updateCart();
});

// Checkout
checkoutBtn.addEventListener('click', () => {
if (cart.length > 0) {
window.location.href = '/user/usercheckout';
} else {
alert("Your cart is empty!");
}
});


// Save Cart to LocalStorage
function saveCartToLocalStorage() {
localStorage.setItem('cart', JSON.stringify(cart));
}

// Load Cart from LocalStorage
function loadCartFromLocalStorage() {
const savedCart = localStorage.getItem('cart');
if (savedCart) {
cart = JSON.parse(savedCart);
updateCart();
}
}

// Handle increase and decrease buttons
cartItemsElement.addEventListener('click', (e) => {
if (e.target.classList.contains('increase-btn')) {
const itemName = e.target.getAttribute('data-name');
const item = cart.find(item => item.name === itemName);
if (item) {
    item.quantity += 1;
    saveCartToLocalStorage();
    updateCart();
}
} else if (e.target.classList.contains('decrease-btn')) {
const itemName = e.target.getAttribute('data-name');
const item = cart.find(item => item.name === itemName);
if (item) {
    item.quantity -= 1;
    if (item.quantity <= 0) {
        cart = cart.filter(item => item.name !== itemName);
    }
    saveCartToLocalStorage();
    updateCart();
}
}
});

// Load Cart on Page Load
loadCartFromLocalStorage();

// Filter Products based on Search and Filters
function filterProducts() {
const searchQuery = searchBar.value.toLowerCase();
const selectedCategory = categoryFilter.value;
const selectedShop = shopFilter.value;

Array.from(productList.children).forEach(product => {
const productName = product.querySelector('h3').innerText.toLowerCase();
const productCategory = product.getAttribute('data-category');
const productShop = product.getAttribute('data-shop');

const matchesSearch = productName.includes(searchQuery);
const matchesCategory = selectedCategory ? productCategory === selectedCategory : true;
const matchesShop = selectedShop ? productShop === selectedShop : true;

if (matchesSearch && matchesCategory && matchesShop) {
    product.style.display = 'block';
} else {
    product.style.display = 'none';
}
});
}

// Event listeners for filters
searchBar.addEventListener('input', filterProducts);
categoryFilter.addEventListener('change', filterProducts);
shopFilter.addEventListener('change', filterProducts);

// Pop-up Message
function showPopupMessage(message) {
const popup = document.createElement('div');
popup.classList.add('popup-message');
popup.innerText = message;

document.body.appendChild(popup);

// Show the pop-up
setTimeout(() => {
popup.classList.add('show');
}, 10);

// Hide and remove the pop-up after 3 seconds
setTimeout(() => {
popup.classList.remove('show');
setTimeout(() => popup.remove(), 500);
}, 3000);
}

// Clear the search input and filters when clicking on the clear search button
document.getElementById('clear-search').addEventListener('click', () => {
searchBar.value = '';
categoryFilter.value = '';
shopFilter.value = '';
filterProducts();
});