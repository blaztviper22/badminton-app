const cron = require('node-cron');
const moment = require('moment-timezone');
const Reservation = require('../models/Reservation');
const { convertTo24Hour } = require('../utils/timeConvertion');
const { log, error } = console;

const clearPastReservations = async () => {
  try {
    // get the current date and time in the specified timezone
    const now = moment().tz('Asia/Manila');
    const currentDate = moment.tz('Asia/Manila').startOf('day');
    const startOfDay = moment.tz(currentDate, 'Asia/Manila').startOf('day').toISOString();
    const currentTime12Hour = now.format('hh:mm A');
    const currentTime = convertTo24Hour(currentTime12Hour);

    // log current date and time for debugging
    log(`Current Date: ${currentDate}`);
    log(`Current Time (12-hour): ${currentTime12Hour}`);
    log(`Current Time (24-hour): ${currentTime}`);

    // delete reservations where the date is in the past
    const pastDateReservations = await Reservation.deleteMany({
      date: { $lt: startOfDay }
    });

    log(`Deleted ${pastDateReservations.deletedCount} reservations with past dates.`);

    // delete reservations for today where the time slot has passed
    const currentDateReservations = await Reservation.find({
      date: currentDate // Match today's date
    });

    let countDeleted = 0;
    for (const reservation of currentDateReservations) {
      const fromTime = convertTo24Hour(reservation.timeSlot.from);
      const toTime = convertTo24Hour(reservation.timeSlot.to);

      // check if the reservation's time slot has already passed
      if (toTime < currentTime) {
        await Reservation.deleteOne({ _id: reservation._id });
        log(
          `Deleted Reservation ID: ${reservation._id}, Date: ${reservation.date}, TimeSlot: ${reservation.timeSlot.from} - ${reservation.timeSlot.to}`
        );
        countDeleted++;
      }
    }

    log(`Deleted ${countDeleted} reservations with past time slots for today.`);
  } catch (err) {
    error('Error clearing past reservations:', err);
  }
};

// cron job to run every minute (for testing)
const startReservationCleanupCronJob = () => {
  cron.schedule(
    '*/1 * * * *', // Run every minute for testing purposes
    async () => {
      log('Running scheduled job to clear past reservations...');
      await clearPastReservations();
    },
    {
      timezone: 'Asia/Manila'
    }
  );

  log('Cron job scheduled to clean past reservations every minute.');
};

module.exports = {
  startReservationCleanupCronJob
};
