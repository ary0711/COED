
const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs');

// ============================================================
// GMAIL SMTP CONFIGURATION
// ============================================================

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,

  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },

  // This keeps your current setup working with the
  // certificate-chain issue you encountered earlier.
  tls: {
    rejectUnauthorized: false,
  },
});

// ============================================================
// COED LOGO
// ============================================================

const COED_LOGO_PATH =
  process.env.COED_LOGO_PATH ||
  path.resolve(__dirname, '../../public/COED LOGO.png');

// ============================================================
// HTML ESCAPE
// ============================================================

function escapeHtml(text = '') {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// ============================================================
// CONVERT TEXT TO HTML
// ============================================================

function textToHtml(text = '') {
  return escapeHtml(text)
    .replace(/\r\n/g, '\n')
    .replace(/\n/g, '<br>');
}

// ============================================================
// SEND CONTACT REPLY
// ============================================================

async function sendContactReply({
  recipientEmail,
  recipientName,
  subject,
  message,
  signature,
}) {
  // ----------------------------------------------------------
  // VALIDATION
  // ----------------------------------------------------------

  if (!recipientEmail) {
    throw new Error('Recipient email is required.');
  }

  if (!message || !message.trim()) {
    throw new Error('Reply message is required.');
  }

  if (!process.env.EMAIL_USER) {
    throw new Error('EMAIL_USER is missing from .env');
  }

  if (!process.env.EMAIL_PASSWORD) {
    throw new Error('EMAIL_PASSWORD is missing from .env');
  }

  // ----------------------------------------------------------
  // RECIPIENT INFORMATION
  // ----------------------------------------------------------

  const safeRecipientName = escapeHtml(
    recipientName || 'Sender'
  );

  const safeMessage = textToHtml(message);

  const emailSubject =
    `Re: ${subject || 'Your COED Inquiry'}`;

  // ----------------------------------------------------------
  // DEFAULT COED SIGNATURE
  // ----------------------------------------------------------

  const defaultSignature = `
    Regards,<br>
    <strong>COED Administration</strong><br>
    College of Education<br>
    Cebu Technological University<br>
    Argao Campus
  `;

  // Use custom signature when supplied.
  const emailSignature =
    signature && signature.trim()
      ? textToHtml(signature)
      : defaultSignature;

  // ----------------------------------------------------------
  // CHECK COED LOGO
  // ----------------------------------------------------------

  let logoAttachment = [];

  if (fs.existsSync(COED_LOGO_PATH)) {
    logoAttachment = [
      {
        filename: 'COED-Logo.png',
        path: COED_LOGO_PATH,
        cid: 'coedlogo',
      },
    ];

    console.log('✓ COED logo found:');
    console.log(COED_LOGO_PATH);
  } else {
    console.warn('');
    console.warn('⚠ COED LOGO NOT FOUND');
    console.warn('Expected location:');
    console.warn(COED_LOGO_PATH);
    console.warn(
      'Email will still be sent without the logo.'
    );
    console.warn('');
  }

  // ----------------------------------------------------------
  // PROFESSIONAL HTML EMAIL
  // ----------------------------------------------------------

  const logoHtml = fs.existsSync(COED_LOGO_PATH)
    ? `
        <div style="
          text-align: center;
          padding: 24px 20px 12px 20px;
        ">
          <img
            src="cid:coedlogo"
            alt="College of Education Logo"
            style="
              width: 90px;
              height: auto;
              display: inline-block;
            "
          />
        </div>
      `
    : '';

  const html = `
<!DOCTYPE html>

<html>
<head>
  <meta charset="UTF-8">
  <meta
    name="viewport"
    content="width=device-width, initial-scale=1.0"
  >
  <title>COED Administration</title>
</head>

<body style="
  margin: 0;
  padding: 0;
  background-color: #f1f5f9;
  font-family: Arial, Helvetica, sans-serif;
  color: #334155;
">

  <table
    width="100%"
    cellpadding="0"
    cellspacing="0"
    border="0"
    style="
      background-color: #f1f5f9;
      padding: 30px 15px;
    "
  >

    <tr>
      <td align="center">

        <table
          width="100%"
          cellpadding="0"
          cellspacing="0"
          border="0"
          style="
            max-width: 620px;
            background-color: #ffffff;
            border-radius: 10px;
            overflow: hidden;
            border: 1px solid #e2e8f0;
          "
        >

          <!-- HEADER -->

          <tr>
            <td
              style="
                background-color: #1e3a8a;
                height: 6px;
                font-size: 0;
                line-height: 0;
              "
            >
              &nbsp;
            </td>
          </tr>

          ${logoHtml}

          <tr>
            <td
              style="
                padding: 0 35px 24px 35px;
                text-align: center;
              "
            >

              <div style="
                font-size: 20px;
                font-weight: bold;
                color: #1e3a8a;
                margin-bottom: 5px;
              ">
                College of Education
              </div>

              <div style="
                font-size: 13px;
                color: #64748b;
              ">
                Cebu Technological University – Argao Campus
              </div>

            </td>
          </tr>

          <!-- MESSAGE -->

          <tr>
            <td
              style="
                padding: 30px 35px;
                border-top: 1px solid #e2e8f0;
              "
            >

              <p style="
                margin: 0 0 18px 0;
                font-size: 15px;
                line-height: 1.7;
                color: #334155;
              ">
                Dear ${safeRecipientName},
              </p>

              <div style="
                font-size: 15px;
                line-height: 1.8;
                color: #475569;
              ">
                ${safeMessage}
              </div>

              <!-- SIGNATURE -->

              <div style="
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid #e2e8f0;
                font-size: 14px;
                line-height: 1.7;
                color: #475569;
              ">
                ${emailSignature}
              </div>

            </td>
          </tr>

          <!-- FOOTER -->

          <tr>
            <td
              style="
                background-color: #f8fafc;
                padding: 20px 35px;
                border-top: 1px solid #e2e8f0;
                text-align: center;
              "
            >

              <div style="
                font-size: 12px;
                line-height: 1.6;
                color: #94a3b8;
              ">
                This email was sent by the<br>
                <strong style="color: #64748b;">
                  College of Education Administration
                </strong>
              </div>

            </td>
          </tr>

          <!-- BOTTOM BLUE LINE -->

          <tr>
            <td
              style="
                background-color: #2563eb;
                height: 4px;
                font-size: 0;
                line-height: 0;
              "
            >
              &nbsp;
            </td>
          </tr>

        </table>

      </td>
    </tr>

  </table>

</body>
</html>
`;

  // ----------------------------------------------------------
  // PLAIN TEXT VERSION
  // ----------------------------------------------------------

  const plainTextSignature =
    signature && signature.trim()
      ? signature
      : `Regards,
COED Administration
College of Education
Cebu Technological University
Argao Campus`;

  const text = `
Dear ${recipientName || 'Sender'},

${message}

${plainTextSignature}
`.trim();

  // ----------------------------------------------------------
  // MAIL OPTIONS
  // ----------------------------------------------------------

  const mailOptions = {
    from: `"COED Administration" <${process.env.EMAIL_USER}>`,
    to: recipientEmail,
    subject: emailSubject,
    text,
    html,
    attachments: logoAttachment,
  };

  // ----------------------------------------------------------
  // DEBUG INFORMATION
  // ----------------------------------------------------------

  console.log('');
  console.log('====================================');
  console.log('SENDING COED CONTACT REPLY');
  console.log('====================================');
  console.log('From:', process.env.EMAIL_USER);
  console.log('To:', recipientEmail);
  console.log('Subject:', emailSubject);
  console.log(
    'Logo:',
    fs.existsSync(COED_LOGO_PATH)
      ? 'Attached'
      : 'Not found'
  );
  console.log('====================================');

  // ----------------------------------------------------------
  // SEND EMAIL
  // ----------------------------------------------------------

  try {
    const info = await transporter.sendMail(mailOptions);

    console.log('');
    console.log('====================================');
    console.log('EMAIL SENT SUCCESSFULLY');
    console.log('====================================');
    console.log('Message ID:', info.messageId);
    console.log('Accepted:', info.accepted);
    console.log('Rejected:', info.rejected);
    console.log('Response:', info.response);
    console.log('Envelope:', info.envelope);
    console.log('====================================');

    return info;

  } catch (error) {

    console.error('');
    console.error('====================================');
    console.error('EMAIL SENDING FAILED');
    console.error('====================================');
    console.error('Message:', error?.message);
    console.error('Code:', error?.code);
    console.error('Command:', error?.command);
    console.error('Response:', error?.response);
    console.error('Stack:', error?.stack);
    console.error('====================================');

    throw error;
  }
}

// ============================================================
// SEND ACCOUNT STATUS EMAIL
// ============================================================
// Used by auth.js when an administrator changes a user's
// account status.
//
// Supported statuses:
// active, inactive, pending, rejected
// ============================================================

async function sendAccountStatusEmail({
  to,
  fullName,
  role,
  status,
}) {
  const normalizedStatus = String(status || '')
    .trim()
    .toLowerCase();

  const statusMessages = {
    active: {
      heading: 'Your COED account is now active.',
      details:
        'Your account has been activated. You can now sign in to the COED University Management System using your registered login credentials.',
    },

    inactive: {
      heading: 'Your COED account is now inactive.',
      details:
        'Your account has been marked as inactive. You will not be able to sign in while this status remains in effect. Please contact the College of Education administration if you need assistance.',
    },

    pending: {
      heading: 'Your COED account is pending approval.',
      details:
        'Your account is currently awaiting approval. Please wait for further updates from the College of Education administration.',
    },

    rejected: {
      heading: 'Your COED account registration was not approved.',
      details:
        'Your account registration has been marked as rejected. Please contact the appropriate College of Education administrator if you need clarification.',
    },
  };

  const statusInfo = statusMessages[normalizedStatus];

  if (!statusInfo) {
    throw new Error(
      `Unsupported account status: ${status || '(empty)'}`
    );
  }

  if (!to) {
    throw new Error(
      'Recipient email is required for account status notifications.'
    );
  }

  const message = `
${statusInfo.heading}

${statusInfo.details}

Account role: ${role || 'User'}
Current status: ${normalizedStatus.toUpperCase()}

If you believe this change was made in error, please contact the College of Education administration.
  `.trim();

  return sendContactReply({
    recipientEmail: to,
    recipientName: fullName || 'COED User',
    subject: 'COED Account Status Update',
    message,
  });
}

// ============================================================
// VERIFY GMAIL CONNECTION
// ============================================================

async function verifyEmailConnection() {
  try {

    await transporter.verify();

    console.log('');
    console.log('====================================');
    console.log('✓ GMAIL SMTP CONNECTION SUCCESSFUL');
    console.log('====================================');
    console.log('Email:', process.env.EMAIL_USER);
    console.log('====================================');

    return true;

  } catch (error) {

    console.error('');
    console.error('====================================');
    console.error('✗ GMAIL SMTP CONNECTION FAILED');
    console.error('====================================');
    console.error('Message:', error?.message);
    console.error('Code:', error?.code);
    console.error('====================================');

    return false;
  }
}

// ============================================================
// EXPORT
// ============================================================

module.exports = {
  sendContactReply,
  sendAccountStatusEmail,
  verifyEmailConnection,
};
