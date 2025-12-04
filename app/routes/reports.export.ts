import { query } from "../db.server";

export async function loader({ request }: { request: Request }) {
  const { requireUserId } = await import("~/services/auth.server");
  await requireUserId(request);
  
  const url = new URL(request.url);
  const type = url.searchParams.get("type") || "opname";
  const startDate = url.searchParams.get("startDate") || "";
  const endDate = url.searchParams.get("endDate") || "";
  const warehouse_id_param = url.searchParams.get("warehouse_id") || "";
  const warehouse_id = warehouse_id_param === "all" ? "" : warehouse_id_param;

  let data: any[] = [];
  let csvContent = "";

  if (type === "opname") {
    // Export Laporan Opname
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
    if (warehouse_id) {
      sql += " AND o.warehouse_id = ?";
      params.push(warehouse_id);
    }
    sql += " ORDER BY o.tanggal DESC";
    data = await query(sql, params) as any[];

    // Generate CSV
    const escapeCsv = (str: string | number | null | undefined) => {
        if (str === null || str === undefined) return "";
        const stringValue = String(str);
        if (stringValue.includes(",") || stringValue.includes('"') || stringValue.includes("\n")) {
            return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
    };

    csvContent = "Tanggal,Kode Barang,Nama Barang,Gudang,Stok Sistem,Stok Fisik,Selisih,Disesuaikan,Petugas,Catatan\n";
    data.forEach((row: any) => {
      const tanggal = new Date(row.tanggal).toLocaleDateString("id-ID");
      const disesuaikan = row.is_adjusted ? "Ya" : "Tidak";
      
      csvContent += [
          tanggal,
          row.kode_barang,
          row.nama_barang,
          row.nama_gudang,
          row.stok_sistem,
          row.stok_fisik,
          row.selisih,
          disesuaikan,
          row.petugas,
          row.catatan
      ].map(escapeCsv).join(",") + "\n";
    });
  }

  return new Response(csvContent, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="laporan_${type}_${new Date().toISOString().split('T')[0]}.csv"`,
    },
  });
}
