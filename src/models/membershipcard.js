const mongoose = require('mongoose');

const cardSchema = new mongoose.Schema(
  {
    cardName: {
      type: String,
      required: true,
      trim: true,
      minlength: [3, 'Card name must be at least 3 characters long'],
      maxlength: [100, 'Card name cannot exceed 100 characters']
    },
    cardDescription: {
      type: String,
      required: true,
      minlength: [10, 'Card description must be at least 10 characters long'],
      maxlength: [500, 'Card description cannot exceed 500 characters']
    },
    cardPrice: {
      type: Number,
      required: true,
      min: [1, 'Price must be at least ₱1'],
      max: [10000, 'Price cannot exceed ₱10,000']
    },
    imageUrl: {
      type: String, // URL of the image
      required: false
    },
    subscribers: [
      {
        username: {
          type: String,
          required: true,
          trim: true,
          minlength: [3, 'Username must be at least 3 characters long'],
          maxlength: [50, 'Username cannot exceed 50 characters']
        },
        subscriptionDate: {
          type: Date,
          default: Date.now
        }
      }
    ]
  },
  {
    timestamps: true,
    strict: 'throw'
  }
);

// Card Model
const Card = mongoose.model('Card', cardSchema);

module.exports = Card;
