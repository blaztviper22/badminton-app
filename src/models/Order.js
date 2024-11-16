const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // User who placed the order
      required: true,
    },
    products: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Product', // The product in the order
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
        },
        price: {
          type: Number,
          required: true,
        },
      },
    ],
    totalPrice: {
      type: Number,
      required: true,
    },
    pickupStatus: {
      type: String,
      enum: ['pending', 'completed', 'cancelled'], 
      default: 'pending',
    },
    pickupSchedule: {
      type: Date, 
      required: true,
    },
    courtOwner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CourtOwner', // Court owner who posted the product
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    strict: 'throw',
  }
);

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
