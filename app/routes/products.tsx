import { Layout } from "../components/Layout";
import { Card, CardContent, CardHeader } from "../components/Card";
import { Plus, Search, Edit, Trash2, Download } from "lucide-react";
import { Link, useLoaderData, Form, useSearchParams, useSubmit, redirect, useActionData } from "react-router";
import { query } from "../db.server";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { ProductForm } from "../components/ProductForm";

export async function loader({ request }: { request: Request }) {
  const { requireUserId } = await import("~/services/auth.server");
  await requireUserId(request);
  const url = new URL(request.url);
  const search = url.searchParams.get("q") || "";
  const status = url.searchParams.get("status") || "all";
  const page = Number(url.searchParams.get("page")) || 1;
  const actionParam = url.searchParams.get("action");
  const idParam = url.searchParams.get("id");
  
  const limit = 10;
  const offset = (page - 1) * limit;

  let sql = `
    SELECT p.*, COALESCE(SUM(s.stok), 0) as stok_saat_ini
    FROM products p
    LEFT JOIN inventory_stocks s ON p.kode_barang = s.kode_barang
  `;
  const params: any[] = [];

  let whereClauses = [];
  if (search) {
    whereClauses.push("(p.nama_barang LIKE ? OR p.kode_barang LIKE ?)");
    params.push(`%${search}%`, `%${search}%`);
  }
  
  if (whereClauses.length > 0) {
    sql += " WHERE " + whereClauses.join(" AND ");
  }

  sql += " GROUP BY p.kode_barang";

  if (status === "available") {
    sql += " HAVING stok_saat_ini > p.stok_minimal";
  } else if (status === "empty") {
    sql += " HAVING stok_saat_ini <= p.stok_minimal";
  }

  sql += " ORDER BY p.created_at DESC LIMIT ? OFFSET ?";
  params.push(limit, offset);

  let countSql = `SELECT COUNT(*) as total FROM (
    SELECT p.kode_barang, COALESCE(SUM(s.stok), 0) as stok_saat_ini
    FROM products p
    LEFT JOIN inventory_stocks s ON p.kode_barang = s.kode_barang
    ${whereClauses.length > 0 ? "WHERE " + whereClauses.join(" AND ") : ""}
    GROUP BY p.kode_barang
    ${status === "available" ? "HAVING stok_saat_ini > p.stok_minimal" : ""}
    ${status === "empty" ? "HAVING stok_saat_ini <= p.stok_minimal" : ""}
  ) as t`;
  
  const countParams = search ? [`%${search}%`, `%${search}%`] : [];

  const products = await query(sql, params);
  const [totalResult] = await query(countSql, countParams);
  const total = (totalResult as any).total;

  // Fetch specific product for edit/delete if needed
  let editingProduct = null;
  if ((actionParam === "edit" || actionParam === "delete") && idParam) {
    const [prod] = await query("SELECT * FROM products WHERE kode_barang = ?", [idParam]);
    if (prod) {
        // Also get current stock for the form
        const [stock] = await query("SELECT COALESCE(SUM(stok), 0) as stok FROM inventory_stocks WHERE kode_barang = ?", [idParam]);
        editingProduct = { ...prod as any, stok_saat_ini: (stock as any).stok };
    }
  }

  // Fetch categories and units for dropdowns
  const categoriesResult = await query("SELECT DISTINCT kategori FROM products WHERE kategori IS NOT NULL AND kategori != '' ORDER BY kategori ASC");
  const unitsResult = await query("SELECT DISTINCT satuan FROM products WHERE satuan IS NOT NULL AND satuan != '' ORDER BY satuan ASC");
  
  const categories = (categoriesResult as any[]).map(r => r.kategori);
  const units = (unitsResult as any[]).map(r => r.satuan);

  // Add default options if empty
  const defaultCategories = ["Elektronik", "Pakaian", "Makanan", "Minuman", "Lainnya"];
  const defaultUnits = ["Pcs", "Unit", "Kg", "Liter", "Box", "Lusin"];

  const finalCategories = Array.from(new Set([...defaultCategories, ...categories])).sort();
  const finalUnits = Array.from(new Set([...defaultUnits, ...units])).sort();

  return { 
    products: products as any[], 
    total, 
    page, 
    limit, 
    search, 
    status, 
    editingProduct,
    categories: finalCategories,
    units: finalUnits
  };
}

export async function action({ request }: { request: Request }) {
  const formData = await request.formData();
  const intent = formData.get("intent");

  try {
    if (intent === "create") {
        const kode_barang = formData.get("kode_barang");
        const nama_barang = formData.get("nama_barang");
        const kategori = formData.get("kategori");
        const satuan = formData.get("satuan");
        const stok_minimal = formData.get("stok_minimal");
        // stok_saat_ini removed from form, default to 0
        const stok_saat_ini = 0;

        await query(
          "INSERT INTO products (kode_barang, nama_barang, kategori, satuan, stok_minimal, stok_saat_ini) VALUES (?, ?, ?, ?, ?, ?)",
          [kode_barang, nama_barang, kategori, satuan, stok_minimal, stok_saat_ini]
        );
        return redirect("/products");
    }

    if (intent === "update") {
        const original_kode_barang = formData.get("original_kode_barang");
        const nama_barang = formData.get("nama_barang");
        const kategori = formData.get("kategori");
        const satuan = formData.get("satuan");
        const stok_minimal = formData.get("stok_minimal");
        
        await query(
          "UPDATE products SET nama_barang = ?, kategori = ?, satuan = ?, stok_minimal = ? WHERE kode_barang = ?",
          [nama_barang, kategori, satuan, stok_minimal, original_kode_barang]
        );
        return redirect("/products");
    }

    if (intent === "delete") {
      const kode_barang = formData.get("kode_barang");
      await query("DELETE FROM products WHERE kode_barang = ?", [kode_barang]);
      return redirect("/products");
    }
  } catch (error: any) {
    console.error(error);
    return { error: error.message || "Terjadi kesalahan saat menyimpan data." };
  }
  
  return null;
}

export default function Products() {
  const { products, total, page, limit, search, status, editingProduct, categories, units } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const [searchParams, setSearchParams] = useSearchParams();
  const submit = useSubmit();
  const totalPages = Math.ceil(total / limit);

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
             <Button variant="outline" className="gap-2" asChild>
              <a href="/products/export" target="_blank" rel="noreferrer">
                <Download size={16} />
                Export
              </a>
            </Button>
            <Button className="gap-2" onClick={() => setSearchParams(prev => {
                const p = new URLSearchParams(prev);
                p.set("action", "new");
                return p;
            })}>
                <Plus size={16} />
                Tambah Produk
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row items-center gap-4">
              <div className="relative flex-1 w-full md:max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <Form method="get" onChange={(e) => submit(e.currentTarget)} className="w-full">
                    <Input
                      type="text"
                      name="q"
                      defaultValue={search}
                      placeholder="Cari nama atau kode barang..."
                      className="pl-9 w-full"
                    />
                    <input type="hidden" name="status" value={status} />
                </Form>
              </div>
              <div className="w-full md:w-48">
                <Form method="get" onChange={(e) => submit(e.currentTarget)}>
                    <input type="hidden" name="q" value={search} />
                    <Select name="status" defaultValue={status} onValueChange={(val) => {
                        const fd = new FormData();
                        fd.set("q", search);
                        fd.set("status", val);
                        submit(fd);
                    }}>
                        <SelectTrigger>
                            <SelectValue placeholder="Filter Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Semua Status</SelectItem>
                            <SelectItem value="available">Tersedia</SelectItem>
                            <SelectItem value="empty">Barang Kosong</SelectItem>
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
                  <TableHead className="w-[50px]">No</TableHead>
                  <TableHead>Kode</TableHead>
                  <TableHead>Nama Barang</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead>Stok</TableHead>
                  <TableHead>Satuan</TableHead>
                  <TableHead>Stok Minimal</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-gray-500">
                      Tidak ada data produk.
                    </TableCell>
                  </TableRow>
                ) : (
                  products.map((product: any, index: number) => (
                    <TableRow key={product.kode_barang}>
                      <TableCell>{(page - 1) * limit + index + 1}</TableCell>
                      <TableCell className="font-medium">{product.kode_barang}</TableCell>
                      <TableCell>{product.nama_barang}</TableCell>
                      <TableCell>{product.kategori}</TableCell>
                      <TableCell>{product.stok_saat_ini}</TableCell>
                      <TableCell>{product.satuan}</TableCell>
                      <TableCell>{product.stok_minimal}</TableCell>
                      <TableCell>
                        {product.stok_saat_ini > product.stok_minimal ? (
                          <Badge variant="secondary">
                            Tersedia
                          </Badge>
                        ) : (
                          <Badge variant="destructive">
                            Barang Kosong
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-primary" onClick={() => setSearchParams(prev => {
                                const p = new URLSearchParams(prev);
                                p.set("action", "edit");
                                p.set("id", product.kode_barang);
                                return p;
                            })}>
                              <Edit size={16} />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setSearchParams(prev => {
                                const p = new URLSearchParams(prev);
                                p.set("action", "delete");
                                p.set("id", product.kode_barang);
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

            {/* Pagination */}
            <div className="flex items-center justify-between mt-4">
              <span className="text-sm text-gray-700">
                Halaman {page} dari {totalPages || 1}
              </span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" asChild disabled={page <= 1}>
                  <Link to={`?page=${page - 1}&q=${search}&status=${status}`} className={page <= 1 ? "pointer-events-none opacity-50" : ""}>
                    Previous
                  </Link>
                </Button>
                <Button variant="outline" size="sm" asChild disabled={page >= totalPages}>
                  <Link to={`?page=${page + 1}&q=${search}&status=${status}`} className={page >= totalPages ? "pointer-events-none opacity-50" : ""}>
                    Next
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Create Dialog */}
        <Dialog open={isAddOpen} onOpenChange={(open) => !open && closeDialog()}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Tambah Produk Baru</DialogTitle>
                    <DialogDescription>
                        Isi form di bawah ini untuk menambahkan produk baru.
                    </DialogDescription>
                </DialogHeader>
                {actionData?.error && (
                    <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
                        {actionData.error}
                    </div>
                )}
                <ProductForm onCancel={closeDialog} categories={categories} units={units} />
            </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={isEditOpen} onOpenChange={(open) => !open && closeDialog()}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Edit Produk</DialogTitle>
                    <DialogDescription>
                        Ubah informasi produk di bawah ini.
                    </DialogDescription>
                </DialogHeader>
                {actionData?.error && (
                    <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
                        {actionData.error}
                    </div>
                )}
                {editingProduct ? (
                    <ProductForm defaultValues={editingProduct} isEditing onCancel={closeDialog} categories={categories} units={units} />
                ) : (
                    <div className="py-4 text-center">Memuat data...</div>
                )}
            </DialogContent>
        </Dialog>

        {/* Delete Dialog */}
        <Dialog open={isDeleteOpen} onOpenChange={(open) => !open && closeDialog()}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Hapus Produk</DialogTitle>
                    <DialogDescription>
                        Apakah Anda yakin ingin menghapus produk ini? Tindakan ini tidak dapat dibatalkan.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                    {editingProduct && (
                        <div className="bg-gray-50 p-3 rounded-md">
                            <p className="font-medium">{editingProduct.nama_barang}</p>
                            <p className="text-sm text-gray-500">{editingProduct.kode_barang}</p>
                        </div>
                    )}
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={closeDialog}>Batal</Button>
                    <Form method="post">
                        <input type="hidden" name="intent" value="delete" />
                        <input type="hidden" name="kode_barang" value={searchParams.get("id") || ""} />
                        <Button type="submit" variant="destructive">Hapus</Button>
                    </Form>
                </DialogFooter>
            </DialogContent>
        </Dialog>

      </div>
    </Layout>
  );
}
