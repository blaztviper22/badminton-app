const jwt = require('jsonwebtoken');
const User = require('../models/User');
const createError = require('http-errors');
const config = require('config');
const { isTokenBlacklisted } = require('../utils/blackListUtils');

const verifyToken = async (req, res, next) => {
  try {
    // Get the session cookie
    const authHeader = req.headers['cookie'];

    // If neither are present, send an Unauthorized error
    if (!authHeader) return next(createError(401, 'Unauthorized'));

    let token;

    // If it's from the cookie, extract the token from the correct cookie name
    if (req.headers['cookie']) {
      // Split the cookie string into key-value pairs
      const cookies = authHeader.split(';').reduce((acc, cookie) => {
        const [name, value] = cookie.trim().split('=');
        acc[name] = value;
        return acc;
      }, {});

      token = cookies['accessToken'];
    }

    // check if token is blacklisted
    const blacklistedToken = await isTokenBlacklisted(token, 'access');
    if (blacklistedToken) {
      return next(createError(401, 'This session has been revoked. Please log in again.'));
    }

    jwt.verify(token, config.jwtSecret, async (err, decoded) => {
      if (err) {
        return next(createError(401, 'This session has expired. Please Login.'));
      }

      const { id } = decoded; // Get user id from the decoded token
      const user = await User.findById(id); // Find user by that `id`

      if (!user) {
        return next(createError(404, 'User not found.'));
      }

      req.user = user.toJSON();
      next();
    });
  } catch (err) {
    console.error('Error occurred during token verification:', err);
    return next(createError(500, 'Internal Server Error'));
  }
};

module.exports = verifyToken;
