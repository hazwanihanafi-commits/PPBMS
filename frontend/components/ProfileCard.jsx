// frontend/components/ProfileCard.jsx
export default function ProfileCard({ name, programme, supervisor, email }) {
  const initials = (name || "NA").split(" ").map(s=>s[0]).slice(0,2).join("").toUpperCase();
  return (
    <div className="bg-white p-6 rounded-2xl shadow">
      <div className="flex items-center gap-4">
        <div className="w-24 h-24 rounded-lg flex items-center justify-center bg-teal-600 text-white text-3xl font-semibold">
          {initials}
        </div>
        <div>
          <div className="text-xl font-bold">{name}</div>
          <div className="text-sm text-gray-600">{programme}</div>
        </div>
      </div>

      <div className="mt-6 space-y-2 text-sm">
        <div><span className="font-medium">Supervisor:</span> {supervisor}</div>
        <div><span className="font-medium">Email:</span> <a href={`mailto:${email}`} className="text-purple-600">{email}</a></div>
      </div>

      <div className="mt-6 flex space-x-3">
        <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-100 rounded">
          <svg className="w-4 h-4 text-green-700" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          <div className="text-sm">On Track</div>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-100 rounded">
          <svg className="w-4 h-4 text-gray-700" viewBox="0 0 24 24" fill="none"><path d="M9 12h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
          <div className="text-sm">Profile</div>
        </div>
      </div>
    </div>
  );
}
