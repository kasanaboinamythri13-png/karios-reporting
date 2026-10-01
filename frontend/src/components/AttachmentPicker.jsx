import { useRef } from 'react';
import { ACCEPT, MAX_FILES_PER_REPORT, MAX_FILE_LABEL, checkFile, uploadFile } from '../api/attachments.js';
import { formatFileSize } from '../utils/files.js';

// Lets a head add up to 5 files (JPG / PNG / PDF, 5 MB each) to a report.
// items: [{ key, id?, fileName, sizeBytes, status: 'uploading' | 'done' | 'error', progress, error }]
// Each new file is uploaded to the backend straight away.
export default function AttachmentPicker({ items, setItems, disabled }) {
  const inputRef = useRef(null);
  const slotsLeft = MAX_FILES_PER_REPORT - items.length;

  const update = (key, patch) => setItems((list) => list.map((it) => (it.key === key ? { ...it, ...patch } : it)));

  async function upload(file, key) {
    try {
      const saved = await uploadFile(file, (progress) => update(key, { progress }));
      update(key, { id: saved.attachmentId, status: 'done', progress: 100 });
    } catch (err) {
      update(key, { status: 'error', error: err.message });
    }
  }

  function onPick(e) {
    const files = [...e.target.files].slice(0, Math.max(0, slotsLeft));
    e.target.value = ''; // allow picking the same file again
    const added = files.map((file) => {
      const problem = checkFile(file);
      return {
        key: `${Date.now()}-${Math.random()}`,
        fileName: file.name,
        sizeBytes: file.size,
        status: problem ? 'error' : 'uploading',
        progress: 0,
        error: problem,
        file,
      };
    });
    setItems((list) => [...list, ...added]);
    added.filter((it) => it.status === 'uploading').forEach((it) => upload(it.file, it.key));
  }

  return (
    <div className="attachments">
      <div className="attachments-head">
        <strong>Attachments</strong>
        <span className="muted small">Optional · JPG, PNG, PDF · max {MAX_FILES_PER_REPORT} · {MAX_FILE_LABEL} each</span>
      </div>

      {items.length > 0 && (
        <ul className="file-list">
          {items.map((it) => (
            <li key={it.key} className={`file-item file-${it.status}`}>
              <span className="file-icon" aria-hidden="true">
                {it.fileName.toLowerCase().endsWith('.pdf') ? '📄' : '🖼'}
              </span>
              <span className="file-name">{it.fileName}</span>
              <span className="muted small">{formatFileSize(it.sizeBytes)}</span>
              <span className="file-state small">
                {it.status === 'uploading' && (
                  <span className="progress" aria-label={`Uploading ${it.progress}%`}>
                    <span style={{ width: `${it.progress}%` }} />
                  </span>
                )}
                {it.status === 'done' && <span className="text-approved">✓ Uploaded</span>}
                {it.status === 'error' && <span className="text-rejected">{it.error}</span>}
              </span>
              <button
                type="button"
                className="btn btn--ghost btn--sm"
                style={{ color: "var(--color-rejected, #dc2626)", padding: "3px 8px", fontSize: 12 }}
                disabled={disabled || it.status === 'uploading'}
                onClick={() => setItems((list) => list.filter((x) => x.key !== it.key))}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}

      <input ref={inputRef} type="file" accept={ACCEPT} multiple hidden onChange={onPick} />
      <button
        type="button"
        className="btn btn--outline btn--sm"
        style={{ marginTop: 8 }}
        disabled={disabled || slotsLeft <= 0}
        onClick={() => inputRef.current?.click()}
      >
        + Add file
      </button>
      {slotsLeft <= 0 && <span className="muted small"> Maximum of {MAX_FILES_PER_REPORT} files reached.</span>}
    </div>
  );
}
