const mongoose = require('mongoose');
const Event = require('./Event');

// define the schema for Tournament
const tournamentSchema = new mongoose.Schema(
  {
    tournamentFee: {
      type: Number,
      default: null
    },
    tournamentCategories: [
      {
        name: {
          type: String,
          required: true
        },
        participantLimit: {
          type: Number,
          required: true
        }
      }
    ],
    bracket: {
      type: [
        {
          round: {
            type: String, // e.g., "Quarterfinals", "Semifinals", "Finals"
            required: true
          },
          matchups: [
            {
              participants: [
                {
                  name: {
                    type: String,
                    required: true
                  },
                  score: {
                    type: Number,
                    default: 0
                  },
                  userId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'User'
                  }
                }
              ],
              winner: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User'
              }
            }
          ]
        }
      ],
      default: []
    },
    results: {
      type: [
        {
          categoryId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Category'
          },
          scores: [
            {
              participantId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User'
              },
              score: Number,
              award: String
            }
          ]
        }
      ],
      default: []
    }
  },

  {
    timestamps: true,
    strict: 'throw'
  }
);

//tournament model, inheriting from Event
const Tournament = Event.discriminator('Tournament', tournamentSchema);

module.exports = Tournament;
