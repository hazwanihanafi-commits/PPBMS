// frontend/components/SubmissionFolder.jsx
export default function SubmissionFolder({ raw = {}, studentEmail = "" }) {
  // keys that correspond to document links - adjust if sheet headers differ
  const docKeys = [
    "Submission Document P1",
    "Submission Document P3",
    "Submission Document P4",
    "Submission Document P5",
    "Development Plan & Learning Contract",
    "Annual Progress Review (Year 1)"
  ];

  return (
    <div>
      <h4 className="text-lg font-semibold mb-3">Submission Folder</h4>
      <ul className="space-y-2">
        {docKeys.map(k => {
          const v = raw[k];
          return (
            <li key={k}>
              <div className="text-sm">
                <strong>{k}:</strong>{" "}
                {v ? <a className="text-purple-600 hover:underline" href={v} target="_blank" rel="noreferrer">Open</a> : <span className="text-gray-500">No file</span>}
              </div>
            </li>
          );
        })}
      </ul>
      <div className="mt-4 text-sm text-gray-600">
        To upload files: you can add a file upload UI that calls your backend upload endpoint (S3 / Google Drive).
      </div>
    </div>
  );
}
