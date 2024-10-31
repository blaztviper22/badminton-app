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

module.exports = { validateAnnouncement: baseAnnouncementSchema, validateEvent };
