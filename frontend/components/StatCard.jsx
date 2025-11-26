import { FiBarChart2, FiCheckCircle, FiClock, FiFileText } from "react-icons/fi";

const ICONS = {
  default: FiFileText,
  progress: FiClock,
  success: FiCheckCircle,
  stats: FiBarChart2,
};

export default function StatCard({ title, value, icon = "default", color="teal" }) {
  const Icon = ICONS[icon] || ICONS.default;

  const colorHeader = {
    teal: "from-teal-500 to-teal-600",
    purple: "from-purple-500 to-purple-600",
    blue: "from-blue-500 to-blue-600",
    orange: "from-orange-500 to-orange-600",
    green: "from-green-500 to-green-600",
  }[color];

  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className={`bg-gradient-to-r ${colorHeader} p-3 text-white flex items-center`}>
        <Icon className="text-xl mr-2" />
        <h3 className="text-sm font-semibold">{title}</h3>
      </div>

      {/* Body */}
      <div className="p-5 text-center">
        <p className="text-3xl font-bold text-gray-800">{value}</p>
      </div>
    </div>
  );
}
