import dotenv from 'dotenv';
import nodemailer from 'nodemailer';
dotenv.config();

const testEmail = async () => {
  console.log("Using USER:", process.env.EMAIL_USER);
  console.log("Using PASS:", process.env.EMAIL_PASS ? "****" : "MISSING");

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    connectionTimeout: 10000, // 10 seconds
    greetingTimeout: 10000,
    socketTimeout: 10000,
  });

  try {
    const info = await transporter.sendMail({
      from: `"CARMS Test" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER, // Send to self
      subject: "Test Email from CARMS",
      text: "If you receive this, Nodemailer is working correctly.",
    });
    console.log("SUCCESS! Message ID:", info.messageId);
  } catch (err) {
    console.error("FAILED TO SEND:", err.message);
  }
};

testEmail();
