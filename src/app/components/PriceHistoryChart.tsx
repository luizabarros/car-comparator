import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Filler,
} from 'chart.js';

ChartJS.register(
  Title,
  Tooltip,
  Legend,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Filler,
);

// Paleta de cores consistente
const COLORS = [
  { border: '#3B82F6', bg: 'rgba(59, 130, 246, 0.1)' }, // Blue
  { border: '#10B981', bg: 'rgba(16, 185, 129, 0.1)' }, // Green
  { border: '#F59E0B', bg: 'rgba(245, 158, 11, 0.1)' }, // Amber
  { border: '#EF4444', bg: 'rgba(239, 68, 68, 0.1)' }, // Red
];

interface PriceHistoryChartProps {
  cars: Array<{
    model: string;
    priceHistory: Array<{
      month: string;
      price: string;
    }>;
  }>;
}

export default function PriceHistoryChart({ cars }: PriceHistoryChartProps) {
  // Valida se há dados
  if (!cars || cars.length === 0) {
    return null;
  }

  // Extrai todos os meses únicos e ordena
  const allMonths = Array.from(
    new Set(cars.flatMap((c) => c.priceHistory.map((p) => p.month))),
  ).sort((a, b) => {
    // Tenta converter para Date para ordenar corretamente
    const dateA = new Date(a);
    const dateB = new Date(b);
    return dateA.getTime() - dateB.getTime();
  });

  // Cria datasets para cada carro
  const datasets = cars.map((car, index) => {
    const colorIndex = index % COLORS.length;
    const color = COLORS[colorIndex];

    return {
      label: car.model,
      data: allMonths.map((month) => {
        const entry = car.priceHistory.find((p) => p.month === month);
        if (!entry) return null;

        // Remove formatação e converte para número
        const numericPrice = Number(entry.price.replace(/[^0-9]/g, ''));
        return isNaN(numericPrice) ? null : numericPrice;
      }),
      borderColor: color.border,
      backgroundColor: color.bg,
      borderWidth: 2,
      tension: 0.4,
      fill: true,
      pointRadius: 4,
      pointHoverRadius: 6,
      pointBackgroundColor: '#fff',
      pointBorderColor: color.border,
      pointBorderWidth: 2,
      pointHoverBackgroundColor: color.border,
      pointHoverBorderColor: '#fff',
    };
  });

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
            <svg
              className="w-6 h-6 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"
              />
            </svg>
            Histórico de Preços FIPE
          </h3>
          <p className="text-sm text-slate-600 mt-1">
            Evolução dos valores de referência ao longo do tempo
          </p>
        </div>
      </div>

      <div className="w-full" style={{ height: '400px' }}>
        <Line
          data={{
            labels: allMonths,
            datasets: datasets,
          }}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
              mode: 'index',
              intersect: false,
            },
            plugins: {
              legend: {
                position: 'top',
                labels: {
                  usePointStyle: true,
                  padding: 15,
                  font: {
                    size: 13,
                    weight: 'bold',
                  },
                },
              },
              tooltip: {
                backgroundColor: 'rgba(15, 23, 42, 0.9)',
                titleColor: '#fff',
                bodyColor: '#fff',
                padding: 12,
                borderColor: 'rgba(148, 163, 184, 0.2)',
                borderWidth: 1,
                displayColors: true,
                callbacks: {
                  label: function (context) {
                    const label = context.dataset.label || '';
                    const value = context.parsed.y;
                    return `${label}: R$ ${value?.toLocaleString('pt-BR')}`;
                  },
                },
              },
            },
            scales: {
              x: {
                grid: {
                  display: false,
                },
                ticks: {
                  font: {
                    size: 12,
                  },
                  maxRotation: 45,
                  minRotation: 45,
                },
              },
              y: {
                beginAtZero: false,
                grid: {
                  color: 'rgba(148, 163, 184, 0.1)',
                },
                ticks: {
                  font: {
                    size: 12,
                  },
                  callback: function (value) {
                    return `R$ ${Number(value).toLocaleString('pt-BR')}`;
                  },
                },
              },
            },
          }}
        />
      </div>

      {/* Legenda adicional */}
      <div className="mt-6 pt-4 border-t border-slate-200">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {cars.map((car, index) => {
            const prices = car.priceHistory
              .map((p) => Number(p.price.replace(/[^0-9]/g, '')))
              .filter((p) => !isNaN(p));

            if (prices.length === 0) return null;

            const minPrice = Math.min(...prices);
            const maxPrice = Math.max(...prices);
            const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
            const variation = ((maxPrice - minPrice) / minPrice) * 100;

            const colorIndex = index % COLORS.length;
            const color = COLORS[colorIndex];

            return (
              <div key={car.model} className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color.border }} />
                  <h4 className="font-medium text-sm text-slate-900 truncate">{car.model}</h4>
                </div>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Média:</span>
                    <span className="font-semibold text-slate-900">
                      R$ {avgPrice.toLocaleString('pt-BR')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Variação:</span>
                    <span
                      className={`font-semibold ${
                        variation > 0 ? 'text-red-600' : 'text-green-600'
                      }`}
                    >
                      {variation > 0 ? '+' : ''}
                      {variation.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
