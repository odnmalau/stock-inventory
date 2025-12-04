import { Layout } from "../components/Layout";
import { ProductForm } from "../components/ProductForm";
import { query } from "../db.server";
import { redirect, useLoaderData } from "react-router";

export async function loader({ params }: { params: { id: string } }) {
  const [product] = await query("SELECT * FROM products WHERE kode_barang = ?", [params.id]);
  
  if (!product) {
    throw new Response("Not Found", { status: 404 });
  }
  
  return { product: product as any };
}

export async function action({ request, params }: { request: Request; params: { id: string } }) {
  const formData = await request.formData();
  const nama_barang = formData.get("nama_barang");
  const kategori = formData.get("kategori");
  const satuan = formData.get("satuan");
  const stok_minimal = formData.get("stok_minimal");
  // stok_saat_ini is not updated here, only via transactions

  await query(
    "UPDATE products SET nama_barang = ?, kategori = ?, satuan = ?, stok_minimal = ? WHERE kode_barang = ?",
    [nama_barang, kategori, satuan, stok_minimal, params.id]
  );
  
  return redirect("/products");
}

export default function EditProduct() {
  const { product } = useLoaderData<typeof loader>();

  return (
    <Layout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Edit Produk</h1>
        <ProductForm defaultValues={product} isEditing />
      </div>
    </Layout>
  );
}
