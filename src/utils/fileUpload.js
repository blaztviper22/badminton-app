const fileType = require('file-type-cjs'); // Assuming you are using file-type to get MIME types
const { uploadToR2 } = require('../services/r2Service');
const { assignFileToAdmin } = require('./adminUtils');
const File = require('../models/File');

const MAX_SIZE = 80 * 1024 * 1024; // 20MB file size limit

async function handleFileUpload(file, adminId, category) {
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

  // Assign the file to the admin
  await assignFileToAdmin(fileDocument, adminId, category); // Pass the file object, not the URL

  return fileUrl; // Return the file URL
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
