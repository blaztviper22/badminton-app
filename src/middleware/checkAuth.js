const jwt = require('jsonwebtoken');
const config = require('config'); // Assuming you're using config for your JWT secret
const { isTokenBlacklisted } = require('../utils/blackListUtils');

const checkAuth = async (req, res, next) => {
  const token = req.cookies.accessToken; // Assuming your JWT is stored in cookies

  if (!token) {
    return next(); // If no token, proceed to the next middleware (public route)
  }

  try {
    // Check if token is blacklisted
    const blacklistedToken = await isTokenBlacklisted(token, 'access');
    if (blacklistedToken) {
      return res.redirect('/login'); // Redirect to login if token is blacklisted
    }

    // Verify the token
    const decoded = jwt.verify(token, config.get('jwtSecret'));
    req.user = decoded; // Store user information in the request object

    // Redirect based on user role
    if (decoded.role === 'player') {
      return res.redirect('/user/dashboard');
    } else if (decoded.role === 'coach') {
      return res.redirect('/user/dashboard');
    } else if (decoded.role === 'admin') {
      return res.redirect('/user/admin/dashboard');
    }
  } catch (err) {
    // If token is invalid, proceed to next middleware (public route)
    console.error('JWT verification failed:', err);
  }

  // Proceed to next middleware if no redirection occurred
  next();
};

module.exports = checkAuth;
