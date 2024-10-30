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
  getAvailability,
  handleCourtReservation,
  getReservations,
  cancelReservation,
  getAdminReservations,
  postAdminAnnouncement,
  getAllAnnouncements,
  removeAnnouncement,
  getAdminAnnouncements
} = require('../controllers/userController');
const serveFile = require('../utils/fileUtils');
const { validateUserId, validateUserInfo, validateAnnouncementPost } = require('../middleware/validator');
const validateUpdateFields = require('../middleware/validateUpdateField');
const { createRateLimiter } = require('../middleware/rateLimiter');
const { checkFilePermissions } = require('../middleware/checkFilePermission');
const checkCourtId = require('../middleware/checkCourtId');

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

  router.get('/court-reservation', verifyToken, checkCourtId, roleChecker(['player', 'coach']), (req, res, next) => {
    handleCourtReservation(req, res, next, io);
  });

  router.delete('/admin/announcement/:announcementId', verifyToken, roleChecker(['admin']), (req, res, next) => {
    removeAnnouncement(req, res, io);
  });

  router.post(
    '/admin/announcement',
    verifyToken,
    validateAnnouncementPost,
    roleChecker(['admin']),
    (req, res, next) => {
      postAdminAnnouncement(req, res, io);
    }
  );

  router.get('/announcements/all', verifyToken, roleChecker(['player', 'coach']), getAllAnnouncements);

  router.get('/announcements/admin', verifyToken, roleChecker(['admin']), getAdminAnnouncements);

  router.get('/events-and-tournaments', verifyToken, roleChecker(['player', 'coach']), (req, res, next) => {
    const tab = req.query.tab;
    let filePath;

    switch (tab) {
      case 'schedule-reservation':
        filePath = path.resolve(__dirname, '../../build/userschedulereservation.html');
        break;
      case 'view-tournaments':
        filePath = path.resolve(__dirname, '../../build/userviewtournaments.html');
        break;
      default:
        filePath = path.resolve(__dirname, '../../build/userviewannouncement.html');
        break;
    }

    serveFile(filePath, res, next);
  });

  router.get('/admin/view-post', verifyToken, roleChecker(['admin']), (req, res, next) => {
    const tab = req.query.tab;
    let filePath;

    switch (tab) {
      case 'announcements':
        break;
      case 'events':
        break;
      case 'tournaments':
        break;
      default:
        filePath = path.resolve(__dirname, '../../build/viewadminpost.html');
        break;
    }

    serveFile(filePath, res, next);
  });

  router.get('/admin/user-payments', verifyToken, roleChecker(['admin']), (req, res, next) => {
    const tab = req.query.tab; // get the page from the query parameter
    let filePath;

    switch (tab) {
      case 'event-and-tournaments':
        filePath = path.resolve(__dirname, '../../build/eventtournaments.html');
        break;
      case 'training-sessions':
        // specify the file path for training sessions here
        filePath = path.resolve(__dirname, '../../build/trainingsessions.html');
        break;
      case 'product-reservation':
        // specify the file path for product reservation here
        filePath = path.resolve(__dirname, '../../build/productpickup.html');
        break;
      default:
        // default to court reservations
        filePath = path.resolve(__dirname, '../../build/adminviewuserpayment.html');
        break;
    }

    serveFile(filePath, res, next);
  });

  router.get('/admin/schedule', verifyToken, roleChecker(['admin']), (req, res, next) => {
    const tab = req.query.tab; // get the page from the query parameter
    let filePath;

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
        filePath = path.resolve(__dirname, '../../build/adminschedulereservation.html');
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

  router.get('/reservations', verifyToken, roleChecker(['player', 'coach']), getReservations);

  router.get('/admin/reservations', verifyToken, roleChecker(['admin']), getAdminReservations);

  router.post('/reservations/cancel', verifyToken, roleChecker(['player', 'coach']), cancelReservation);

  router.get('/availability', verifyToken, roleChecker(['player', 'coach']), getAvailability);

  router.get('/dashboard', verifyToken, roleChecker(['player', 'coach']), (req, res, next) => {
    const filePath = path.resolve(__dirname, '../../build/userdash.html');
    serveFile(filePath, res, next);
  });

  router.get('/view-schedule', verifyToken, roleChecker(['player', 'coach']), (req, res, next) => {
    const filePath = path.resolve(__dirname, '../../build/viewusercourtreservationsched.html');
    serveFile(filePath, res, next);
  });

  router.get('/edit-profile', verifyToken, roleChecker(['player', 'coach']), (req, res, next) => {
    const filePath = path.resolve(__dirname, '../../build/userprofile.html');
    serveFile(filePath, res, next);
  });

  app.use('/user', router);
};

module.exports = routes;
