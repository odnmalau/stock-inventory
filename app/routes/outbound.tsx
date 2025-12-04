import { Layout } from "../components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "../components/Card";
import { Form, redirect, useLoaderData, useActionData, useSubmit, useSearchParams } from "react-router";
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
import { OutboundForm } from "../components/OutboundForm";
import { Plus, Edit, Trash2, Download } from "lucide-react";
import { useState, useEffect } from "react";

export async function loader({ request }: { request: Request }) {
  const { requireUserId } = await import("~/services/auth.server");
  await requireUserId(request);
  const url = new URL(request.url);
  const selectedProduct = url.searchParams.get("kode_barang");
  const actionParam = url.searchParams.get("action");
  const idParam = url.searchParams.get("id");

  const products = await query("SELECT kode_barang, nama_barang, kategori, satuan, COALESCE((SELECT SUM(stok) FROM inventory_stocks WHERE kode_barang = products.kode_barang), 0) as stok_saat_ini FROM products ORDER BY nama_barang ASC");
  
  let warehouses: any[] = [];
  if (selectedProduct) {
    // Smart Dropdown: Only fetch warehouses that have stock for this product
    warehouses = await query(`
      SELECT w.id, w.nama_gudang, s.stok 
      FROM warehouses w
      JOIN inventory_stocks s ON w.id = s.warehouse_id
      WHERE s.kode_barang = ? AND s.stok > 0
      ORDER BY w.nama_gudang ASC
    `, [selectedProduct]) as any[];
  } else {
    // Fallback if no product selected (though UI should prevent this)
    warehouses = await query("SELECT id, nama_gudang FROM warehouses ORDER BY nama_gudang ASC") as any[];
  }

  // Fetch recent outbound transactions
  const recentTransactions = await query(`
    SELECT t.*, p.nama_barang, p.kategori, p.satuan, w.nama_gudang 
    FROM transactions_out t
    JOIN products p ON t.kode_barang = p.kode_barang
    JOIN warehouses w ON t.asal_gudang_id = w.id
    ORDER BY t.created_at DESC
    LIMIT 20
  `);

  let editingTransaction = null;
  if ((actionParam === "edit" || actionParam === "delete") && idParam) {
    const [trans] = await query("SELECT * FROM transactions_out WHERE id = ?", [idParam]);
    if (trans) {
        editingTransaction = trans;
        // If editing, we might need to fetch warehouses for the product in the transaction
        // But since we disable editing product/warehouse, we might not strictly need it for the dropdown
        // However, for display purposes, it's good.
        // The loader logic above relies on ?kode_barang=...
        // If we are editing, we might not have that param set in URL yet unless we set it when opening modal.
        // We'll handle this in the component side by setting URL param when opening edit.
    }
  }

  return { products: products as any[], warehouses, selectedProduct, recentTransactions: recentTransactions as any[], editingTransaction };
}

export async function action({ request }: { request: Request }) {
  const formData = await request.formData();
  const intent = formData.get("intent");

  try {
    if (intent === "delete") {
        const id = formData.get("id");
        
        await withTransaction(async (conn) => {
            // Get transaction data
            const [trans] = await txQuery(conn, "SELECT * FROM transactions_out WHERE id = ?", [id]);
            if (trans) {
                const t = trans as any;
                // Add stock back to warehouse
                await txQuery(conn, "UPDATE inventory_stocks SET stok = stok + ? WHERE kode_barang = ? AND warehouse_id = ?", [t.jumlah_keluar, t.kode_barang, t.asal_gudang_id]);
                // Add stock back to global product
                await txQuery(conn, "UPDATE products SET stok_saat_ini = stok_saat_ini + ? WHERE kode_barang = ?", [t.jumlah_keluar, t.kode_barang]);
                // Delete transaction
                await txQuery(conn, "DELETE FROM transactions_out WHERE id = ?", [id]);
            }
        });
        
        return redirect("/outbound");
    }

    if (intent === "update") {
        const id = formData.get("id");
        const original_jumlah_keluar = Number(formData.get("original_jumlah_keluar"));
        const original_asal_gudang_id = formData.get("original_asal_gudang_id");
        const original_kode_barang = formData.get("original_kode_barang");
        
        const tanggal_keluar = formData.get("tanggal_keluar");
        const jumlah_keluar = Number(formData.get("jumlah_keluar"));
        const penanggung_jawab = formData.get("penanggung_jawab");

        const result = await withTransaction(async (conn) => {
            // 1. Revert old stock (Add back)
            await txQuery(conn, "UPDATE inventory_stocks SET stok = stok + ? WHERE kode_barang = ? AND warehouse_id = ?", [original_jumlah_keluar, original_kode_barang, original_asal_gudang_id]);
            await txQuery(conn, "UPDATE products SET stok_saat_ini = stok_saat_ini + ? WHERE kode_barang = ?", [original_jumlah_keluar, original_kode_barang]);

            // 2. Check if new quantity is available (with lock)
            const [stock] = await txQuery(conn,
                "SELECT stok FROM inventory_stocks WHERE kode_barang = ? AND warehouse_id = ? FOR UPDATE", 
                [original_kode_barang, original_asal_gudang_id]
            );
            
            if (!stock || (stock as any).stok < jumlah_keluar) {
                throw new Error("Stok di gudang ini tidak mencukupi untuk jumlah baru!");
            }

            // 3. Update transaction record
            await txQuery(conn,
                "UPDATE transactions_out SET tanggal_keluar = ?, jumlah_keluar = ?, penanggung_jawab = ? WHERE id = ?",
                [tanggal_keluar, jumlah_keluar, penanggung_jawab, id]
            );

            // 4. Apply new stock (Subtract)
            await txQuery(conn, "UPDATE inventory_stocks SET stok = stok - ? WHERE kode_barang = ? AND warehouse_id = ?", [jumlah_keluar, original_kode_barang, original_asal_gudang_id]);
            await txQuery(conn, "UPDATE products SET stok_saat_ini = stok_saat_ini - ? WHERE kode_barang = ?", [jumlah_keluar, original_kode_barang]);
            
            return { success: true };
        });

        return redirect("/outbound");
    }

    if (intent === "create") {
        const tanggal_keluar = formData.get("tanggal_keluar");
        const kode_barang = formData.get("kode_barang");
        const jumlah_keluar = Number(formData.get("jumlah_keluar"));
        const asal_gudang_id = formData.get("asal_gudang_id");
        const penanggung_jawab = formData.get("penanggung_jawab");

        await withTransaction(async (conn) => {
            // Check and lock stock row to prevent race condition
            const [stock] = await txQuery(conn,
                "SELECT stok FROM inventory_stocks WHERE kode_barang = ? AND warehouse_id = ? FOR UPDATE", 
                [kode_barang, asal_gudang_id]
            );
            
            if (!stock || (stock as any).stok < jumlah_keluar) {
                throw new Error("Stok di gudang ini tidak mencukupi!");
            }

            // Insert transaction
            await txQuery(conn,
                "INSERT INTO transactions_out (tanggal_keluar, kode_barang, jumlah_keluar, asal_gudang_id, penanggung_jawab) VALUES (?, ?, ?, ?, ?)",
                [tanggal_keluar, kode_barang, jumlah_keluar, asal_gudang_id, penanggung_jawab]
            );

            // Update inventory_stocks
            await txQuery(conn,
                "UPDATE inventory_stocks SET stok = stok - ? WHERE kode_barang = ? AND warehouse_id = ?",
                [jumlah_keluar, kode_barang, asal_gudang_id]
            );

            // Sync legacy column
            await txQuery(conn,
                "UPDATE products SET stok_saat_ini = stok_saat_ini - ? WHERE kode_barang = ?",
                [jumlah_keluar, kode_barang]
            );
        });

        return redirect("/outbound");
    }
  } catch (error: any) {
    console.error(error);
    return { error: error.message || "Gagal menyimpan transaksi." };
  }
  return null;
}

export default function Outbound() {
  const { products, warehouses, selectedProduct, recentTransactions, editingTransaction } = useLoaderData<typeof loader>();
  const actionData = useActionData<{ error?: string }>();
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
    // We might want to keep kode_barang if it was set for filtering, or clear it.
    // For now, let's keep it if we are just closing dialog, but maybe clear it if we want fresh start.
    // Let's clear it to be safe and clean.
    newParams.delete("kode_barang");
    setSearchParams(newParams);
  };

  const handleProductChange = (val: string) => {
    // Trigger loader reload to fetch relevant warehouses
    // We need to update URL param
    setSearchParams(prev => {
        const p = new URLSearchParams(prev);
        p.set("kode_barang", val);
        return p;
    });
  };

  // When opening edit, we might want to set the product so warehouses are fetched?
  // But since we disabled editing product/warehouse, maybe not strictly needed for the dropdown to work (it will show selected value).
  // However, if we want to show "Stok: ..." in the dropdown, we need warehouses fetched.
  // So let's try to set kode_barang when editingTransaction is present.


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
                    Input Barang Keluar
                </Button>
            </div>
        </div>
        
        {/* History Table */}
        <Card>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Kode</TableHead>
                  <TableHead>Nama Barang</TableHead>
                  <TableHead>Jenis</TableHead>
                  <TableHead>Satuan</TableHead>
                  <TableHead>Gudang Asal</TableHead>
                  <TableHead>Penanggung Jawab</TableHead>
                  <TableHead className="text-right">Jumlah</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentTransactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-gray-500">
                      Belum ada transaksi.
                    </TableCell>
                  </TableRow>
                ) : (
                  recentTransactions.map((t: any) => (
                    <TableRow key={t.id}>
                      <TableCell className="text-sm">{new Date(t.tanggal_keluar).toLocaleDateString("id-ID")}</TableCell>
                      <TableCell className="font-medium">{t.kode_barang}</TableCell>
                      <TableCell>{t.nama_barang}</TableCell>
                      <TableCell>{t.kategori}</TableCell>
                      <TableCell>{t.satuan}</TableCell>
                      <TableCell>{t.nama_gudang}</TableCell>
                      <TableCell className="text-sm">{t.penanggung_jawab}</TableCell>
                      <TableCell className="text-right font-bold">{t.jumlah_keluar}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-primary" onClick={() => setSearchParams(prev => {
                                const p = new URLSearchParams(prev);
                                p.set("action", "edit");
                                p.set("id", t.id);
                                // Also set kode_barang so warehouses are fetched for the form
                                p.set("kode_barang", t.kode_barang);
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

        {/* Create Dialog */}
        <Dialog open={isAddOpen} onOpenChange={(open) => !open && closeDialog()}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Input Barang Keluar</DialogTitle>
                    <DialogDescription>
                        Isi form di bawah ini untuk mencatat barang keluar.
                    </DialogDescription>
                </DialogHeader>
                {actionData?.error && (
                    <div className="bg-destructive/10 text-destructive p-3 rounded-md text-sm">
                        {actionData.error}
                    </div>
                )}
                <OutboundForm 
                    products={products} 
                    warehouses={warehouses} 
                    onCancel={closeDialog}
                    onProductChange={handleProductChange}
                    defaultValues={selectedProduct ? { kode_barang: selectedProduct } as any : undefined}
                />
            </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={isEditOpen} onOpenChange={(open) => !open && closeDialog()}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Edit Barang Keluar</DialogTitle>
                    <DialogDescription>
                        Ubah informasi transaksi barang keluar.
                    </DialogDescription>
                </DialogHeader>
                {actionData?.error && (
                    <div className="bg-destructive/10 text-destructive p-3 rounded-md text-sm">
                        {actionData.error}
                    </div>
                )}
                {editingTransaction ? (
                    <OutboundForm 
                        defaultValues={editingTransaction}
                        products={products} 
                        warehouses={warehouses} 
                        isEditing
                        onCancel={closeDialog}
                        onProductChange={handleProductChange}
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
                        Apakah Anda yakin ingin menghapus transaksi ini? Stok barang akan dikembalikan (ditambahkan kembali).
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
