
const express = require('express');
const router = express.Router();

const {
  sendContactReply,
} = require('../services/emailService');

// ============================================================
// POST /api/contact/reply
// ============================================================

router.post('/reply', async (req, res) => {
  try {
    const {
      recipientEmail,
      recipientName,
      subject,
      message,
    } = req.body;

    console.log('');
    console.log('====================================');
    console.log('CONTACT REPLY REQUEST');
    console.log('====================================');
    console.log('Recipient:', recipientEmail);
    console.log('Name:', recipientName);
    console.log('Subject:', subject);
    console.log('====================================');

    // --------------------------------------------------------
    // VALIDATION
    // --------------------------------------------------------

    if (!recipientEmail) {
      return res.status(400).json({
        success: false,
        message: 'Recipient email is required.',
      });
    }

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Reply message is required.',
      });
    }

    // --------------------------------------------------------
    // SEND EMAIL
    // --------------------------------------------------------

    console.log(
      'Sending contact reply to:',
      recipientEmail
    );

    const info = await sendContactReply({
      recipientEmail,
      recipientName,
      subject,
      message,
    });

    // --------------------------------------------------------
    // CHECK SMTP RESULT
    // --------------------------------------------------------

    console.log('');
    console.log('====================================');
    console.log('NODEMAILER RESULT');
    console.log('====================================');
    console.log('Message ID:', info.messageId);
    console.log('Accepted:', info.accepted);
    console.log('Rejected:', info.rejected);
    console.log('Response:', info.response);
    console.log('Envelope:', info.envelope);
    console.log('====================================');

    // --------------------------------------------------------
    // EMAIL NOT ACCEPTED
    // --------------------------------------------------------

    if (
      !info.accepted ||
      info.accepted.length === 0
    ) {
      console.error(
        'GMAIL DID NOT ACCEPT THE EMAIL'
      );

      return res.status(500).json({
        success: false,
        message:
          'Gmail did not accept the recipient email.',
        accepted: info.accepted || [],
        rejected: info.rejected || [],
      });
    }

    // --------------------------------------------------------
    // EMAIL SUCCESS
    // --------------------------------------------------------

    console.log('');
    console.log('====================================');
    console.log('CONTACT REPLY EMAIL SUCCESS');
    console.log('====================================');
    console.log(
      'Email accepted by Gmail for:',
      recipientEmail
    );
    console.log('Message ID:', info.messageId);
    console.log('====================================');

    // IMPORTANT:
    // Return success immediately.
    // Do not perform any database operation here.

    return res.status(200).json({
      success: true,
      message: 'Reply email sent successfully.',
      messageId: info.messageId,
      accepted: info.accepted,
      rejected: info.rejected,
    });

  } catch (error) {
    console.error('');
    console.error('====================================');
    console.error('CONTACT REPLY ERROR');
    console.error('====================================');
    console.error('Message:', error?.message);
    console.error('Code:', error?.code);
    console.error('Command:', error?.command);
    console.error('Response:', error?.response);
    console.error('Stack:', error?.stack);
    console.error('====================================');

    return res.status(500).json({
      success: false,
      message:
        error?.message ||
        'Failed to send reply email.',
      code: error?.code || null,
    });
  }
});

module.exports = router;


