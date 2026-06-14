"use client";

import { useState } from "react";
import { Search, Download, Plus, ArrowUpDown, ChevronDown } from "lucide-react";
import type { InventoryItem } from "@/lib/types";
import { StatusBadge } from "@/components/shared/StatusBadge";
import Link from "next/link";
import * as XLSX from "xlsx";

const CATEGORY_ICONS: Record<string, string> = {
  Fabric: "🧵",
  Accessories: "🔩",
  Packaging: "📦",
  Garment: "👗",
  Thread: "🪡",
  Button: "🔘",
  Zipper: "🤐",
  General: "📋",
  Raw: "🌿",
  Material: "🧱",
};

function getCategoryIcon(cat: string): string {
  for (const [key, icon] of Object.entries(CATEGORY_ICONS)) {
    if (cat.toLowerCase().includes(key.toLowerCase())) return icon;
  }
  return "📦";
}

function exportToExcel(items: InventoryItem[]) {
  const rows = items.map((item) => ({
    "Item Name": item.name,
    Type: item.type,
    Category: item.cat,
    "Item Code": item.code,
    "Sales Price": item.sale,
    "Purchase Price": item.purchase,
    "Quantity (PCS)": item.qty,
    "Stock Status": item.critical
      ? "Out of Stock"
      : item.low
        ? "Low Stock"
        : "Normal",
  }));
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Inventory");
  XLSX.writeFile(wb, "inventory.xlsx");
}

function QtyBadge({ item }: { item: InventoryItem }) {
  if (item.critical) return <span className="text-[#d32f2f] font-semibold">0 PCS</span>;
  if (item.low) return <span className="text-[#e65100] font-semibold">{item.qty} PCS</span>;
  return <span className="text-gray-700">{item.qty} PCS</span>;
}

interface InventoryTableViewProps {
  items: InventoryItem[];
  onItemClick: (i: number) => void;
}

export function InventoryTableView({ items, onItemClick }: InventoryTableViewProps) {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  // Build category summary from real items
  const categoryMap = items.reduce<Record<string, number>>((acc, it) => {
    acc[it.cat] = (acc[it.cat] ?? 0) + 1;
    return acc;
  }, {});
  const categories = Object.entries(categoryMap).map(([name, count]) => ({
    name,
    count,
    icon: getCategoryIcon(name),
  }));

  const filtered = items.filter((it) => {
    const matchSearch = search
      ? it.name.toLowerCase().includes(search.toLowerCase())
      : true;
    const matchCat = activeCategory ? it.cat === activeCategory : true;
    return matchSearch && matchCat;
  });

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2.5 px-5 py-3 border-b border-[#f0f0f0] bg-white flex-shrink-0">
        <span className="text-[17px] font-bold text-[#1a1a1a]">
          Items List{" "}
          <span className="text-[14px] font-normal text-gray-400">({items.length})</span>
        </span>
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => exportToExcel(items)}
            className="flex items-center gap-1.5 text-[12.5px] border border-[#e0e0e0] rounded-lg px-3 py-1.5 bg-white hover:bg-gray-50"
          >
            <Download size={13} /> Export
          </button>
          <Link
            href="/inventory/add"
            className="flex items-center gap-1.5 text-[12.5px] bg-[#29ad82] text-white rounded-lg px-3 py-1.5 hover:bg-[#1d9470] transition-colors"
          >
            <Plus size={13} /> Add Item
          </Link>
        </div>
      </div>

      {/* Category tiles — real data from DB */}
      {categories.length > 0 && (
        <div
          className="grid gap-2.5 px-5 py-3.5 border-b border-[#f0f0f0] bg-white flex-shrink-0"
          style={{
            gridTemplateColumns: `repeat(${Math.min(categories.length, 6)}, 1fr)`,
          }}
        >
          {categories.map((cat) => {
            const isActive = activeCategory === cat.name;
            return (
              <div
                key={cat.name}
                onClick={() => setActiveCategory(isActive ? null : cat.name)}
                className={`border rounded-xl p-3.5 text-center cursor-pointer transition-all ${
                  isActive
                    ? "border-[1.5px] border-[#29ad82] bg-[#edfaf4]"
                    : "border-[#e5e5e5] hover:border-[#29ad82] hover:bg-[#edfaf4]"
                }`}
              >
                <div className="text-2xl mb-2">{cat.icon}</div>
                <div className="text-[13px] font-semibold text-[#1a1a1a]">{cat.name}</div>
                <div className="text-[12px] text-gray-400 mt-1">
                  {cat.count} SKU{cat.count !== 1 ? "s" : ""}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Search + filters */}
      <div className="flex items-center gap-2.5 px-5 py-3 border-b border-[#f0f0f0] bg-white flex-shrink-0">
        <div className="flex items-center gap-2 bg-[#f7f7f7] border border-[#ebebeb] rounded-lg px-3 py-1.5 w-60">
          <Search size={13} className="text-gray-400 flex-shrink-0" />
          <input
            className="flex-1 bg-transparent outline-none text-[12.5px] text-gray-700 placeholder:text-gray-400"
            placeholder="Search items..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {["All Locations", "All Categories", "All Stock", "All Items"].map((f) => (
          <button
            key={f}
            className="flex items-center gap-1.5 text-[12.5px] border border-[#e5e5e5] rounded-lg px-3 py-1.5 bg-white hover:bg-gray-50 text-gray-600"
          >
            {f} <ChevronDown size={12} />
          </button>
        ))}
        <button className="ml-auto flex items-center gap-1.5 text-[12.5px] text-gray-500 hover:text-gray-700">
          <ArrowUpDown size={14} /> Sort By
        </button>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-y-auto">
        <table className="w-full border-collapse">
          <thead className="sticky top-0 z-10">
            <tr className="bg-[#f7f8fa] border-y border-[#efefef]">
              <th className="text-left px-5 py-3 text-[11.5px] text-gray-400 font-semibold uppercase tracking-wide w-[34%]">Item Name</th>
              <th className="text-left px-3.5 py-3 text-[11.5px] text-gray-400 font-semibold uppercase tracking-wide">Type</th>
              <th className="text-left px-3.5 py-3 text-[11.5px] text-gray-400 font-semibold uppercase tracking-wide">Category</th>
              <th className="text-left px-3.5 py-3 text-[11.5px] text-gray-400 font-semibold uppercase tracking-wide">Item Code</th>
              <th className="text-left px-3.5 py-3 text-[11.5px] text-gray-400 font-semibold uppercase tracking-wide">Sales Price</th>
              <th className="text-left px-3.5 py-3 text-[11.5px] text-gray-400 font-semibold uppercase tracking-wide">Purchase Price</th>
              <th className="text-left px-3.5 py-3 text-[11.5px] text-gray-400 font-semibold uppercase tracking-wide">Quantity</th>
              <th className="px-3.5 py-3 text-[11.5px] text-gray-400 font-semibold uppercase tracking-wide">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="py-16 text-center text-[13px] text-gray-400">
                  No items found
                </td>
              </tr>
            )}
            {filtered.map((item, rowIdx) => (
              <tr
                key={item.code}
                onClick={() => onItemClick(items.indexOf(item))}
                className={`group border-b border-[#f3f3f3] cursor-pointer transition-colors hover:bg-[#f7fdf9] ${rowIdx % 2 === 0 ? "bg-white" : "bg-[#fafafa]"}`}
              >
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-9 h-9 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center text-white text-[11px] font-bold shadow-sm"
                      style={{
                        background: item.images?.[0] ? undefined : item.color || "#29ad82",
                      }}
                    >
                      {item.images?.[0] ? (
                        <img src={item.images[0]} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        item.init
                      )}
                    </div>
                    <div>
                      <div className="text-[13px] font-semibold text-[#1a1a1a] group-hover:text-[#29ad82] transition-colors">{item.name}</div>
                      {item.code && (
                        <div className="text-[11px] text-gray-400 font-mono mt-0.5">{item.code}</div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-3.5 py-3">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11.5px] font-medium ${item.type === "Service" ? "bg-blue-50 text-blue-600" : "bg-[#edfaf4] text-[#29ad82]"}`}>
                    {item.type}
                  </span>
                </td>
                <td className="px-3.5 py-3 text-[12.5px] text-gray-600">{item.cat}</td>
                <td className="px-3.5 py-3">
                  <span className="text-[12px] text-gray-400 font-mono bg-gray-100 px-2 py-0.5 rounded-md">{item.code}</span>
                </td>
                <td className="px-3.5 py-3">
                  <span className="text-[13px] font-semibold text-[#1a1a1a]">{item.sale}</span>
                </td>
                <td className="px-3.5 py-3 text-[12.5px] text-gray-500">{item.purchase}</td>
                <td className="px-3.5 py-3">
                  <QtyBadge item={item} />
                </td>
                <td className="px-3.5 py-3">
                  {item.critical ? (
                    <StatusBadge label="Out of Stock" />
                  ) : item.low ? (
                    <StatusBadge label="Low Stock" />
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11.5px] text-[#29ad82] font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#29ad82] inline-block" />
                      In Stock
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
