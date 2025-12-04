import { Form } from "react-router";
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

interface InboundFormProps {
  defaultValues?: {
    id?: number;
    tanggal_masuk: string;
    kode_barang: string;
    jumlah_masuk: number;
    gudang_id: number;
    penerima?: string;
  };
  products: any[];
  warehouses: any[];
  isEditing?: boolean;
  onCancel?: () => void;
}

export function InboundForm({
  defaultValues,
  products,
  warehouses,
  isEditing = false,
  onCancel,
}: InboundFormProps) {
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
  };

  return (
    <Form method="post" className="space-y-4">
      <input type="hidden" name="intent" value={isEditing ? "update" : "create"} />
      {isEditing && <input type="hidden" name="id" value={defaultValues?.id} />}
      {isEditing && <input type="hidden" name="original_jumlah_masuk" value={defaultValues?.jumlah_masuk} />}
      {isEditing && <input type="hidden" name="original_gudang_id" value={defaultValues?.gudang_id} />}
      {isEditing && <input type="hidden" name="original_kode_barang" value={defaultValues?.kode_barang} />}

      <div className="space-y-2">
        <Label htmlFor="tanggal_masuk">Tanggal Masuk</Label>
        <Input
          type="date"
          id="tanggal_masuk"
          name="tanggal_masuk"
          required
          defaultValue={defaultValues?.tanggal_masuk ? new Date(defaultValues.tanggal_masuk).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]}
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
        <Label htmlFor="jumlah_masuk">Jumlah Masuk</Label>
        <Input
          type="number"
          id="jumlah_masuk"
          name="jumlah_masuk"
          min="1"
          required
          defaultValue={defaultValues?.jumlah_masuk}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="gudang_id">Gudang Tujuan</Label>
        <Select 
            name="gudang_id" 
            required 
            defaultValue={defaultValues?.gudang_id ? String(defaultValues.gudang_id) : undefined}
            disabled={isEditing}
        >
          <SelectTrigger className="w-full">
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
        {isEditing && <input type="hidden" name="gudang_id" value={defaultValues?.gudang_id} />}
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="penerima">Penerima</Label>
        <Input
          type="text"
          id="penerima"
          name="penerima"
          required
          defaultValue={defaultValues?.penerima}
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
