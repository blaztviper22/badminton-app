const Joi = require('joi');

// base schema for common fields
const baseAnnouncementSchema = Joi.object({
  heading: Joi.string().min(5).required().messages({
    'string.empty': 'Heading is required',
    'string.min': 'Heading must be at least 5 characters long'
  }),
  details: Joi.string().min(10).required().messages({
    'string.empty': 'Details are required',
    'string.min': 'Details must be at least 10 characters long'
  }),
  images: Joi.array().items(Joi.string()).optional()
});

// event-specific schema that extends the base schema
const validateEvent = baseAnnouncementSchema.append({
  startDate: Joi.date().required().messages({
    'date.base': 'Start date is required',
    'date.empty': 'Start date is required'
  }),
  endDate: Joi.date().required().greater(Joi.ref('startDate')).messages({
    'date.base': 'End date is required',
    'date.empty': 'End date is required',
    'date.greater': 'End date must be greater than start date'
  }),
  reservationFee: Joi.number().optional().default(null),
  eventFee: Joi.number().optional().default(null),
  participantLimit: Joi.number().required().min(1).messages({
    'number.base': 'Participant limit is required',
    'number.empty': 'Participant limit must be at least 1'
  }),
  participants: Joi.array().items(Joi.string()).optional().default([])
});

// tournament-specific validation schema
const validateTournament = validateEvent.append({
  tournamentFee: Joi.number().optional().default(null),
  tournamentCategories: Joi.array()
    .items(
      Joi.object({
        name: Joi.string().required().messages({
          'string.empty': 'Category name is required'
        }),
        participantLimit: Joi.number().required().min(1).messages({
          'number.base': 'Participant limit for category is required',
          'number.empty': 'Participant limit for category must be at least 1'
        })
      })
    )
    .required()
    .messages({
      'array.base': 'Tournament categories are required'
    }),
  bracket: Joi.array()
    .items(
      Joi.object({
        round: Joi.string().required().messages({
          'string.empty': 'Round name is required'
        }),
        matchups: Joi.array()
          .items(
            Joi.object({
              participants: Joi.array()
                .items(
                  Joi.object({
                    name: Joi.string().required().messages({
                      'string.empty': 'Participant name is required'
                    }),
                    score: Joi.number().optional().default(0),
                    userId: Joi.string().optional()
                  })
                )
                .required()
                .messages({
                  'array.base': 'Participants are required'
                }),
              winner: Joi.string().optional()
            })
          )
          .optional()
          .default([])
      })
    )
    .optional()
    .default([])
});

module.exports = { validateAnnouncement: baseAnnouncementSchema, validateEvent };
