import { useState } from 'react';
import { getFileUrl } from '../api/attachments.js';
import { formatFileSize } from '../utils/files.js';

// Read-only list of a report's files. The file is downloaded on click (with the login token)
// and shown in a new tab.
export default function AttachmentList({ attachments }) {
  const [error, setError] = useState(null);
  const [openingId, setOpeningId] = useState(null);

  if (!attachments?.length) return <p className="muted">No attachments.</p>;

  async function open(att) {
    setError(null);
    setOpeningId(att.id);
    // Open the tab now (inside the click) so pop-up blockers allow it, then point it at the file.
    const tab = window.open('', '_blank');
    try {
      const url = await getFileUrl(att.id);
      if (tab) tab.location.href = url;
      else window.location.href = url;
      setTimeout(() => URL.revokeObjectURL(url), 60_000); // free memory once the tab has loaded it
    } catch (err) {
      tab?.close();
      setError(err.message);
    } finally {
      setOpeningId(null);
    }
  }

  return (
    <>
      <ul className="file-list">
        {attachments.map((att) => (
          <li key={att.id} className="file-item">
            <span className="file-icon" aria-hidden="true">
              {att.mimeType === 'application/pdf' ? '📄' : '🖼'}
            </span>
            <span className="file-name">{att.fileName}</span>
            <span className="muted small">{formatFileSize(att.sizeBytes)}</span>
            <span className="file-state" />
            <button type="button" className="link-button" disabled={openingId === att.id} onClick={() => open(att)}>
              {openingId === att.id ? 'Opening…' : 'View'}
            </button>
          </li>
        ))}
      </ul>
      {error && <p className="text-rejected small">{error}</p>}
    </>
  );
}
