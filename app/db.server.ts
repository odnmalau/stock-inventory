import mysql from "mysql2/promise";
import type { PoolConnection, RowDataPacket, ResultSetHeader } from "mysql2/promise";

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "stock_inventory",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export async function query(sql: string, params: any[] = []) {
  const [results] = await pool.execute(sql, params);
  return results as any;
}

// Get a connection for manual transaction handling
export async function getConnection(): Promise<PoolConnection> {
  return pool.getConnection();
}

// Transaction wrapper - automatically handles commit/rollback
export async function withTransaction<T>(
  callback: (connection: PoolConnection) => Promise<T>
): Promise<T> {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

// Execute query within a transaction connection
export async function txQuery(
  connection: PoolConnection,
  sql: string,
  params: any[] = []
) {
  const [results] = await connection.execute(sql, params);
  return results as any;
}

// Helper to update product total stock
export async function updateProductStock(connection: PoolConnection, kode_barang: string) {
  const [total] = await connection.execute(
    "SELECT COALESCE(SUM(stok), 0) as total FROM inventory_stocks WHERE kode_barang = ?", 
    [kode_barang]
  ) as any[];
  
  await connection.execute(
    "UPDATE products SET stok_saat_ini = ? WHERE kode_barang = ?", 
    [(total as any).total || 0, kode_barang]
  );
}

export default pool;
