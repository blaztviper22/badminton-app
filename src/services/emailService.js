require('dotenv').config();
const nodemailer = require('nodemailer');
const User = require('../models/User');
const { generateOTP } = require('../utils/otpUtils');
const { error, log } = console;
const config = require('config');
const fs = require('fs').promises; // Use promises for cleaner async/await syntax
const path = require('path');

exports.sendOTP = async (email) => {
  try {
    const otp = generateOTP(); //Generate OTP using the utility
    const otpExpiration = Date.now() + 10 * 60 * 1000; // OTP valid for 10 minutes

    // store the OTP and expiration time in the database associated with the user
    const updateResult = await User.updateOne({ email }, { otp, otpExpires: otpExpiration }).exec();

    if (updateResult.nModified === 0) {
      return error(`No user found with email: ${email}`);
    }

    log(`OTP updated for user: ${email}`);

    // Configure Nodemailer to send the email
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: config.gmail.user,
        pass: config.gmail.pass
      }
    });

    const templatePath = path.join(__dirname, '../../client/html/otpEmailTemplate.html');

    // Use async/await to read the HTML template
    const htmlContent = await fs.readFile(templatePath, 'utf8');

    // Replace placeholder with actual OTP
    const emailContent = htmlContent.replace('[OTP_PLACEHOLDER]', otp);

    const mailOptions = {
      from: config.gmail.user,
      to: email,
      subject: 'Email Verification',
      html: emailContent
    };

    // Send the email using your email service here
    const info = await transporter.sendMail(mailOptions);
    log('OTP sent:', info.response);
  } catch (err) {
    if (err.code === 'ENOENT') {
      error('Error: HTML template file not found');
    } else {
      error('Error in sendOTP function:', err);
    }
  }
};

exports.sendForgotPasswordEmail = async (email, resetToken) => {
  try {
    // Configure Nodemailer to send the email
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: config.gmail.user,
        pass: config.gmail.pass
      }
    });

    const templatePath = path.join(__dirname, '../../client/html/forgotPassEmailTemplate.html');

    // Use async/await to read the HTML template
    const htmlContent = await fs.readFile(templatePath, 'utf8');

    // Create a reset link with the reset token
    const resetLink = `${config.frontendUrl}/reset-password?token=${resetToken}`;

    // Replace placeholder with actual reset link
    const emailContent = htmlContent.replace('[RESET_LINK_PLACEHOLDER]', resetLink);

    const mailOptions = {
      from: config.gmail.user,
      to: email,
      subject: 'Password Reset Request',
      html: emailContent
    };

    // Send the email using your email service
    const info = await transporter.sendMail(mailOptions);
    log('Password reset email sent:', info.response);
  } catch (err) {
    if (err.code === 'ENOENT') {
      error('Error: HTML template file not found');
    } else {
      error('Error in sendForgotPasswordEmail function:', err);
    }
  }
};
