const nodemailer = require("nodemailer");

const sendEmail = async (options) => {
  console.log("DEBUG: Attempting to send email to:", options.email);
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    tls: {
      rejectUnauthorized: false
    },
    family: 4, // Force IPv4
    connectionTimeout: 10000 // 10 seconds
  });

  const mailOptions = {
    from: `"LearnMate Support" <${process.env.EMAIL_USER}>`,
    to: options.email,
    subject: options.subject,
    html: options.message,
  };
  await transporter.sendMail(mailOptions);
  console.log("DEBUG: Email sent successfully");
};

module.exports = sendEmail;
