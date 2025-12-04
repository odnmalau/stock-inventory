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
  
  if (startDate && endDate && startDate > endDate) {
      const temp = startDate;
      startDate = endDate;
      endDate = temp;
  }
  const kode_barang = url.searchParams.get("kode_barang") || "";

  let data: any[] = [];
  let initialBalance = 0;
  let productName = "";

  if (kode_barang) {
    // Get product name
    const [product] = await query("SELECT nama_barang FROM products WHERE kode_barang = ?", [kode_barang]) as any[];
    productName = product?.nama_barang || "";

    // 1. Calculate Initial Balance (Stok Awal) before startDate
    let inBalSql = "SELECT SUM(jumlah_masuk) as total FROM transactions_in WHERE kode_barang = ? AND tanggal_masuk < ?";
    let outBalSql = "SELECT SUM(jumlah_keluar) as total FROM transactions_out WHERE kode_barang = ? AND tanggal_keluar < ?";
    let opnameBalSql = "SELECT SUM(selisih) as total FROM stock_opname WHERE kode_barang = ? AND is_adjusted = 1 AND tanggal < ?";
    
    const balParams = [kode_barang, startDate || '1970-01-01'];

    if (startDate) {
        const [inSum] = await query(inBalSql, balParams);
        const [outSum] = await query(outBalSql, balParams);
        const [opnameSum] = await query(opnameBalSql, balParams);
        
        initialBalance = (Number((inSum as any).total) || 0) 
                       - (Number((outSum as any).total) || 0)
                       + (Number((opnameSum as any).total) || 0);
    }

    // 2. Fetch Transactions within period
    let inSql = "SELECT 'Masuk' as type, tanggal_masuk as tanggal, jumlah_masuk as jumlah, created_at, gudang_id as warehouse_id, w.nama_gudang FROM transactions_in JOIN warehouses w ON transactions_in.gudang_id = w.id WHERE kode_barang = ?";
    let outSql = "SELECT 'Keluar' as type, tanggal_keluar as tanggal, jumlah_keluar as jumlah, created_at, asal_gudang_id as warehouse_id, w.nama_gudang FROM transactions_out JOIN warehouses w ON transactions_out.asal_gudang_id = w.id WHERE kode_barang = ?";
    let opnameSql = "SELECT 'Opname' as type, tanggal, selisih as jumlah, created_at, warehouse_id, w.nama_gudang FROM stock_opname JOIN warehouses w ON stock_opname.warehouse_id = w.id WHERE kode_barang = ? AND is_adjusted = 1";

    const params: any[] = [kode_barang];
    const opnameParams: any[] = [kode_barang];

    if (startDate) {
        inSql += " AND tanggal_masuk >= ?";
        outSql += " AND tanggal_keluar >= ?";
        opnameSql += " AND tanggal >= ?";
        params.push(startDate);
        opnameParams.push(startDate);
    }
    if (endDate) {
        inSql += " AND tanggal_masuk <= ?";
        outSql += " AND tanggal_keluar <= ?";
        opnameSql += " AND tanggal <= ?";
        params.push(endDate);
        opnameParams.push(endDate);
    }

    const transactionsIn = await query(inSql, params);
    const transactionsOut = await query(outSql, params);
    const transactionsOpname = await query(opnameSql, opnameParams);
    
    // Merge and sort
    data = [
        ...(transactionsIn as any[]), 
        ...(transactionsOut as any[]),
        ...(transactionsOpname as any[])
    ].sort((a, b) => {
        const dateA = new Date(a.tanggal).getTime();
        const dateB = new Date(b.tanggal).getTime();
        return dateA - dateB || new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    });

    // 3. Calculate Running Balance
    let currentBalance = initialBalance;
    data = data.map(row => {
        if (row.type === 'Masuk') {
            currentBalance += row.jumlah;
        } else if (row.type === 'Keluar') {
            currentBalance -= row.jumlah;
        } else if (row.type === 'Opname') {
            currentBalance += row.jumlah; // selisih can be negative
        }
        return { ...row, saldo: currentBalance };
    });
  }

  return { data, startDate, endDate, kode_barang, initialBalance, productName };
}

export default function StockCard() {
  const { data, startDate, endDate, kode_barang, initialBalance, productName } = useLoaderData<typeof loader>();
  const [searchParams] = useSearchParams();
  
  // Only show table if form has been submitted
  const hasSubmitted = searchParams.has("kode_barang") && kode_barang !== "";

  return (
    <Layout>
      <div className="space-y-6">
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            {hasSubmitted && (
              <div className="no-print">
                <Button variant="outline" onClick={() => window.print()}>
                  Cetak Laporan
                </Button>
              </div>
            )}
          </CardHeader>
          <CardContent>
            <Form method="get" className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <div className="space-y-2">
                <Label>Kode Barang</Label>
                <Input
                  type="text"
                  name="kode_barang"
                  placeholder="Masukkan kode barang..."
                  defaultValue={kode_barang}
                  required
                />
              </div>
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
          <CardHeader>
            <CardTitle className="text-lg">
              {productName ? `${kode_barang} - ${productName}` : kode_barang}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Keterangan</TableHead>
                  <TableHead>Gudang</TableHead>
                  <TableHead className="text-right">Masuk</TableHead>
                  <TableHead className="text-right">Keluar</TableHead>
                  <TableHead className="text-right">Saldo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* Initial Balance Row */}
                <TableRow className="bg-muted/50 font-medium">
                    <TableCell colSpan={3}>Stok Awal Periode</TableCell>
                    <TableCell className="text-right">-</TableCell>
                    <TableCell className="text-right">-</TableCell>
                    <TableCell className="text-right">{initialBalance}</TableCell>
                </TableRow>

                {data.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-gray-500">
                      Tidak ada transaksi dalam periode ini.
                    </TableCell>
                  </TableRow>
                ) : (
                  data.map((row: any, i: number) => {
                    let masuk = '-';
                    let keluar = '-';
                    let keterangan = row.type;

                    if (row.type === 'Masuk') {
                        masuk = row.jumlah;
                    } else if (row.type === 'Keluar') {
                        keluar = row.jumlah;
                    } else if (row.type === 'Opname') {
                        keterangan = `Opname (Selisih ${row.jumlah > 0 ? '+' : ''}${row.jumlah})`;
                        if (row.jumlah > 0) {
                            masuk = row.jumlah;
                        } else {
                            keluar = Math.abs(row.jumlah).toString();
                        }
                    }

                    return (
                        <TableRow key={i}>
                        <TableCell>{new Date(row.tanggal).toLocaleDateString("id-ID")}</TableCell>
                        <TableCell>
                            <Badge 
                                variant={row.type === 'Keluar' || (row.type === 'Opname' && row.jumlah < 0) ? 'destructive' : (row.type === 'Opname' ? 'secondary' : 'default')} 
                            >
                            {keterangan}
                            </Badge>
                        </TableCell>
                        <TableCell>{row.nama_gudang}</TableCell>
                        <TableCell className="text-right">{masuk}</TableCell>
                        <TableCell className="text-right">{keluar}</TableCell>
                        <TableCell className="text-right font-bold">{row.saldo}</TableCell>
                        </TableRow>
                    );
                  })
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
