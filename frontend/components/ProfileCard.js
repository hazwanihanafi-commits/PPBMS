// frontend/components/ProfileCard.js
export default function ProfileCard({ name, programme, supervisor, email }) {
  return (
    <div className="bg-white rounded-2xl shadow p-5">
      <div className="flex items-center gap-4">
        <div className="w-20 h-20 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-bold text-lg">
          {name ? name.split(" ").slice(0,2).map(n=>n[0]).join("") : "ST"}
        </div>
        <div>
          <div className="text-lg font-bold">{name}</div>
          <div className="text-sm text-gray-500">{programme}</div>
        </div>
      </div>

      <div className="mt-4 text-sm text-gray-700">
        <div><strong>Supervisor:</strong> {supervisor}</div>
        <div className="mt-2"><strong>Email:</strong> <span className="text-purple-700">{email}</span></div>
      </div>
    </div>
  );
}
