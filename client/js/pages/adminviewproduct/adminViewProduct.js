import '../../../css/components/preloader.css';
import '../../../css/components/sideNavAdmin.css';
import '../../../css/pages/adminviewproduct/adminviewProduct.css';
import { startSessionChecks } from '../../../utils/sessionUtils.js';
import '../../components/sideNavAdmin.js';

const addProductButton = document.getElementById("add-product-btn");
const productList = document.getElementById("product-list");

// Modal setup
const modal = document.getElementById("editModal");
const closeButton = document.getElementById("close-edit-modal");
const closeModal = document.querySelector(".close");
const updateProductButton = document.getElementById("update-product-btn");

let currentProductCard = null;

addProductButton.addEventListener("click", function() {
    const productName = document.getElementById("product-name").value;
    const productPrice = document.getElementById("product-price").value;
    const productCategory = document.getElementById("product-category").value;
    const productImage = document.getElementById("product-image").files[0];

    if (!productName || !productPrice || !productImage) {
        alert("Please fill all the fields.");
        return;
    }

    const productCard = document.createElement("div");
    const reader = new FileReader();

    reader.onload = function(event) {
        const productCardContent = `
            <div class="product-card">
                <img src="${event.target.result}" alt="${productName}">
                <h3>${productName} - ${productCategory}</h3>
                <div class="price">₱${productPrice}</div>
                <div class="action-buttons">
                    <button class="edit-btn"><i class="fas fa-edit"></i></button>
                    <button class="delete-btn"><i class="fas fa-trash"></i></button>
                </div>
            </div>
        `;
        productCard.innerHTML = productCardContent;
        productList.appendChild(productCard);

        const deleteButton = productCard.querySelector(".delete-btn");
        deleteButton.addEventListener("click", function() {
            productCard.remove();
        });

        const editButton = productCard.querySelector(".edit-btn");
        editButton.addEventListener("click", function() {
            currentProductCard = productCard; // Set the current card to edit
            openEditModal(productName, productPrice, productCategory, event.target.result);
        });
    }

    reader.readAsDataURL(productImage);
});

function openEditModal(name, price, category, imageSrc) {
    document.getElementById("edit-product-name").value = name;
    document.getElementById("edit-product-price").value = price;
    document.getElementById("edit-product-category").value = category;
    document.getElementById("edit-product-image").value = ""; // Reset image field

    modal.style.display = "block"; // Show the modal
}

closeModal.onclick = function() {
    modal.style.display = "none"; // Close the modal
};

window.onclick = function(event) {
    if (event.target == modal) {
        modal.style.display = "none"; // Close the modal when clicking outside
    }
};

updateProductButton.addEventListener("click", function() {
    const updatedName = document.getElementById("edit-product-name").value;
    const updatedPrice = document.getElementById("edit-product-price").value;
    const updatedCategory = document.getElementById("edit-product-category").value;
    const updatedImage = document.getElementById("edit-product-image").files[0];

    if (currentProductCard && updatedName && updatedPrice && updatedCategory) {
        // Update the product card with new details
        currentProductCard.querySelector("h3").innerText = `${updatedName} - ${updatedCategory}`;
        currentProductCard.querySelector(".price").innerText = `₱${updatedPrice}`;

        // Update image if changed
        if (updatedImage) {
            const reader = new FileReader();
            reader.onload = function(event) {
                currentProductCard.querySelector("img").src = event.target.result;
            };
            reader.readAsDataURL(updatedImage);
        }

        modal.style.display = "none"; // Close the modal
    }
                closeModal.onclick = function() {
        modal.style.display = "none"; // Close the modal
    };
    window.onclick = function(event) {
        if (event.target == modal) {
            modal.style.display = "none"; // Close the modal when clicking outside
        }
    };
    closeButton.onclick = function() {
modal.style.display = "none";
};


});