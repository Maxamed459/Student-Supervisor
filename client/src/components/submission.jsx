import { useState } from 'react';
import { CheckCircle2, ExternalLink, FileText, Send } from 'lucide-react';

export function SubmissionFiles({ submission }) {
  const version = submission.versions?.find((item) => item.versionNumber === submission.currentVersion) || submission.versions?.at(-1);
  const files = version?.files?.length ? version.files : version?.file ? [version.file] : [];
  if (!files.length) return 'No files';

  return (
    <div className="file-link-list">
      {files.map((file) => (
        <a className="file-link" href={file.secureUrl} key={file.publicId || file.secureUrl} rel="noreferrer" target="_blank">
          <FileText size={14} />
          <span>{file.originalName}</span>
          <ExternalLink size={13} />
        </a>
      ))}
    </div>
  );
}

export function FeedbackReplyForm({ submission, mutation }) {
  const [message, setMessage] = useState('');
  return (
    <form
      className="feedback-reply"
      onSubmit={(event) => {
        event.preventDefault();
        const cleanMessage = message.trim();
        if (!cleanMessage) return;
        mutation.mutate({ id: submission._id, message: cleanMessage }, {
          onSuccess: () => setMessage(''),
        });
      }}
    >
      <input value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Reply feedback" />
      <button className="small-button" disabled={mutation.isPending || !message.trim()} type="submit">
        <Send size={13} />Send
      </button>
    </form>
  );
}

export function ReviewControls({ item, mutation }) {
  const [feedback, setFeedback] = useState('');
  return (
    <form className="review-controls" onSubmit={(event) => event.preventDefault()}>
      <input value={feedback} onChange={(event) => setFeedback(event.target.value)} placeholder="Feedback" />
      <button className="small-button" onClick={() => mutation.mutate({ id: item._id, payload: { decision: 'approved', feedback } })} type="button">
        <CheckCircle2 size={13} />Approve
      </button>
      <button className="small-button danger" onClick={() => mutation.mutate({ id: item._id, payload: { decision: 'changes_requested', feedback } })} type="button">
        Request changes
      </button>
    </form>
  );
}
