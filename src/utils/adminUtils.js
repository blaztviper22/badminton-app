const { assignFileAccess } = require('./assignFileAccess');
/**
 * Assigns access permissions to a file for the admin.
 * @param {Object} file - The file document to which access will be assigned.
 * @param {ObjectId} adminId - The ID of the admin user who will own the file.
 * @returns {Promise<void>} - A promise that resolves when the operation is complete.
 * @throws {Error} - Throws an error if the assignment fails.
 */
const assignFileToAdmin = async (file, adminId, category) => {
  const accessibleUsers = [adminId]; // User who uploaded should have access
  let roleBasedAccess = [];

  switch (category) {
    case 'businessLogo':
      roleBasedAccess = ['admin', 'coach', 'player'];
      file.isPublic = true;
      break;
    case 'courtImage':
      roleBasedAccess = ['admin', 'coach', 'player'];
      file.isPublic = false;
      break;
    case 'facilityImage':
      roleBasedAccess = ['admin', 'coach', 'player'];
      file.isPublic = false;
      break;
    default:
      roleBasedAccess = []; // No specific roles
      file.isPublic = false;
      break;
  }

  await assignFileAccess(file, adminId, roleBasedAccess, accessibleUsers);
};

module.exports = {
  assignFileToAdmin
};
