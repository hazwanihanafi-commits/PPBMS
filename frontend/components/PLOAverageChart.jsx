import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend
);

export default function PLOAverageChart({ ploSummary }) {
  const data = {
    labels: ploSummary.map(p => p.plo),
    datasets: [
      {
        label: "Average PLO Score",
        data: ploSummary.map(p => p.average),
        backgroundColor: ploSummary.map(p =>
          p.status === "Achieved" ? "#16a34a" : "#dc2626"
        )
      }
    ]
  };

  const options = {
    responsive: true,
    scales: {
      y: {
        min: 0,
        max: 5,
        ticks: { stepSize: 1 }
      }
    },
    plugins: {
      legend: { display: false }
    }
  };

  return <Bar data={data} options={options} />;
}
