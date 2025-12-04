import { Layout } from "../components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "../components/Card";
import { Form, redirect, useLoaderData, useSubmit, useSearchParams, useActionData } from "react-router";
import { query, withTransaction, txQuery } from "../db.server";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../components/ui/dialog";
import { InboundForm } from "../components/InboundForm";
import { Plus, Edit, Trash2, Download } from "lucide-react";

export async function loader({ request }: { request: Request }) {
  const { requireUserId } = await import("~/services/auth.server");
  await requireUserId(request);
  const url = new URL(request.url);
  const gudang_filter = url.searchParams.get("gudang_filter") || "";
  const actionParam = url.searchParams.get("action");
  const idParam = url.searchParams.get("id");
  
  const products = await query("SELECT kode_barang, nama_barang, kategori, satuan, COALESCE((SELECT SUM(stok) FROM inventory_stocks WHERE kode_barang = products.kode_barang), 0) as stok_saat_ini FROM products ORDER BY nama_barang ASC");
  const warehouses = await query("SELECT id, nama_gudang FROM warehouses ORDER BY nama_gudang ASC");
  
  let recentSql = `
    SELECT t.*, p.nama_barang, p.kategori, p.satuan, w.nama_gudang 
    FROM transactions_in t
    JOIN products p ON t.kode_barang = p.kode_barang
    JOIN warehouses w ON t.gudang_id = w.id
    ${gudang_filter ? 'WHERE t.gudang_id = ?' : ''}
    ORDER BY t.created_at DESC
    LIMIT 20
  `;
  const recentParams = gudang_filter ? [gudang_filter] : [];
  const recentTransactions = await query(recentSql, recentParams);

  let editingTransaction = null;
  if ((actionParam === "edit" || actionParam === "delete") && idParam) {
    const [trans] = await query("SELECT * FROM transactions_in WHERE id = ?", [idParam]);
    if (trans) {
        editingTransaction = trans;
    }
  }

  return { products: products as any[], warehouses: warehouses as any[], recentTransactions: recentTransactions as any[], gudang_filter, editingTransaction };
}

export async function action({ request }: { request: Request }) {
  const formData = await request.formData();
  const intent = formData.get("intent");

  try {
    if (intent === "delete") {
        const id = formData.get("id");
        
        await withTransaction(async (conn) => {
            const [trans] = await txQuery(conn, "SELECT * FROM transactions_in WHERE id = ?", [id]);
            if (trans) {
                const t = trans as any;
                
                // Validate stock before delete to prevent negative stock
                const [currentStock] = await txQuery(conn,
                    "SELECT COALESCE(stok, 0) as stok FROM inventory_stocks WHERE kode_barang = ? AND warehouse_id = ? FOR UPDATE",
                    [t.kode_barang, t.gudang_id]
                ) as any[];
                
                const availableStock = currentStock?.stok || 0;
                if (availableStock < t.jumlah_masuk) {
                    throw new Error(`Tidak bisa menghapus. Stok saat ini (${availableStock}) lebih kecil dari jumlah masuk (${t.jumlah_masuk}). Mungkin ada transaksi keluar yang sudah menggunakan stok ini.`);
                }
                
                await txQuery(conn, "UPDATE inventory_stocks SET stok = stok - ? WHERE kode_barang = ? AND warehouse_id = ?", [t.jumlah_masuk, t.kode_barang, t.gudang_id]);
                await txQuery(conn, "UPDATE products SET stok_saat_ini = stok_saat_ini - ? WHERE kode_barang = ?", [t.jumlah_masuk, t.kode_barang]);
                await txQuery(conn, "DELETE FROM transactions_in WHERE id = ?", [id]);
            }
        });
        
        return redirect("/inbound");
    }

    if (intent === "update") {
        const id = formData.get("id");
        const original_jumlah_masuk = Number(formData.get("original_jumlah_masuk"));
        const original_gudang_id = formData.get("original_gudang_id");
        const original_kode_barang = formData.get("original_kode_barang");
        
        const tanggal_masuk = formData.get("tanggal_masuk");
        const jumlah_masuk = Number(formData.get("jumlah_masuk"));
        const penerima = formData.get("penerima");

        const stockDifference = jumlah_masuk - original_jumlah_masuk;

        await withTransaction(async (conn) => {
            // 1. Revert old stock (Subtract from current stock, because we added it previously)
            // Wait, inbound means we ADDED stock. So to revert, we must SUBTRACT.
            // But wait, if we subtract, we must check if we have enough to subtract.
            
            // Logic:
            // Old transaction: Added 10.
            // New transaction: Add 15.
            // Net change: +5.
            // We can just apply net change?
            // Or strictly: Revert old (Subtract 10), Apply new (Add 15).
            
            // If we revert old (Subtract 10), we must check if stock >= 10.
            // Because maybe we added 10, then sold 10. Stock is 0.
            // If we try to edit inbound to be 5.
            // Revert 10 -> Stock -10 (Error).
            // So we cannot simply revert if stock is used.
            
            // Correct Logic for Inbound Edit:
            // We effectively "un-buy" the items.
            // Check if current stock >= original_jumlah_masuk.
            
            const [currentStock] = await txQuery(conn,
                "SELECT COALESCE(stok, 0) as stok FROM inventory_stocks WHERE kode_barang = ? AND warehouse_id = ? FOR UPDATE",
                [original_kode_barang, original_gudang_id]
            ) as any[];
            
            const availableStock = currentStock?.stok || 0;
            
            if (availableStock < original_jumlah_masuk) {
                 throw new Error(`Tidak bisa mengubah transaksi: Stok saat ini (${availableStock}) lebih kecil dari jumlah masuk awal (${original_jumlah_masuk}). Barang mungkin sudah keluar.`);
            }

            // 1. Revert old stock
            await txQuery(conn, "UPDATE inventory_stocks SET stok = stok - ? WHERE kode_barang = ? AND warehouse_id = ?", [original_jumlah_masuk, original_kode_barang, original_gudang_id]);
            await txQuery(conn, "UPDATE products SET stok_saat_ini = stok_saat_ini - ? WHERE kode_barang = ?", [original_jumlah_masuk, original_kode_barang]);

            // 2. Update transaction record
            await txQuery(conn,
                "UPDATE transactions_in SET tanggal_masuk = ?, jumlah_masuk = ?, penerima = ? WHERE id = ?",
                [tanggal_masuk, jumlah_masuk, penerima, id]
            );

            // 3. Apply new stock
            await txQuery(conn,
                `INSERT INTO inventory_stocks (kode_barang, warehouse_id, stok)
                 VALUES (?, ?, ?)
                 ON DUPLICATE KEY UPDATE stok = stok + ?`,
                [original_kode_barang, original_gudang_id, jumlah_masuk, jumlah_masuk]
            );
            await txQuery(conn, "UPDATE products SET stok_saat_ini = stok_saat_ini + ? WHERE kode_barang = ?", [jumlah_masuk, original_kode_barang]);
        });

        return redirect("/inbound");
    }

    if (intent === "create") {
        const tanggal_masuk = formData.get("tanggal_masuk");
        const kode_barang = formData.get("kode_barang");
        const jumlah_masuk = Number(formData.get("jumlah_masuk"));
        const gudang_id = formData.get("gudang_id");
        const penerima = formData.get("penerima"); 

        await withTransaction(async (conn) => {
            await txQuery(conn,
                "INSERT INTO transactions_in (tanggal_masuk, kode_barang, jumlah_masuk, gudang_id, penerima) VALUES (?, ?, ?, ?, ?)",
                [tanggal_masuk, kode_barang, jumlah_masuk, gudang_id, penerima]
            );

            await txQuery(conn,
                `INSERT INTO inventory_stocks (kode_barang, warehouse_id, stok)
                VALUES (?, ?, ?)
                ON DUPLICATE KEY UPDATE stok = stok + ?`,
                [kode_barang, gudang_id, jumlah_masuk, jumlah_masuk]
            );

            await txQuery(conn,
                "UPDATE products SET stok_saat_ini = stok_saat_ini + ? WHERE kode_barang = ?",
                [jumlah_masuk, kode_barang]
            );
        });

        return redirect("/inbound");
    }
  } catch (error: any) {
    console.error(error);
    return { error: error.message || "Gagal menyimpan transaksi." };
  }
  return null;
}

export default function Inbound() {
  const { products, warehouses, recentTransactions, gudang_filter, editingTransaction } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const submit = useSubmit();
  const [searchParams, setSearchParams] = useSearchParams();

  const actionParam = searchParams.get("action");
  const isAddOpen = actionParam === "new";
  const isEditOpen = actionParam === "edit";
  const isDeleteOpen = actionParam === "delete";

  const closeDialog = () => {
    const newParams = new URLSearchParams(searchParams);
    newParams.delete("action");
    newParams.delete("id");
    setSearchParams(newParams);
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex gap-2 ml-auto">
                <Button className="gap-2" onClick={() => setSearchParams(prev => {
                    const p = new URLSearchParams(prev);
                    p.set("action", "new");
                    return p;
                })}>
                    <Plus size={16} />
                    Input Barang Masuk
                </Button>
            </div>
        </div>

        {/* History Table */}
        <div className="w-full">
            <Card className="h-full">
                <CardHeader>
                    <div className="flex flex-row items-center justify-between">
                        <div className="w-[200px]">
                            <Form method="get" onChange={(e) => submit(e.currentTarget)}>
                                <Select name="gudang_filter" defaultValue={gudang_filter || "all"} onValueChange={(val) => {
                                    const fd = new FormData();
                                    if (val !== "all") fd.set("gudang_filter", val);
                                    submit(fd);
                                }}>
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Semua Gudang" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Semua Gudang</SelectItem>
                                        {warehouses.map((w: any) => (
                                            <SelectItem key={w.id} value={String(w.id)}>
                                                {w.nama_gudang}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </Form>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Tanggal</TableHead>
                                <TableHead>Kode</TableHead>
                                <TableHead>Nama Barang</TableHead>
                                <TableHead>Jenis</TableHead>
                                <TableHead>Satuan</TableHead>
                                <TableHead>Gudang</TableHead>
                                <TableHead className="text-right">Jumlah</TableHead>
                                <TableHead className="text-right">Aksi</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {recentTransactions.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="text-center text-gray-500">Belum ada data transaksi.</TableCell>
                                </TableRow>
                            ) : (
                                recentTransactions.map((t: any) => (
                                    <TableRow key={t.id}>
                                        <TableCell>{new Date(t.tanggal_masuk).toLocaleDateString("id-ID")}</TableCell>
                                        <TableCell className="font-medium">{t.kode_barang}</TableCell>
                                        <TableCell>{t.nama_barang}</TableCell>
                                        <TableCell>{t.kategori}</TableCell>
                                        <TableCell>{t.satuan}</TableCell>
                                        <TableCell>{t.nama_gudang}</TableCell>
                                        <TableCell className="text-right font-bold">{t.jumlah_masuk}</TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-primary" onClick={() => setSearchParams(prev => {
                                                    const p = new URLSearchParams(prev);
                                                    p.set("action", "edit");
                                                    p.set("id", t.id);
                                                    return p;
                                                })}>
                                                    <Edit size={16} />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setSearchParams(prev => {
                                                    const p = new URLSearchParams(prev);
                                                    p.set("action", "delete");
                                                    p.set("id", t.id);
                                                    return p;
                                                })}>
                                                    <Trash2 size={16} />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>

        {/* Create Dialog */}
        <Dialog open={isAddOpen} onOpenChange={(open) => !open && closeDialog()}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Input Barang Masuk</DialogTitle>
                    <DialogDescription>
                        Isi form di bawah ini untuk mencatat barang masuk.
                    </DialogDescription>
                </DialogHeader>
                {actionData?.error && (
                    <div className="bg-destructive/10 text-destructive p-3 rounded-md text-sm">
                        {actionData.error}
                    </div>
                )}
                <InboundForm 
                    products={products} 
                    warehouses={warehouses} 
                    onCancel={closeDialog} 
                />
            </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={isEditOpen} onOpenChange={(open) => !open && closeDialog()}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Edit Barang Masuk</DialogTitle>
                    <DialogDescription>
                        Ubah informasi transaksi barang masuk.
                    </DialogDescription>
                </DialogHeader>
                {actionData?.error && (
                    <div className="bg-destructive/10 text-destructive p-3 rounded-md text-sm">
                        {actionData.error}
                    </div>
                )}
                {editingTransaction ? (
                    <InboundForm 
                        defaultValues={editingTransaction}
                        products={products} 
                        warehouses={warehouses} 
                        isEditing
                        onCancel={closeDialog} 
                    />
                ) : (
                    <div className="py-4 text-center">Memuat data...</div>
                )}
            </DialogContent>
        </Dialog>

        {/* Delete Dialog */}
        <Dialog open={isDeleteOpen} onOpenChange={(open) => !open && closeDialog()}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Hapus Transaksi?</DialogTitle>
                    <DialogDescription>
                        Apakah Anda yakin ingin menghapus transaksi ini? Stok barang akan dikembalikan (dikurangi).
                        Tindakan ini tidak dapat dibatalkan.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button variant="outline" onClick={closeDialog}>Batal</Button>
                    <Form method="post">
                        <input type="hidden" name="intent" value="delete" />
                        <input type="hidden" name="id" value={searchParams.get("id") || ""} />
                        <Button type="submit" variant="destructive">Hapus</Button>
                    </Form>
                </DialogFooter>
            </DialogContent>
        </Dialog>

      </div>
    </Layout>
  );
}
