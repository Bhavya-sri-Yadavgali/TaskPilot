const nodemailer = require("nodemailer");

const sendEmail = async (options) => {
  console.log("DEBUG: Attempting to send email to:", options.email);
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
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
