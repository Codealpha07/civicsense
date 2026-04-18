const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

exports.sendComplaintEmail = async (to, subject, html) => {
  try {
    console.log('Preparing to send email:', { to, subject });
    
    // Simple email options with explicit content type
    const mailOptions = {
      from: process.env.SMTP_FROM,
      to,
      subject,
      html: html,
      text: 'Please enable HTML to view this email properly',
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'X-Mailer': 'CivicSense Mailer'
      }
    };
    
    console.log('Mail options prepared:', {
      from: mailOptions.from,
      to: mailOptions.to,
      subject: mailOptions.subject,
      hasHtml: !!mailOptions.html
    });

    console.log('Sending email with options:', { 
      to, 
      subject,
      from: mailOptions.from,
      hasHtml: !!html
    });

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Email send error:', {
      message: error.message,
      stack: error.stack,
      code: error.code,
      response: error.response
    });
    return { 
      success: false, 
      error: error.message,
      code: error.code
    };
  }
};
