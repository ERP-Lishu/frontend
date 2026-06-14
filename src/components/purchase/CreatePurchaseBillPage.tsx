"use client";

import { useState, useRef, useEffect } from "react";
import {
  ArrowLeft, Settings, Trash2, Plus, Camera, ChevronDown,
  Calendar, Search, X, Link2,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useParties } from "@/context/PartiesContext";
import { useInventory } from "@/context/InventoryContext";
import { usePurchase, type FullBill } from "@/context/PurchaseContext";
import type { BillRow } from "@/lib/types";

type LineItem = BillRow;

function calcRow(row: LineItem) {
  const qty = parseFloat(row.qty) || 0;
  const rate = parseFloat(row.rate) || 0;
  const discPct = parseFloat(row.discPct) || 0;
  const gross = qty * rate;
  const disc = discPct > 0 ? (gross * discPct) / 100 : parseFloat(row.discAmt) || 0;
  return Math.max(0, gross - disc);
}

const TAX_OPTIONS = ["VAT 13%", "VAT 5%", "No Tax"];
let nextId = 200;

export function CreatePurchaseBillPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");
  const preselectedPartyId = searchParams.get("partyId");
  const isEdit = !!editId;

  const { parties } = useParties();
  const { items: inventoryItems } = useInventory();
  const { bills, addBill, updateBill, deleteBill } = usePurchase();

  const [supplier, setSupplier] = useState(() => {
    if (preselectedPartyId) return "";
    return "";
  });
  const [billNo, setBillNo] = useState(() => (isEdit ? "" : `#${Date.now()}`));
  const [billDate, setBillDate] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()} ${d.toLocaleString("en", { month: "short" })} ${String(d.getDate()).padStart(2, "0")}`;
  });
  const [paymentMode, setPaymentMode] = useState("Cash");
  const [notes, setNotes] = useState("");
  const [attachImages, setAttachImages] = useState<string[]>([]);
  const [rows, setRows] = useState<LineItem[]>([
    { id: 1, name: "", qty: "", rate: "", discPct: "", discAmt: "" },
  ]);

  const [showDiscount, setShowDiscount] = useState(false);
  const [discPct, setDiscPct] = useState("");
  const [discAmt, setDiscAmt] = useState("");

  const [showTax, setShowTax] = useState(false);
  const [taxType, setTaxType] = useState("VAT 13%");

  const [paidEnabled, setPaidEnabled] = useState(false);
  const [paidAmt, setPaidAmt] = useState("");

  const [supplierError, setSupplierError] = useState(false);
  const [supplierOpen, setSupplierOpen] = useState(false);
  const [supplierSearch, setSupplierSearch] = useState("");
  const [itemSuggestRowId, setItemSuggestRowId] = useState<number | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const supplierDropRef = useRef<HTMLDivElement>(null);
  const supplierSearchRef = useRef<HTMLInputElement>(null);
  const imgRef = useRef<HTMLInputElement>(null);
  const dateRef = useRef<HTMLInputElement>(null);

  // Pre-fill supplier from partyId query param
  useEffect(() => {
    if (!preselectedPartyId || editId) return;
    const matched = parties.find((p) => p.id === preselectedPartyId);
    if (matched) setSupplier(matched.name);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preselectedPartyId, parties.length]);

  // Pre-fill when editing
  useEffect(() => {
    if (!editId) return;
    const bill = bills.find((x) => x.id === editId);
    if (!bill) return;
    setSupplier(bill.supplier);
    setBillNo(bill.no);
    setBillDate(bill.date);
    setPaymentMode(bill.mode);
    setNotes(bill.notes);
    setAttachImages(bill.attachImages);
    setRows(bill.rows.length > 0 ? bill.rows : [{ id: nextId++, name: "", qty: "", rate: "", discPct: "", discAmt: "" }]);
    const paidNum = Math.round(parseFloat(bill.paid.replace(/[^0-9.]/g, "")) || 0);
    if (paidNum > 0) { setPaidEnabled(true); setPaidAmt(String(paidNum)); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editId, bills.length]);

  useEffect(() => {
    function out(e: MouseEvent) {
      if (supplierDropRef.current && !supplierDropRef.current.contains(e.target as Node)) {
        setSupplierOpen(false); setSupplierSearch("");
      }
    }
    document.addEventListener("mousedown", out);
    return () => document.removeEventListener("mousedown", out);
  }, []);

  const subTotal = rows.reduce((s, r) => s + calcRow(r), 0);
  const discountRs = discPct ? (subTotal * (parseFloat(discPct) || 0)) / 100 : parseFloat(discAmt) || 0;
  const taxRate = taxType === "VAT 13%" ? 0.13 : taxType === "VAT 5%" ? 0.05 : 0;
  const taxAmt = (subTotal - discountRs) * taxRate;
  const totalAmount = subTotal - discountRs + taxAmt;
  const paidNum = paidEnabled ? (parseFloat(paidAmt) || 0) : 0;
  const balanceDue = totalAmount - paidNum;

  function addRow() {
    setRows((r) => [...r, { id: nextId++, name: "", qty: "", rate: "", discPct: "", discAmt: "" }]);
  }
  function removeRow(id: number) {
    setRows((r) => (r.length > 1 ? r.filter((row) => row.id !== id) : r));
  }
  function updateRow(id: number, field: keyof LineItem, value: string) {
    setRows((r) => r.map((row) => {
      if (row.id !== id) return row;
      const updated = { ...row, [field]: value };
      if (field === "discPct" && value) updated.discAmt = "";
      if (field === "discAmt" && value) updated.discPct = "";
      return updated;
    }));
  }

  function buildBill(id?: string): FullBill {
    const status: FullBill["status"] =
      balanceDue <= 0 ? "PAID" : paidNum > 0 ? "PARTIAL" : "UNPAID";
    const matchedParty = parties.find((p) => p.name === supplier);
    return {
      id: id ?? Date.now().toString(),
      no: billNo,
      supplier,
      supplierId: matchedParty?.id,
      date: billDate,
      amount: `Rs. ${totalAmount > 0 ? Math.round(totalAmount).toLocaleString("en-US") : "0"}`,
      paid: `Rs. ${paidNum > 0 ? Math.round(paidNum).toLocaleString("en-US") : "0"}`,
      balance: `Rs. ${balanceDue > 0 ? Math.round(balanceDue).toLocaleString("en-US") : "0"}`,
      status,
      mode: paymentMode,
      rows,
      notes,
      attachImages,
    };
  }

  function handleSave(saveAndNew = false) {
    if (!supplier) { setSupplierError(true); return; }
    if (isEdit && editId) {
      updateBill(buildBill(editId));
      router.back();
    } else {
      addBill(buildBill());
      if (saveAndNew) {
        setSupplier(""); setBillNo(`#${Date.now()}`);
        setRows([{ id: nextId++, name: "", qty: "", rate: "", discPct: "", discAmt: "" }]);
        setNotes(""); setAttachImages([]); setSupplierError(false);
        setShowDiscount(false); setShowTax(false);
        setDiscPct(""); setDiscAmt(""); setPaidEnabled(false); setPaidAmt("");
      } else {
        router.back();
      }
    }
  }

  function handleDelete() {
    if (editId) { deleteBill(editId); router.back(); }
  }

  const filteredSuppliers = supplierSearch
    ? parties.filter((p) => p.name.toLowerCase().includes(supplierSearch.toLowerCase()))
    : parties;

  const inputCls = "w-full px-3 py-2 text-[13px] text-[#1a1a1a] outline-none bg-transparent placeholder:text-gray-300";

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-[#f0f0f0] flex-shrink-0">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-[15px] font-bold text-[#1a1a1a] hover:opacity-70 transition-opacity">
          <ArrowLeft size={17} />
          {isEdit ? "Edit Purchase Bill" : "Create Purchase Bill"}
        </button>
        <button className="w-8 h-8 rounded-full border border-[#e5e5e5] flex items-center justify-center text-gray-400 hover:bg-gray-50">
          <Settings size={15} />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto">
        <div className="w-full px-4 py-4 space-y-3">

          {/* Supplier + Bill meta */}
          <div className="bg-white border border-[#efefef] rounded-xl px-4 py-4">
            <div className="grid grid-cols-2 gap-5">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[12.5px] text-gray-500 font-medium">Select Supplier</label>
                </div>
                <div className="relative" ref={supplierDropRef}>
                  <button
                    onClick={() => { setSupplierOpen((o) => !o); setTimeout(() => supplierSearchRef.current?.focus(), 50); }}
                    className={`w-full flex items-center justify-between border rounded-xl px-3.5 py-2.5 text-[13px] text-left transition-colors ${
                      supplierError ? "border-red-400" : supplierOpen ? "border-[#29ad82]" : "border-[#e5e5e5] hover:border-[#29ad82]"
                    } bg-white`}
                  >
                    <span className={supplier ? "text-[#1a1a1a] font-medium" : "text-gray-400"}>{supplier || "Search for supplier"}</span>
                    <ChevronDown size={14} className={`text-gray-400 transition-transform ${supplierOpen ? "rotate-180" : ""}`} />
                  </button>
                  {supplierOpen && (
                    <div className="absolute left-0 top-full mt-1.5 w-full bg-white rounded-2xl shadow-2xl border border-[#efefef] z-50 overflow-hidden">
                      <div className="flex items-center gap-2 px-3.5 py-2.5 border-b border-[#f0f0f0]">
                        <Search size={13} className="text-gray-400 flex-shrink-0" />
                        <input ref={supplierSearchRef} className="flex-1 text-[13px] outline-none placeholder:text-gray-400 bg-transparent" placeholder="Search for supplier" value={supplierSearch} onChange={(e) => setSupplierSearch(e.target.value)} />
                      </div>
                      <div className="max-h-[240px] overflow-y-auto py-1">
                        {filteredSuppliers.map((p) => (
                          <button key={p.name} onClick={() => { setSupplier(p.name); setSupplierOpen(false); setSupplierSearch(""); setSupplierError(false); }}
                            className={`flex items-center justify-between w-full px-3.5 py-2.5 hover:bg-gray-50 transition-colors ${supplier === p.name ? "bg-[#edfaf4]" : ""}`}>
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-[#29ad82] flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0">{p.init}</div>
                              <span className="text-[13px] font-medium text-[#1a1a1a]">{p.name}</span>
                            </div>
                            <span className="text-[12.5px] font-semibold text-gray-400">{p.amt}</span>
                          </button>
                        ))}
                        {filteredSuppliers.length === 0 && <div className="text-center py-6 text-[12.5px] text-gray-400">No suppliers found</div>}
                      </div>
                    </div>
                  )}
                </div>
                {supplierError && <span className="text-red-500 text-[11.5px] mt-1.5 block">Please select a supplier to continue</span>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <label className="text-[12.5px] text-gray-500 font-medium">Bill No</label>
                    <span className="text-[11.5px] text-[#29ad82] font-medium cursor-pointer hover:underline">Manual</span>
                  </div>
                  <input className="w-full border border-[#e5e5e5] rounded-xl px-3.5 py-2.5 text-[13px] outline-none focus:border-[#29ad82] bg-white text-[#1a1a1a]" value={billNo} onChange={(e) => setBillNo(e.target.value)} />
                </div>
                <div>
                  <label className="text-[12.5px] text-gray-500 font-medium block mb-1.5">Bill Date</label>
                  <div className="relative">
                    <input className="w-full border border-[#e5e5e5] rounded-xl px-3.5 py-2.5 text-[13px] outline-none focus:border-[#29ad82] bg-white text-[#1a1a1a] pr-10" value={billDate} onChange={(e) => setBillDate(e.target.value)} />
                    <input ref={dateRef} type="date" className="absolute inset-0 opacity-0 w-full cursor-pointer"
                      onChange={(e) => { if (!e.target.value) return; const d = new Date(e.target.value); setBillDate(`${d.getFullYear()} ${d.toLocaleString("en", { month: "short" })} ${String(d.getDate()).padStart(2, "0")}`); }} />
                    <Calendar size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Line items table */}
          <div className="bg-white border border-[#efefef] rounded-xl overflow-hidden">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-[#f0f0f0] bg-[#fafafa]">
                  <th className="text-left px-5 py-3 text-[12px] text-gray-400 font-medium w-12">S.N.</th>
                  <th className="text-left px-4 py-3 text-[12px] text-gray-400 font-medium border-l border-[#efefef]">Name</th>
                  <th className="text-left px-4 py-3 text-[12px] text-gray-400 font-medium border-l border-[#efefef] w-32">Quantity</th>
                  <th className="text-left px-4 py-3 text-[12px] text-gray-400 font-medium border-l border-[#efefef] w-32">Rate</th>
                  <th className="text-left px-4 py-3 text-[12px] text-gray-400 font-medium border-l border-[#efefef] w-40">Discount</th>
                  <th className="text-left px-4 py-3 text-[12px] text-gray-400 font-medium border-l border-[#efefef] w-28">Amount</th>
                  <th className="w-10 border-l border-[#efefef]" />
                </tr>
              </thead>
              <tbody>
                {rows.map((row, idx) => {
                  const amt = calcRow(row);
                  return (
                    <tr key={row.id} className="border-b border-[#f8f8f8] hover:bg-[#fafafa] transition-colors">
                      <td className="px-5 py-2 text-[13px] text-gray-400 text-center">{idx + 1}</td>
                      <td className="border-l border-[#efefef] align-middle relative">
                        <input
                          className={inputCls}
                          placeholder="Enter item name"
                          value={row.name}
                          onChange={(e) => { updateRow(row.id, "name", e.target.value); setItemSuggestRowId(row.id); }}
                          onFocus={() => setItemSuggestRowId(row.id)}
                          onBlur={() => setTimeout(() => setItemSuggestRowId(null), 150)}
                        />
                        {itemSuggestRowId === row.id && row.name.length > 0 && (() => {
                          const matches = inventoryItems.filter((it) =>
                            it.name.toLowerCase().includes(row.name.toLowerCase())
                          );
                          if (matches.length === 0) return null;
                          return (
                            <div className="absolute left-0 top-full z-50 w-full bg-white border border-[#efefef] rounded-xl shadow-xl overflow-hidden max-h-[200px] overflow-y-auto">
                              {matches.map((it) => (
                                <button key={it.id} type="button"
                                  className="flex items-center justify-between w-full px-3.5 py-2.5 hover:bg-[#f7f7f7] text-left"
                                  onMouseDown={() => {
                                    const purchaseNum = parseInt(it.purchase.replace(/[^0-9]/g, "")) || 0;
                                    setRows((prev) => prev.map((r) =>
                                      r.id === row.id ? { ...r, name: it.name, rate: String(purchaseNum) } : r
                                    ));
                                    setItemSuggestRowId(null);
                                  }}
                                >
                                  <span className="text-[13px] text-[#1a1a1a] font-medium">{it.name}</span>
                                  <span className="text-[12px] text-gray-400">{it.purchase}</span>
                                </button>
                              ))}
                            </div>
                          );
                        })()}
                      </td>
                      <td className="border-l border-[#efefef] align-middle">
                        <div className="flex items-center gap-1 px-3">
                          <input className="w-10 py-2 text-[13px] outline-none bg-transparent placeholder:text-gray-300" placeholder="0" type="number" value={row.qty} onChange={(e) => updateRow(row.id, "qty", e.target.value)} />
                          <div className="flex items-center gap-0.5 text-[12px] text-gray-400 border border-[#e5e5e5] rounded px-1.5 py-0.5 cursor-pointer hover:border-gray-400">
                            PCS <ChevronDown size={10} />
                          </div>
                        </div>
                      </td>
                      <td className="border-l border-[#efefef] align-middle">
                        <div className="flex items-center gap-1 px-3">
                          <span className="text-[12.5px] text-gray-400">Rs.</span>
                          <input className="flex-1 py-2 text-[13px] outline-none bg-transparent placeholder:text-gray-300 min-w-0" placeholder="0" type="number" value={row.rate} onChange={(e) => updateRow(row.id, "rate", e.target.value)} />
                        </div>
                      </td>
                      <td className="border-l border-[#efefef] align-middle">
                        <div className="flex">
                          <div className="flex items-center gap-1 px-2 flex-1 border-r border-[#efefef]">
                            <input className="w-8 py-2 text-[13px] outline-none bg-transparent placeholder:text-gray-300" placeholder="0" type="number" value={row.discPct} onChange={(e) => updateRow(row.id, "discPct", e.target.value)} />
                            <span className="text-[12px] text-gray-400">%</span>
                          </div>
                          <div className="flex items-center gap-1 px-2 flex-1">
                            <span className="text-[12px] text-gray-400">Rs.</span>
                            <input className="w-10 py-2 text-[13px] outline-none bg-transparent placeholder:text-gray-300 min-w-0" placeholder="0" type="number" value={row.discAmt} onChange={(e) => updateRow(row.id, "discAmt", e.target.value)} />
                          </div>
                        </div>
                      </td>
                      <td className="border-l border-[#efefef] align-middle">
                        <div className="flex items-center gap-1 px-3">
                          <span className="text-[12px] text-gray-400">Rs.</span>
                          <span className="py-2 text-[13px] text-[#1a1a1a] font-medium">{amt > 0 ? amt.toLocaleString("en-US") : ""}</span>
                        </div>
                      </td>
                      <td className="border-l border-[#efefef] text-center align-middle px-2">
                        <button onClick={() => removeRow(row.id)} className="w-6 h-6 rounded flex items-center justify-center mx-auto hover:opacity-80">
                          <Trash2 size={14} className="text-red-400" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <div className="flex items-center border-t border-[#f0f0f0]">
              <button onClick={addRow} className="flex items-center gap-1.5 text-[12.5px] text-[#29ad82] font-semibold px-5 py-3 hover:bg-[#edfaf4] transition-colors">
                <Plus size={13} /> Add Billing Item
              </button>
              <div className="ml-auto flex items-center gap-6 px-5 py-3 border-l border-[#f0f0f0]">
                <span className="text-[13px] text-gray-500 font-medium">Sub Total</span>
                <span className="text-[13px] font-semibold text-[#1a1a1a] min-w-[80px] text-right">
                  Rs. {subTotal > 0 ? Math.round(subTotal).toLocaleString("en-US") : "0"}
                </span>
              </div>
            </div>
          </div>

          {/* Notes + Totals */}
          <div className="grid grid-cols-2 gap-3 items-start">

            <div className="flex flex-col gap-3">
              <div>
                <label className="text-[12.5px] text-gray-500 font-medium block mb-2">Notes or Remarks</label>
                <textarea
                  className="w-full border border-[#e5e5e5] rounded-xl px-3.5 py-2 text-[13px] bg-white outline-none focus:border-[#29ad82] resize-none h-14 placeholder:text-gray-300"
                  placeholder="Enter note or description..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
              <div>
                <label className="text-[12.5px] text-gray-500 font-medium block mb-3">Attach Images</label>
                <input ref={imgRef} type="file" accept="image/*" multiple className="hidden"
                  onChange={(e) => {
                    Array.from(e.target.files ?? []).forEach((file) => {
                      const reader = new FileReader();
                      reader.onload = (ev) => { if (ev.target?.result) setAttachImages((prev) => [...prev, ev.target!.result as string].slice(0, 5)); };
                      reader.readAsDataURL(file);
                    });
                    e.target.value = "";
                  }}
                />
                <div className="flex flex-wrap gap-2.5">
                  {attachImages.map((src, i) => (
                    <div key={i} className="relative w-[64px] h-[64px] rounded-xl overflow-hidden border border-[#e5e5e5] group">
                      <img src={src} alt="" className="w-full h-full object-cover" />
                      <button onClick={() => setAttachImages((prev) => prev.filter((_, idx) => idx !== i))} className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[13px]">✕</button>
                    </div>
                  ))}
                  {attachImages.length < 5 && (
                    <button onClick={() => imgRef.current?.click()} className="w-[64px] h-[64px] rounded-xl border border-dashed border-[#d0d0d0] hover:border-[#29ad82] bg-[#fafafa] hover:bg-[#f0fdf9] flex flex-col items-center justify-center gap-1 transition-colors group">
                      <Camera size={20} className="text-gray-300 group-hover:text-[#29ad82]" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl overflow-hidden">

              {showDiscount && (
                <div className="flex items-center gap-2 px-4 py-3 border-b border-[#f5f5f5]">
                  <span className="text-[13px] text-gray-600 font-medium w-20 flex-shrink-0">Discount</span>
                  <div className="flex items-center gap-1 border border-[#e5e5e5] rounded-lg px-2 py-1.5 flex-1">
                    <input type="number" className="w-full text-[13px] outline-none bg-transparent placeholder:text-gray-300" placeholder="0" value={discPct} onChange={(e) => { setDiscPct(e.target.value); if (e.target.value) setDiscAmt(""); }} />
                    <span className="text-[12px] text-gray-400 flex-shrink-0">%</span>
                  </div>
                  <button className="text-gray-300 hover:text-[#29ad82] transition-colors flex-shrink-0"><Link2 size={14} /></button>
                  <div className="flex items-center gap-1 border border-[#e5e5e5] rounded-lg px-2 py-1.5 flex-1">
                    <span className="text-[12px] text-gray-400 flex-shrink-0">Rs.</span>
                    <input type="number" className="w-full text-[13px] outline-none bg-transparent placeholder:text-gray-300" placeholder="0"
                      value={discAmt || (discPct ? Math.round(discountRs).toString() : "")}
                      readOnly={!!discPct}
                      onChange={(e) => { if (!discPct) setDiscAmt(e.target.value); }}
                    />
                  </div>
                  <button onClick={() => { setShowDiscount(false); setDiscPct(""); setDiscAmt(""); }} className="text-red-400 hover:text-red-500 flex-shrink-0"><Trash2 size={14} /></button>
                </div>
              )}

              {showTax && (
                <div className="flex items-center gap-2 px-4 py-3 border-b border-[#f5f5f5]">
                  <span className="text-[13px] text-gray-600 font-medium w-20 flex-shrink-0">Tax</span>
                  <div className="relative flex-1">
                    <select value={taxType} onChange={(e) => setTaxType(e.target.value)} className="w-full border border-[#e5e5e5] rounded-lg px-2 py-1.5 text-[13px] text-[#1a1a1a] outline-none focus:border-[#29ad82] bg-white appearance-none pr-6">
                      {TAX_OPTIONS.map((t) => <option key={t}>{t}</option>)}
                    </select>
                    <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                  <div className="flex items-center gap-1 border border-[#e5e5e5] rounded-lg px-2 py-1.5 flex-1 bg-[#f7f8fa]">
                    <span className="text-[12px] text-gray-400 flex-shrink-0">Rs.</span>
                    <span className="text-[13px] text-[#1a1a1a]">{taxAmt > 0 ? Math.round(taxAmt).toLocaleString("en-US") : "0"}</span>
                  </div>
                  <button onClick={() => setShowTax(false)} className="text-red-400 hover:text-red-500 flex-shrink-0"><Trash2 size={14} /></button>
                </div>
              )}

              <div className="flex items-center flex-wrap gap-x-1 gap-y-1 px-4 py-3 border-b border-[#f0f0f0] bg-[#fafafa]">
                {!showDiscount && (
                  <button onClick={() => setShowDiscount(true)} className="flex items-center gap-0.5 text-[12px] text-[#29ad82] font-semibold hover:underline px-1.5 py-1">
                    <Plus size={11} /> Add Discount
                  </button>
                )}
                {!showTax && (
                  <button onClick={() => setShowTax(true)} className="flex items-center gap-0.5 text-[12px] text-[#29ad82] font-semibold hover:underline px-1.5 py-1">
                    <Plus size={11} /> Add Tax
                  </button>
                )}
              </div>

              <div className="flex items-center justify-between px-4 py-3 border-b border-[#f0f0f0]">
                <span className="text-[13px] font-semibold text-[#1a1a1a]">Total Amount</span>
                <div className="flex items-center gap-1.5 bg-[#f7f8fa] border border-[#e5e5e5] rounded-lg px-3 py-1.5 w-40">
                  <span className="text-[12.5px] text-gray-400">Rs.</span>
                  <span className="text-[13px] font-semibold text-[#1a1a1a]">
                    {totalAmount > 0 ? Math.round(totalAmount).toLocaleString("en-US") : "0"}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between px-4 py-3 border-b border-[#f0f0f0]">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={paidEnabled} onChange={(e) => { setPaidEnabled(e.target.checked); if (!e.target.checked) setPaidAmt(""); }} className="w-4 h-4 rounded accent-[#29ad82] cursor-pointer" />
                  <span className="text-[13px] text-gray-600 font-medium">Paid Amount</span>
                </label>
                <div className={`flex items-center gap-1 border rounded-lg px-3 py-1.5 w-40 transition-colors ${paidEnabled ? "border-[#29ad82] bg-white" : "border-[#e5e5e5] bg-[#f7f8fa]"}`}>
                  <span className="text-[12.5px] text-gray-400">Rs.</span>
                  <input type="number" disabled={!paidEnabled} className="flex-1 text-[13px] outline-none bg-transparent placeholder:text-gray-300 disabled:cursor-not-allowed" placeholder="0" value={paidAmt} onChange={(e) => setPaidAmt(e.target.value)} />
                </div>
              </div>

              {paidEnabled && (
                <div className="flex items-center justify-between px-4 py-3 border-b border-[#f0f0f0] bg-[#fafafa]">
                  <span className="text-[13px] font-semibold text-[#1a1a1a]">Balance Due</span>
                  <span className="text-[13px] font-bold text-[#1a1a1a] w-40 text-right pr-1">
                    Rs. {balanceDue > 0 ? Math.round(balanceDue).toLocaleString("en-US") : "0"}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between px-4 py-3">
                <span className="text-[13px] text-gray-600 font-medium">Payment Mode</span>
                <div className="relative w-40">
                  <select value={paymentMode} onChange={(e) => setPaymentMode(e.target.value)} className="w-full border border-[#e5e5e5] rounded-lg px-3 py-1.5 text-[13px] text-[#1a1a1a] outline-none focus:border-[#29ad82] bg-white appearance-none pr-7">
                    {["Cash", "Credit", "Bank Transfer", "QR / Wallet"].map((m) => <option key={m}>{m}</option>)}
                  </select>
                  <ChevronDown size={13} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-[#f0f0f0] flex-shrink-0">
        <div>
          {isEdit && (
            <button onClick={() => setShowDeleteConfirm(true)} className="text-[13.5px] text-red-500 font-medium border border-red-300 rounded-xl px-5 py-2.5 hover:bg-red-50 transition-colors">
              Delete
            </button>
          )}
        </div>
        <div className="flex items-center gap-3">
          {!isEdit && (
            <button onClick={() => handleSave(true)} className="text-[13.5px] text-gray-500 font-medium px-5 py-2.5 border border-[#e5e5e5] rounded-xl hover:bg-gray-50 transition-colors">
              Save &amp; New
            </button>
          )}
          <div className="flex rounded-xl overflow-hidden">
            <button onClick={() => handleSave(false)} className="bg-[#29ad82] text-white text-[13.5px] font-semibold px-5 py-2.5 hover:bg-[#1d9470] transition-colors">
              {isEdit ? "Update Purchase Bill" : "Save Purchase Bill"}
            </button>
            {!isEdit && (
              <>
                <div className="w-px bg-white/30" />
                <button className="bg-[#29ad82] text-white px-3 py-2.5 hover:bg-[#1d9470] transition-colors">
                  <ChevronDown size={15} />
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/40 z-[60] flex items-center justify-center" onClick={() => setShowDeleteConfirm(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-[360px] p-6 flex flex-col gap-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between">
              <h2 className="text-[16px] font-bold text-[#1a1a1a]">Delete Purchase Bill?</h2>
              <button onClick={() => setShowDeleteConfirm(false)} className="w-7 h-7 border border-[#e5e5e5] rounded-md flex items-center justify-center hover:bg-gray-50 ml-3">
                <X size={14} className="text-gray-500" />
              </button>
            </div>
            <p className="text-[13px] text-gray-500 leading-relaxed">
              Are you sure you want to delete this transaction? The transaction cannot be recovered once deleted.
            </p>
            <div className="flex items-center justify-end gap-3 pt-1">
              <button onClick={handleDelete} className="text-[13.5px] text-gray-700 font-medium hover:text-red-500 transition-colors px-2">Yes, Delete</button>
              <button onClick={() => setShowDeleteConfirm(false)} className="text-[13.5px] font-semibold bg-red-500 text-white rounded-xl px-5 py-2 hover:bg-red-600 transition-colors">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
