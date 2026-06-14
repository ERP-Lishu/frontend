"use client";

import { useState, useEffect, useRef, KeyboardEvent } from "react";
import { ArrowLeft, BellRing, ImagePlus, Info, Plus, Settings, Trash2, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useInventory } from "@/context/InventoryContext";

const colorHex: Record<string, string> = {
  Black: "#1a1a1a", Charcoal: "#4a4a4a", Olive: "#6b8e6b", White: "#d4d0cb", Grey: "#9e9e9e",
  Navy: "#1a237e", Brown: "#5d4037", Maroon: "#6d1c2e", Green: "#2e7d32", Red: "#c62828",
  Blue: "#1565c0", Yellow: "#f9a825", Orange: "#e65100", Pink: "#ad1457", Purple: "#6a1b9a",
  Beige: "#d4b896", Cream: "#f5f0e8", Khaki: "#8b7355", Teal: "#00695c", Rust: "#b84c1e",
};

interface Variation {
  id: string;
  label: string;
  values: string[];
  draft: string;
}

interface VariantRow {
  key: string;
  combo: string[];
  sku: string;
  salesPrice: string;
  purchasePrice: string;
  stock: string;
}

function cartesian(arrays: string[][]): string[][] {
  if (arrays.length === 0) return [];
  return arrays.reduce<string[][]>(
    (acc, arr) => acc.flatMap((combo) => arr.map((val) => [...combo, val])),
    [[]]
  );
}

function VariationRow({
  variation,
  onChange,
  onRemove,
}: {
  variation: Variation;
  onChange: (updated: Variation) => void;
  onRemove: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  function commitDraft() {
    const val = variation.draft.trim();
    if (!val || variation.values.includes(val)) {
      onChange({ ...variation, draft: "" });
      return;
    }
    onChange({ ...variation, values: [...variation.values, val], draft: "" });
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      commitDraft();
    } else if (e.key === "Backspace" && variation.draft === "" && variation.values.length > 0) {
      onChange({ ...variation, values: variation.values.slice(0, -1) });
    }
  }

  return (
    <div className="border border-[#e8e8e8] rounded-xl p-4 bg-white group">
      <div className="flex items-center gap-2 mb-3">
        <input
          className="flex-1 text-[13px] font-semibold text-[#1a1a1a] outline-none border-b border-transparent focus:border-[#29ad82] pb-0.5 bg-transparent placeholder:text-gray-300 placeholder:font-normal"
          placeholder="Variation name (e.g. Size, Color, Material…)"
          value={variation.label}
          onChange={(e) => onChange({ ...variation, label: e.target.value })}
        />
        <button
          onClick={onRemove}
          className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-300 hover:text-red-400 p-0.5"
        >
          <Trash2 size={14} />
        </button>
      </div>
      <div
        className="flex flex-wrap gap-1.5 min-h-[36px] border border-[#e5e5e5] rounded-lg px-2.5 py-1.5 cursor-text bg-[#f9f9f9] focus-within:border-[#29ad82] focus-within:bg-white transition-colors"
        onClick={() => inputRef.current?.focus()}
      >
        {variation.values.map((v) => (
          <span
            key={v}
            className="inline-flex items-center gap-1 bg-[#edfaf4] text-[#29ad82] border border-[#c6e8d6] rounded-md px-2 py-0.5 text-[12px] font-medium"
          >
            {v}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onChange({ ...variation, values: variation.values.filter((x) => x !== v) });
              }}
              className="text-[#29ad82] hover:text-[#1d9470] leading-none"
            >
              <X size={10} />
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          className="flex-1 min-w-[100px] text-[12.5px] outline-none bg-transparent placeholder:text-gray-300"
          placeholder={variation.values.length === 0 ? "Type a value and press Enter…" : "Add more…"}
          value={variation.draft}
          onChange={(e) => onChange({ ...variation, draft: e.target.value })}
          onKeyDown={handleKeyDown}
          onBlur={commitDraft}
        />
      </div>
      {variation.values.length > 0 && (
        <p className="text-[10.5px] text-gray-300 mt-1.5">
          Press Enter or comma to add · Backspace to remove last
        </p>
      )}
    </div>
  );
}

export function AddItemPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editCode = searchParams.get("edit");
  const { items, addItem, updateItem } = useInventory();
  const isEdit = !!editCode;

  const [itemType, setItemType] = useState<"product" | "service">("product");
  const [activeTab, setActiveTab] = useState<"stock" | "variation" | "location" | "others">("stock");
  const [selectedLocations, setSelectedLocations] = useState<string[]>(["Main Warehouse"]);
  const [lsaOn, setLsaOn] = useState(false);
  const [variations, setVariations] = useState<Variation[]>([]);
  const [variantRows, setVariantRows] = useState<Record<string, VariantRow>>({});
  // Form fields
  const [itemName, setItemName] = useState("");
  const [itemCat, setItemCat] = useState("General");
  const [openingStock, setOpeningStock] = useState("");
  const [unit, setUnit] = useState("PCS");
  const [salesPrice, setSalesPrice] = useState("");
  const [purchasePrice, setPurchasePrice] = useState("");
  const [itemCode, setItemCode] = useState("");
  const [nameError, setNameError] = useState(false);
  const [editColor, setEditColor] = useState<string | undefined>(undefined);
  const [images, setImages] = useState<string[]>([]);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const dragIndexRef = useRef<number | null>(null);

  function readFiles(files: File[]) {
    files.slice(0, 5).forEach((file) => {
      if (!file.type.startsWith("image/")) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) {
          setImages((prev) => [...prev, ev.target!.result as string].slice(0, 5));
        }
      };
      reader.readAsDataURL(file);
    });
  }

  // Holds stock values from the existing item so the variation effect can pick them up
  const pendingStocks = useRef<Record<string, string> | null>(null);

  // Pre-fill form when editing
  useEffect(() => {
    if (!editCode || items.length === 0) return;
    const existing = items.find((x) => x.code === editCode);
    if (!existing) return;

    setItemName(existing.name);
    setItemCat(existing.cat);
    setItemType(existing.type === "Service" ? "service" : "product");
    setOpeningStock(String(existing.qty));
    setItemCode(existing.code);
    setEditColor(existing.color);
    setImages(existing.images ?? []);
    setLsaOn(existing.low ?? false);

    const rawSale = existing.sale.replace(/[^0-9]/g, "");
    const rawPurchase = existing.purchase.replace(/[^0-9]/g, "");
    setSalesPrice(rawSale);
    setPurchasePrice(rawPurchase);

    // Reconstruct variations + variantRows from saved variants
    if (existing.variants && existing.variants.length > 0) {
      const label0 = existing.varLabels?.[0] ?? "Size";
      const label1 = existing.varLabels?.[1] ?? "Color";
      const vals0 = [...new Set(existing.variants.map((v) => v.size).filter(Boolean))];
      const vals1 = [...new Set(existing.variants.map((v) => v.color).filter(Boolean))];

      const rebuilt: Variation[] = [];
      if (vals0.length > 0) rebuilt.push({ id: crypto.randomUUID(), label: label0, values: vals0, draft: "" });
      if (vals1.length > 0) rebuilt.push({ id: crypto.randomUUID(), label: label1, values: vals1, draft: "" });

      // Store stock values in a ref — the variation effect will read and apply them
      const stocks: Record<string, string> = {};
      for (const v of existing.variants) {
        const key = [v.size, v.color].filter(Boolean).join("|");
        stocks[key] = String(v.stock);
      }
      pendingStocks.current = stocks;

      setVariations(rebuilt);
    } else {
      pendingStocks.current = null;
      setVariations([]);
      setVariantRows({});
    }
  }, [editCode, items]);

  useEffect(() => {
    const filled = variations.filter((v) => v.values.length > 0);
    if (filled.length === 0) { setVariantRows({}); return; }
    const combos = cartesian(filled.map((v) => v.values));
    const inherited = pendingStocks.current;
    if (inherited) pendingStocks.current = null; // consume once
    setVariantRows((prev) => {
      const next: Record<string, VariantRow> = {};
      for (const combo of combos) {
        const key = combo.join("|");
        if (prev[key]) {
          next[key] = prev[key];
        } else {
          const stock = inherited?.[key] ?? "";
          next[key] = { key, combo, sku: "", salesPrice: "", purchasePrice: "", stock };
        }
      }
      return next;
    });
  }, [variations]);

  function updateVariantRow(key: string, field: keyof Omit<VariantRow, "key" | "combo">, value: string) {
    setVariantRows((prev) => ({ ...prev, [key]: { ...prev[key], [field]: value } }));
  }

  function addVariation() {
    setVariations((prev) => {
      if (prev.length >= 2) return prev;
      return [...prev, { id: crypto.randomUUID(), label: "", values: [], draft: "" }];
    });
  }

  const sortedVariantRows = Object.values(variantRows);

  function handleSave(andNew = false) {
    if (!itemName.trim()) { setNameError(true); return; }
    const words = itemName.trim().split(" ");
    const init = words.map((w) => w[0]?.toUpperCase() ?? "").join("").slice(0, 2) || "??";
    const qty = parseInt(openingStock) || 0;
    const code = itemCode.trim() || `${init}-${Date.now().toString().slice(-4)}`;
    const avatarColors = ["#29ad82","#1565c0","#5d4037","#6d1c2e","#6a1b9a","#e65100","#00695c","#ad1457"];
    const color = editColor ?? avatarColors[Math.floor(Math.random() * avatarColors.length)];

    const filledVariations = variations.filter((v) => v.values.length > 0);
    const varLabels = filledVariations.length > 0 ? filledVariations.map((v) => v.label || `Variation ${filledVariations.indexOf(v) + 1}`) : undefined;

    const variantList = sortedVariantRows.length > 0
      ? sortedVariantRows.map((r) => ({
          size: r.combo[0] || "",   // slot 0 — whatever the first variation type is
          color: r.combo[1] || "",  // slot 1 — whatever the second variation type is
          stock: parseInt(r.stock) || 0,
        }))
      : undefined;

    // If variants exist, total qty = sum of variant stocks; otherwise use opening stock field
    const totalQty = variantList
      ? variantList.reduce((sum, v) => sum + v.stock, 0)
      : qty;

    const itemData = {
      init,
      name: itemName.trim(),
      cat: itemCat,
      type: itemType === "product" ? "Product" : "Service",
      code,
      sale: salesPrice ? `Rs. ${parseInt(salesPrice).toLocaleString("en-US")}` : "Rs. 0",
      purchase: purchasePrice ? `Rs. ${parseInt(purchasePrice).toLocaleString("en-US")}` : "Rs. 0",
      qty: totalQty,
      low: lsaOn,
      critical: totalQty === 0,
      color,
      variants: variantList,
      varLabels,
      images: images.length > 0 ? images : undefined,
    };

    if (isEdit && editCode) {
      const existingItem = items.find((x) => x.code === editCode);
      updateItem(existingItem?.id ?? editCode, itemData);
      router.push("/inventory");
    } else {
      addItem(itemData);
      if (andNew) {
        setItemName(""); setItemCat("General"); setOpeningStock(""); setSalesPrice("");
        setPurchasePrice(""); setItemCode(""); setLsaOn(false);
        setVariations([]); setVariantRows({}); setActiveTab("stock"); setNameError(false);
        setSelectedLocations(["Main Warehouse"]); setEditColor(undefined); setImages([]);
      } else {
        router.push("/inventory");
      }
    }
  }

  function getColorDot(combo: string[]): string | null {
    for (const val of combo) { if (colorHex[val]) return colorHex[val]; }
    return null;
  }

  const inputCls = "w-full border border-[#e5e5e5] rounded-xl px-3.5 py-2.5 text-[13px] text-[#1a1a1a] outline-none focus:border-[#29ad82] bg-white placeholder:text-gray-300";
  const selectCls = "w-full border border-[#e5e5e5] rounded-xl px-3.5 py-2.5 text-[13px] text-[#1a1a1a] outline-none focus:border-[#29ad82] bg-white appearance-none";

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#f0f0f0] flex-shrink-0">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-[14px] font-semibold text-[#1a1a1a] hover:opacity-70 transition-opacity">
          <ArrowLeft size={16} />
          {isEdit ? "Edit Item" : "Add New Item"}
        </button>
        <button className="w-8 h-8 rounded-full border border-[#e5e5e5] flex items-center justify-center text-gray-400 hover:bg-gray-50 transition-colors">
          <Settings size={14} />
        </button>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-6 py-6 space-y-5">

          {/* Item Name */}
          <div>
            <label className="text-[12.5px] text-gray-500 font-medium block mb-1.5">Item Name *</label>
            <input
              className={`${inputCls} ${nameError ? "border-red-400" : ""}`}
              placeholder="eg. Elusive Hoodie"
              value={itemName}
              onChange={(e) => { setItemName(e.target.value); setNameError(false); }}
            />
            {nameError && <span className="text-red-500 text-[11px] mt-1 block">Item name is required</span>}
          </div>

          {/* Category + Item Type */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[12.5px] text-gray-500 font-medium block mb-1.5">Item Category</label>
              <div className="relative">
                <select className={selectCls} value={itemCat} onChange={(e) => setItemCat(e.target.value)}>
                  {["General", "Hoodie", "Trouser", "Shirts", "Kurti", "Fabric", "Accessories"].map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-[11px]">▾</span>
              </div>
            </div>
            <div>
              <label className="text-[12.5px] text-gray-500 font-medium block mb-1.5">Item Type</label>
              <div className="flex gap-2">
                {(["product", "service"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setItemType(t)}
                    className={`flex-1 py-2.5 text-[13px] rounded-xl border font-medium capitalize transition-colors ${
                      itemType === t
                        ? "border-[#29ad82] text-[#29ad82]"
                        : "border-[#e5e5e5] text-gray-400"
                    }`}
                  >
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-[#f0f0f0]">
            <div className="flex gap-1">
              {([["stock", "Stock Details"], ["variation", "Variation"], ["location", "Location"], ["others", "Others"]] as const).map(([t, label]) => (
                <button
                  key={t}
                  onClick={() => setActiveTab(t)}
                  className={`px-4 py-2.5 text-[13px] border-b-2 -mb-px transition-colors ${
                    activeTab === t
                      ? "text-[#29ad82] border-[#29ad82] font-semibold"
                      : "text-gray-400 border-transparent"
                  }`}
                >
                  {label}
                  {t === "variation" && variations.length > 0 && (
                    <span className="ml-1.5 text-[10px] bg-[#29ad82] text-white rounded-full px-1.5 py-0.5">{variations.length}</span>
                  )}
                  {t === "location" && selectedLocations.length > 0 && (
                    <span className="ml-1.5 text-[10px] bg-[#29ad82] text-white rounded-full px-1.5 py-0.5">{selectedLocations.length}</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* ── Stock Details ── */}
          {activeTab === "stock" && (
            <div className="space-y-4">
              {/* Opening Stock + Measuring Unit */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[12.5px] text-gray-500 font-medium block mb-1.5">
                    Opening Stock
                    {isEdit && <span className="ml-1.5 text-[10.5px] text-gray-400 font-normal">(use Adjust Stock to change)</span>}
                  </label>
                  <input
                    className={`${inputCls} ${isEdit ? "bg-[#f5f5f5] text-gray-400 cursor-not-allowed" : ""}`}
                    placeholder="0"
                    type="number"
                    value={openingStock}
                    onChange={(e) => { if (!isEdit) setOpeningStock(e.target.value); }}
                    readOnly={isEdit}
                    disabled={isEdit}
                  />
                </div>
                <div>
                  <label className="text-[12.5px] text-gray-500 font-medium block mb-1.5">Measuring Unit</label>
                  <div className="relative">
                    <select className={selectCls} value={unit} onChange={(e) => setUnit(e.target.value)}>
                      <option value="">Select Units</option>
                      <option>PCS</option><option>Metre</option><option>Kg</option><option>Box</option><option>Dozen</option>
                    </select>
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-[11px]">›</span>
                  </div>
                </div>
              </div>

              {/* Sales Price + Purchase Price */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[12.5px] text-gray-500 font-medium block mb-1.5">Sales Price</label>
                  <div className="flex items-center border border-[#e5e5e5] rounded-xl overflow-hidden focus-within:border-[#29ad82]">
                    <span className="pl-3.5 pr-1 text-[13px] text-gray-400 select-none">Rs.</span>
                    <input className="flex-1 pr-3.5 py-2.5 text-[13px] outline-none bg-white" placeholder="0" type="number" value={salesPrice} onChange={(e) => setSalesPrice(e.target.value)} />
                  </div>
                </div>
                <div>
                  <label className="text-[12.5px] text-gray-500 font-medium block mb-1.5">Purchase Price</label>
                  <div className="flex items-center border border-[#e5e5e5] rounded-xl overflow-hidden focus-within:border-[#29ad82]">
                    <span className="pl-3.5 pr-1 text-[13px] text-gray-400 select-none">Rs.</span>
                    <input className="flex-1 pr-3.5 py-2.5 text-[13px] outline-none bg-white" placeholder="0" type="number" value={purchasePrice} onChange={(e) => setPurchasePrice(e.target.value)} />
                  </div>
                </div>
              </div>

              {/* Low Stock Alert card */}
              <div className="border border-[#e5e5e5] rounded-xl overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3.5">
                  <div className="flex items-center gap-2">
                    <BellRing size={15} className="text-[#29ad82]" />
                    <span className="text-[13.5px] font-semibold text-[#1a1a1a]">Low Stock Alert</span>
                    <Info size={13} className="text-gray-300" />
                  </div>
                  <button
                    onClick={() => setLsaOn((o) => !o)}
                    className={`relative w-11 h-6 rounded-full transition-colors duration-200 flex-shrink-0 ${lsaOn ? "bg-[#29ad82]" : "bg-gray-200"}`}
                  >
                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${lsaOn ? "translate-x-5" : "translate-x-0"}`} />
                  </button>
                </div>

                {lsaOn && (
                  <div className="border-t border-[#f0f0f0] px-4 py-3.5">
                    <label className="text-[12.5px] text-gray-500 font-medium block mb-1.5">Low Stock Quantity</label>
                    <input className={inputCls} placeholder="Enter Stock Quantity" type="number" />
                  </div>
                )}
              </div>

              {/* Add Image */}
              <div>
                <label className="text-[12.5px] text-gray-500 font-medium block mb-2">Add Image</label>
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => { readFiles(Array.from(e.target.files ?? [])); e.target.value = ""; }}
                />
                <div className="flex flex-wrap gap-2.5">
                  {images.map((src, i) => (
                    <div
                      key={i}
                      draggable
                      onDragStart={() => { dragIndexRef.current = i; }}
                      onDragOver={(e) => { e.preventDefault(); }}
                      onDrop={(e) => {
                        e.preventDefault();
                        const from = dragIndexRef.current;
                        if (from === null || from === i) return;
                        setImages((prev) => {
                          const next = [...prev];
                          const [moved] = next.splice(from, 1);
                          next.splice(i, 0, moved);
                          return next;
                        });
                        dragIndexRef.current = null;
                      }}
                      className="relative w-[72px] h-[72px] rounded-xl overflow-hidden border border-[#e5e5e5] group flex-shrink-0 cursor-grab active:cursor-grabbing"
                    >
                      {i === 0 && (
                        <span className="absolute top-1 left-1 z-10 bg-[#29ad82] text-white text-[8.5px] font-bold px-1.5 py-0.5 rounded-md leading-none">Main</span>
                      )}
                      <img src={src} alt={`item-${i}`} className="w-full h-full object-cover pointer-events-none" />
                      <button
                        onClick={() => setImages((prev) => prev.filter((_, idx) => idx !== i))}
                        className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                      >
                        <X size={16} className="text-white" />
                      </button>
                    </div>
                  ))}
                  {images.length < 5 && (
                    <button
                      onClick={() => imageInputRef.current?.click()}
                      className="w-[72px] h-[72px] rounded-xl border border-dashed border-[#d0d0d0] hover:border-[#29ad82] bg-white hover:bg-[#f9fef9] flex flex-col items-center justify-center gap-1 transition-colors group flex-shrink-0"
                    >
                      <ImagePlus size={20} className="text-gray-300 group-hover:text-[#29ad82] transition-colors" />
                      <span className="text-[9.5px] text-gray-300 group-hover:text-[#29ad82]">Add</span>
                    </button>
                  )}
                </div>
                {images.length > 1 && (
                  <p className="text-[11px] text-gray-400 mt-1.5">Drag to reorder · first image is the main photo</p>
                )}
              </div>
            </div>
          )}

          {/* ── Variation ── */}
          {activeTab === "variation" && (
            <div>
              {variations.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-10 h-10 rounded-full bg-[#edfaf4] flex items-center justify-center mb-3">
                    <Plus size={18} className="text-[#29ad82]" />
                  </div>
                  <p className="text-[13px] font-medium text-[#1a1a1a] mb-1">No variations yet</p>
                  <p className="text-[12px] text-gray-400 mb-4">Add variation types like Size, Color, Material, or anything custom.</p>
                  <button onClick={addVariation} className="flex items-center gap-1.5 text-[12.5px] font-semibold text-[#29ad82] border border-[#29ad82] rounded-xl px-4 py-2 hover:bg-[#edfaf4] transition-colors">
                    <Plus size={13} /> Add Variation Type
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {variations.map((v) => (
                    <VariationRow
                      key={v.id}
                      variation={v}
                      onChange={(updated) => setVariations((prev) => prev.map((x) => (x.id === v.id ? updated : x)))}
                      onRemove={() => setVariations((prev) => prev.filter((x) => x.id !== v.id))}
                    />
                  ))}
                  {variations.length < 2 ? (
                    <button onClick={addVariation} className="flex items-center gap-1.5 text-[12.5px] text-gray-400 hover:text-[#29ad82] border border-dashed border-[#e0e0e0] hover:border-[#29ad82] rounded-xl px-4 py-3 transition-colors w-full justify-center">
                      <Plus size={13} /> Add another variation type
                    </button>
                  ) : (
                    <p className="text-center text-[11.5px] text-gray-400 py-1">Maximum 2 variation types allowed (e.g. Size &amp; Color)</p>
                  )}

                  {sortedVariantRows.length > 0 && (
                    <div className="mt-2">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-[13px] font-semibold text-[#1a1a1a]">Variant Details</p>
                        <p className="text-[11.5px] text-gray-400">{sortedVariantRows.length} variant{sortedVariantRows.length !== 1 ? "s" : ""}</p>
                      </div>
                      <div className="border border-[#e8e8e8] rounded-xl overflow-hidden">
                        <div className="grid grid-cols-[2fr_1.5fr_1.2fr_1.2fr_0.8fr] bg-[#f7f7f7] border-b border-[#e8e8e8] px-4 py-2.5">
                          {["Variant", "SKU", "Sales Price", "Purchase Price", isEdit ? "Stock (locked)" : "Stock"].map((h) => (
                            <span key={h} className={`text-[11.5px] font-semibold ${h === "Stock (locked)" ? "text-gray-300" : "text-gray-500"}`}>{h}</span>
                          ))}
                        </div>
                        {sortedVariantRows.map((row, idx) => {
                          const dot = getColorDot(row.combo);
                          return (
                            <div key={row.key} className={`grid grid-cols-[2fr_1.5fr_1.2fr_1.2fr_0.8fr] items-center px-4 py-2.5 gap-2 ${idx !== sortedVariantRows.length - 1 ? "border-b border-[#f0f0f0]" : ""}`}>
                              <div className="flex items-center gap-2">
                                {dot && <span className="w-3 h-3 rounded-full flex-shrink-0 ring-1 ring-black/10" style={{ background: dot }} />}
                                <span className="text-[12.5px] font-medium text-[#1a1a1a]">{row.combo.join(" / ")}</span>
                              </div>
                              <input className="border border-[#e5e5e5] rounded-lg px-2.5 py-1.5 text-[12px] outline-none focus:border-[#29ad82] bg-[#f9f9f9] focus:bg-white w-full" placeholder="SKU-001" value={row.sku} onChange={(e) => updateVariantRow(row.key, "sku", e.target.value)} />
                              <div className="flex border border-[#e5e5e5] rounded-lg overflow-hidden focus-within:border-[#29ad82]">
                                <span className="px-2 py-1.5 bg-[#f7f7f7] text-[11px] text-gray-400 border-r border-[#e5e5e5] flex-shrink-0">Rs.</span>
                                <input className="flex-1 px-2 py-1.5 text-[12px] outline-none bg-[#f9f9f9] focus:bg-white w-0 min-w-0" placeholder="0" type="number" value={row.salesPrice} onChange={(e) => updateVariantRow(row.key, "salesPrice", e.target.value)} />
                              </div>
                              <div className="flex border border-[#e5e5e5] rounded-lg overflow-hidden focus-within:border-[#29ad82]">
                                <span className="px-2 py-1.5 bg-[#f7f7f7] text-[11px] text-gray-400 border-r border-[#e5e5e5] flex-shrink-0">Rs.</span>
                                <input className="flex-1 px-2 py-1.5 text-[12px] outline-none bg-[#f9f9f9] focus:bg-white w-0 min-w-0" placeholder="0" type="number" value={row.purchasePrice} onChange={(e) => updateVariantRow(row.key, "purchasePrice", e.target.value)} />
                              </div>
                              <input
                                className={`border rounded-lg px-2.5 py-1.5 text-[12px] outline-none w-full text-center ${isEdit ? "border-[#e5e5e5] bg-[#f5f5f5] text-gray-400 cursor-not-allowed" : "border-[#e5e5e5] focus:border-[#29ad82] bg-[#f9f9f9] focus:bg-white"}`}
                                placeholder="0"
                                type="number"
                                value={row.stock}
                                onChange={(e) => { if (!isEdit) updateVariantRow(row.key, "stock", e.target.value); }}
                                readOnly={isEdit}
                                disabled={isEdit}
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── Location ── */}
          {activeTab === "location" && (
            <div className="space-y-4">
              <p className="text-[12.5px] text-gray-400">Select the warehouses or stores where this item is stocked.</p>
              {[
                { icon: "🏭", name: "Main Warehouse", desc: "Primary storage facility" },
                { icon: "🔧", name: "Factory Floor", desc: "Production area stock" },
                { icon: "📦", name: "Godown B", desc: "Secondary storage" },
                { icon: "👗", name: "Showroom", desc: "Display & retail stock" },
              ].map((loc) => {
                const checked = selectedLocations.includes(loc.name);
                return (
                  <div
                    key={loc.name}
                    onClick={() =>
                      setSelectedLocations((prev) =>
                        checked ? prev.filter((l) => l !== loc.name) : [...prev, loc.name]
                      )
                    }
                    className={`flex items-center gap-4 border rounded-xl px-4 py-3.5 cursor-pointer transition-all ${
                      checked
                        ? "border-[#29ad82] bg-[#edfaf4]"
                        : "border-[#e5e5e5] hover:border-[#29ad82] hover:bg-[#f9fef9]"
                    }`}
                  >
                    <span className="text-2xl">{loc.icon}</span>
                    <div className="flex-1">
                      <div className="text-[13.5px] font-semibold text-[#1a1a1a]">{loc.name}</div>
                      <div className="text-[12px] text-gray-400 mt-0.5">{loc.desc}</div>
                    </div>
                    <div
                      className={`w-5 h-5 rounded-md border-[1.5px] flex items-center justify-center flex-shrink-0 transition-colors ${
                        checked ? "bg-[#29ad82] border-[#29ad82]" : "border-[#d0d0d0] bg-white"
                      }`}
                    >
                      {checked && (
                        <svg width="11" height="8" viewBox="0 0 11 8" fill="none">
                          <path d="M1 4l3 3 6-6" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Add new location hint */}
              <button className="flex items-center gap-2 text-[12.5px] text-[#29ad82] font-medium hover:opacity-75 transition-opacity">
                <div className="w-5 h-5 rounded-md border border-dashed border-[#29ad82] flex items-center justify-center">
                  <Plus size={11} />
                </div>
                Add New Location
              </button>
            </div>
          )}

          {/* ── Others ── */}
          {activeTab === "others" && (
            <div className="space-y-4">
              <div>
                <label className="text-[12.5px] text-gray-500 font-medium block mb-1.5">Item Code / SKU</label>
                <input
                  className={inputCls}
                  placeholder="Auto-generated if left empty"
                  value={itemCode}
                  onChange={(e) => setItemCode(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[12.5px] text-gray-500 font-medium block mb-1.5">HSN Code</label>
                  <input className={inputCls} placeholder="Enter HSN code" />
                </div>
                <div>
                  <label className="text-[12.5px] text-gray-500 font-medium block mb-1.5">Tax Rate</label>
                  <select className={selectCls}>
                    <option>None</option><option>13% (VAT)</option><option>5%</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-[12.5px] text-gray-500 font-medium block mb-1.5">Description</label>
                <textarea className="w-full border border-[#e5e5e5] rounded-xl px-3.5 py-2.5 text-[13px] bg-white outline-none focus:border-[#29ad82] resize-none h-24 placeholder:text-gray-300" placeholder="Enter item description..." />
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Bottom action bar */}
      <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#f0f0f0] bg-white flex-shrink-0">
        {!isEdit && (
          <button onClick={() => handleSave(true)} className="text-[13.5px] text-gray-500 font-medium hover:text-gray-700 px-4 py-2.5 transition-colors">
            Save &amp; New
          </button>
        )}
        <button onClick={() => handleSave(false)} className="text-[13.5px] bg-[#29ad82] text-white rounded-xl px-6 py-2.5 font-semibold hover:bg-[#1d9470] transition-colors">
          {isEdit ? "Update Item" : "Add Item"}
        </button>
      </div>
    </div>
  );
}
