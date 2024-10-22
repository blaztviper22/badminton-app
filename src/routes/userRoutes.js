const express = require('express');
const router = express.Router();
const path = require('path');
const config = require('config');
const roleChecker = require('../middleware/roleChecker');
const verifyToken = require('../middleware/authJwt');
const {
  getCurrentUser,
  getUserById,
  updateUserInfo,
  serveData,
  getAllCourts,
  getCourtById,
  createReservation,
  getAvailability
} = require('../controllers/userController');
const serveFile = require('../utils/fileUtils');
const { validateUserId, validateUserInfo } = require('../middleware/validator');
const validateUpdateFields = require('../middleware/validateUpdateField');
const { createRateLimiter } = require('../middleware/rateLimiter');
const { checkFilePermissions } = require('../middleware/checkFilePermission');

const limiter = createRateLimiter(15 * 60 * 1000, 100);

let routes = (app, io) => {
  router.get('/me', verifyToken, getCurrentUser);

  router.get('/get-user/:id', verifyToken, validateUserId, getUserById);

  // route to serve files from R2
  router.get('/data/:filename', verifyToken, checkFilePermissions, limiter, serveData);

  router.put(
    '/update',
    verifyToken,
    roleChecker(['player', 'coach']),
    validateUpdateFields,
    validateUserInfo,
    updateUserInfo
  );

  router.get('/courts', verifyToken, getAllCourts);

  router.get('/court/:id', verifyToken, getCourtById);

  router.get('/admin/dashboard', verifyToken, roleChecker(['admin']), (req, res, next) => {
    const filePath = path.resolve(__dirname, '../../build/admindash.html');
    serveFile(filePath, res, next);
  });

  router.get('/court-reservation', verifyToken, roleChecker(['player', 'coach']), (req, res, next) => {
    const filePath = path.resolve(__dirname, '../../build/usercourtreservation.html');
    serveFile(filePath, res, next);
  });

  // endpoint to get the client Key for adyen
  router.get('/client-key', verifyToken, (req, res) => {
    const clientKey = config.get('adyen').clientKey;
    res.json({ clientKey });
  });

  router.get('/admin/schedule-dashboard', verifyToken, roleChecker(['admin']), (req, res, next) => {
    const tab = req.query.tab; // get the page from the query parameter
    let filePath;

    // determine which HTML file to serve based on the query parameter
    switch (tab) {
      case 'event-and-tournaments':
        filePath = path.resolve(__dirname, '../../build/eventtournaments.html');
        break;
      case 'training-sessions':
        // specify the file path for training sessions here
        filePath = path.resolve(__dirname, '../../build/trainingsessions.html');
        break;
      case 'product-pickup':
        // specify the file path for product pickup here
        filePath = path.resolve(__dirname, '../../build/productpickup.html');
        break;
      default:
        // default to court reservations
        filePath = path.resolve(__dirname, '../../build/courtreservations.html');
        break;
    }

    serveFile(filePath, res, next);
  });
  router.get('/reserve/:type', verifyToken, roleChecker(['player', 'coach']), (req, res, next) => {
    const { type } = req.params;
    let filePath;

    switch (type) {
      case 'court-list':
        filePath = path.resolve(__dirname, '../../build/usercourtlist.html');
        break;
      case 'map-view':
        filePath = path.resolve(__dirname, '../../build/usercourtviewing.html');
        break;
    }

    serveFile(filePath, res, next);
  });

  router.post('/reserve', verifyToken, roleChecker(['player', 'coach']), (req, res) => {
    createReservation(req, res, io);
  });

  router.get('/availability', verifyToken, roleChecker(['player', 'coach']), getAvailability);

  router.get('/dashboard', verifyToken, roleChecker(['player', 'coach']), (req, res, next) => {
    const filePath = path.resolve(__dirname, '../../build/userdash.html');
    serveFile(filePath, res, next);
  });
  router.get('/edit-profile', verifyToken, roleChecker(['player', 'coach']), (req, res, next) => {
    const filePath = path.resolve(__dirname, '../../build/userprofile.html');
    serveFile(filePath, res, next);
  });

  app.use('/user', router);
};

module.exports = routes;
