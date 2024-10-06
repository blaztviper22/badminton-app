const { verifySchema } = require('../validation/userVerifyValidatorSchema');
const { registrationSchema } = require('../validation/userRegValidatorSchema');
const { loginSchema } = require('../validation/loginValidatorSchema');
const { resetPasswordSchema } = require('../validation/resetPassValidatorSchema');
const { forgotPasswordSchema } = require('../validation/forgotPassValidatorSchema');

/**
 * Middleware to validate user verification input.
 */
const validateVerify = (req, res, next) => {
  const { error } = verifySchema.validate(req.body, { abortEarly: false });

  if (error) {
    return res.status(400).json({
      errors: error.details.map((err) => ({
        message: err.message,
        path: err.path[0]
      }))
    });
  }
  next();
};

/**
 * Middleware to validate user registration input.
 */
const validateRegistration = (req, res, next) => {
  const { error } = registrationSchema.validate(req.body, { abortEarly: false });

  if (error) {
    return res.status(400).json({
      errors: error.details.map((err) => ({
        message: err.message,
        path: err.path[0]
      }))
    });
  }
  next();
};

/**
 * Middleware to validate user login input.
 */
const validateLogin = (req, res, next) => {
  const { error } = loginSchema.validate(req.body, { abortEarly: false });

  if (error) {
    return res.status(400).json({
      errors: error.details.map((err) => ({
        message: err.message,
        path: err.path[0]
      }))
    });
  }
  next();
};
/**
 * Middleware to validate forgot password input.
 */
const validateForgotPassword = (req, res, next) => {
  const { error } = forgotPasswordSchema.validate(req.body, { abortEarly: false });

  if (error) {
    return res.status(400).json({
      errors: error.details.map((err) => ({
        message: err.message,
        path: err.path[0]
      }))
    });
  }
  next();
};

/**
 * Middleware to validate reset password input.
 */
const validateResetPassword = (req, res, next) => {
  const { error } = resetPasswordSchema.validate(req.body, { abortEarly: false });

  if (error) {
    return res.status(400).json({
      errors: error.details.map((err) => ({
        message: err.message,
        path: err.path[0]
      }))
    });
  }
  next();
};

// Export all validation middleware functions
module.exports = {
  validateVerify,
  validateRegistration,
  validateLogin,
  validateForgotPassword,
  validateResetPassword
};
