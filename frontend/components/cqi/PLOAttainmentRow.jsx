import { useState } from "react";
import PLOCQIAction from "./PLOCQIAction";

export default function PLOAttainmentRow({ plo }) {
  const [open, setOpen] = useState(false);

  const color =
    plo.percent >= 70
      ? "bg-green-500"
      : plo.percent >= 50
      ? "bg-yellow-500"
      : "bg-red-500";

  const status =
    plo.percent >= 70
      ? "Achieved"
      : plo.percent >= 50
      ? "Borderline"
      : "CQI Required";

  return (
    <div className="bg-white rounded-xl p-4 shadow">
      <div className="flex justify-between items-center mb-2">
        <div className="font-bold">{plo.plo}</div>
        <div className="text-sm font-semibold">{plo.percent}%</div>
      </div>

      {/* Progress Bar */}
      <div className="relative h-3 bg-gray-200 rounded-full mb-2">
        <div
          className={`h-3 rounded-full ${color}`}
          style={{ width: `${plo.percent}%` }}
        />
        {/* 70% benchmark */}
        <div className="absolute top-0 left-[70%] h-3 w-[2px] bg-black/40" />
      </div>

      <div className="flex justify-between text-xs text-gray-600">
        <span>
          {plo.achieved} / {plo.total} students achieved
        </span>
        <span
          className={`font-semibold ${
            status === "Achieved"
              ? "text-green-700"
              : status === "Borderline"
              ? "text-yellow-700"
              : "text-red-700"
          }`}
        >
          {status}
        </span>
      </div>

      {status !== "Achieved" && (
        <button
          onClick={() => setOpen(!open)}
          className="text-purple-600 text-xs mt-2 underline"
        >
          {open ? "Hide CQI Action" : "View CQI Action"}
        </button>
      )}

      {open && <PLOCQIAction actions={plo.actions} />}
    </div>
  );
}
