import { Form, useSubmit } from "react-router";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { useState, useEffect } from "react";

interface OutboundFormProps {
  defaultValues?: {
    id?: number;
    tanggal_keluar: string;
    kode_barang: string;
    jumlah_keluar: number;
    asal_gudang_id: number;
    penanggung_jawab?: string;
  };
  products: any[];
  warehouses: any[];
  isEditing?: boolean;
  onCancel?: () => void;
  onProductChange?: (val: string) => void;
}

export function OutboundForm({
  defaultValues,
  products,
  warehouses,
  isEditing = false,
  onCancel,
  onProductChange
}: OutboundFormProps) {
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  useEffect(() => {
    if (defaultValues?.kode_barang) {
      const product = products.find((p) => p.kode_barang === defaultValues.kode_barang);
      setSelectedProduct(product);
    }
  }, [defaultValues, products]);

  const handleProductChange = (val: string) => {
    const product = products.find((p) => p.kode_barang === val);
    setSelectedProduct(product);
    if (onProductChange) {
        onProductChange(val);
    }
  };

  return (
    <Form method="post" className="space-y-4">
      <input type="hidden" name="intent" value={isEditing ? "update" : "create"} />
      {isEditing && <input type="hidden" name="id" value={defaultValues?.id} />}
      {isEditing && <input type="hidden" name="original_jumlah_keluar" value={defaultValues?.jumlah_keluar} />}
      {isEditing && <input type="hidden" name="original_asal_gudang_id" value={defaultValues?.asal_gudang_id} />}
      {isEditing && <input type="hidden" name="original_kode_barang" value={defaultValues?.kode_barang} />}

      <div className="space-y-2">
        <Label htmlFor="tanggal_keluar">Tanggal Keluar</Label>
        <Input
          type="date"
          id="tanggal_keluar"
          name="tanggal_keluar"
          required
          defaultValue={defaultValues?.tanggal_keluar ? new Date(defaultValues.tanggal_keluar).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="kode_barang">Produk</Label>
        <Select 
            name="kode_barang" 
            required 
            onValueChange={handleProductChange}
            defaultValue={defaultValues?.kode_barang}
            disabled={isEditing}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Pilih Produk..." />
          </SelectTrigger>
          <SelectContent>
            {products.map((p: any) => (
              <SelectItem key={p.kode_barang} value={p.kode_barang}>
                {p.kode_barang} - {p.nama_barang}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {isEditing && <input type="hidden" name="kode_barang" value={defaultValues?.kode_barang} />}
      </div>

      {/* Info Barang Card (Auto-show) */}
      {selectedProduct && (
        <div className="p-4 bg-muted border rounded-lg space-y-2 text-sm">
          <h4 className="font-semibold">Info Barang</h4>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="text-muted-foreground">Nama:</span> {selectedProduct.nama_barang}
            </div>
            <div>
              <span className="text-muted-foreground">Kategori:</span> {selectedProduct.kategori}
            </div>
            <div>
              <span className="text-muted-foreground">Satuan:</span> {selectedProduct.satuan}
            </div>
            <div>
              <span className="text-muted-foreground">Total Stok:</span> {selectedProduct.stok_saat_ini}
            </div>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="asal_gudang_id">Asal Gudang</Label>
        <Select 
            name="asal_gudang_id" 
            required 
            defaultValue={defaultValues?.asal_gudang_id ? String(defaultValues.asal_gudang_id) : undefined}
            disabled={isEditing || !selectedProduct}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder={selectedProduct ? "Pilih Gudang..." : "Pilih Produk Terlebih Dahulu"} />
          </SelectTrigger>
          <SelectContent>
            {warehouses.length === 0 ? (
                <SelectItem value="none" disabled>Tidak ada stok tersedia</SelectItem>
            ) : (
                warehouses.map((w: any) => (
                <SelectItem key={w.id} value={String(w.id)}>
                    {w.nama_gudang} {w.stok !== undefined ? `(Stok: ${w.stok})` : ''}
                </SelectItem>
                ))
            )}
          </SelectContent>
        </Select>
        {isEditing && <input type="hidden" name="asal_gudang_id" value={defaultValues?.asal_gudang_id} />}
        {selectedProduct && warehouses.length === 0 && !isEditing && (
            <p className="text-sm text-destructive">Produk ini tidak memiliki stok di gudang manapun.</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="jumlah_keluar">Jumlah Keluar</Label>
        <Input
          type="number"
          id="jumlah_keluar"
          name="jumlah_keluar"
          min="1"
          required
          defaultValue={defaultValues?.jumlah_keluar}
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="penanggung_jawab">Penanggung Jawab</Label>
        <Input
          type="text"
          id="penanggung_jawab"
          name="penanggung_jawab"
          required
          defaultValue={defaultValues?.penanggung_jawab}
        />
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel || (() => window.history.back())}
        >
          Batal
        </Button>
        <Button type="submit">
          Simpan
        </Button>
      </div>
    </Form>
  );
}
