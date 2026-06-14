"use client";

import { useState } from "react";
import {
  Search,
  Download,
  Plus,
  ArrowUpDown,
  ArrowLeft,
  Settings,
  ChevronDown,
  Pencil,
  Trash2,
} from "lucide-react";
import * as XLSX from "xlsx";
import type { InventoryItem } from "@/lib/types";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { useInventory } from "@/context/InventoryContext";
import Link from "next/link";

const CATEGORY_ICONS: Record<string, string> = {
  Fabric: "🧵",
  Accessories: "🔩",
  Packaging: "📦",
  Garment: "👗",
  Thread: "🪡",
  Button: "🔘",
  Zipper: "🤐",
  General: "📋",
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
    "Stock Status": item.critical ? "Out of Stock" : item.low ? "Low Stock" : "Normal",
  }));
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Inventory");
  XLSX.writeFile(wb, "inventory.xlsx");
}

function QtyBadge({ item }: { item: InventoryItem }) {
  if (item.critical)
    return <span className="text-[#d32f2f] font-semibold">0 PCS</span>;
  if (item.low)
    return <span className="text-[#e65100] font-semibold">{item.qty} PCS</span>;
  return <span className="text-gray-700">{item.qty} PCS</span>;
}

// ─── Delete Confirm Modal ──────────────────────────────────────
function DeleteConfirmModal({
  name,
  onConfirm,
  onCancel,
}: {
  name: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div
      className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center"
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-[400px] p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-3">
          <h2 className="text-[16px] font-bold text-[#1a1a1a]">Delete Item?</h2>
          <button
            onClick={onCancel}
            className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-gray-100 text-gray-400"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path
                d="M1 1l12 12M13 1L1 13"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
        <p className="text-[13.5px] text-gray-500 mb-6">
          Are you sure you want to delete{" "}
          <span className="font-semibold text-gray-700">{name}</span>?
        </p>
        <div className="flex justify-end gap-2.5">
          <button
            onClick={onCancel}
            className="px-5 py-2 text-[13px] border border-[#e0e0e0] rounded-xl text-gray-600 hover:bg-gray-50 font-medium"
          >
            No, Keep
          </button>
          <button
            onClick={onConfirm}
            className="px-5 py-2 text-[13px] bg-red-500 text-white rounded-xl hover:bg-red-600 font-semibold"
          >
            Yes, Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Table View ────────────────────────────────────────────────
function InventoryTableView({
  items,
  onItemClick,
}: {
  items: InventoryItem[];
  onItemClick: (i: number) => void;
}) {
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
    const matchSearch = search ? it.name.toLowerCase().includes(search.toLowerCase()) : true;
    const matchCat = activeCategory ? it.cat === activeCategory : true;
    return matchSearch && matchCat;
  });

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2.5 px-5 py-3 border-b border-[#f0f0f0] bg-white flex-shrink-0">
        <span className="text-[17px] font-bold text-[#1a1a1a]">
          Items List{" "}
          <span className="text-[14px] font-normal text-gray-400">
            ({items.length})
          </span>
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
          style={{ gridTemplateColumns: `repeat(${Math.min(categories.length, 6)}, 1fr)` }}
        >
          {categories.map((cat) => {
            const isActive = activeCategory === cat.name;
            return (
              <div
                key={cat.name}
                onClick={() => setActiveCategory(isActive ? null : cat.name)}
                className={`border rounded-xl p-3.5 text-center cursor-pointer transition-all ${isActive ? "border-[1.5px] border-[#29ad82] bg-[#edfaf4]" : "border-[#e5e5e5] hover:border-[#29ad82] hover:bg-[#edfaf4]"}`}
              >
                <div className="text-2xl mb-2">{cat.icon}</div>
                <div className="text-[13px] font-semibold text-[#1a1a1a]">
                  {cat.name}
                </div>
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
        {["All Locations", "All Categories", "All Stock", "All Items"].map(
          (f) => (
            <button
              key={f}
              className="flex items-center gap-1.5 text-[12.5px] border border-[#e5e5e5] rounded-lg px-3 py-1.5 bg-white hover:bg-gray-50 text-gray-600"
            >
              {f} <ChevronDown size={12} />
            </button>
          ),
        )}
        <button className="ml-auto flex items-center gap-1.5 text-[12.5px] text-gray-500 hover:text-gray-700">
          <ArrowUpDown size={14} /> Sort By
        </button>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-y-auto">
        <table className="w-full border-collapse">
          <thead className="sticky top-0 bg-white border-b-[1.5px] border-[#f0f0f0] z-10">
            <tr>
              <th className="text-left px-5 py-2.5 text-[12px] text-gray-400 font-medium w-[36%]">
                Item Name
              </th>
              <th className="text-left px-3.5 py-2.5 text-[12px] text-gray-400 font-medium">
                Type
              </th>
              <th className="text-left px-3.5 py-2.5 text-[12px] text-gray-400 font-medium">
                Category
              </th>
              <th className="text-left px-3.5 py-2.5 text-[12px] text-gray-400 font-medium">
                Item Code
              </th>
              <th className="text-left px-3.5 py-2.5 text-[12px] text-gray-400 font-medium">
                Sales Price
              </th>
              <th className="text-left px-3.5 py-2.5 text-[12px] text-gray-400 font-medium">
                Purchase Price
              </th>
              <th className="text-left px-3.5 py-2.5 text-[12px] text-gray-400 font-medium">
                Quantity
              </th>
              <th className="w-10" />
            </tr>
          </thead>
          <tbody>
            {filtered.map((item) => (
              <tr
                key={item.code}
                onClick={() => onItemClick(items.indexOf(item))}
                className="border-b border-[#f8f8f8] hover:bg-gray-50 cursor-pointer"
              >
                <td className="px-5 py-2.5">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-9 h-9 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center text-white text-[11px] font-bold"
                      style={{
                        background: item.images?.[0]
                          ? undefined
                          : item.color || "#29ad82",
                      }}
                    >
                      {item.images?.[0] ? (
                        <img
                          src={item.images[0]}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        item.init
                      )}
                    </div>
                    <span className="text-[13px] font-medium text-[#1a1a1a]">
                      {item.name}
                    </span>
                  </div>
                </td>
                <td className="px-3.5 py-2.5 text-[12.5px] text-gray-600">
                  {item.type}
                </td>
                <td className="px-3.5 py-2.5 text-[12.5px] text-gray-600">
                  {item.cat}
                </td>
                <td className="px-3.5 py-2.5 text-[12.5px] text-gray-500 font-mono">
                  {item.code}
                </td>
                <td className="px-3.5 py-2.5 text-[12.5px] text-gray-700">
                  {item.sale}
                </td>
                <td className="px-3.5 py-2.5 text-[12.5px] text-gray-700">
                  {item.purchase}
                </td>
                <td className="px-3.5 py-2.5 text-[12.5px]">
                  <QtyBadge item={item} />
                </td>
                <td className="px-3.5 py-2.5 text-center">
                  {(item.critical || item.low) && (
                    <StatusBadge
                      label={item.critical ? "Out of Stock" : "Low Stock"}
                    />
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

// ─── Split / Detail View ───────────────────────────────────────
function InventorySplitView({
  items,
  selectedIdx,
  onBack,
  onSelectItem,
  onDelete,
}: {
  items: InventoryItem[];
  selectedIdx: number | null;
  onBack: () => void;
  onSelectItem: (i: number) => void;
  onDelete: (id: string) => void;
}) {
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<
    "activity" | "details" | "variants"
  >("activity");
  const [selSize, setSelSize] = useState<string>("");
  const [selColor, setSelColor] = useState<string>("");
  const [manageOpen, setManageOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const colorHex: Record<string, string> = {
    Black: "#1a1a1a",
    Charcoal: "#4a4a4a",
    Olive: "#6b8e6b",
    White: "#f0ede8",
    Grey: "#9e9e9e",
    "Light Grey": "#d0d0d0",
    Navy: "#1a237e",
    Brown: "#5d4037",
    Maroon: "#6d1c2e",
    Green: "#2e7d32",
    Red: "#c62828",
    Blue: "#1565c0",
    Yellow: "#f9a825",
    Orange: "#e65100",
    Pink: "#ad1457",
    Purple: "#6a1b9a",
    Beige: "#d4b896",
    Cream: "#f5f0e8",
    Khaki: "#8b7355",
    Teal: "#00695c",
    Rust: "#b84c1e",
  };

  const filtered = search
    ? items.filter((it) => it.name.toLowerCase().includes(search.toLowerCase()))
    : items;
  const item = selectedIdx !== null ? items[selectedIdx] : null;

  const varLabel0 = item?.varLabels?.[0] ?? "Size";
  const varLabel1 = item?.varLabels?.[1] ?? "Color";
  const sizes = item?.variants
    ? [...new Set(item.variants.map((v) => v.size).filter(Boolean))]
    : [];
  const colors = item?.variants
    ? [...new Set(item.variants.map((v) => v.color).filter(Boolean))]
    : [];

  // Stock for current selection
  const variantStock = (() => {
    if (!item?.variants) return item?.qty ?? 0;
    if (selSize && selColor) {
      return (
        item.variants.find((v) => v.size === selSize && v.color === selColor)
          ?.stock ?? 0
      );
    }
    if (selSize)
      return item.variants
        .filter((v) => v.size === selSize)
        .reduce((a, v) => a + v.stock, 0);
    if (selColor)
      return item.variants
        .filter((v) => v.color === selColor)
        .reduce((a, v) => a + v.stock, 0);
    return item.qty;
  })();

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Left mini-list */}
      <div className="w-[370px] flex-shrink-0 border-r border-[#f0f0f0] flex flex-col bg-white">
        <div className="flex items-center gap-2.5 px-4 py-3 border-b border-[#f0f0f0] flex-shrink-0">
          <button
            onClick={onBack}
            className="text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft size={15} />
          </button>
          <span className="text-[15px] font-bold text-[#1a1a1a]">
            Items ({items.length})
          </span>
          <div className="ml-auto flex rounded-lg overflow-hidden">
            <Link
              href="/inventory/add"
              className="flex items-center gap-1 bg-[#29ad82] text-white px-2.5 py-1 text-[12px] font-semibold hover:bg-[#1d9470]"
            >
              <Plus size={12} /> Add Item
            </Link>
            <div className="w-px bg-white/30" />
            <button className="bg-[#29ad82] text-white px-2 py-1 hover:bg-[#1d9470]">
              <ChevronDown size={12} />
            </button>
          </div>
        </div>
        <div className="px-3 py-2 border-b border-[#f0f0f0] flex-shrink-0">
          <div className="flex items-center gap-2 bg-[#f7f7f7] border border-[#ebebeb] rounded-lg px-2.5 py-1.5">
            <Search size={12} className="text-gray-400 flex-shrink-0" />
            <input
              className="flex-1 bg-transparent outline-none text-[12.5px] text-gray-700 placeholder:text-gray-400"
              placeholder="Search items..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {filtered.map((it) => {
            const i = items.indexOf(it);
            return (
              <div
                key={it.code}
                onClick={() => onSelectItem(i)}
                className={`flex items-center gap-3.5 px-4 py-3.5 border-b border-[#f5f5f5] cursor-pointer transition-colors ${selectedIdx === i ? "bg-[#edfaf4]" : "hover:bg-gray-50"}`}
              >
                <div
                  className="w-[46px] h-[46px] rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center text-white text-[13px] font-bold"
                  style={{
                    background: it.images?.[0]
                      ? undefined
                      : it.color || "#29ad82",
                  }}
                >
                  {it.images?.[0] ? (
                    <img
                      src={it.images[0]}
                      alt={it.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    it.init
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13.5px] font-medium text-[#1a1a1a] truncate">
                    {it.name}
                  </div>
                  <div className="text-[12px] text-gray-400 mt-0.5">
                    {it.cat}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right detail */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {!item ? (
          <div className="flex-1 flex flex-col items-center justify-center bg-[#fafafa]">
            <div className="text-[15px] font-bold text-gray-500 mb-1.5">
              Item Not Selected
            </div>
            <div className="text-[12.5px] text-gray-400">
              Click any item to view its stock activity.
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col overflow-hidden bg-white">
            {/* Item header */}
            <div className="flex items-center gap-3.5 px-5 py-3.5 border-b border-[#f0f0f0] flex-shrink-0">
              <div
                className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center text-white text-[14px] font-bold"
                style={{
                  background: item.images?.[0]
                    ? undefined
                    : item.color || "#29ad82",
                }}
              >
                {item.images?.[0] ? (
                  <img
                    src={item.images[0]}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  item.init
                )}
              </div>
              <div className="flex-1">
                <div className="text-[16px] font-bold text-[#1a1a1a]">
                  {item.name}
                </div>
                <div className="text-[12.5px] text-gray-400 mt-0.5">
                  {item.cat} · {item.type}
                </div>
              </div>
              <div className="relative">
                <button
                  onClick={() => setManageOpen((o) => !o)}
                  className="flex items-center gap-1.5 text-[12.5px] border border-[#e0e0e0] rounded-lg px-3 py-1.5 hover:bg-gray-50"
                >
                  <Settings size={13} /> Manage Item
                </button>
                {manageOpen && (
                  <div className="absolute right-0 top-full mt-1.5 w-[160px] bg-white rounded-xl shadow-xl border border-[#efefef] z-30 overflow-hidden">
                    <div className="px-3.5 py-2 text-[11px] text-gray-400 font-semibold uppercase tracking-wide border-b border-[#f5f5f5]">
                      Manage Item
                    </div>
                    <Link
                      href={`/inventory/add?edit=${item.code}`}
                      onClick={() => setManageOpen(false)}
                      className="flex items-center gap-2.5 w-full px-3.5 py-2.5 text-[13px] text-gray-700 hover:bg-gray-50"
                    >
                      <Pencil size={13} className="text-gray-400" /> Edit Item
                    </Link>
                    <button
                      onClick={() => {
                        setManageOpen(false);
                        setDeleteConfirm(true);
                      }}
                      className="flex items-center gap-2.5 w-full px-3.5 py-2.5 text-[13px] text-red-500 hover:bg-red-50"
                    >
                      <Trash2 size={13} /> Delete Item
                    </button>
                  </div>
                )}
              </div>
              {deleteConfirm && item && (
                <DeleteConfirmModal
                  name={item.name}
                  onConfirm={() => {
                    setDeleteConfirm(false);
                    onDelete(item.id!);
                    onBack();
                  }}
                  onCancel={() => setDeleteConfirm(false)}
                />
              )}
            </div>

            {/* Stats */}
            <div className="flex gap-9 px-5 py-3.5 border-b border-[#f0f0f0] flex-shrink-0">
              {[
                { label: "Stock Quantity", value: `${variantStock} PCS` },
                { label: "Sales Price", value: item.sale },
                { label: "Purchase Price", value: item.purchase },
                {
                  label: "Stock Value",
                  value: `Rs. ${(variantStock * parseInt(item.purchase.replace(/[^0-9]/g, ""))).toLocaleString("en-US")}`,
                },
              ].map((s) => (
                <div key={s.label}>
                  <div className="text-[11.5px] text-gray-400 mb-1">
                    {s.label}
                  </div>
                  <div className="text-[16px] font-bold text-[#1a1a1a]">
                    {s.value}
                  </div>
                </div>
              ))}
            </div>

            {/* Size & Color Variation Selectors */}
            {item.variants && item.variants.length > 0 && (
              <div className="px-5 py-3.5 border-b border-[#f0f0f0] flex-shrink-0 space-y-3">
                {/* Slot 0 variation */}
                {sizes.length > 0 && (
                  <div className="flex items-center gap-2.5">
                    <span className="text-[12px] text-gray-500 font-medium w-10 flex-shrink-0">
                      {varLabel0}
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {/* All chip */}
                      <button
                        onClick={() => {
                          setSelSize("");
                          setSelColor("");
                        }}
                        className={`h-[34px] min-w-[38px] px-3.5 rounded-lg text-[13px] font-semibold border-[1.5px] transition-all ${
                          selSize === "" && selColor === ""
                            ? "bg-[#29ad82] border-[#29ad82] text-white"
                            : "bg-white border-[#e0e0e0] text-gray-700 hover:border-[#29ad82]"
                        }`}
                      >
                        All
                      </button>
                      {sizes.map((sz) => {
                        const hasStock = item.variants!.some(
                          (v) => v.size === sz && v.stock > 0,
                        );
                        const isActive = selSize === sz;
                        return (
                          <button
                            key={sz}
                            onClick={() => setSelSize(isActive ? "" : sz)}
                            className={`h-[34px] min-w-[38px] px-3.5 rounded-lg text-[13px] font-medium border-[1.5px] transition-all ${
                              isActive
                                ? "bg-[#29ad82] border-[#29ad82] text-white font-semibold"
                                : hasStock
                                  ? "bg-white border-[#e0e0e0] text-gray-700 hover:border-[#29ad82]"
                                  : "bg-white border-[#e0e0e0] text-gray-300 line-through cursor-not-allowed"
                            }`}
                          >
                            {sz}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Slot 1 variation */}
                {colors.length > 0 && (
                  <div className="flex items-center gap-2.5">
                    <span className="text-[12px] text-gray-500 font-medium w-10 flex-shrink-0">
                      {varLabel1}
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {colors.map((cl) => {
                        const hex = colorHex[cl] || "#888";
                        const isActive = selColor === cl;
                        const needsBorder =
                          cl === "White" || cl === "Cream" || cl === "Beige";
                        return (
                          <button
                            key={cl}
                            onClick={() => setSelColor(isActive ? "" : cl)}
                            className={`h-[34px] px-3.5 rounded-lg text-[13px] font-medium border-[1.5px] transition-all ${
                              isActive
                                ? "bg-[#29ad82] border-[#29ad82] text-white font-semibold"
                                : "bg-white border-[#e0e0e0] text-gray-700 hover:border-[#29ad82]"
                            }`}
                          >
                            {cl}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Selected variant info bar */}
                {(selSize || selColor) && (
                  <div className="flex items-center gap-2.5 bg-[#f5f5f3] rounded-xl px-4 py-2.5 mt-1">
                    <svg
                      width="15"
                      height="15"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#888"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                    </svg>
                    <span className="text-[12.5px] text-gray-500">
                      Selected:
                    </span>
                    <span className="bg-[#29ad82] text-white text-[12px] font-semibold rounded-lg px-2.5 py-0.5">
                      {[selSize, selColor].filter(Boolean).join(" / ")}
                    </span>
                    <span className="text-gray-400 text-[13px]">→</span>
                    <span
                      className={`text-[13px] font-bold ${variantStock === 0 ? "text-[#d32f2f]" : variantStock <= 5 ? "text-[#e65100]" : "text-[#29ad82]"}`}
                    >
                      {variantStock} PCS
                    </span>
                    <span className="text-gray-300 text-[12px]">·</span>
                    <span className="text-[13px] text-gray-600">
                      {item.sale}
                    </span>
                    <span className="ml-auto text-[11px] text-gray-400">
                      in stock
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Tabs */}
            <div className="flex border-b border-[#f0f0f0] px-5 flex-shrink-0">
              {(["activity", "details", "variants"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setActiveTab(t)}
                  className={`py-2.5 px-1 mr-5 text-[13px] border-b-2 transition-colors capitalize ${activeTab === t ? "text-[#29ad82] border-[#29ad82] font-semibold" : "text-gray-400 border-transparent"}`}
                >
                  {t === "activity"
                    ? "Activity"
                    : t === "details"
                      ? "Details"
                      : "All Variants"}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="flex-1 overflow-y-auto">
              {activeTab === "activity" &&
                (() => {
                  const activities = item.activity ?? [
                    {
                      date: "2026 May 01",
                      desc: "Opening Stock",
                      qty: `+${item.qty}`,
                    },
                  ];
                  return (
                    <div>
                      {/* Activity header bar */}
                      <div className="flex items-center justify-between px-5 py-3 border-b border-[#f0f0f0]">
                        <span className="text-[14px] font-bold text-[#1a1a1a]">
                          Item Activity{" "}
                          <span className="text-gray-400 font-normal text-[13px]">
                            ({activities.length})
                          </span>
                        </span>
                        <div className="flex items-center gap-2">
                          <button className="w-8 h-8 border border-[#e5e5e5] rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-50">
                            <Search size={14} />
                          </button>
                          <button className="flex items-center gap-1.5 text-[12.5px] border border-[#e5e5e5] rounded-lg px-3 py-1.5 text-gray-500 hover:bg-gray-50">
                            <ArrowUpDown size={13} /> Sort
                          </button>
                          <button className="flex items-center gap-1.5 text-[12.5px] bg-[#29ad82] text-white rounded-lg px-3.5 py-1.5 font-semibold hover:bg-[#1d9470] transition-colors">
                            Adjust Stock <ChevronDown size={13} />
                          </button>
                        </div>
                      </div>

                      {/* Table */}
                      <div className="border border-[#efefef] rounded-xl mx-5 mt-4 overflow-hidden">
                        {/* Column headers */}
                        <div className="grid grid-cols-[2fr_1.4fr_1fr_1fr_1.2fr] bg-[#f9f9f9] border-b border-[#efefef] px-4 py-2.5">
                          {[
                            "Type",
                            "Date",
                            "Change",
                            "Quantity",
                            "Remarks",
                          ].map((h) => (
                            <span
                              key={h}
                              className="text-[12px] text-gray-400 font-medium"
                            >
                              {h}
                            </span>
                          ))}
                        </div>

                        {/* Rows */}
                        {activities.map((a, i) => {
                          const change =
                            parseInt(a.qty.replace(/[^0-9-]/g, "")) || 0;
                          const isPositive =
                            a.qty.startsWith("+") || change > 0;
                          const runningQty = item.qty;
                          return (
                            <div
                              key={i}
                              className={`grid grid-cols-[2fr_1.4fr_1fr_1fr_1.2fr] items-center px-4 py-3.5 ${i !== activities.length - 1 ? "border-b border-[#f5f5f5]" : ""} hover:bg-gray-50 transition-colors`}
                            >
                              {/* Type */}
                              <div>
                                <div className="text-[13px] font-semibold text-[#1a1a1a]">
                                  {a.desc}
                                </div>
                                {(a as { party?: string }).party && (
                                  <div className="text-[11.5px] text-gray-400 mt-0.5">
                                    {(a as { party?: string }).party}
                                  </div>
                                )}
                              </div>
                              {/* Date */}
                              <div className="text-[12.5px] text-gray-500">
                                {a.date}
                              </div>
                              {/* Change */}
                              <div
                                className={`text-[13px] font-bold ${isPositive ? "text-[#29ad82]" : "text-[#d32f2f]"}`}
                              >
                                {isPositive ? "+" : ""}
                                {Math.abs(change)}
                              </div>
                              {/* Quantity */}
                              <div>
                                <span className="inline-block bg-[#f5f5f5] text-[#1a1a1a] text-[12.5px] font-medium rounded-lg px-2.5 py-0.5">
                                  {runningQty}
                                </span>
                              </div>
                              {/* Remarks */}
                              <div className="text-[12.5px] text-gray-400">
                                --
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}
              {activeTab === "details" && (
                <div className="p-5 grid grid-cols-2 gap-4 text-[13px]">
                  {[
                    ["Item Code", item.code],
                    ["Category", item.cat],
                    ["Type", item.type],
                    ["Sales Price", item.sale],
                    ["Purchase Price", item.purchase],
                  ].map(([l, v]) => (
                    <div key={l}>
                      <div className="text-gray-400 text-[11.5px] mb-1">
                        {l}
                      </div>
                      <div className="font-medium text-[#1a1a1a]">{v}</div>
                    </div>
                  ))}
                </div>
              )}
              {activeTab === "variants" && item.variants && (
                <table className="w-full text-[12.5px] border-collapse mx-auto px-5">
                  <thead>
                    <tr className="border-b border-[#f0f0f0]">
                      {[
                        ...(sizes.length > 0 ? [varLabel0] : []),
                        ...(colors.length > 0 ? [varLabel1] : []),
                        "Stock",
                      ].map((h) => (
                        <th
                          key={h}
                          className="text-left py-2 px-3 text-[11px] text-gray-400 font-medium"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {item.variants.map((v, i) => (
                      <tr
                        key={i}
                        className="border-b border-[#f8f8f8] hover:bg-gray-50"
                      >
                        {v.size && (
                          <td className="py-2.5 px-3 font-medium text-gray-700">
                            {v.size}
                          </td>
                        )}
                        {v.color && (
                          <td className="py-2.5 px-3 text-gray-600">
                            {v.color}
                          </td>
                        )}
                        <td className="py-2.5 px-3">
                          <span
                            className={
                              v.stock === 0
                                ? "text-[#d32f2f] font-semibold"
                                : v.stock < 5
                                  ? "text-[#e65100] font-semibold"
                                  : "text-gray-700"
                            }
                          >
                            {v.stock} PCS
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main InventoryPage ────────────────────────────────────────
export function InventoryPage() {
  const { items, deleteItem } = useInventory();
  const [view, setView] = useState<"table" | "split">("table");
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

  function handleItemClick(i: number) {
    setSelectedIdx(i);
    setView("split");
  }

  function handleDelete(id: string) {
    deleteItem(id);
    setView("table");
    setSelectedIdx(null);
  }

  return (
    <div className="flex flex-col h-full bg-white overflow-hidden">
      {view === "table" ? (
        <InventoryTableView items={items} onItemClick={handleItemClick} />
      ) : (
        <InventorySplitView
          items={items}
          selectedIdx={selectedIdx}
          onBack={() => setView("table")}
          onSelectItem={setSelectedIdx}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}
