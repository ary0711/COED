const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,

  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },

  tls: {
    rejectUnauthorized: false,
  },
});

async function sendContactReply({
  recipientEmail,
  recipientName,
  subject,
  message,
}) {
  const mailOptions = {
    from: `"COED Administration" <${process.env.EMAIL_USER}>`,
    to: recipientEmail,
    subject: `Re: ${subject || 'Your COED Inquiry'}`,

    text: `Dear ${recipientName || 'Sender'},

${message}

Regards,
COED Administration`,

    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <p>Dear ${recipientName || 'Sender'},</p>

        <p>${message.replace(/\n/g, '<br>')}</p>

        <p>
          Regards,<br>
          <strong>COED Administration</strong>
        </p>
      </div>
    `,
  };

  return await transporter.sendMail(mailOptions);
}

module.exports = {
  sendContactReply,
};