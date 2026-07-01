"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input, PrimaryButton, Select } from "@/components/ui/form";
import { CatalogItemModal } from "@/components/catalog/catalog-item-modal";
import { CATALOG_CATEGORIES } from "@/lib/catalog-categories";
import type { CatalogItemRecord } from "@/lib/actions/catalog-items";
import { formatCurrency } from "@/lib/utils";

export function CatalogItemsLibrary({ items }: { items: CatalogItemRecord[] }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<CatalogItemRecord | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((item) => {
      const matchesSearch =
        !q ||
        item.name.toLowerCase().includes(q) ||
        item.code.toLowerCase().includes(q);
      const matchesCategory = !category || item.category === category;
      return matchesSearch && matchesCategory;
    });
  }, [items, search, category]);

  function openCreate() {
    setEditing(null);
    setModalOpen(true);
  }

  function openEdit(item: CatalogItemRecord) {
    setEditing(item);
    setModalOpen(true);
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative min-w-[200px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search by name or code…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-auto"
        >
          <option value="">All categories</option>
          {CATALOG_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </Select>
        <PrimaryButton type="button" onClick={openCreate} className="ml-auto">
          <span className="inline-flex items-center gap-1.5">
            <Plus className="h-4 w-4" />
            New item
          </span>
        </PrimaryButton>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-100 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3 font-medium">Code</th>
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-5 py-3 font-medium">Category</th>
                <th className="px-5 py-3 font-medium">Unit</th>
                <th className="px-5 py-3 text-right font-medium">Unit price</th>
                <th className="px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-8 text-center text-sm text-slate-400"
                  >
                    No catalog items match.
                  </td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr
                    key={item.id}
                    className="cursor-pointer hover:bg-slate-50/60"
                    onClick={() => openEdit(item)}
                  >
                    <td className="px-5 py-3 font-medium text-slate-900">
                      {item.code}
                    </td>
                    <td className="px-5 py-3 text-slate-700">{item.name}</td>
                    <td className="px-5 py-3 text-slate-500">
                      {item.category}
                    </td>
                    <td className="px-5 py-3 text-slate-500">{item.unit}</td>
                    <td className="px-5 py-3 text-right tabular-nums text-slate-900">
                      {formatCurrency(item.unitPrice)}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={
                          item.active
                            ? "text-xs font-medium text-emerald-600"
                            : "text-xs font-medium text-slate-400"
                        }
                      >
                        {item.active ? "Active" : "Inactive"}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <CatalogItemModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        item={editing}
        onSaved={() => router.refresh()}
      />
    </div>
  );
}
