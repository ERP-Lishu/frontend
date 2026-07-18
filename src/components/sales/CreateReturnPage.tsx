"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import {
  ArrowLeft, Trash2, Plus, Camera, ChevronDown, Calendar, Search,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useParties } from "@/context/PartiesContext";
import { useInventory } from "@/context/InventoryContext";
import { useSales } from "@/context/SalesContext";
import { usePurchase } from "@/context/PurchaseContext";
import { usePayments } from "@/context/PaymentsContext";
import {
  fetchSalesReturnsApi,
  createSalesReturnApi,
  type SalesReturnApiResponse,
} from "@/lib/api/sales-return";
import {
  fetchPurchaseReturnsApi,
  createPurchaseReturnApi,
  type PurchaseReturnApiResponse,
} from "@/lib/api/purchase-return";
import { computePartyRunningBalance } from "@/lib/partyBalance";
import { AddPartyModal } from "@/components/parties/AddPartyModal";
import type { Party } from "@/lib/types";

interface ReturnRow {
  id: number;
  name: string;
  qty: string;
  rate: string;
  discPct: string;
  discAmt: string;
}

function calcRow(row: ReturnRow) {
  const qty = parseFloat(row.qty) || 0;
  const rate = parseFloat(row.rate) || 0;
  const discPct = parseFloat(row.discPct) || 0;
  const gross = qty * rate;
  const disc = discPct > 0 ? (gross * discPct) / 100 : parseFloat(row.discAmt) || 0;
  return Math.max(0, gross - disc);
}

const PAYMENT_METHODS = ["Cash", "Cheque", "Bank Transfer", "Credit Card"];
let nextId = 100;

export function CreateReturnPage({ type }: { type: "sales" | "purchase" }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedPartyId = searchParams.get("partyId");

  const { parties, addParty } = useParties();
  const { items: inventoryItems } = useInventory();
  const { invoices } = useSales();
  const { bills } = usePurchase();
  const { paymentsIn, paymentsOut } = usePayments();
  const [salesReturns, setSalesReturns] = useState<SalesReturnApiResponse[]>([]);
  const [purchaseReturns, setPurchaseReturns] = useState<PurchaseReturnApiResponse[]>([]);

  const seqKey = type === "sales" ? "gf_sales_return_seq" : "gf_purchase_return_seq";
  const label = type === "sales" ? "Sales Return" : "Purchase Return";
  // Tracks whether the Return No field is still auto-generated (vs. hand-edited by
  // the user), so the auto-suggested number keeps refreshing until they touch it.
  const returnNoAutoRef = useRef(true);

  const [party, setParty] = useState("");
  const [returnNo, setReturnNo] = useState(() => {
    const next = parseInt(localStorage.getItem(seqKey) || "0", 10) + 1;
    return String(next);
  });

  // returnNumber is unique in the database, but the field above only guesses from a
  // per-browser counter. Once the real list of existing returns loads, bump the
  // suggestion past the highest number actually in use so it can't collide —
  // otherwise saving fails with a generic "Failed to save" (a duplicate-key error).
  useEffect(() => {
    Promise.allSettled([fetchSalesReturnsApi(), fetchPurchaseReturnsApi()]).then(
      ([sr, pr]) => {
        if (sr.status === "fulfilled") setSalesReturns(sr.value);
        if (pr.status === "fulfilled") setPurchaseReturns(pr.value);

        const relevant = type === "sales" ? sr : pr;
        if (relevant.status !== "fulfilled" || !returnNoAutoRef.current) return;
        const maxExisting = relevant.value.reduce((max, r) => {
          const n = parseInt(r.returnNumber, 10);
          return Number.isFinite(n) && n > max ? n : max;
        }, 0);
        const stored = parseInt(localStorage.getItem(seqKey) || "0", 10);
        const next = Math.max(maxExisting, stored) + 1;
        localStorage.setItem(seqKey, String(next));
        setReturnNo(String(next));
      },
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [returnDate, setReturnDate] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()} ${d.toLocaleString("en", { month: "short" })} ${String(d.getDate()).padStart(2, "0")}`;
  });
  const [paymentMode, setPaymentMode] = useState("Cash");
  const [notes, setNotes] = useState("");
  const [attachImages, setAttachImages] = useState<string[]>([]);
  const [rows, setRows] = useState<ReturnRow[]>([
    { id: 1, name: "", qty: "", rate: "", discPct: "", discAmt: "" },
  ]);

  const [partyError, setPartyError] = useState(false);
  const [itemsError, setItemsError] = useState("");
  const [saving, setSaving] = useState(false);
  const [partyOpen, setPartyOpen] = useState(false);
  const [partySearch, setPartySearch] = useState("");
  const [addPartyOpen, setAddPartyOpen] = useState(false);
  const [itemSuggestRowId, setItemSuggestRowId] = useState<number | null>(null);
  const [itemDropdownPos, setItemDropdownPos] = useState<{ top: number; left: number; width: number } | null>(null);

  const partyDropRef = useRef<HTMLDivElement>(null);
  const partySearchRef = useRef<HTMLInputElement>(null);
  const imgRef = useRef<HTMLInputElement>(null);
  const dateRef = useRef<HTMLInputElement>(null);
  const itemInputRefs = useRef<Record<number, HTMLInputElement | null>>({});

  useEffect(() => {
    if (!preselectedPartyId || parties.length === 0) return;
    const matched = parties.find((p) => p.id === preselectedPartyId);
    if (matched) setParty(matched.name);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preselectedPartyId, parties.length]);

  useEffect(() => {
    function out(e: MouseEvent) {
      if (partyDropRef.current && !partyDropRef.current.contains(e.target as Node)) {
        setPartyOpen(false); setPartySearch("");
      }
    }
    document.addEventListener("mousedown", out);
    return () => document.removeEventListener("mousedown", out);
  }, []);

  const subTotal = rows.reduce((s, r) => s + calcRow(r), 0);
  const totalAmount = subTotal;

  function addRow() {
    setRows((r) => [...r, { id: nextId++, name: "", qty: "", rate: "", discPct: "", discAmt: "" }]);
  }
  function removeRow(id: number) {
    setRows((r) => (r.length > 1 ? r.filter((row) => row.id !== id) : r));
  }
  function updateRow(id: number, field: keyof ReturnRow, value: string) {
    setRows((r) => r.map((row) => {
      if (row.id !== id) return row;
      const updated = { ...row, [field]: value };
      if (field === "discPct" && value) updated.discAmt = "";
      if (field === "discAmt" && value) updated.discPct = "";
      return updated;
    }));
  }

  async function handleCreateParty(newParty: Party) {
    await addParty(newParty);
    setParty(newParty.name);
    setPartyError(false);
    setPartyOpen(false);
    setPartySearch("");
    setAddPartyOpen(false);
  }

  function returnToParties() {
    if (preselectedPartyId) {
      router.push(`/parties?selected=${preselectedPartyId}`);
    } else {
      router.back();
    }
  }

  function resetForm(lastReturnNo: string) {
    setParty("");
    const lastNum = parseInt(lastReturnNo, 10) || 0;
    const stored = parseInt(localStorage.getItem(seqKey) || "0", 10);
    const next = Math.max(lastNum, stored) + 1;
    localStorage.setItem(seqKey, String(next));
    returnNoAutoRef.current = true;
    setReturnNo(String(next));
    setRows([{ id: nextId++, name: "", qty: "", rate: "", discPct: "", discAmt: "" }]);
    setNotes("");
    setAttachImages([]);
    setPartyError(false);
    setItemsError("");
  }

  async function handleSave(saveAndNew = false) {
    if (!party) { setPartyError(true); return; }
    const validRows = rows.filter((r) => r.name.trim());
    if (validRows.length === 0) { setItemsError("Add at least one item"); return; }
    setItemsError("");

    const matchedParty = parties.find((p) => p.name === party);
    const payload = {
      partyId: matchedParty?.id,
      returnNumber: returnNo,
      returnDate: new Date().toISOString(),
      notes: notes || undefined,
      paymentMode: paymentMode.toUpperCase().replace(/ /g, "_"),
      subTotal,
      totalAmount,
      imageUrl: attachImages[0],
      items: validRows.map((r) => ({
        itemName: r.name.trim(),
        quantity: parseFloat(r.qty) || 0,
        rate: parseFloat(r.rate) || 0,
        discountPercent: parseFloat(r.discPct) || 0,
        discount: parseFloat(r.discAmt) || 0,
        amount: calcRow(r),
      })),
    };

    setSaving(true);
    try {
      if (type === "sales") {
        await createSalesReturnApi(payload);
      } else {
        await createPurchaseReturnApi(payload);
      }
      if (saveAndNew) {
        resetForm(returnNo);
      } else {
        returnToParties();
      }
    } catch {
      setItemsError("Failed to save. Return No may already be in use — try a different number.");
    } finally {
      setSaving(false);
    }
  }

  const selectedParty = parties.find((p) => p.name === party);
  const selectedPartyBalance = useMemo(() => {
    if (!selectedParty) return null;
    return computePartyRunningBalance(selectedParty, {
      invoices,
      bills,
      paymentsIn,
      paymentsOut,
      salesReturns,
      purchaseReturns,
    });
  }, [selectedParty, invoices, bills, paymentsIn, paymentsOut, salesReturns, purchaseReturns]);

  const filteredParties = partySearch
    ? parties.filter((p) => p.name.toLowerCase().includes(partySearch.toLowerCase()))
    : parties;

  const inputCls = "w-full px-3 py-2 text-[13px] text-[#1a1a1a] outline-none bg-transparent placeholder:text-gray-300";

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-[#f0f0f0] flex-shrink-0">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-[15px] font-bold text-[#1a1a1a] hover:opacity-70 transition-opacity">
          <ArrowLeft size={17} />
          Create {label}
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto">
        <div className="w-full px-4 py-4 space-y-3">

          {/* Party + Return meta */}
          <div className="bg-white border border-[#efefef] rounded-xl px-4 py-4">
            <div className="grid grid-cols-2 gap-5">
              {/* Select Party */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[12.5px] text-gray-500 font-medium">Select Party</label>
                  {selectedPartyBalance && (
                    <span
                      className={`text-[12.5px] font-semibold ${
                        selectedPartyBalance.amt === "Rs. 0"
                          ? "text-gray-400"
                          : selectedPartyBalance.g
                            ? "text-[#29ad82]"
                            : "text-red-500"
                      }`}
                    >
                      {selectedPartyBalance.amt}
                    </span>
                  )}
                </div>
                <div className="relative" ref={partyDropRef}>
                  <button
                    onClick={() => { setPartyOpen((o) => !o); setTimeout(() => partySearchRef.current?.focus(), 50); }}
                    className={`w-full flex items-center justify-between border rounded-xl px-3.5 py-2.5 text-[13px] text-left transition-colors ${
                      partyError ? "border-red-400" : partyOpen ? "border-[#29ad82]" : "border-[#e5e5e5] hover:border-[#29ad82]"
                    } bg-white`}
                  >
                    <span className={party ? "text-[#1a1a1a] font-medium" : "text-gray-400"}>{party || "Search for party"}</span>
                    <ChevronDown size={14} className={`text-gray-400 transition-transform ${partyOpen ? "rotate-180" : ""}`} />
                  </button>
                  {partyOpen && (
                    <div className="absolute left-0 top-full mt-1.5 w-full bg-white rounded-2xl shadow-2xl border border-[#efefef] z-50 overflow-hidden">
                      <div className="flex items-center gap-2 px-3.5 py-2.5 border-b border-[#f0f0f0]">
                        <Search size={13} className="text-gray-400 flex-shrink-0" />
                        <input ref={partySearchRef} className="flex-1 text-[13px] outline-none placeholder:text-gray-400 bg-transparent" placeholder="Search for party" value={partySearch} onChange={(e) => setPartySearch(e.target.value)} />
                      </div>
                      <div className="max-h-[240px] overflow-y-auto py-1">
                        {filteredParties.map((p) => (
                          <button key={p.name} onClick={() => { setParty(p.name); setPartyOpen(false); setPartySearch(""); setPartyError(false); }}
                            className={`flex items-center justify-between w-full px-3.5 py-2.5 hover:bg-gray-50 transition-colors ${party === p.name ? "bg-[#edfaf4]" : ""}`}>
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-[#29ad82] flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0">{p.init}</div>
                              <span className="text-[13px] font-medium text-[#1a1a1a]">{p.name}</span>
                            </div>
                            <span className={`text-[12.5px] font-semibold ${parseFloat(p.amt.replace(/[^0-9.]/g, "")) > 0 && p.g ? "text-[#29ad82]" : parseFloat(p.amt.replace(/[^0-9.]/g, "")) > 0 ? "text-red-500" : "text-gray-400"}`}>{p.amt}</span>
                          </button>
                        ))}
                        {filteredParties.length === 0 && <div className="text-center py-6 text-[12.5px] text-gray-400">No parties found</div>}
                      </div>
                      <button
                        onClick={() => { setAddPartyOpen(true); setPartyOpen(false); }}
                        className="flex items-center gap-2 w-full px-3.5 py-2.5 border-t border-[#f0f0f0] text-[13px] font-semibold text-[#29ad82] hover:bg-[#f7fdfb] transition-colors"
                      >
                        <Plus size={14} />
                        Add New Party
                      </button>
                    </div>
                  )}
                </div>
                {partyError && <span className="text-red-500 text-[11.5px] mt-1.5 block">Please select a party to continue</span>}
              </div>

              {/* Return No + Date */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <label className="text-[12.5px] text-gray-500 font-medium">Return No</label>
                    <span className="text-[11.5px] text-[#29ad82] font-medium cursor-pointer hover:underline">Manual</span>
                  </div>
                  <input className="w-full border border-[#e5e5e5] rounded-xl px-3.5 py-2.5 text-[13px] outline-none focus:border-[#29ad82] bg-white text-[#1a1a1a]" value={returnNo} onChange={(e) => { returnNoAutoRef.current = false; setReturnNo(e.target.value); }} />
                </div>
                <div>
                  <label className="text-[12.5px] text-gray-500 font-medium block mb-1.5">Return Date</label>
                  <div className="relative">
                    <input className="w-full border border-[#e5e5e5] rounded-xl px-3.5 py-2.5 text-[13px] outline-none focus:border-[#29ad82] bg-white text-[#1a1a1a] pr-10" value={returnDate} onChange={(e) => setReturnDate(e.target.value)} />
                    <input ref={dateRef} type="date" className="absolute inset-0 opacity-0 w-full cursor-pointer"
                      onChange={(e) => { if (!e.target.value) return; const d = new Date(e.target.value); setReturnDate(`${d.getFullYear()} ${d.toLocaleString("en", { month: "short" })} ${String(d.getDate()).padStart(2, "0")}`); }} />
                    <Calendar size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Line items table */}
          <div className="bg-white border border-[#efefef] rounded-xl">
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
                      <td className="border-l border-[#efefef] align-middle">
                        <input
                          ref={(el) => { itemInputRefs.current[row.id] = el; }}
                          className={inputCls}
                          placeholder="Enter Item name"
                          value={row.name}
                          onChange={(e) => {
                            updateRow(row.id, "name", e.target.value);
                            setItemSuggestRowId(row.id);
                          }}
                          onFocus={() => {
                            const el = itemInputRefs.current[row.id];
                            if (el) {
                              const rect = el.getBoundingClientRect();
                              setItemDropdownPos({ top: rect.bottom + window.scrollY, left: rect.left + window.scrollX, width: Math.max(rect.width, 520) });
                            }
                            setItemSuggestRowId(row.id);
                          }}
                          onBlur={() => setTimeout(() => { setItemSuggestRowId(null); setItemDropdownPos(null); }, 200)}
                        />
                      </td>
                      <td className="border-l border-[#efefef] align-middle">
                        <div className="flex items-center gap-1 px-3">
                          <input
                            className="w-full py-2 text-[13px] outline-none bg-transparent placeholder:text-gray-300"
                            placeholder="0"
                            type="number"
                            value={row.qty}
                            onChange={(e) => updateRow(row.id, "qty", e.target.value)}
                          />
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

            {/* Add Billing Item + Sub Total */}
            <div className="flex items-center border-t border-[#f0f0f0]">
              <button onClick={addRow} className="flex items-center gap-1.5 text-[12.5px] text-[#29ad82] font-semibold px-5 py-3 hover:bg-[#edfaf4] transition-colors">
                <Plus size={13} /> Add Billing Item
              </button>
              <div className="ml-auto flex items-center gap-6 px-5 py-3 border-l border-[#f0f0f0]">
                <span className="text-[13px] text-gray-500 font-medium">Sub Total</span>
                <span className="text-[13px] font-semibold text-[#1a1a1a] min-w-[80px] text-right">
                  Rs. {subTotal > 0 ? subTotal.toLocaleString("en-US") : "0"}
                </span>
              </div>
            </div>
          </div>
          {itemsError && <p className="text-[12px] text-red-500 px-1">{itemsError}</p>}

          {/* Notes + Images (left) · Total + Payment Mode (right) */}
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
              <div className="flex items-center justify-between px-4 py-3 border-b border-[#f0f0f0]">
                <span className="text-[13px] font-semibold text-[#1a1a1a]">Total Amount</span>
                <div className="flex items-center gap-1.5 bg-[#f7f8fa] border border-[#e5e5e5] rounded-lg px-3 py-1.5 w-40">
                  <span className="text-[12.5px] text-gray-400">Rs.</span>
                  <span className="text-[13px] font-semibold text-[#1a1a1a]">
                    {totalAmount > 0 ? Math.round(totalAmount).toLocaleString("en-US") : "0"}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between px-4 py-3">
                <span className="text-[13px] text-gray-600 font-medium">Payment Mode</span>
                <div className="relative w-40">
                  <select
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value)}
                    className="w-full border border-[#e5e5e5] rounded-lg px-3 py-1.5 text-[13px] text-[#1a1a1a] outline-none focus:border-[#29ad82] bg-white appearance-none pr-7"
                  >
                    {PAYMENT_METHODS.map((m) => <option key={m}>{m}</option>)}
                  </select>
                  <ChevronDown size={13} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Item suggestion dropdown (fixed, escapes overflow-hidden parents) */}
      {itemSuggestRowId !== null && itemDropdownPos && (() => {
        const activeRow = rows.find((r) => r.id === itemSuggestRowId);
        const matches = activeRow && activeRow.name.length > 0
          ? inventoryItems.filter((it) => it.name.toLowerCase().includes(activeRow.name.toLowerCase()))
          : inventoryItems;
        if (matches.length === 0) return null;
        return (
          <div
            className="fixed z-[9999] bg-white border border-[#efefef] rounded-xl shadow-2xl overflow-hidden flex flex-col"
            style={{ top: itemDropdownPos.top + 4, left: itemDropdownPos.left, width: itemDropdownPos.width, maxHeight: 260 }}
          >
            <div className="grid grid-cols-4 px-4 py-2 bg-[#fafafa] border-b border-[#efefef] flex-shrink-0">
              <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Item Name</span>
              <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide text-center">Quantity</span>
              <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide text-right">Sales Price</span>
              <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide text-right">Purchase Price</span>
            </div>
            <div className="overflow-y-auto flex-1">
              {matches.map((it) => (
                <button
                  key={it.id}
                  type="button"
                  className="grid grid-cols-4 w-full px-4 py-2.5 hover:bg-[#f7f7f7] text-left items-center"
                  onMouseDown={() => {
                    const priceStr = type === "sales" ? it.sale : it.purchase;
                    const priceNum = parseInt(priceStr.replace(/[^0-9]/g, "")) || 0;
                    setRows((prev) => prev.map((r) =>
                      r.id === itemSuggestRowId
                        ? { ...r, name: it.name, rate: String(priceNum) }
                        : r
                    ));
                    setItemSuggestRowId(null);
                    setItemDropdownPos(null);
                  }}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-6 h-6 rounded bg-[#29ad82] flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">{it.init}</div>
                    <span className="text-[12.5px] text-[#1a1a1a] font-medium truncate">{it.name}</span>
                  </div>
                  <span className="text-[12px] text-gray-500 text-center">{it.qty} PCS</span>
                  <span className="text-[12px] text-gray-700 text-right">{it.sale}</span>
                  <span className="text-[12px] text-gray-500 text-right">{it.purchase}</span>
                </button>
              ))}
            </div>
          </div>
        );
      })()}

      {/* Footer */}
      <div className="flex items-center justify-end px-4 py-3 bg-white border-t border-[#f0f0f0] flex-shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={() => handleSave(true)} disabled={saving} className="text-[13.5px] text-gray-500 font-medium px-5 py-2.5 border border-[#e5e5e5] rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-60">
            Save &amp; New
          </button>
          <button onClick={() => handleSave(false)} disabled={saving} className="bg-[#29ad82] text-white text-[13.5px] font-semibold px-5 py-2.5 rounded-xl hover:bg-[#1d9470] transition-colors disabled:opacity-60">
            {saving ? "Saving…" : `Save ${label}`}
          </button>
        </div>
      </div>

      <AddPartyModal
        open={addPartyOpen}
        onClose={() => setAddPartyOpen(false)}
        onSave={handleCreateParty}
      />
    </div>
  );
}
