import { Layout } from "../components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "../components/Card";
import { Form, redirect, useLoaderData, useSubmit, useNavigation, useActionData } from "react-router";
import { query, withTransaction, txQuery } from "../db.server";
import { useState, useEffect, useRef } from "react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Checkbox } from "../components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { Search, Save, Trash2, FileDown } from "lucide-react";

export async function loader({ request }: { request: Request }) {
  const { requireUserId } = await import("~/services/auth.server");
  await requireUserId(request);
  const url = new URL(request.url);
  const warehouse_id = url.searchParams.get("warehouse_id");
  const code = url.searchParams.get("code");
  const tanggal = url.searchParams.get("tanggal") || new Date().toISOString().split('T')[0];
  const history_search = url.searchParams.get("history_search") || "";
  const history_status = url.searchParams.get("history_status") || "all";

  const warehouses = await query("SELECT id, nama_gudang FROM warehouses ORDER BY nama_gudang ASC");
  
  let product = null;
  if (warehouse_id && code) {
    const [p] = await query(`
      SELECT p.kode_barang, p.nama_barang, COALESCE(s.stok, 0) as stok_sistem 
      FROM products p 
      LEFT JOIN inventory_stocks s ON p.kode_barang = s.kode_barang AND s.warehouse_id = ?
      WHERE p.kode_barang = ? OR p.nama_barang LIKE ?
      LIMIT 1
    `, [warehouse_id, code, `%${code}%`]) as any[];
    product = p || null;
  }

  let historySql = `
    SELECT so.*, p.nama_barang, w.nama_gudang 
    FROM stock_opname so
    JOIN products p ON so.kode_barang = p.kode_barang
    LEFT JOIN warehouses w ON so.warehouse_id = w.id
    WHERE 1=1
  `;
  const historyParams: any[] = [];

  if (history_search) {
    historySql += " AND (so.kode_barang LIKE ? OR p.nama_barang LIKE ?)";
    historyParams.push(`%${history_search}%`, `%${history_search}%`);
  }
  if (history_status === "adjusted") {
    historySql += " AND so.is_adjusted = 1";
  } else if (history_status === "not_adjusted") {
    historySql += " AND so.is_adjusted = 0";
  }
  
  historySql += " ORDER BY so.created_at DESC LIMIT 50";
  const history = await query(historySql, historyParams) as any[];

  return { product, warehouses: warehouses as any[], warehouse_id, code, tanggal, history, history_search, history_status };
}

export async function action({ request }: { request: Request }) {
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "delete") {
      const id = formData.get("id");
      
      try {
          await withTransaction(async (conn) => {
              const [record] = await txQuery(conn, "SELECT * FROM stock_opname WHERE id_opname = ?", [id]) as any[];
              
              if (record && record.is_adjusted) {
                  // Validate stock before reduction if selisih is positive (meaning we added stock previously)
                  if (record.selisih > 0) {
                      const [currentStock] = await txQuery(conn, 
                          "SELECT stok FROM inventory_stocks WHERE kode_barang = ? AND warehouse_id = ? FOR UPDATE",
                          [record.kode_barang, record.warehouse_id]
                      ) as any[];
                      
                      const available = currentStock?.stok || 0;
                      if (available < record.selisih) {
                          throw new Error(`Gagal menghapus: Stok saat ini (${available}) tidak cukup untuk dikurangi sebesar ${record.selisih}.`);
                      }
                  }

                  await txQuery(conn,
                      "UPDATE inventory_stocks SET stok = stok - ? WHERE kode_barang = ? AND warehouse_id = ?",
                      [record.selisih, record.kode_barang, record.warehouse_id]
                  );
                  
                  const [total] = await txQuery(conn, "SELECT COALESCE(SUM(stok), 0) as total FROM inventory_stocks WHERE kode_barang = ?", [record.kode_barang]) as any[];
                  await txQuery(conn, "UPDATE products SET stok_saat_ini = ? WHERE kode_barang = ?", [total.total || 0, record.kode_barang]);
              }
              
              await txQuery(conn, "DELETE FROM stock_opname WHERE id_opname = ?", [id]);
          });
          return { success: true };
      } catch (error) {
          console.error(error);
          return { error: "Gagal menghapus data opname." };
      }
  }

  const tanggal = formData.get("tanggal");
  const warehouse_id = formData.get("warehouse_id");
  const petugas = formData.get("petugas");
  const kode_barang = formData.get("kode_barang");
  const stok_fisik = Number(formData.get("stok_fisik"));
  const stok_sistem = Number(formData.get("stok_sistem"));
  const catatan = formData.get("catatan");
  const is_adjusted = formData.get("is_adjusted") === "on";

  if (!warehouse_id || !kode_barang || isNaN(stok_fisik)) {
      return { error: "Data tidak valid." };
  }

  const selisih = stok_fisik - stok_sistem;

  try {
    await withTransaction(async (conn) => {
        await txQuery(conn,
            "INSERT INTO stock_opname (tanggal, kode_barang, warehouse_id, stok_sistem, stok_fisik, selisih, is_adjusted, petugas, catatan) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
            [tanggal, kode_barang, warehouse_id, stok_sistem, stok_fisik, selisih, is_adjusted, petugas, catatan]
        );

        if (is_adjusted) {
            // If selisih is negative (stok fisik < stok sistem), we are reducing stock.
            // Check if we have enough stock to reduce (though usually opname reflects reality, 
            // but if system thinks we have 10 and we say 5, we reduce 5. 
            // If system thinks we have 10 and we say -5 (impossible), but let's say logic error.
            // Actually, opname sets the stock TO the physical amount. 
            // So we don't strictly need to check if we have enough "to reduce", 
            // we just overwrite it. 
            // BUT, if we use INSERT ON DUPLICATE KEY UPDATE stok = VALUES(stok), it overwrites.
            // The previous logic was: ON DUPLICATE KEY UPDATE stok = ? (stok_fisik).
            // This is correct for opname (force set).
            // However, we should ensure the product exists in the warehouse or created.
            // The query handles insert.
            
            await txQuery(conn,
                `INSERT INTO inventory_stocks (kode_barang, warehouse_id, stok)
                 VALUES (?, ?, ?)
                 ON DUPLICATE KEY UPDATE stok = ?`,
                [kode_barang, warehouse_id, stok_fisik, stok_fisik]
            );
            
            const [total] = await txQuery(conn, "SELECT COALESCE(SUM(stok), 0) as total FROM inventory_stocks WHERE kode_barang = ?", [kode_barang]);
            await txQuery(conn, "UPDATE products SET stok_saat_ini = ? WHERE kode_barang = ?", [(total as any).total || 0, kode_barang]);
        }
    });

    return redirect(`/opname?warehouse_id=${warehouse_id}`);
  } catch (error) {
    console.error(error);
    return { error: "Gagal menyimpan data opname." };
  }
}

export default function Opname() {
  const { product, warehouses, warehouse_id, code, tanggal, history, history_search, history_status } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const submit = useSubmit();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  
  const [stokFisik, setStokFisik] = useState<string>("");
  const [selisih, setSelisih] = useState<number | null>(null);

  // Reset form when product changes
  useEffect(() => {
    if (product) {
        setStokFisik("");
        setSelisih(null);
    }
  }, [product]);

  const handleStokFisikChange = (val: string) => {
      setStokFisik(val);
      if (product && val !== "") {
          setSelisih(Number(val) - product.stok_sistem);
      } else {
          setSelisih(null);
      }
  };

  return (
    <Layout>
      <div className="space-y-6">
        
        <Card>
          <CardContent className="pt-6">
            {/* Search Section */}
            <Form method="get" className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="space-y-2">
                    <Label htmlFor="tanggal">Tanggal Opname</Label>
                    <Input
                        type="date"
                        id="tanggal"
                        name="tanggal" // Note: This is just for UI persistence if we wanted, but actually we need to pass it to the POST form. 
                                       // For GET search, we might want to keep it in URL or just rely on state. 
                                       // To keep it simple, we'll put it in the POST form primarily, 
                                       // but here we just show it.
                        defaultValue={tanggal}
                    />
                </div>
                
                <div className="space-y-2">
                    <Label htmlFor="warehouse_id">Gudang</Label>
                    <Select 
                        name="warehouse_id" 
                        defaultValue={warehouse_id || ""} 
                    >
                    <SelectTrigger>
                        <SelectValue placeholder="Pilih Gudang..." />
                    </SelectTrigger>
                    <SelectContent>
                        {warehouses.map((w: any) => (
                        <SelectItem key={w.id} value={String(w.id)}>
                            {w.nama_gudang}
                        </SelectItem>
                        ))}
                    </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="code">Kode / Nama Barang</Label>
                    <div className="flex gap-2">
                        <Input 
                            name="code" 
                            defaultValue={code || ""} 
                            placeholder="Cari barang..." 
                        />
                        <Button type="submit" variant="outline" size="icon">
                            <Search className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </Form>

            {/* Error Display */}
            {actionData?.error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm mb-4">
                    {actionData.error}
                </div>
            )}

            {/* Input Section - Only visible if product found */}
            {product ? (
                <Form method="post" className="space-y-6 border-t pt-6">
                    <input type="hidden" name="warehouse_id" value={warehouse_id || ""} />
                    <input type="hidden" name="kode_barang" value={product.kode_barang} />
                    <input type="hidden" name="stok_sistem" value={product.stok_sistem} />
                    {/* We need to pass the date again or capture it from the top input. 
                        For simplicity, let's duplicate the date input here hidden or just ask user to confirm.
                        Better: Use a controlled state for date or just put the date input inside this form?
                        The design shows date at top. Let's put a hidden input here that syncs or just another visible one if needed.
                        Actually, let's just put the main inputs here.
                    */}
                    <input type="hidden" name="tanggal" value={tanggal} /> 

                    <div className="space-y-2">
                        <Label>Nama Petugas</Label>
                        <Input name="petugas" placeholder="Nama Petugas" required />
                    </div>

                    <div className="p-4 bg-gray-50 rounded-lg space-y-4">
                        <h3 className="font-semibold text-gray-700">Stok</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label>Stok di Sistem</Label>
                                <Input value={product.stok_sistem} readOnly className="bg-muted" />
                            </div>
                            <div className="space-y-2">
                                <Label>Stok Fisik (Hasil Hitung)</Label>
                                <Input 
                                    name="stok_fisik" 
                                    type="number" 
                                    required 
                                    value={stokFisik}
                                    onChange={(e) => handleStokFisikChange(e.target.value)}
                                    autoFocus
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Selisih</Label>
                                <Input 
                                    value={selisih !== null ? selisih : ""} 
                                    readOnly 
                                    className={`font-bold ${selisih && selisih < 0 ? 'bg-destructive/10 text-destructive' : selisih && selisih > 0 ? 'bg-primary/10 text-primary' : 'bg-muted'}`} 
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Catatan (Opsional)</Label>
                            <Textarea name="catatan" placeholder="Contoh: Salah hitung di awal..." />
                        </div>

                        <div className="flex items-center space-x-2">
                            <Checkbox id="is_adjusted" name="is_adjusted" defaultChecked />
                            <label
                                htmlFor="is_adjusted"
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-destructive"
                            >
                                Ya, sesuaikan stok di sistem dengan hasil hitung fisik.
                            </label>
                        </div>
                    </div>

                    <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={() => window.location.href = '/opname'}>Batal</Button>
                        <Button type="submit" disabled={isSubmitting}>
                            <Save className="w-4 h-4 mr-2" />
                            {isSubmitting ? "Menyimpan..." : "Simpan Hasil"}
                        </Button>
                    </div>
                </Form>
            ) : (
                warehouse_id && code && (
                    <div className="text-center py-8 text-gray-500">
                        Produk tidak ditemukan di gudang ini.
                    </div>
                )
            )}
          </CardContent>
        </Card>

        {/* History Section */}
        <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
                <h2 className="text-xl font-semibold text-gray-700">Riwayat Stok Opname</h2>
                {/* Search and Export */}
                <Form method="get" className="flex gap-2 flex-wrap">
                    {/* Preserve existing params */}
                    {warehouse_id && <input type="hidden" name="warehouse_id" value={warehouse_id} />}
                    {code && <input type="hidden" name="code" value={code} />}
                    <input type="hidden" name="tanggal" value={tanggal} />
                    
                    <Input 
                        name="history_search"
                        placeholder="Cari kode atau nama barang..." 
                        className="w-[250px]" 
                        defaultValue={history_search}
                    />
                    <Select 
                        name="history_status" 
                        defaultValue={history_status}
                        onValueChange={(val) => {
                            const fd = new FormData();
                            if (warehouse_id) fd.set("warehouse_id", warehouse_id);
                            if (code) fd.set("code", code);
                            fd.set("tanggal", tanggal);
                            if (history_search) fd.set("history_search", history_search);
                            fd.set("history_status", val);
                            submit(fd);
                        }}
                    >
                        <SelectTrigger className="w-[200px] bg-white">
                            <SelectValue placeholder="Semua Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Semua Status</SelectItem>
                            <SelectItem value="adjusted">Disesuaikan</SelectItem>
                            <SelectItem value="not_adjusted">Tidak Disesuaikan</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button type="submit" variant="outline"><Search className="w-4 h-4" /></Button>
                    <Button 
                        type="button"
                        variant="outline"
                        asChild
                    >
                        <a href="/reports/export?type=opname" target="_blank" rel="noreferrer">
                            <FileDown className="w-4 h-4 mr-2" /> Export
                        </a>
                    </Button>
                </Form>
            </div>

            <div className="bg-white rounded-md border shadow-sm overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Tanggal</TableHead>
                            <TableHead>Kode Barang</TableHead>
                            <TableHead>Nama Barang</TableHead>
                            <TableHead>Gudang</TableHead>
                            <TableHead className="text-center">Sistem</TableHead>
                            <TableHead className="text-center">Fisik</TableHead>
                            <TableHead className="text-center">Selisih</TableHead>
                            <TableHead>Penyesuaian</TableHead>
                            <TableHead>Petugas</TableHead>
                            <TableHead>Catatan</TableHead>
                            <TableHead className="text-center">Aksi</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {history.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={11} className="text-center py-8 text-gray-500">
                                    Belum ada riwayat opname.
                                </TableCell>
                            </TableRow>
                        ) : (
                            history.map((item: any) => (
                                <TableRow key={item.id_opname}>
                                    <TableCell>{new Date(item.tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</TableCell>
                                    <TableCell className="font-medium">{item.kode_barang}</TableCell>
                                    <TableCell>{item.nama_barang}</TableCell>
                                    <TableCell>{item.nama_gudang}</TableCell>
                                    <TableCell className="text-center">{item.stok_sistem}</TableCell>
                                    <TableCell className="text-center">{item.stok_fisik}</TableCell>
                                    <TableCell className={`text-center font-bold ${item.selisih < 0 ? 'text-destructive' : item.selisih > 0 ? 'text-primary' : ''}`}>
                                        {item.selisih}
                                    </TableCell>
                                    <TableCell>
                                        <span className={`px-2 py-1 rounded text-xs ${item.is_adjusted ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                                            {item.is_adjusted ? 'Disesuaikan' : 'Tidak Disesuaikan'}
                                        </span>
                                    </TableCell>
                                    <TableCell>{item.petugas}</TableCell>
                                    <TableCell className="max-w-[200px] truncate" title={item.catatan}>{item.catatan || '-'}</TableCell>
                                    <TableCell className="text-center">
                                        <Form method="post" onSubmit={(e) => !confirm("Hapus riwayat ini?") && e.preventDefault()}>
                                            <input type="hidden" name="intent" value="delete" />
                                            <input type="hidden" name="id" value={item.id_opname} />
                                            <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </Form>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>

      </div>
    </Layout>
  );
}
