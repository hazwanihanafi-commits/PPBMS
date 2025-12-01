import { useState } from "react";

export default function ProgressRow({ activity, actual, onSave }) {
  const [date, setDate] = useState(actual || "");

  return (
    <tr>
      <td>{activity}</td>
      <td>{/* expected date */}</td>

      {/* Student selects date */}
      <td>
        <input
          type="date"
          value={date}
          onChange={(e) => {
            setDate(e.target.value);
            onSave(activity, e.target.value); // <-- send to backend
          }}
          className="border rounded px-2 py-1"
        />
      </td>
    </tr>
  );
}
