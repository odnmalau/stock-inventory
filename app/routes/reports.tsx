import { Layout } from "../components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "../components/Card";
import { Form, useLoaderData, useSearchParams } from "react-router";
import { query } from "../db.server";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Badge } from "../components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";

export async function loader({ request }: { request: Request }) {
  const { requireUserId } = await import("~/services/auth.server");
  await requireUserId(request);
  const url = new URL(request.url);
  let startDate = url.searchParams.get("startDate") || "";
  let endDate = url.searchParams.get("endDate") || "";

  // Validate dates
  if (startDate && endDate && startDate > endDate) {
      // Swap if start > end, or just reset. Let's swap for user convenience.
      const temp = startDate;
      startDate = endDate;
      endDate = temp;
  }

  let data: any[] = [];

  let sql = `
    SELECT o.*, p.nama_barang, w.nama_gudang
    FROM stock_opname o 
    JOIN products p ON o.kode_barang = p.kode_barang
    LEFT JOIN warehouses w ON o.warehouse_id = w.id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (startDate) {
    sql += " AND o.tanggal >= ?";
    params.push(startDate);
  }
  if (endDate) {
    sql += " AND o.tanggal <= ?";
    params.push(endDate);
  }
  sql += " ORDER BY o.tanggal DESC";
  data = await query(sql, params) as any[];

  return { data, startDate, endDate };
}

export default function Reports() {
  const { data, startDate, endDate } = useLoaderData<typeof loader>();
  const [searchParams] = useSearchParams();
  
  // Only show table if form has been submitted
  const hasSubmitted = searchParams.has("startDate") || searchParams.has("endDate");

  return (
    <Layout>
      <div className="space-y-6">
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            {hasSubmitted && (
              <div className="flex gap-2 no-print">
                <Button 
                  variant="outline" 
                  asChild
                >
                  <a 
                    href={`/reports/export?type=opname&startDate=${startDate}&endDate=${endDate}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Export CSV
                  </a>
                </Button>
                <Button variant="outline" onClick={() => window.print()}>
                  Cetak Laporan
                </Button>
              </div>
            )}
          </CardHeader>
          <CardContent>
            <Form method="get" className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <div className="space-y-2">
                <Label>Tanggal Awal</Label>
                <Input
                  type="date"
                  name="startDate"
                  defaultValue={startDate}
                />
              </div>
              <div className="space-y-2">
                <Label>Tanggal Akhir</Label>
                <Input
                  type="date"
                  name="endDate"
                  defaultValue={endDate}
                />
              </div>
              <div className="pb-0.5">
                <Button type="submit" className="w-full">
                  Tampilkan
                </Button>
              </div>
            </Form>
          </CardContent>
        </Card>

        {hasSubmitted && (
        <Card>
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Kode</TableHead>
                  <TableHead>Nama Barang</TableHead>
                  <TableHead>Gudang</TableHead>
                  <TableHead className="text-right">Sistem</TableHead>
                  <TableHead className="text-right">Fisik</TableHead>
                  <TableHead className="text-right">Selisih</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Petugas</TableHead>
                  <TableHead>Catatan</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center text-gray-500">
                      Tidak ada data laporan opname.
                    </TableCell>
                  </TableRow>
                ) : (
                  data.map((item: any) => (
                    <TableRow key={item.id_opname}>
                      <TableCell>{new Date(item.tanggal).toLocaleDateString("id-ID")}</TableCell>
                      <TableCell className="font-medium">{item.kode_barang}</TableCell>
                      <TableCell>{item.nama_barang}</TableCell>
                      <TableCell>{item.nama_gudang}</TableCell>
                      <TableCell className="text-right">{item.stok_sistem}</TableCell>
                      <TableCell className="text-right">{item.stok_fisik}</TableCell>
                      <TableCell className={`text-right font-bold ${item.selisih < 0 ? 'text-destructive' : item.selisih > 0 ? 'text-primary' : ''}`}>
                        {item.selisih > 0 ? `+${item.selisih}` : item.selisih}
                      </TableCell>
                      <TableCell>
                        <Badge variant={item.is_adjusted ? "default" : "secondary"}>
                          {item.is_adjusted ? "Disesuaikan" : "Hanya Catat"}
                        </Badge>
                      </TableCell>
                      <TableCell>{item.petugas}</TableCell>
                      <TableCell className="text-sm text-gray-500 italic">{item.catatan || "-"}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        )}
      </div>
    </Layout>
  );
}
