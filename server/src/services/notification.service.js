import Notification from '../models/Notification.js';
import { sendEmail } from './email.service.js';

/**
 * Creates an in-app notification record AND dispatches the corresponding
 * email via Gmail OAuth2. Covers FR-N1 through FR-N5 and FR-T10.
 *
 * `recipient` must be a populated User document (needs email + fullName).
 * Email failures are swallowed and recorded on the notification record so a
 * flaky mail provider never breaks the calling request.
 */
export const notify = async ({ recipient, type, message, link = null, emailSubject, emailHtml }) => {
  const notification = await Notification.create({
    userId: recipient._id,
    type,
    message,
    link,
  });

  try {
    await sendEmail({ to: recipient.email, subject: emailSubject, html: emailHtml });
    notification.emailSent = true;
  } catch (err) {
    console.error(`Failed to send email to ${recipient.email}:`, err.message);
    notification.emailSent = false;
    notification.emailError = err.message;
  }

  await notification.save();
  return notification;
};

/**
 * Convenience helper to fire notifications to several recipients in parallel.
 */
export const notifyMany = async (recipients, buildPayload) =>
  Promise.all(recipients.map((recipient) => notify(buildPayload(recipient))));

export default { notify, notifyMany };
