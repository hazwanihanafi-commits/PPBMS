export default function ProgressRow({ row, saveActualDate }) {
  return (
    <tr className="border-b">
      <td className="px-3 py-2">{row.activity}</td>
      <td className="px-3 py-2">{row.expected}</td>

      {/* ACTUAL DATE INPUT */}
      <td className="px-3 py-2">
        <input
          type="date"
          value={row.actual || ""}
          onChange={async (e) => {
            const date = e.target.value;
            const result = await saveActualDate(row.activity, date);

            if (result.ok) {
              alert("Saved: " + date);
            } else {
              alert("ERROR: " + result.error);
            }
          }}
        />
      </td>

      <td className="px-3 py-2">{row.status}</td>
      <td className="px-3 py-2">{row.remaining}</td>
    </tr>
  );
}
