// frontend/components/EmailReminderButton.jsx
export default function EmailReminderButton({ supervisorEmail, studentName, milestone }) {
  const subject = encodeURIComponent(`[Reminder] ${studentName} - ${milestone} overdue`);
  const body = encodeURIComponent(`Dear Supervisor,\n\nStudent ${studentName} appears to be late on ${milestone}. Please follow up.\n\nThanks,\nPPBMS`);
  const href = `mailto:${supervisorEmail}?subject=${subject}&body=${body}`;

  return (
    <a
      href={href}
      className="inline-flex items-center px-3 py-1.5 bg-indigo-600 text-white rounded-md text-sm hover:bg-indigo-700"
    >
      Send reminder
    </a>
  );
}
