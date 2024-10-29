const fileType = require('file-type-cjs'); // Assuming you are using file-type to get MIME types
const { uploadToR2 } = require('../services/r2Service');
const File = require('../models/File');
const { assignFileToAdmin } = require('./userFileAccess');
const User = require('../models/User');

const MAX_SIZE = 80 * 1024 * 1024; // 20MB file size limit

async function handleFileUpload(file, userId, category) {
  if (file.size > MAX_SIZE) {
    throw new Error('File size exceeds the limit of 20MB.');
  }
  const fileBuffer = file.data;
  const fileTypeInfo = await fileType.fromBuffer(fileBuffer);

  const allowedImageTypes = ['image/jpeg', 'image/png', 'image/gif'];
  const allowedDocumentTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];

  // Combine allowed types
  const allowedTypes = [...allowedImageTypes, ...allowedDocumentTypes];

  console.log(`File name: ${file.name}, MIME type: ${file.mimetype}`);

  // Check if file type is valid
  if (!fileTypeInfo || !allowedTypes.includes(fileTypeInfo.mime)) {
    throw new Error(
      `Invalid file type. Allowed types: ${allowedImageTypes.join(', ')}, ${allowedDocumentTypes.join(', ')}`
    );
  }
  //  Upload the file to Cloudflare R2 and return the file URL
  const uploadResult = await uploadToR2(file.data, file.name);
  const fileUrl = `/user/data/${uploadResult.fileName}`;

  // Create a new file document in your database
  const fileDocument = new File({
    fileName: uploadResult.fileName,
    owner: adminId // The ID of the admin who owns this file
  });

  // Save the file document
  await fileDocument.save();

  // retrieve user to determine if they are an admin
  const user = await User.findById(userId);
  if (!user) {
    throw new Error('User not found.');
  }

  if (user.isAdmin) {
    // if user is admin, assign to admin
    await assignFileToAdmin(fileDocument, userId, category);
  } else {
    // otherwise, assign to regular user
    await assignFileToUser(fileDocument, userId, category);
  }

  return fileUrl;
}

async function handleMultipleFileUploads(files, adminId, category) {
  let fileUrls = [];
  const filesArray = Array.isArray(files) ? files : [files]; // Handle single or multiple files

  for (const file of filesArray) {
    const fileUrl = await handleFileUpload(file, adminId, category);
    fileUrls.push(fileUrl);
  }

  return fileUrls;
}

module.exports = {
  handleFileUpload,
  handleMultipleFileUploads
};
