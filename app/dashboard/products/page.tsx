"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, ImageIcon } from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { DataTable, type Column } from "@/components/dashboard/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatCurrency } from "@/lib/utils";
import { toast } from "@/components/ui/use-toast";

interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  isPublished: boolean;
  images: string[];
  category?: { name: string } | null;
}

function StockBadge({ stock }: { stock: number }) {
  if (stock === 0) return <Badge variant="danger">Out</Badge>;
  if (stock <= 10) return <Badge variant="warning">{stock} left</Badge>;
  return <Badge variant="success">{stock}</Badge>;
}

export default function ProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [published, setPublished] = useState("all");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (published !== "all") params.set("published", published);
    const res = await fetch(`/api/products?${params}`);
    const data = await res.json();
    setProducts(
      (data.products ?? []).map((p: Product & { price: string | number }) => ({
        ...p,
        price: Number(p.price),
      })),
    );
    setLoading(false);
  }, [search, published]);

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [load]);

  async function confirmDelete() {
    if (!deleteId) return;
    const res = await fetch(`/api/products/${deleteId}`, { method: "DELETE" });
    setDeleteId(null);
    if (res.ok) {
      toast({ title: "Product deleted", variant: "success" });
      load();
    } else {
      toast({ title: "Delete failed", variant: "danger" });
    }
  }

  const columns: Column<Product>[] = [
    {
      key: "image",
      label: "",
      className: "w-12",
      render: (p) =>
        p.images[0] ? (
          <Image
            src={p.images[0]}
            alt=""
            width={40}
            height={40}
            className="h-10 w-10 rounded object-cover"
          />
        ) : (
          <div className="grid h-10 w-10 place-items-center rounded bg-gray-100 text-[#9ca3af]">
            <ImageIcon className="h-4 w-4" />
          </div>
        ),
    },
    { key: "name", label: "Name", render: (p) => <span className="font-medium">{p.name}</span> },
    { key: "category", label: "Category", render: (p) => p.category?.name ?? "—" },
    { key: "price", label: "Price", render: (p) => formatCurrency(p.price) },
    { key: "stock", label: "Stock", render: (p) => <StockBadge stock={p.stock} /> },
    {
      key: "status",
      label: "Status",
      render: (p) =>
        p.isPublished ? (
          <Badge variant="success">Published</Badge>
        ) : (
          <Badge variant="muted">Draft</Badge>
        ),
    },
    {
      key: "actions",
      label: "",
      render: (p) => (
        <div className="flex gap-1">
          <Link href={`/dashboard/products/${p.id}/edit`} onClick={(e) => e.stopPropagation()}>
            <Button size="icon" variant="ghost">
              <Pencil className="h-4 w-4" />
            </Button>
          </Link>
          <Button
            size="icon"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              setDeleteId(p.id);
            }}
          >
            <Trash2 className="h-4 w-4 text-danger" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="Products" subtitle="Manage your catalog">
        <Link href="/dashboard/products/new">
          <Button>
            <Plus className="h-4 w-4" /> Add product
          </Button>
        </Link>
      </PageHeader>

      <div className="mb-4 flex flex-wrap gap-3">
        <Input
          placeholder="Search products…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <Select value={published} onValueChange={setPublished}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All status</SelectItem>
            <SelectItem value="true">Published</SelectItem>
            <SelectItem value="false">Draft</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DataTable
        columns={columns}
        data={products}
        loading={loading}
        emptyMessage="No products yet."
        emptyAction={
          <Link href="/dashboard/products/new">
            <Button>
              <Plus className="h-4 w-4" /> Add your first product
            </Button>
          </Link>
        }
        onRowClick={(p) => router.push(`/dashboard/products/${p.id}/edit`)}
      />

      <Dialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete product?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-[#6b7280]">This action cannot be undone.</p>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setDeleteId(null)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={confirmDelete}>
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
