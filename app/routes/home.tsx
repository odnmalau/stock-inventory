import { Layout } from "../components/Layout";
import { StatsCard } from "../components/StatsCard";
import { Card, CardContent, CardHeader, CardTitle } from "../components/Card";
import { Package, ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { useLoaderData, Form, useSubmit } from "react-router";
import { query } from "../db.server";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { Badge } from "../components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { DashboardCharts } from "../components/DashboardCharts";
import { Checkbox } from "../components/ui/checkbox";
import { useState } from "react";

export async function loader({ request }: { request: Request }) {
  const { requireUserId, getUser } = await import("~/services/auth.server");
  await requireUserId(request);
  
  const url = new URL(request.url);
  const gudang_ids_raw = url.searchParams.getAll("gudang_ids[]");
  // Sanitize: ensure all IDs are numeric strings
  const gudang_ids = gudang_ids_raw.filter(id => /^\d+$/.test(id));

  const warehouses = await query("SELECT id, nama_gudang FROM warehouses ORDER BY nama_gudang ASC");
  
  // Fetch user for greeting
  const user = await getUser(request);
  const userEmail = user?.email || "User";

  // Base queries
  let inboundSql = "SELECT COUNT(*) as count FROM transactions_in";
  let outboundSql = "SELECT COUNT(*) as count FROM transactions_out";
  let recentSql = `
    (SELECT 'Masuk' as type, t.created_at, p.nama_barang, t.jumlah_masuk as jumlah, t.kode_barang, w.nama_gudang
     FROM transactions_in t 
     JOIN products p ON t.kode_barang = p.kode_barang
     JOIN warehouses w ON t.gudang_id = w.id
     ${gudang_ids.length > 0 ? `WHERE t.gudang_id IN (${gudang_ids.map(() => '?').join(',')})` : ''})
    UNION ALL
    (SELECT 'Keluar' as type, t.created_at, p.nama_barang, t.jumlah_keluar as jumlah, t.kode_barang, w.nama_gudang
     FROM transactions_out t 
     JOIN products p ON t.kode_barang = p.kode_barang
     JOIN warehouses w ON t.asal_gudang_id = w.id
     ${gudang_ids.length > 0 ? `WHERE t.asal_gudang_id IN (${gudang_ids.map(() => '?').join(',')})` : ''})
    ORDER BY created_at DESC
    LIMIT 10
  `;

  // Daily Data (All transactions, grouped by date - last 30 entries)
  let dailyInSql = `
    SELECT DATE(tanggal_masuk) as date, SUM(jumlah_masuk) as total 
    FROM transactions_in 
    ${gudang_ids.length > 0 ? `WHERE gudang_id IN (${gudang_ids.map(() => '?').join(',')})` : ''}
    GROUP BY DATE(tanggal_masuk)
    ORDER BY date DESC
    LIMIT 30
  `;
  let dailyOutSql = `
    SELECT DATE(tanggal_keluar) as date, SUM(jumlah_keluar) as total 
    FROM transactions_out 
    ${gudang_ids.length > 0 ? `WHERE asal_gudang_id IN (${gudang_ids.map(() => '?').join(',')})` : ''}
    GROUP BY DATE(tanggal_keluar)
    ORDER BY date DESC
    LIMIT 30
  `;

  // Monthly Data (All transactions, grouped by month - last 12 entries)
  let monthlyInSql = `
    SELECT DATE_FORMAT(tanggal_masuk, '%Y-%m') as month, SUM(jumlah_masuk) as total 
    FROM transactions_in 
    ${gudang_ids.length > 0 ? `WHERE gudang_id IN (${gudang_ids.map(() => '?').join(',')})` : ''}
    GROUP BY DATE_FORMAT(tanggal_masuk, '%Y-%m')
    ORDER BY month DESC
    LIMIT 12
  `;
  let monthlyOutSql = `
    SELECT DATE_FORMAT(tanggal_keluar, '%Y-%m') as month, SUM(jumlah_keluar) as total 
    FROM transactions_out 
    ${gudang_ids.length > 0 ? `WHERE asal_gudang_id IN (${gudang_ids.map(() => '?').join(',')})` : ''}
    GROUP BY DATE_FORMAT(tanggal_keluar, '%Y-%m')
    ORDER BY month DESC
    LIMIT 12
  `;

  const inboundParams: any[] = [];
  const outboundParams: any[] = [];

  if (gudang_ids.length > 0) {
    inboundSql += ` WHERE gudang_id IN (${gudang_ids.map(() => '?').join(',')})`;
    inboundParams.push(...gudang_ids);
    outboundSql += ` WHERE asal_gudang_id IN (${gudang_ids.map(() => '?').join(',')})`;
    outboundParams.push(...gudang_ids);
  }

  const [products] = await query("SELECT COUNT(*) as count FROM products");
  const [inbound] = await query(inboundSql, inboundParams);
  const [outbound] = await query(outboundSql, outboundParams);
  
  const recentParams = gudang_ids.length > 0 ? [...gudang_ids, ...gudang_ids] : [];
  const recentTransactions = await query(recentSql, recentParams);
  
  const dailyInParams = gudang_ids.length > 0 ? gudang_ids : [];
  const dailyOutParams = gudang_ids.length > 0 ? gudang_ids : [];
  const monthlyInParams = gudang_ids.length > 0 ? gudang_ids : [];
  const monthlyOutParams = gudang_ids.length > 0 ? gudang_ids : [];
  
  const dailyIn = await query(dailyInSql, dailyInParams) as any[];
  const dailyOut = await query(dailyOutSql, dailyOutParams) as any[];
  const monthlyIn = await query(monthlyInSql, monthlyInParams) as any[];
  const monthlyOut = await query(monthlyOutSql, monthlyOutParams) as any[];

  // Process Daily Data - build from actual data
  const dailyDataMap = new Map<string, { date: string, masuk: number, keluar: number }>();
  
  // First add all dates from inbound
  dailyIn.forEach((row: any) => {
    let dateStr = row.date;
    if (row.date instanceof Date) dateStr = row.date.toISOString().split('T')[0];
    else if (typeof row.date === 'string' && row.date.includes('T')) dateStr = row.date.split('T')[0];
    if (!dailyDataMap.has(dateStr)) {
      dailyDataMap.set(dateStr, { date: dateStr, masuk: 0, keluar: 0 });
    }
    dailyDataMap.get(dateStr)!.masuk = Number(row.total);
  });
  
  // Then add/update with outbound
  dailyOut.forEach((row: any) => {
    let dateStr = row.date;
    if (row.date instanceof Date) dateStr = row.date.toISOString().split('T')[0];
    else if (typeof row.date === 'string' && row.date.includes('T')) dateStr = row.date.split('T')[0];
    if (!dailyDataMap.has(dateStr)) {
      dailyDataMap.set(dateStr, { date: dateStr, masuk: 0, keluar: 0 });
    }
    dailyDataMap.get(dateStr)!.keluar = Number(row.total);
  });
  
  // Sort by date and convert to array
  const dailyData = Array.from(dailyDataMap.values()).sort((a, b) => a.date.localeCompare(b.date));

  // Process Monthly Data - build from actual data
  const monthlyDataMap = new Map<string, { date: string, masuk: number, keluar: number }>();
  
  // Helper function to convert month key to display name
  const monthKeyToName = (monthKey: string) => {
    const [year, month] = monthKey.split('-').map(Number);
    const d = new Date(year, month - 1);
    return d.toLocaleDateString("id-ID", { month: 'long', year: 'numeric' });
  };
  
  // Add all months from inbound
  monthlyIn.forEach((row: any) => {
    if (!monthlyDataMap.has(row.month)) {
      monthlyDataMap.set(row.month, { date: monthKeyToName(row.month), masuk: 0, keluar: 0 });
    }
    monthlyDataMap.get(row.month)!.masuk = Number(row.total);
  });
  
  // Add/update with outbound
  monthlyOut.forEach((row: any) => {
    if (!monthlyDataMap.has(row.month)) {
      monthlyDataMap.set(row.month, { date: monthKeyToName(row.month), masuk: 0, keluar: 0 });
    }
    monthlyDataMap.get(row.month)!.keluar = Number(row.total);
  });
  
  // Sort by month key and convert to array
  const monthlyData = Array.from(monthlyDataMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([_, value]) => value);

  // Stock Distribution
  const stockDistributionRaw = await query(`
    SELECT w.nama_gudang as name, COALESCE(SUM(s.stok), 0) as value
    FROM warehouses w
    LEFT JOIN inventory_stocks s ON w.id = s.warehouse_id
    GROUP BY w.id, w.nama_gudang
  `) as any[];
  // Convert value to number (MySQL sometimes returns as string)
  const stockDistribution = stockDistributionRaw.map((s: any) => ({ name: s.name, value: Number(s.value) }));

  return {
    totalProducts: (products as any).count,
    totalInbound: (inbound as any).count,
    totalOutbound: (outbound as any).count,
    recentTransactions: recentTransactions as any[],
    warehouses: warehouses as any[],
    gudang_ids,
    dailyData,
    monthlyData,
    stockDistribution,
  };
}

export default function Home() {
  const { totalProducts, totalInbound, totalOutbound, recentTransactions, warehouses, gudang_ids, dailyData, monthlyData, stockDistribution } = useLoaderData<typeof loader>();
  const submit = useSubmit();

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col gap-2">
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatsCard
            title="Total Produk"
            value={totalProducts}
            icon={Package}
            description="Item terdaftar (Global)"
          />
          <StatsCard
            title="Total Transaksi Masuk"
            value={totalInbound}
            icon={ArrowDownLeft}
            description={gudang_ids.length > 0 ? `${gudang_ids.length} gudang terpilih` : "Semua gudang"}
          />
          <StatsCard
            title="Total Transaksi Keluar"
            value={totalOutbound}
            icon={ArrowUpRight}
            description={gudang_ids.length > 0 ? `${gudang_ids.length} gudang terpilih` : "Semua gudang"}
          />
        </div>

        {/* Charts Section */}
        <DashboardCharts 
          dailyData={dailyData} 
          monthlyData={monthlyData} 
          warehouses={warehouses} 
          gudang_ids={gudang_ids}
          stockDistribution={stockDistribution}
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="col-span-1 lg:col-span-2">
            <CardHeader>
              <CardTitle>10 Transaksi Terakhir</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Tipe</TableHead>
                    <TableHead>Kode</TableHead>
                    <TableHead>Nama Barang</TableHead>
                    <TableHead>Gudang</TableHead>
                    <TableHead className="text-right">Jumlah</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentTransactions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-gray-500">
                        Belum ada transaksi.
                      </TableCell>
                    </TableRow>
                  ) : (
                    recentTransactions.map((t: any, i: number) => (
                      <TableRow key={i}>
                        <TableCell>{new Date(t.created_at).toLocaleDateString("id-ID")}</TableCell>
                        <TableCell>
                          <Badge variant={t.type === 'Masuk' ? 'default' : 'destructive'}>
                            {t.type}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">{t.kode_barang}</TableCell>
                        <TableCell>{t.nama_barang}</TableCell>
                        <TableCell>{t.nama_gudang}</TableCell>
                        <TableCell className="text-right">{t.jumlah}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
