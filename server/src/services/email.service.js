import { getGmailTransporter } from '../config/googleEmail.js';

/**
 * Sends an email through the Gmail API (OAuth2). Failures are caught and
 * logged by the caller (see notification.service.js) so that email delivery
 * issues never block the core business transaction (e.g. approving a
 * submission should succeed even if the notification email fails to send).
 */
export const sendEmail = async ({ to, subject, html }) => {
  const transporter = await getGmailTransporter();

  const info = await transporter.sendMail({
    from: `Student Supervisor System <${process.env.GOOGLE_GMAIL_SENDER}>`,
    to,
    subject,
    html,
  });

  return info;
};

export default sendEmail;
