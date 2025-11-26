export default function ProfileCard({ name, programme, supervisor, email }) {
  return (
    <div className="bg-white shadow-lg rounded-2xl overflow-hidden border border-gray-200">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-500 to-teal-600 p-4 text-white">
        <h2 className="text-lg font-bold">Academic Information</h2>
      </div>

      {/* Content */}
      <div className="p-5 text-center">
        {/* Avatar */}
        <div className="flex justify-center mb-4">
          <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-teal-400 shadow">
            <img
              src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
                name
              )}&background=0D8ABC&color=fff&size=200`}
              alt="avatar"
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        <p className="text-xl font-semibold">{name}</p>
        <p className="text-gray-600 text-sm">{programme}</p>

        <div className="mt-4 text-left space-y-2 text-sm">
          <p>
            <span className="font-medium text-gray-700">Supervisor:</span>{" "}
            {supervisor}
          </p>
          <p>
            <span className="font-medium text-gray-700">Email:</span>{" "}
            {email}
          </p>
        </div>
      </div>
    </div>
  );
}
