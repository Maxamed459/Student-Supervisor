const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

const layout = (title, bodyHtml) => `
<!DOCTYPE html>
<html>
  <body style="font-family: Arial, Helvetica, sans-serif; background:#f4f5f7; padding:24px; margin:0;">
    <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:8px;overflow:hidden;border:1px solid #e5e7eb;">
      <tr>
        <td style="background:#1f2937;padding:20px 24px;">
          <h2 style="color:#ffffff;margin:0;font-size:18px;">Student Supervisor System</h2>
        </td>
      </tr>
      <tr>
        <td style="padding:24px;color:#111827;font-size:14px;line-height:1.6;">
          <h3 style="margin-top:0;">${title}</h3>
          ${bodyHtml}
        </td>
      </tr>
      <tr>
        <td style="padding:16px 24px;background:#f9fafb;color:#6b7280;font-size:12px;">
          This is an automated notification. Please do not reply to this email.
        </td>
      </tr>
    </table>
  </body>
</html>
`;

const button = (href, label) =>
  `<p style="margin:20px 0;"><a href="${href}" style="background:#2563eb;color:#ffffff;text-decoration:none;padding:10px 18px;border-radius:6px;font-size:14px;display:inline-block;">${label}</a></p>`;

export const assignmentEmail = ({ studentName, supervisorName, forStudent }) =>
  layout(
    'Supervisor Assignment',
    forStudent
      ? `<p>Hi ${studentName},</p><p>You have been assigned to your supervisor, <strong>${supervisorName}</strong>. You can now view their profile and published guidelines.</p>${button(
          `${CLIENT_URL}/student/supervisor`,
          'View Supervisor Profile'
        )}`
      : `<p>Hi ${supervisorName},</p><p>A new student, <strong>${studentName}</strong>, has been assigned to you.</p>${button(
          `${CLIENT_URL}/supervisor/students`,
          'View My Students'
        )}`
  );

export const guidelinePublishedEmail = ({ studentName, title, supervisorName }) =>
  layout(
    'New Guideline Published',
    `<p>Hi ${studentName},</p><p>Your supervisor <strong>${supervisorName}</strong> has published new guidance: <strong>${title}</strong>.</p>${button(
      `${CLIENT_URL}/student/milestones`,
      'View Guidelines'
    )}`
  );

export const taskCreatedEmail = ({ studentName, title, dueDate, supervisorName }) =>
  layout(
    'New Milestone Task',
    `<p>Hi ${studentName},</p><p><strong>${supervisorName}</strong> has created a new task: <strong>${title}</strong>.</p>${
      dueDate ? `<p>Due date: <strong>${new Date(dueDate).toDateString()}</strong></p>` : ''
    }${button(`${CLIENT_URL}/student/milestones`, 'View Task Details')}`
  );

export const submissionReceivedEmail = ({ supervisorName, studentName, milestoneTitle }) =>
  layout(
    'New Submission Ready for Review',
    `<p>Hi ${supervisorName},</p><p><strong>${studentName}</strong> has submitted work for <strong>${milestoneTitle}</strong>. It is ready for your evaluation.</p>${button(
      `${CLIENT_URL}/supervisor/submissions`,
      'Review Submission'
    )}`
  );

export const reviewOutcomeEmail = ({ studentName, milestoneTitle, status, comment, reviewerName }) =>
  layout(
    'Submission Review Outcome',
    `<p>Hi ${studentName},</p><p>Your submission for <strong>${milestoneTitle}</strong> has been <strong>${
      status === 'approved' ? 'Approved' : 'sent back with Requested Changes'
    }</strong> by ${reviewerName}.</p>${
      comment ? `<p style="background:#f3f4f6;padding:12px;border-radius:6px;">"${comment}"</p>` : ''
    }${button(`${CLIENT_URL}/student/submissions`, 'View Feedback')}`
  );

export const accountCreatedEmail = ({ fullName, email, tempPassword, role }) =>
  layout(
    'Your Account Has Been Created',
    `<p>Hi ${fullName},</p><p>An account has been created for you on the Student Supervisor System as a <strong>${role}</strong>.</p>
     <p>Email: <strong>${email}</strong><br/>Temporary Password: <strong>${tempPassword}</strong></p>
     <p>Please log in and change your password immediately.</p>${button(`${CLIENT_URL}/login`, 'Log In Now')}`
  );

export default {
  assignmentEmail,
  guidelinePublishedEmail,
  taskCreatedEmail,
  submissionReceivedEmail,
  reviewOutcomeEmail,
  accountCreatedEmail,
};
