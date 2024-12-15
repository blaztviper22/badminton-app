const mongoose = require('mongoose');

const membershipSubscriptionSchema = new mongoose.Schema({
  cardName: {
    type: String,
    required: true
  },
  cardDescription: {
    type: String,
    required: true
  },
  cardPrice: {
    type: Number,
    required: true
  },
  imageUrl: {
    type: String,
    required: true
  },
  // Add to the subscribers array schema
  subscribers: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    dateSubscribed: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['active', 'revoked'],
      default: 'active'
    },
    paymentStatus: {
      type: String,
      enum: ['paid', 'unpaid'],
      default: 'unpaid'
    },
    transactionId: String,
    payerEmail: String
  }],
  court: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Court',
    required: true
  },
  postedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const MembershipSubscription = mongoose.model('MembershipStorage', membershipSubscriptionSchema);
module.exports = MembershipSubscription;