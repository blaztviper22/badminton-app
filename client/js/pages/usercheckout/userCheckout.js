import { io } from 'socket.io-client';
import '../../../css/components/navBarUser.css';
import '../../../css/components/preloader.css';
import '../../../css/pages/usercheckout/userCheckout.css';
import { startSessionChecks, validateSessionAndNavigate } from '../../../utils/sessionUtils.js';
import '../../components/navBarUser.js';
import { setupLogoutListener } from '../../global/logout.js';

setupLogoutListener();
startSessionChecks();

document.addEventListener('DOMContentLoaded', () => {
  flatpickr('#pickup-date', {
    altInput: true,
    altFormat: 'F j, Y',
    dateFormat: 'Y-m-d',
    minDate: 'today'
  });

  const backButton = document.getElementById('back-to-shop');
  backButton.addEventListener('click', () => {
    window.location.href = 'shop.html';
  });

  function updateCart() {
    const cartItems = JSON.parse(localStorage.getItem('cart')) || [];
    const cartItemsElement = document.getElementById('cart-items');
    const totalPriceElement = document.getElementById('total-price');
    const reservationPercentElement = document.getElementById('reservation-percent');
    const totalReservationElement = document.getElementById('total-reservation');
    let totalPrice = 0;

    const shops = {};

    cartItems.forEach((item) => {
      if (!shops[item.shopName]) {
        shops[item.shopName] = [];
      }
      shops[item.shopName].push(item);
    });

    cartItemsElement.innerHTML = '';

    Object.keys(shops).forEach((shopName) => {
      const table = document.createElement('table');
      table.classList.add('shop-table');

      table.innerHTML = `
                <thead>
                    <tr>
                        <th colspan="3">${shopName}</th>
                    </tr>
                </thead>
                <tbody></tbody>
            `;
      const tbody = table.querySelector('tbody');

      let shopTotalPrice = 0;
      shops[shopName].forEach((item, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
                    <td><img src="${item.image}" alt="${item.name}" width="50" height="50"></td>
                    <td>${item.name} - ₱${item.price} x <span class="quantity-value">${item.quantity}</span></td>
                    <td class="quantity">
                        <button class="decrease">-</button>
                        <span class="quantity-value">${item.quantity}</span>
                        <button class="increase">+</button>
                    </td>
                `;
        tbody.appendChild(row);

        shopTotalPrice += item.price * item.quantity;

        // Remove item if quantity is 0
        if (item.quantity === 0) {
          cartItems.splice(index, 1); // Remove item from cartItems
        }
      });

      cartItemsElement.appendChild(table);
      totalPrice += shopTotalPrice;
    });

    // Update the total price and reservation fee
    totalPriceElement.innerText = `Total Price: ₱${totalPrice}`;
    const reservationPercent = (totalPrice * 0.3).toFixed(2);
    reservationPercentElement.innerText = `Reservation Percentage: 30%`;
    totalReservationElement.innerText = `Total Reservation Fee: ₱${reservationPercent}`;

    // Save updated cartItems back to localStorage
    localStorage.setItem('cart', JSON.stringify(cartItems));
  }

  document.getElementById('checkout-form').addEventListener('submit', function (event) {
    event.preventDefault();
    const pickupDate = document.getElementById('pickup-date').value;
    if (pickupDate) {
      const cartItems = JSON.parse(localStorage.getItem('cart')) || [];
      const totalPrice = cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
      const orderDate = new Date().toLocaleDateString();
      const order = {
        orderDate,
        items: cartItems,
        totalPrice,
        pickupDate
      };

      const orderHistory = JSON.parse(localStorage.getItem('orderHistory')) || [];
      orderHistory.push(order);
      localStorage.setItem('orderHistory', JSON.stringify(orderHistory));

      localStorage.removeItem('cart');
      alert(`Order placed successfully! Pickup Date: ${pickupDate}`);
      window.location.href = 'orderlist.html';
    } else {
      alert('Please select a valid pickup date.');
    }
  });

  document.addEventListener('click', (event) => {
    if (event.target.classList.contains('increase') || event.target.classList.contains('decrease')) {
      const quantityValue = event.target.parentNode.querySelector('.quantity-value');
      const itemIndex = [...document.querySelectorAll('.quantity')].indexOf(event.target.parentNode);
      const cartItems = JSON.parse(localStorage.getItem('cart')) || [];
      const cartItem = cartItems[itemIndex];

      if (event.target.classList.contains('increase')) {
        cartItem.quantity++;
      } else if (event.target.classList.contains('decrease')) {
        cartItem.quantity--;
      }

      quantityValue.innerText = cartItem.quantity;

      // Check if the quantity is 0 and remove the item
      if (cartItem.quantity <= 0) {
        cartItems.splice(itemIndex, 1); // Remove item from cartItems
      }

      localStorage.setItem('cart', JSON.stringify(cartItems));
      updateCart();
    }
  });

  updateCart();
});
