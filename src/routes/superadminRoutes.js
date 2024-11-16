const express = require('express');
const router = express.Router();
const path = require('path');
const config = require('config');
const roleChecker = require('../middleware/roleChecker');
const verifyToken = require('../middleware/authJwt');
const serveFile = require('../utils/fileUtils');
const { getSuperadminDashboard } = require('../controllers/superadminController');

let routes = (app) => {
  router.get('/dashboard', verifyToken, roleChecker(['superadmin']), getSuperadminDashboard);

  app.use('/superadmin', router);
};

module.exports = routes;
