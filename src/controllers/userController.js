const User = require('../models/User');
const File = require('../models/File');
const Reservation = require('../models/Reservation');
const { assignFileAccess } = require('../utils/assignFileAccess');
const { isCourtAvailable } = require('../utils/courtAvailability');
const { convertTo24Hour } = require('../utils/timeConvertion');
const { log, error } = console;
const { uploadToR2, deleteFromR2, getFileFromR2 } = require('../services/r2Service');
const mongoose = require('mongoose');
const { pipeline } = require('stream');
const { promisify } = require('util');
const pipelineAsync = promisify(pipeline);
const mime = require('mime-types');
const fileType = require('file-type-cjs');
const Court = require('../models/Court');
const { geocodeAddress } = require('../utils/addressToCoord');
const moment = require('moment-timezone');
const calculateTotalAmount = require('../utils/amountCalculator');

exports.getCurrentUser = async (req, res) => {
  try {
    let user = await User.findById(req.user.id).select('+isAdmin'); // Select the isAdmin field

    if (!user) {
      return res.status(404).json({
        status: 'error',
        code: 404,
        message: 'User not found'
      });
    }

    // if the user is an admin, populate the court field
    if (user.isAdmin) {
      user = await user.populate('court');
    }

    // Send the user object, with court info if admin
    res.json(user);
  } catch (err) {
    error('Error occurred while fetching current user:', err);
    return res.status(500).json({
      status: 'error',
      code: 500,
      message: 'Internal Server Error'
    });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const userId = req.params.id;

    // Check if the userId is missing
    if (!userId) {
      return res.status(400).json({
        status: 'error',
        code: 400,
        message: 'User ID is required'
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        status: 'error',
        code: 404,
        message: 'User not found'
      });
    }

    res.json(user);
  } catch (err) {
    console.error('Error occurred while fetching user by ID:', err);
    return res.status(500).json({
      status: 'error',
      code: 500,
      message: 'Internal Server Error'
    });
  }
};

exports.updateUserInfo = async (req, res) => {
  try {
    const userId = req.user.id;

    // safely extract the uploaded file and password
    const profile_photo = req.files?.profile_photo;
    const password = req.body.password;
    const newEmail = req.body.email;

    // retrieve the user's current profile
    const user = await User.findById(userId);

    // Check if the new email is the same as the old email
    if (newEmail && newEmail === user.email) {
      return res.status(400).json({
        status: 'error',
        code: 400,
        message: 'The new email must be different from the current email.'
      });
    }

    // Check if the new password is the same as the old password
    if (password && password === user.password) {
      return res.status(400).json({
        status: 'error',
        code: 400,
        message: 'The new password must be different from the current password.'
      });
    }

    // check if profile_photo is provided and handle the upload
    let fileUrl;
    if (profile_photo) {
      // Check file size limit (e.g., 5MB)
      const MAX_SIZE = 5 * 1024 * 1024; // 5 MB
      if (profile_photo.size > MAX_SIZE) {
        return res.status(400).json({
          status: 'error',
          code: 400,
          message: 'File size exceeds the limit of 5MB.'
        });
      }

      // check the file's MIME type using file-type
      const fileBuffer = profile_photo.data;
      const type = await fileType.fromBuffer(fileBuffer);
      const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif'];

      if (!type || !allowedMimeTypes.includes(type.mime)) {
        return res.status(400).json({
          status: 'error',
          code: 400,
          message: 'Invalid file type. Only images are allowed.'
        });
      }

      // delete the existing profile photo from Cloudflare R2 if present
      if (user.profile_photo) {
        const fileName = user.profile_photo.split('/').pop(); // Extract the file name from the URL
        await deleteFromR2(fileName); // Delete the old photo
      }

      // upload the new file to Cloudflare R2
      const uploadResult = await uploadToR2(profile_photo.data, profile_photo.name);
      const fileName = uploadResult.fileName;
      fileUrl = `/user/data/${fileName}`;

      // assign access permissions for the new profile photo
      const accessibleUsers = [userId]; // User who uploaded should have access

      const file = new File({
        fileName: uploadResult.fileName,
        owner: userId // The ID of the user who owns this file
      });

      await assignFileAccess(file, userId, [], accessibleUsers);
    }

    // Update user's fields
    if (req.body) {
      Object.assign(user, req.body);
    }

    // Update profile photo URL if it was uploaded
    if (fileUrl) {
      user.profile_photo = fileUrl;
    }

    // If the password is being updated, the pre-save hook will hash it
    if (password) {
      user.password = password;
    }

    // Set email verification to false if the email is being updated
    if (newEmail) {
      user.email = newEmail;
    }

    // Save the user, triggering the pre-save hook
    await user.save();

    return res.status(200).json({
      status: 'success',
      code: 200,
      message: 'User information updated successfully',
      user
    });
  } catch (err) {
    console.error(err);
    if (err instanceof mongoose.Error.StrictModeError) {
      return res.status(400).json({
        status: 'error',
        code: 400,
        message: 'Invalid fields in the request.'
      });
    }
    return res.status(500).json({
      status: 'error',
      code: 500,
      message: 'Internal Server Error'
    });
  }
};

exports.serveData = async (req, res) => {
  const { filename } = req.params;

  try {
    // Fetch file stream from R2
    const fileStream = await getFileFromR2(filename);

    if (!fileStream) {
      return res.status(404).json({
        status: 'error',
        message: 'File not found'
      });
    }

    // Set the correct Content-Type based on the file extension
    const mimeType = mime.lookup(filename) || 'application/octet-stream';
    res.setHeader('Content-Type', mimeType);

    // Set cache headers
    res.setHeader('Cache-Control', 'public, max-age=3600, must-revalidate');
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);

    // Pipe the file stream to the response
    await pipelineAsync(fileStream, res);

    // Ensure response is ended properly
    res.end(); // Call to end the response, though pipeline should handle this.
  } catch (err) {
    console.error('Error fetching file:', err);

    // Check if headers are already sent
    if (!res.headersSent) {
      // Handle specific errors
      if (err.code === 'ERR_STREAM_PREMATURE_CLOSE') {
        return res.status(500).json({
          status: 'error',
          message: 'File streaming failed due to an internal error.'
        });
      }

      // Handle other errors
      return res.status(500).json({
        status: 'error',
        code: 500,
        message: 'Internal Server Error'
      });
    }

    // Log if headers are already sent
    console.error('Headers already sent, cannot respond with error:', err);
  }
};

// controller function to get all available courts
exports.getAllCourts = async (req, res) => {
  const page = parseInt(req.query.page) || 1; // Current page, default is 1
  const limit = parseInt(req.query.limit) || 10; // Number of items per page, default is 10
  const skip = (page - 1) * limit; // Calculate how many items to skip

  const query = {};

  // Check for search parameters
  if (req.query.business_name) {
    const businessName = req.query.business_name.trim();

    // Minimum length check to avoid meaningless results
    if (businessName.length >= 3) {
      // Use a regex to match any part of the business name, case-insensitive
      query.business_name = { $regex: businessName, $options: 'i' };
    } else {
      return res.status(400).json({
        status: 'error',
        code: '400',
        message: 'Search term is too short. Please provide at least 3 characters.'
      });
    }
  }
  // check for location search (street address)
  if (req.query.address) {
    try {
      // convert the address to coordinates (geocoding)
      const { latitude, longitude } = await geocodeAddress(req.query.address);
      console.log(latitude, longitude);

      // use MongoDB's geospatial query to find courts near the location
      query.location = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [longitude, latitude]
          },
          $maxDistance: 5000 // 5 kilometers (adjust this as needed)
        }
      };
    } catch (error) {
      log(error);
      return res.status(400).json({
        status: 'error',
        code: '400',
        message: 'Invalid address. Could not find location.'
      });
    }
  }

  try {
    // fetch total number of courts for pagination
    const totalCourts = await Court.countDocuments({});
    const courts = await Court.find(query).select('-documents -paypal_email').skip(skip).limit(limit);

    // calculate total pages
    const totalPages = Math.ceil(totalCourts / limit);

    // return the courts data with pagination info
    return res.status(200).json({
      status: 'success',
      code: 200,
      totalCourts,
      totalPages,
      currentPage: page,
      courts
    });
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      code: 500,
      message: 'Internal Server Error'
    });
  }
};

exports.getCourtById = async (req, res) => {
  try {
    const courtId = req.params.id;

    // check if the courtId is missing
    if (!courtId) {
      return res.status(400).json({
        status: 'error',
        code: 400,
        message: 'Court ID is required'
      });
    }

    // find the court by ID
    const court = await Court.findById(courtId).select('-documents');

    if (!court) {
      return res.status(404).json({
        status: 'error',
        code: 404,
        message: 'Court not found'
      });
    }

    // return the court data
    res.json(court);
  } catch (err) {
    console.error('Error occurred while fetching court by ID:', err);
    return res.status(500).json({
      status: 'error',
      code: 500,
      message: 'Internal Server Error'
    });
  }
};

// reservation controller function
exports.createReservation = async (req, res, io) => {
  try {
    const userId = req.user.id;

    const { courtId, date, timeSlot, selectedCourt } = req.body;

    // Validate input
    if (
      !courtId ||
      !date ||
      !timeSlot ||
      !timeSlot.from ||
      !timeSlot.to ||
      !Array.isArray(selectedCourt) ||
      selectedCourt.length === 0
    ) {
      return res.status(400).json({
        status: 'error',
        code: 400,
        message: 'All fields are required and selectedCourt must not be empty.'
      });
    }

    // Get the current date and time in the Philippines timezone
    const now = moment.tz('Asia/Manila');

    // Convert date to a Date object
    const selectedDate = moment.tz(date, 'Asia/Manila');
    const currentDate = moment.tz(new Date(), 'Asia/Manila');

    // Normalize to the start of the day for comparison
    const currentDateStartOfDay = moment().startOf('day');
    const selectedDateStartOfDay = selectedDate.startOf('day');

    // Check if the selected date is in the past
    if (selectedDateStartOfDay.isBefore(currentDateStartOfDay)) {
      return res.status(400).json({
        status: 'error',
        code: 400,
        message: 'Cannot check availability for past dates.'
      });
    }

    // if the selected date is today, check the time slot
    if (selectedDateStartOfDay.isSame(currentDateStartOfDay)) {
      const fromTimeString = `${date} ${timeSlot.from}`;
      const fromTime = moment.tz(fromTimeString, 'Asia/Manila');

      // check if the time slot's start time is in the past
      if (fromTime.isBefore(now)) {
        return res.status(400).json({
          status: 'error',
          code: 400,
          message: 'Cannot reserve a time slot that is in the past.'
        });
      }
    }

    // Get the court and its total courts
    const court = await Court.findById(courtId);
    if (!court) {
      return res.status(404).json({
        status: 'error',
        code: 404,
        message: 'Court not found'
      });
    }

    // use the virtual field to get the total number of courts
    const totalCourts = court.totalCourts;

    // Check if the selected court images are within bounds
    if (selectedCourt.some((index) => index < 0 || index >= totalCourts)) {
      return res.status(400).json({
        status: 'error',
        code: 400,
        message: `Selected court indices are out of bounds. Total courts available: ${totalCourts}.`
      });
    }

    // Check court availability
    const courtAvailable = await isCourtAvailable(courtId, selectedDate, timeSlot, selectedCourt.length);
    if (!courtAvailable) {
      return res.status(400).json({
        status: 'error',
        code: 400,
        message: 'Selected time slot is not available'
      });
    }

    const hourlyRate = court.hourly_rate;

    const { operating_hours } = court;

    // convert operating hours to Date objects for the selected date
    const operatingStart = moment.tz(`${date} ${operating_hours.from}`, 'YYYY-MM-DD h:mm A', 'Asia/Manila');
    const operatingEnd = moment.tz(`${date} ${operating_hours.to}`, 'YYYY-MM-DD h:mm A', 'Asia/Manila');

    // convert time to 24-hour format
    const fromTime24 = convertTo24Hour(timeSlot.from);
    const toTime24 = convertTo24Hour(timeSlot.to);

    // create Date objects for fromTime and toTime
    const fromTime = moment.tz(`${selectedDate.format('YYYY-MM-DD')} ${fromTime24}`, 'Asia/Manila');
    const toTime = moment.tz(`${selectedDate.format('YYYY-MM-DD')} ${toTime24}`, 'Asia/Manila');

    // validate that the time slot falls within operating hours
    if (fromTime.isBefore(operatingStart) || toTime.isAfter(operatingEnd)) {
      return res.status(400).json({
        status: 'error',
        code: 400,
        message: `The selected time slot (${timeSlot.from} - ${timeSlot.to}) is outside of operating hours (${operating_hours.from} - ${operating_hours.to}).`
      });
    }

    // validate time range
    if (fromTime.isAfter(toTime)) {
      return res.status(400).json({
        status: 'error',
        code: 400,
        message: 'End time must be after start time'
      });
    }

    // ensure the reservation starts at least one hour from now
    const oneHourLater = now.clone().add(1, 'hour'); // Current time + 1 hour
    if (fromTime.isBefore(oneHourLater)) {
      return res.status(400).json({
        status: 'error',
        code: 400,
        message: 'Reservations must start at least one hour from the current time.'
      });
    }

    // calculate total amount
    const totalAmount = calculateTotalAmount(fromTime, toTime, hourlyRate, selectedCourt.length);

    // create a new reservation
    const reservation = new Reservation({
      user: userId,
      court: courtId,
      date: selectedDate.toDate(),
      timeSlot: {
        from: fromTime24,
        to: toTime24
      },
      totalAmount,
      selectedCourt,
      status: 'pending',
      paymentStatus: 'unpaid'
    });

    await reservation.save();

    io.emit('reservationCreated', {
      courtId,
      date
    });

    return res.status(201).json(reservation);
  } catch (err) {
    // handle duplicate key error
    console.error('Error while creating reservation:', err);
    if (err.name === 'MongoServerError' && err.code === 11000) {
      return res.status(400).json({
        status: 'error',
        code: 400,
        message: 'This time slot is already booked. Please choose another time.'
      });
    }
    return res.status(500).json({
      status: 'error',
      code: 500,
      message: 'Internal Server Error'
    });
  }
};
exports.getAvailability = async (req, res) => {
  try {
    const { date, courtId } = req.query;

    // Validate the date parameter
    if (!date) {
      return res.status(400).json({
        status: 'error',
        code: 400,
        message: 'Date is required.'
      });
    }

    // Parse the date
    const selectedDate = moment.tz(date, 'YYYY-MM-DD', 'Asia/Manila').startOf('day');
    const currentDate = moment().tz('Asia/Manila').startOf('day');
    const currentTime = moment().tz('Asia/Manila'); // Capture current time for later checks

    // Log current time for debugging
    console.log('Current Time:', currentTime.format('YYYY-MM-DD h:mm A'));

    // Check if the selected date is in the past
    if (selectedDate.isBefore(currentDate)) {
      return res.status(400).json({ error: 'Cannot check availability for past dates.' });
    }

    const response = {
      status: 'success',
      reservedDates: [],
      courts: []
    };

    // find all courts if courtId is not provided
    const courts = courtId ? [await Court.findById(courtId)] : await Court.find();

    if (courtId && !courts[0]) {
      return res.status(404).json({ error: 'Court not found.' });
    }

    // Iterate through each court
    for (const court of courts) {
      const courtResponse = {
        courtId: court._id,
        timeSlot: {
          available: [],
          unavailable: []
        }
      };

      // Get reservations
      const reservations = await Reservation.find({ court: court._id });

      // Check for reservations and populate reservedDates
      reservations.forEach((reservation) => {
        const reservationDate = moment(reservation.date).tz('Asia/Manila').startOf('day');
        if (reservationDate.isSame(currentDate, 'day') || reservationDate.isAfter(currentDate)) {
          if (!response.reservedDates.includes(reservationDate.format('YYYY-MM-DD'))) {
            response.reservedDates.push(reservationDate.format('YYYY-MM-DD'));
          }
        }
      });

      // Get operating hours
      const operatingHours = court.operating_hours;
      const operatingStart = moment.tz(`${date} ${operatingHours.from}`, 'YYYY-MM-DD h:mm A', 'Asia/Manila');
      const operatingEnd = moment.tz(`${date} ${operatingHours.to}`, 'YYYY-MM-DD h:mm A', 'Asia/Manila');

      // Create available time slots
      const availableTimeSlots = [];
      for (let m = operatingStart; m.isBefore(operatingEnd); m.add(1, 'hours')) {
        availableTimeSlots.push(m.format('h:mm A') + ' - ' + m.clone().add(1, 'hour').format('h:mm A'));
      }

      // Log available time slots
      console.log('Available Time Slots Before Reservations:', availableTimeSlots);

      // Mark unavailable slots
      const unavailableTimeSlots = new Set();

      // Mark reservations as unavailable
      reservations.forEach((reservation) => {
        const reservationDate = moment(reservation.date).tz('Asia/Manila').startOf('day');
        if (reservationDate.isSame(selectedDate, 'day')) {
          const from = moment.tz(reservation.timeSlot.from, 'h:mm A', 'Asia/Manila');
          const to = moment.tz(reservation.timeSlot.to, 'h:mm A', 'Asia/Manila');
          for (let m = from; m.isBefore(to); m.add(1, 'hour')) {
            const timeSlotKey = `${m.format('h:mm A')} - ${m.clone().add(1, 'hour').format('h:mm A')}`;
            unavailableTimeSlots.add(timeSlotKey);
          }
        }
      });

      // Check for past time slots and those within the next hour only for today
      const currentDate2 = currentTime.clone().startOf('day'); // Start of current day

      if (selectedDate.isSame(currentDate2, 'day')) {
        const oneHourFromNow = currentTime.clone().add(1, 'hour');

        availableTimeSlots.forEach((slot) => {
          const [fromTimeStr] = slot.split(' - ');
          const fromTime = moment.tz(
            selectedDate.format('YYYY-MM-DD') + ' ' + fromTimeStr,
            'YYYY-MM-DD h:mm A',
            'Asia/Manila'
          );

          // Logging for debugging
          console.log(`Current Time: ${currentTime.format('YYYY-MM-DD HH:mm:ss')}`);
          console.log(`From Time: ${fromTime.format('YYYY-MM-DD HH:mm:ss')}`);
          console.log(`One Hour From Now: ${oneHourFromNow.format('YYYY-MM-DD HH:mm:ss')}`);

          // Mark as unavailable if the slot is in the past
          if (fromTime.isBefore(currentTime)) {
            unavailableTimeSlots.add(slot);
            console.log(`Marking as unavailable (past): ${slot}`);
          }
          // Mark as unavailable if the slot starts within the next hour
          else if (fromTime.isBefore(oneHourFromNow)) {
            if (fromTime.isSame(currentTime, 'hour') && currentTime.isBefore(oneHourFromNow)) {
              console.log(`Skipping marking as unavailable (ongoing): ${slot}`);
            } else {
              unavailableTimeSlots.add(slot);
              console.log(`Marking as unavailable (next hour): ${slot}`);
            }
          }
        });
      }

      // Log unavailable time slots after checking for past slots
      console.log('Final Unavailable Time Slots:', Array.from(unavailableTimeSlots));

      // Assign final available and unavailable slots
      courtResponse.timeSlot.unavailable = Array.from(unavailableTimeSlots);
      courtResponse.timeSlot.available = availableTimeSlots.filter(
        (slot) => !courtResponse.timeSlot.unavailable.includes(slot)
      );

      // Log final available and unavailable slots for the court
      console.log(`Court ID: ${court._id} - Available Slots:`, courtResponse.timeSlot.available);
      console.log(`Court ID: ${court._id} - Unavailable Slots:`, courtResponse.timeSlot.unavailable);

      // Push to response
      response.courts.push(courtResponse);
    }

    return res.status(200).json(response);
  } catch (error) {
    console.error('Error checking court availability:', error);
    return res.status(500).json({
      status: 'error',
      code: 500,
      message: 'Internal Server Error'
    });
  }
};
