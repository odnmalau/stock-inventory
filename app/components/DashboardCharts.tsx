import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "./Card";
import { useState, useEffect, useRef } from "react";
import { Button } from "./ui/button";

interface ChartData {
  date: string; // or month name
  masuk: number;
  keluar: number;
}

interface StockDistribution {
  name: string;
  value: number;
  [key: string]: any;
}

interface DashboardChartsProps {
  dailyData: ChartData[];
  monthlyData: ChartData[];
  warehouses: { id: number; nama_gudang: string }[];
  gudang_ids: string[];
  stockDistribution: StockDistribution[];
}

const COLORS = ["#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899"];

export function DashboardCharts({ 
  dailyData, 
  monthlyData, 
  warehouses, 
  gudang_ids, 
  stockDistribution
}: DashboardChartsProps) {
  const [chartView, setChartView] = useState<"monthly" | "daily">("monthly");
  const barChartRef = useRef<HTMLDivElement>(null);
  const pieChartRef = useRef<HTMLDivElement>(null);
  const [barChartWidth, setBarChartWidth] = useState(600);
  const [pieChartWidth, setPieChartWidth] = useState(300);

  useEffect(() => {
    const updateWidths = () => {
      if (barChartRef.current) {
        setBarChartWidth(barChartRef.current.offsetWidth - 40); // padding
      }
      if (pieChartRef.current) {
        setPieChartWidth(pieChartRef.current.offsetWidth - 40);
      }
    };
    
    updateWidths();
    window.addEventListener('resize', updateWidths);
    // Delay to ensure DOM is ready
    const timer = setTimeout(updateWidths, 100);
    return () => {
      window.removeEventListener('resize', updateWidths);
      clearTimeout(timer);
    };
  }, []);

  const currentData = chartView === "monthly" ? monthlyData : dailyData;
  const chartTitle = chartView === "monthly" ? "Transaksi Bulanan Tahun Ini" : "Transaksi Harian Bulan Ini";

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Transaction Chart (Left - 2/3 width) */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{chartTitle}</CardTitle>
            <div className="flex bg-muted rounded-md p-1">
              <Button 
                variant={chartView === "monthly" ? "secondary" : "ghost"} 
                size="sm" 
                onClick={() => setChartView("monthly")}
                className="text-xs"
              >
                Bulanan
              </Button>
              <Button 
                variant={chartView === "daily" ? "secondary" : "ghost"} 
                size="sm" 
                onClick={() => setChartView("daily")}
                className="text-xs"
              >
                Harian
              </Button>
            </div>
          </CardHeader>
          <CardContent ref={barChartRef}>
            {currentData.length === 0 ? (
              <div className="h-[350px] flex items-center justify-center text-gray-500">
                Tidak ada data transaksi.
              </div>
            ) : (
              <BarChart
                width={barChartWidth > 0 ? barChartWidth : 600}
                height={350}
                data={currentData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  fontSize={10} 
                  tickFormatter={(value) => {
                    if (chartView === "daily") {
                      try {
                        return new Date(value).getDate().toString();
                      } catch {
                        return value;
                      }
                    }
                    // For monthly, truncate long month names
                    return value.length > 8 ? value.substring(0, 3) : value;
                  }}
                  interval={chartView === "daily" ? 2 : 0}
                  angle={chartView === "monthly" ? -45 : 0}
                  textAnchor={chartView === "monthly" ? "end" : "middle"}
                  height={chartView === "monthly" ? 80 : 30}
                />
                <YAxis fontSize={12} />
                <Tooltip 
                  labelFormatter={(value) => {
                    if (chartView === "daily") {
                      try {
                        return new Date(value).toLocaleDateString("id-ID", { day: 'numeric', month: 'long' });
                      } catch {
                        return value;
                      }
                    }
                    return value;
                  }}
                />
                <Legend />
                <Bar dataKey="masuk" name="Barang Masuk" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="keluar" name="Barang Keluar" fill="#fca5a5" radius={[4, 4, 0, 0]} />
              </BarChart>
            )}
          </CardContent>
        </Card>

        {/* Stock Distribution Chart (Right - 1/3 width) */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Jumlah Stok per Gudang</CardTitle>
          </CardHeader>
          <CardContent ref={pieChartRef}>
            {stockDistribution.length === 0 || stockDistribution.every(s => Number(s.value) === 0) ? (
              <div className="h-[350px] flex items-center justify-center text-gray-500">
                Tidak ada data stok.
              </div>
            ) : (
              <PieChart width={pieChartWidth > 0 ? pieChartWidth : 300} height={350}>
                <Pie
                  data={stockDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {stockDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
