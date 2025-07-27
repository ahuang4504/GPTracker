import { useState, useEffect, useCallback } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line } from "react-chartjs-2";
import type { Session } from "@supabase/supabase-js";
import type { TimePeriod, VisitHistoryEntry } from "@/types/storage";
import {
  fetchVisitHistory,
  formatDateLabel,
  getPeriodDisplayName,
} from "@/utils/chartData";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface VisitChartProps {
  session: Session;
}

export function VisitChart({ session }: VisitChartProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>("1W");
  const [chartData, setChartData] = useState<VisitHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadChartData = useCallback(
    async (period: TimePeriod) => {
      setIsLoading(true);
      setError(null);

      try {
        const data = await fetchVisitHistory(session, period);
        setChartData(data);
      } catch (error) {
        setError(
          `Failed to load ${getPeriodDisplayName(period)} data ${error}`
        );
        setChartData([]);
      } finally {
        setIsLoading(false);
      }
    },
    [session]
  );

  useEffect(() => {
    loadChartData(selectedPeriod);
  }, [selectedPeriod, loadChartData]);

  const handlePeriodChange = (period: TimePeriod) => {
    setSelectedPeriod(period);
  };

  const chartJsData = {
    labels: chartData.map((entry) =>
      formatDateLabel(entry.date, selectedPeriod)
    ),
    datasets: [
      {
        label: "ChatGPT Visits",
        data: chartData.map((entry) => entry.visits),
        borderColor: "#1e3932",
        backgroundColor: "rgba(30, 57, 50, 0.1)",
        borderWidth: 2,
        fill: true,
        tension: 0.1,
        pointBackgroundColor: "#1e3932",
        pointBorderColor: "#1e3932",
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        mode: "index" as const,
        intersect: false,
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        titleColor: "white",
        bodyColor: "white",
        borderColor: "rgba(30, 57, 50, 0.5)",
        borderWidth: 1,
      },
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: "Date",
        },
        ticks: {
          maxRotation: 45,
          minRotation: 0,
        },
      },
      y: {
        display: true,
        title: {
          display: true,
          text: "Visits",
        },
        beginAtZero: true,
        ticks: {
          stepSize: 1,
        },
      },
    },
    interaction: {
      mode: "nearest" as const,
      axis: "x" as const,
      intersect: false,
    },
  };

  const periods: TimePeriod[] = ["1W", "1M", "1Y"];

  return (
    <div className="visit-chart">
      <div className="chart-header">
        <h3>► Visit History</h3>
        <div className="period-tabs">
          {periods.map((period) => (
            <button
              key={period}
              className={`period-tab ${
                selectedPeriod === period ? "active" : ""
              }`}
              onClick={() => handlePeriodChange(period)}
              disabled={isLoading}
            >
              {getPeriodDisplayName(period)}
            </button>
          ))}
        </div>
      </div>

      <div className="chart-container">
        {isLoading && (
          <div className="chart-loading">
            <p>Loading chart data...</p>
          </div>
        )}

        {error && (
          <div className="chart-error">
            <p>{error}</p>
            <button onClick={() => loadChartData(selectedPeriod)}>Retry</button>
          </div>
        )}

        {!isLoading && !error && (
          <Line data={chartJsData} options={chartOptions} />
        )}
      </div>
    </div>
  );
}
