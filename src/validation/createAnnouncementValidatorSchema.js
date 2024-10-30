const Joi = require('joi');

const validateAnnouncement = Joi.object({
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

module.exports = { validateAnnouncement };
