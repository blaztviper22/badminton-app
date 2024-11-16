exports.getSuperadminDashboard = (req, res) => {
  res.json({
    message: 'Welcome to the Superadmin Dashboard!',
    user: req.user // sending user data for testing purposes
  });
};
