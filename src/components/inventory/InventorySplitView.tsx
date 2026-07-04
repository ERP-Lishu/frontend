"use client";

import { useState } from "react";
import {
  Search, Plus, ArrowLeft, Settings, ChevronDown, Pencil, Trash2, ArrowUpDown, Hexagon, ArrowRight,
} from "lucide-react";
import type { InventoryItem } from "@/lib/types";
import { DeleteConfirmModal } from "./DeleteConfirmModal";
import Link from "next/link";

const colorHex: Record<string, string> = {
  Black: "#1a1a1a", Charcoal: "#4a4a4a", Olive: "#6b8e6b", White: "#f0ede8",
  Grey: "#9e9e9e", "Light Grey": "#d0d0d0", Navy: "#1a237e", Brown: "#5d4037",
  Maroon: "#6d1c2e", Green: "#2e7d32", Red: "#c62828", Blue: "#1565c0",
  Yellow: "#f9a825", Orange: "#e65100", Pink: "#ad1457", Purple: "#6a1b9a",
  Beige: "#d4b896", Cream: "#f5f0e8", Khaki: "#8b7355", Teal: "#00695c", Rust: "#b84c1e",
};

interface InventorySplitViewProps {
  items: InventoryItem[];
  selectedIdx: number | null;
  onBack: () => void;
  onSelectItem: (i: number) => void;
  onDelete: (id: string) => void;
}

export function InventorySplitView({
  items,
  selectedIdx,
  onBack,
  onSelectItem,
  onDelete,
}: InventorySplitViewProps) {
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"activity" | "details" | "variants">("activity");
  const [manageOpen, setManageOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [selSize, setSelSize] = useState("All");
  const [selColor, setSelColor] = useState<string | null>(null);
  // Reset the variant filter pills whenever the selected item changes, so a
  // stale Size/Color choice from the previous item isn't carried over. Done
  // during render (React's recommended way to reset state on prop change)
  // rather than in an effect, to avoid an extra render pass.
  const [prevSelectedIdx, setPrevSelectedIdx] = useState(selectedIdx);
  if (selectedIdx !== prevSelectedIdx) {
    setPrevSelectedIdx(selectedIdx);
    setSelSize("All");
    setSelColor(null);
  }

  const filtered = search
    ? items.filter((it) => it.name.toLowerCase().includes(search.toLowerCase()))
    : items;
  const item = selectedIdx !== null ? items[selectedIdx] : null;

  const varLabel0 = item?.varLabels?.[0] ?? "Variation 1";
  const varLabel1 = item?.varLabels?.[1] ?? "Variation 2";
  const sizes = item?.variants ? [...new Set(item.variants.map((v) => v.size).filter(Boolean))] : [];
  const colors = item?.variants ? [...new Set(item.variants.map((v) => v.color).filter(Boolean))] : [];
  const variantStock = item?.qty ?? 0;

  const isVariantFullySelected =
    (sizes.length === 0 || selSize !== "All") && (colors.length === 0 || selColor !== null);
  const selectedVariant = isVariantFullySelected
    ? item?.variants?.find(
        (v) => (sizes.length === 0 || v.size === selSize) && (colors.length === 0 || v.color === selColor)
      )
    : undefined;
  const pillCls = (active: boolean) =>
    `px-4 py-1.5 text-[13px] font-semibold rounded-xl border transition-colors ${
      active ? "bg-[#29ad82] border-[#29ad82] text-white" : "bg-white border-[#e5e5e5] text-[#1a1a1a] hover:bg-gray-50"
    }`;

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Left mini-list */}
      <div className="w-[370px] flex-shrink-0 border-r border-[#f0f0f0] flex flex-col bg-white">
        <div className="flex items-center gap-2.5 px-4 py-3 border-b border-[#f0f0f0] flex-shrink-0">
          <button onClick={onBack} className="text-gray-500 hover:text-gray-700">
            <ArrowLeft size={15} />
          </button>
          <span className="text-[15px] font-bold text-[#1a1a1a]">Items ({items.length})</span>
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
                  style={{ background: it.images?.[0] ? undefined : (it.color || "#29ad82") }}
                >
                  {it.images?.[0] ? (
                    <img src={it.images[0]} alt={it.name} className="w-full h-full object-cover" />
                  ) : it.init}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13.5px] font-medium text-[#1a1a1a] truncate">{it.name}</div>
                  <div className="text-[12px] text-gray-400 mt-0.5">{it.cat}</div>
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
            <div className="text-[15px] font-bold text-gray-500 mb-1.5">Item Not Selected</div>
            <div className="text-[12.5px] text-gray-400">Click any item to view its stock activity.</div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col overflow-hidden bg-white">
            {/* Item header */}
            <div className="flex items-center gap-3.5 px-5 py-3.5 border-b border-[#f0f0f0] flex-shrink-0">
              <div
                className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center text-white text-[14px] font-bold"
                style={{ background: item.images?.[0] ? undefined : (item.color || "#29ad82") }}
              >
                {item.images?.[0] ? (
                  <img src={item.images[0]} alt={item.name} className="w-full h-full object-cover" />
                ) : item.init}
              </div>
              <div className="flex-1">
                <div className="text-[16px] font-bold text-[#1a1a1a]">{item.name}</div>
                <div className="text-[12.5px] text-gray-400 mt-0.5">{item.cat} · {item.type}</div>
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
                      onClick={() => { setManageOpen(false); setDeleteConfirm(true); }}
                      className="flex items-center gap-2.5 w-full px-3.5 py-2.5 text-[13px] text-red-500 hover:bg-red-50"
                    >
                      <Trash2 size={13} /> Delete Item
                    </button>
                  </div>
                )}
              </div>
              {deleteConfirm && (
                <DeleteConfirmModal
                  name={item.name}
                  onConfirm={() => { setDeleteConfirm(false); onDelete(item.id!); onBack(); }}
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
                { label: "Stock Value", value: `Rs. ${(variantStock * parseInt(item.purchase.replace(/[^0-9]/g, ""))).toLocaleString("en-US")}` },
              ].map((s) => (
                <div key={s.label}>
                  <div className="text-[11.5px] text-gray-400 mb-1">{s.label}</div>
                  <div className="text-[16px] font-bold text-[#1a1a1a]">{s.value}</div>
                </div>
              ))}
            </div>


            {/* Tabs */}
            <div className="flex border-b border-[#f0f0f0] px-5 flex-shrink-0">
              {(["activity", "details", "variants"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setActiveTab(t)}
                  className={`py-2.5 px-1 mr-5 text-[13px] border-b-2 transition-colors capitalize ${activeTab === t ? "text-[#29ad82] border-[#29ad82] font-semibold" : "text-gray-400 border-transparent"}`}
                >
                  {t === "activity" ? "Activity" : t === "details" ? "Details" : "All Variants"}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="flex-1 overflow-y-auto">
              {activeTab === "activity" && (() => {
                const activities = item.activity ?? [{ date: "2026 May 01", desc: "Opening Stock", qty: `+${item.qty}` }];
                return (
                  <div>
                    <div className="flex items-center justify-between px-5 py-3 border-b border-[#f0f0f0]">
                      <span className="text-[14px] font-bold text-[#1a1a1a]">
                        Item Activity{" "}
                        <span className="text-gray-400 font-normal text-[13px]">({activities.length})</span>
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
                    <div className="border border-[#efefef] rounded-xl mx-5 mt-4 overflow-hidden">
                      <div className="grid grid-cols-[2fr_1.4fr_1fr_1fr_1.2fr] bg-[#f9f9f9] border-b border-[#efefef] px-4 py-2.5">
                        {["Type", "Date", "Change", "Quantity", "Remarks"].map((h) => (
                          <span key={h} className="text-[12px] text-gray-400 font-medium">{h}</span>
                        ))}
                      </div>
                      {activities.map((a, i) => {
                        const change = parseInt(a.qty.replace(/[^0-9-]/g, "")) || 0;
                        const isPositive = a.qty.startsWith("+") || change > 0;
                        return (
                          <div
                            key={i}
                            className={`grid grid-cols-[2fr_1.4fr_1fr_1fr_1.2fr] items-center px-4 py-3.5 ${i !== activities.length - 1 ? "border-b border-[#f5f5f5]" : ""} hover:bg-gray-50 transition-colors`}
                          >
                            <div>
                              <div className="text-[13px] font-semibold text-[#1a1a1a]">{a.desc}</div>
                              {(a as { party?: string }).party && (
                                <div className="text-[11.5px] text-gray-400 mt-0.5">{(a as { party?: string }).party}</div>
                              )}
                            </div>
                            <div className="text-[12.5px] text-gray-500">{a.date}</div>
                            <div className={`text-[13px] font-bold ${isPositive ? "text-[#29ad82]" : "text-[#d32f2f]"}`}>
                              {isPositive ? "+" : ""}{Math.abs(change)}
                            </div>
                            <div>
                              <span className="inline-block bg-[#f5f5f5] text-[#1a1a1a] text-[12.5px] font-medium rounded-lg px-2.5 py-0.5">{item.qty}</span>
                            </div>
                            <div className="text-[12.5px] text-gray-400">--</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

              {activeTab === "details" && (
                <div className="p-5 grid grid-cols-2 gap-4 text-[13px]">
                  {[["Item Code", item.code], ["Category", item.cat], ["Type", item.type], ["Sales Price", item.sale], ["Purchase Price", item.purchase]].map(([l, v]) => (
                    <div key={l}>
                      <div className="text-gray-400 text-[11.5px] mb-1">{l}</div>
                      <div className="font-medium text-[#1a1a1a]">{v}</div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === "variants" && item.variants && (
                <div className="px-5 py-4">
                  {sizes.length > 0 && (
                    <div className="mb-4">
                      <div className="text-[12.5px] text-gray-500 font-medium mb-2">{varLabel0}</div>
                      <div className="flex flex-wrap gap-2">
                        <button onClick={() => setSelSize("All")} className={pillCls(selSize === "All")}>
                          All
                        </button>
                        {sizes.map((s) => (
                          <button key={s} onClick={() => setSelSize(s)} className={pillCls(selSize === s)}>
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {colors.length > 0 && (
                    <div className="mb-4">
                      <div className="text-[12.5px] text-gray-500 font-medium mb-2">{varLabel1}</div>
                      <div className="flex flex-wrap gap-2">
                        {colors.map((c) => (
                          <button
                            key={c}
                            onClick={() => setSelColor((prev) => (prev === c ? null : c))}
                            className={pillCls(selColor === c)}
                          >
                            {c}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedVariant && (
                    <div className="flex items-center gap-3 border border-[#e5e5e5] rounded-xl px-4 py-3 bg-[#fafafa]">
                      <Hexagon size={16} className="text-gray-400 flex-shrink-0" />
                      <span className="text-[13px] text-gray-500 font-medium">Selected:</span>
                      <span className="px-2.5 py-1 text-[12.5px] font-semibold rounded-lg bg-[#29ad82] text-white">
                        {[selSize !== "All" ? selSize : null, selColor].filter(Boolean).join(" / ")}
                      </span>
                      <ArrowRight size={14} className="text-gray-300 flex-shrink-0" />
                      <span
                        className={`text-[15px] font-bold ${selectedVariant.stock === 0 ? "text-[#d32f2f]" : selectedVariant.stock < 5 ? "text-[#e65100]" : "text-[#1a1a1a]"}`}
                      >
                        {selectedVariant.stock} PCS
                      </span>
                      <span className="text-gray-300">·</span>
                      <span className="text-[14px] font-semibold text-[#1a1a1a]">
                        Rs. {Math.round(selectedVariant.salesPrice ?? 0).toLocaleString("en-US")}
                      </span>
                      <span className="ml-auto text-[12px] text-gray-400 flex-shrink-0">
                        {selectedVariant.stock > 0 ? "in stock" : "out of stock"}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
