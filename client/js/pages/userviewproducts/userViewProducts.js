import { io } from 'socket.io-client';
import '../../../css/components/navBarUser.css';
import '../../../css/components/preloader.css';
import '../../../css/pages/userviewproducts/userViewProducts.css';
import { startSessionChecks, validateSessionAndNavigate } from '../../../utils/sessionUtils.js';
import '../../components/navBarUser.js';
import { setupLogoutListener } from '../../global/logout.js';

startSessionChecks();

setupLogoutListener();

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

let cart = JSON.parse(localStorage.getItem('cart')) || [];

// fetch products from the server
async function fetchProducts(withPreloader = true) {
  try {
    const searchQuery = searchBar.value.toLowerCase();
    const selectedCategory = categoryFilter.value;
    // get the selected shop from localStorage if set
    const selectedShop = localStorage.getItem('selectedShop') || shopFilter.value;

    const url = `/user/get-products?search=${searchQuery}&category=${selectedCategory}&shopName=${selectedShop}`;
    const response = await fetch(url, {
      withPreloader
    });
    const data = await response.json();

    if (data.status === 'success') {
      renderProducts(data.data);
    } else {
      console.error('Failed to load products');
    }
  } catch (error) {
    console.error('Error fetching products:', error);
  }
}

// fetch products from the server
async function getShopFilter(withPreloader = true) {
  try {
    const url = `/user/get-products`;
    const response = await fetch(url, {
      withPreloader
    });
    const data = await response.json();

    if (data.status === 'success') {
      updateShopFilter(data.data);
    } else {
      console.error('Failed to load products');
    }
  } catch (error) {
    console.error('Error fetching products:', error);
  }
}

// Render products dynamically
function renderProducts(products) {
  productList.innerHTML = ''; // Clear the product list first
  products.forEach((product) => {
    const productCard = document.createElement('div');
    productCard.classList.add('product-card');
    productCard.setAttribute('data-name', product.name);
    productCard.setAttribute('data-category', product.category);
    productCard.setAttribute('data-shop', product.owner.court.business_name);

    productCard.innerHTML = `
      <img src="${product.image}" alt="${product.name}" />
      <h3>${product.name}</h3>
      <div class="category">Category: ${product.category}</div>
      <div class="shop-name">Shop: ${product.owner.court.business_name}</div>
      <div class="price">₱${product.price}</div>
      <button data-name="${product.name}" data-price="${product.price}" data-image="${product.image}">Add to Cart</button>
    `;

    productList.appendChild(productCard);
  });

  // attach event listener to dynamically generated product cards
  addProductToCartListener();
}

// add item to cart (only once)
function addProductToCartListener() {
  productList.addEventListener('click', (e) => {
    if (e.target.tagName === 'BUTTON') {
      const productName = e.target.getAttribute('data-name');
      const productPrice = parseInt(e.target.getAttribute('data-price'));
      const productImage = e.target.getAttribute('data-image');
      const productShop = e.target.closest('.product-card').getAttribute('data-shop');

      // check if item already exists in cart
      const existingItem = cart.find((item) => item.name === productName);
      if (existingItem) {
        existingItem.quantity += 1;
      } else {
        cart.push({ name: productName, price: productPrice, quantity: 1, image: productImage, shopName: productShop });
        saveCartToLocalStorage();
      }

      console.log(cart);

      // show a message after adding to the cart
      showPopupMessage(`${productName} has been added to the cart!`);
    }
  });
}

function saveCartToLocalStorage() {
  localStorage.setItem('cart', JSON.stringify(cart));
}

// Filter products by updating the selected shop
function filterProducts() {
  fetchProducts(false);
}

document.getElementById('clear-search').addEventListener('click', () => {
  searchBar.value = '';
  categoryFilter.value = '';
  shopFilter.value = '';
  localStorage.removeItem('selectedShop');
  filterProducts();
});

// load products when the page loads
document.addEventListener('DOMContentLoaded', () => {
  fetchProducts();
  getShopFilter();
  // set the shop filter based on localStorage
  const storedShop = localStorage.getItem('selectedShop');
  if (storedShop) {
    shopFilter.value = storedShop; // set the shop filter to the stored value
  }
});

// Event listeners for filters
searchBar.addEventListener('input', filterProducts);
categoryFilter.addEventListener('change', filterProducts);

// update the shop filter and save it in localStorage
shopFilter.addEventListener('change', (event) => {
  const selectedShop = event.target.value;
  // save the selected shop in localStorage
  localStorage.setItem('selectedShop', selectedShop);
  filterProducts();
  // ensure the selected value is retained when fetching products
  shopFilter.value = selectedShop;
});

function updateShopFilter(products) {
  const shopFilter = document.getElementById('shop-filter');
  const uniqueShops = new Set();

  products.forEach((product) => {
    uniqueShops.add(product.owner.court.business_name);
  });

  // clear existing shop filter options
  shopFilter.innerHTML = '<option value="">All Shops</option>';

  // add each unique shop as an option in the filter
  uniqueShops.forEach((shop) => {
    const option = document.createElement('option');
    option.value = shop;
    option.textContent = `${shop}'s Shop`;
    shopFilter.appendChild(option);
  });
}

// pop-up message
function showPopupMessage(message) {
  const popup = document.createElement('div');
  popup.classList.add('popup-message');
  popup.innerText = message;

  document.body.appendChild(popup);

  // show the pop-up
  setTimeout(() => {
    popup.classList.add('show');
  }, 10);

  // hide and remove the pop-up after 3 seconds
  setTimeout(() => {
    popup.classList.remove('show');
    setTimeout(() => popup.remove(), 500);
  }, 3000);
}

// add a listener to open the cart
cartIcon.addEventListener('click', () => {
  cartContainer.classList.toggle('open');
});

// add a listener to close the cart
closeCartBtn.addEventListener('click', () => {
  cartContainer.style.display = 'none';
});

// close the cart if the user clicks outside the cart
document.addEventListener('click', (e) => {
  if (!cartContainer.contains(e.target) && e.target !== cartIcon) {
    cartContainer.style.display = 'none';
  }
});
