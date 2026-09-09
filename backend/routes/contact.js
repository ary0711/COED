const express = require('express');
const router = express.Router();

const {
  sendContactReply,
} = require('../services/emailService');

router.post('/reply', async (req, res) => {
  try {
    const {
      recipientEmail,
      recipientName,
      subject,
      message,
    } = req.body;

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

    await sendContactReply({
      recipientEmail,
      recipientName,
      subject,
      message: message.trim(),
    });

    return res.json({
      success: true,
      message: 'Reply email sent successfully.',
    });

  } catch (error) {
    console.error(
      'Error sending contact reply:',
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        'Failed to send reply email.',
    });
  }
});

module.exports = router;