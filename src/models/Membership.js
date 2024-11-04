const mongoose = require('mongoose');
const Announcement = require('./Announcement');

const membershipSchema = new mongoose.Schema(
  {
    reservationFee: {
      type: Number,
      required: false,
      default: null
    },
    membershipFee: {
      type: Number,
      required: false,
      default: null
    },
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    ]
  },
  {
    timestamps: true,
    strict: 'throw'
  }
);

// membership model using the announcement model as a base
const Membership = Announcement.discriminator('Membership', membershipSchema);

module.exports = Membership;
