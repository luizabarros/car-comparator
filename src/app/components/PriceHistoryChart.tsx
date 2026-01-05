import { Line } from "react-chartjs-2";
import { Chart as ChartJS, Title, Tooltip, Legend, LineElement, CategoryScale, LinearScale, PointElement } from "chart.js";

ChartJS.register(Title, Tooltip, Legend, LineElement, CategoryScale, LinearScale, PointElement);

export default function PriceHistoryChart({ cars }: { cars: any[] }) {
  const labels = Array.from(new Set(cars.flatMap(c => c.priceHistory.map((p: any) => p.month)))).sort();
  
  const datasets = cars.map(car => ({
    label: car.model,
    data: labels.map(month => {
      const entry = car.priceHistory.find((p: any) => p.month === month);
      return entry ? Number(entry.price.replace(/[^0-9]/g, "")) : null;
    }),
    borderColor: '#' + Math.floor(Math.random()*16777215).toString(16),
    tension: 0.3
  }));

  return (
    <div className="mt-8 bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
      <h3 className="text-lg font-semibold mb-4">Histórico de preços (FIPE)</h3>
      <div className="w-full h-[360px]">
        <Line
          data={{ labels, datasets }}
          options={{
            responsive: true,
            plugins: { legend: { position: "top" } },
            scales: {
              y: {
                ticks: {
                  callback: (v) => `R$ ${v?.toLocaleString()}`
                }
              }
            }
          }}
        />
      </div>
    </div>
  );
}
