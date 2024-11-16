const path = require('path');
const serveFile = require('../utils/fileUtils');
const User = require('../models/User');
const Court = require('../models/Court');
const { log, error } = console;

exports.getSuperadminDashboard = (req, res, next) => {
  const filePath = path.resolve(__dirname, '../../build/superadmindashboard.html');
  serveFile(filePath, res, next);
};

// handle court approval or rejection and update the associated user's isCourtApproved field
exports.handleCourtApproval = async (req, res, next) => {
  const courtId = req.params.courtId;
  const action = req.params.action; // action will either be "approve" or "reject"

  try {
    // find the court by ID
    const court = await Court.findById(courtId);

    if (!court) {
      return res.status(404).json({
        success: false,
        code: 404,
        message: 'Court not found'
      });
    }

    // update the court status based on the action
    if (action === 'approve') {
      court.status = 'approved';
      await court.save();

      // find the associated user and update the isCourtApproved field
      const user = await User.findById(court.user); // assuming court has a user field with the user ID
      if (user) {
        user.isCourtApproved = true;
        await user.save();
      }

      return res.status(200).json({
        success: true,
        code: 200,
        message: 'Court approved successfully'
      });
    } else if (action === 'reject') {
      court.status = 'rejected';
      await court.save();

      // find the associated user and update the isCourtApproved field
      const user = await User.findById(court.user); // assuming court has a user field with the user ID
      if (user) {
        user.isCourtApproved = false;
        await user.save();
      }

      return res.status(200).json({
        success: true,
        code: 200,
        message: 'Court rejection processed successfully'
      });
    } else {
      return res.status(400).json({
        success: false,
        code: 400,
        message: 'Invalid action specified'
      });
    }
  } catch (err) {
    error('Error handling court approval/rejection:', err);
    return res.status(500).json({
      success: false,
      code: 500,
      message: 'Internal Server Error'
    });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().populate('court');
    return res.status(200).json({
      success: true,
      code: 200,
      data: users
    });
  } catch (err) {
    console.error('Error fetching users:', err);
    return res.status(500).json({
      success: false,
      code: 500,
      message: 'Internal Server Error'
    });
  }
};
