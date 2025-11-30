// components/ExpectedActualChart.js
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend
} from "chart.js";
import { Bar } from "react-chartjs-2";

ChartJS.register(
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend
);

export default function ExpectedActualChart({ items }) {
  const labels = items.map((i) => i.key);

  const expected = items.map((i) =>
    i.expected && i.expected !== "—" ? 1 : 0
  );
  const actual = items.map((i) =>
    i.actual && i.actual !== "—" ? 1 : 0
  );

  const data = {
    labels,
    datasets: [
      {
        label: "Expected",
        data: expected,
        backgroundColor: "rgba(99, 102, 241, 0.5)", // purple
      },
      {
        label: "Actual",
        data: actual,
        backgroundColor: "rgba(16, 185, 129, 0.5)", // green
      },
    ],
  };

  return <Bar data={data} />;
}
