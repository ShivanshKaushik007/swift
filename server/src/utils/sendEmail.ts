import nodemailer from "nodemailer";

export const sendEmail = async (options: { to: string; subject: string; text: string }) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log("=========================================");
    console.log(`📧 MOCK EMAIL SENT TO: ${options.to}`);
    console.log(`SUBJECT: ${options.subject}`);
    console.log(`BODY:`);
    console.log(options.text);
    console.log("=========================================");
    console.log("⚠️  Provide EMAIL_USER and EMAIL_PASS in .env to send real emails.");
    return;
  }

  const transporter = nodemailer.createTransport({
    service: "gmail", // Assuming Gmail for default, can be parameterized later
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: options.to,
    subject: options.subject,
    text: options.text,
  };

  await transporter.sendMail(mailOptions);
};
