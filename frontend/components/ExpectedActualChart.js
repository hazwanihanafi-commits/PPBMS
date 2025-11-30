import { Bar } from "react-chartjs-2";

export default function ExpectedActualChart({ items }) {
  const labels = items.map(i => i.key);

  const expected = items.map(i => i.expected && i.expected !== "—" ? 1 : 0);
  const actual = items.map(i => i.actual && i.actual !== "—" ? 1 : 0);

  const data = {
    labels,
    datasets: [
      {
        label: "Expected",
        data: expected,
        backgroundColor: "rgba(99, 102, 241, 0.3)", // purple
        borderColor: "rgba(99, 102, 241, 1)",
        borderWidth: 1
      },
      {
        label: "Actual",
        data: actual,
        backgroundColor: "rgba(16, 185, 129, 0.3)", // green
        borderColor: "rgba(16, 185, 129, 1)",
        borderWidth: 1
      }
    ]
  };

  return <Bar data={data} />;
}
