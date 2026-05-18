import nodemailer from 'nodemailer';

const sendEmail = async (options) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail', // You can change this based on your provider
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 10000,
  });

  const mailOptions = {
    from: `"CARMS" <${process.env.EMAIL_USER}>`,
    to: options.email,
    subject: options.subject,
    html: options.message,
  };

  console.log(`Attempting to send email to ${options.email}...`);
  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`Email successfully sent! Message ID: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error('Nodemailer sendMail failed:', error);
    throw error;
  }
};

export default sendEmail;
