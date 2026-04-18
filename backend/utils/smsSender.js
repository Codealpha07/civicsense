const twilio = require('twilio');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Load credentials from environment variables
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromPhone = process.env.TWILIO_FROM_PHONE;

let client;
if (accountSid && authToken && fromPhone) {
  client = twilio(accountSid, authToken);
} else {
  console.warn('Twilio credentials are not set in environment variables. SMS sending disabled.');
}

/**
 * Send OTP via SMS using Twilio
 * @param {string} to - Destination mobile number (E.164 format e.g. +919876543210)
 * @param {string} otp - 6-digit OTP code
 */
async function sendOtpSms(to, otp) {
  if (!client) return;
  try {
    await client.messages.create({
      body: `Your CivicSense verification code is ${otp}`,
      from: fromPhone,
      to
    });
    console.log(`OTP SMS sent to ${to}`);
  } catch (err) {
    console.error('Failed to send OTP SMS', err);
  }
}

module.exports = { sendOtpSms };
