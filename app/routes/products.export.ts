import { query } from "../db.server";

export async function loader() {
  const products = await query("SELECT * FROM products ORDER BY nama_barang ASC");
  
  const csvRows = [
    ["Kode Barang", "Nama Barang", "Kategori", "Satuan", "Stok Minimal", "Stok Saat Ini"],
    ...(products as any[]).map((p) => [
      p.kode_barang,
      p.nama_barang,
      p.kategori,
      p.satuan,
      p.stok_minimal,
      p.stok_saat_ini,
    ]),
  ];

  const escapeCsv = (str: string | number | null | undefined) => {
      if (str === null || str === undefined) return "";
      const stringValue = String(str);
      if (stringValue.includes(",") || stringValue.includes('"') || stringValue.includes("\n")) {
          return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
  };

  const csvContent = csvRows.map((row) => row.map(escapeCsv).join(",")).join("\n");

  return new Response(csvContent, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": 'attachment; filename="products.csv"',
    },
  });
}
