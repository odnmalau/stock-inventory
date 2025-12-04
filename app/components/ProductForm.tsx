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

interface ProductFormProps {
  defaultValues?: {
    kode_barang: string;
    nama_barang: string;
    kategori: string;
    satuan: string;
    stok_minimal: number;
    stok_saat_ini: number;
  };
  isEditing?: boolean;
  onCancel?: () => void;
  categories?: string[];
  units?: string[];
}

export function ProductForm({ 
  defaultValues, 
  isEditing = false, 
  onCancel,
  categories = [],
  units = []
}: ProductFormProps) {
  return (
    <Form method="post" className="space-y-4">
      <input type="hidden" name="intent" value={isEditing ? "update" : "create"} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="kode_barang">Kode Barang</Label>
          <Input
            type="text"
            id="kode_barang"
            name="kode_barang"
            defaultValue={defaultValues?.kode_barang}
            readOnly={isEditing}
            required
            disabled={isEditing}
          />
          {isEditing && <input type="hidden" name="original_kode_barang" value={defaultValues?.kode_barang} />}
        </div>

        <div className="space-y-2">
          <Label htmlFor="kategori">Kategori</Label>
          <Select name="kategori" defaultValue={defaultValues?.kategori}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Pilih Kategori" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="nama_barang">Nama Barang</Label>
          <Input
            type="text"
            id="nama_barang"
            name="nama_barang"
            defaultValue={defaultValues?.nama_barang}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="satuan">Satuan</Label>
          <Select name="satuan" defaultValue={defaultValues?.satuan}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Pilih Satuan" />
            </SelectTrigger>
            <SelectContent>
              {units.map((unit) => (
                <SelectItem key={unit} value={unit}>
                  {unit}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="stok_minimal">Stok Minimal</Label>
          <Input
            type="number"
            id="stok_minimal"
            name="stok_minimal"
            defaultValue={defaultValues?.stok_minimal ?? 0}
            min="0"
          />
        </div>
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
