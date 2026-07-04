"use client";

import { useState, useRef, useEffect } from "react";
import {
  ArrowLeft, Settings, Trash2, Plus, Camera, ChevronDown,
  Calendar, Search, X, Link2,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useParties } from "@/context/PartiesContext";
import { useInventory } from "@/context/InventoryContext";
import { useSales, type InvoiceRow } from "@/context/SalesContext";
import type { FullInvoice } from "@/context/SalesContext";

type LineItem = InvoiceRow;


function calcRow(row: LineItem) {
  const qty = parseFloat(row.qty) || 0;
  const rate = parseFloat(row.rate) || 0;
  const discPct = parseFloat(row.discPct) || 0;
  const gross = qty * rate;
  const disc = discPct > 0 ? (gross * discPct) / 100 : parseFloat(row.discAmt) || 0;
  return Math.max(0, gross - disc);
}

const TAX_OPTIONS = ["VAT 13%", "VAT 5%", "No Tax"];
let nextId = 100;

export function CreateInvoicePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");
  const preselectedPartyId = searchParams.get("partyId");
  const isEdit = !!editId;

  const { parties } = useParties();
  const { items: inventoryItems, updateItem: updateInventoryItem } = useInventory();
  const { invoices, addInvoice, updateInvoice, deleteInvoice } = useSales();

  // Core fields
  const [party, setParty] = useState("");
  const [invoiceNo, setInvoiceNo] = useState(() => {
    if (isEdit) return "";
    const next = (parseInt(localStorage.getItem("gf_invoice_seq") || "10000079", 10) + 1);
    localStorage.setItem("gf_invoice_seq", String(next));
    return `#${next}`;
  });
  const [invoiceDate, setInvoiceDate] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()} ${d.toLocaleString("en", { month: "short" })} ${String(d.getDate()).padStart(2, "0")}`;
  });
  const [paymentMode, setPaymentMode] = useState("Cash");
  const [notes, setNotes] = useState("");
  const [attachImages, setAttachImages] = useState<string[]>([]);
  const [rows, setRows] = useState<LineItem[]>([
    { id: 1, name: "", qty: "", rate: "", discPct: "", discAmt: "" },
  ]);

  // Discount
  const [showDiscount, setShowDiscount] = useState(false);
  const [discPct, setDiscPct] = useState("");
  const [discAmt, setDiscAmt] = useState("");

  // Tax
  const [showTax, setShowTax] = useState(false);
  const [taxType, setTaxType] = useState("VAT 13%");


  // Received amount
  const [receivedEnabled, setReceivedEnabled] = useState(false);
  const [receivedAmt, setReceivedAmt] = useState("");

  // UI state
  const [partyError, setPartyError] = useState(false);
  const [stockErrors, setStockErrors] = useState<Record<number, string>>({});
  const [partyOpen, setPartyOpen] = useState(false);
  const [partySearch, setPartySearch] = useState("");
  const [itemSuggestRowId, setItemSuggestRowId] = useState<number | null>(null);
  const [itemDropdownPos, setItemDropdownPos] = useState<{ top: number; left: number; width: number } | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const partyDropRef = useRef<HTMLDivElement>(null);
  const partySearchRef = useRef<HTMLInputElement>(null);
  const imgRef = useRef<HTMLInputElement>(null);
  const dateRef = useRef<HTMLInputElement>(null);
  const itemInputRefs = useRef<Record<number, HTMLInputElement | null>>({});

  // Pre-fill party from partyId query param
  useEffect(() => {
    if (isEdit || !preselectedPartyId || parties.length === 0) return;
    const matched = parties.find((p) => p.id === preselectedPartyId);
    if (matched) setParty(matched.name);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preselectedPartyId, parties.length]);

  // Pre-fill when editing
  useEffect(() => {
    if (!editId) return;
    const inv = invoices.find((x) => x.id === editId);
    if (!inv) return;
    setParty(inv.party);
    setInvoiceNo(inv.no);
    setInvoiceDate(inv.date);
    setPaymentMode(inv.mode);
    setNotes(inv.notes);
    setAttachImages(inv.attachImages);
    setRows(inv.rows.length > 0 ? inv.rows : [{ id: nextId++, name: "", qty: "", rate: "", discPct: "", discAmt: "" }]);
    const recNum = Math.round(parseFloat(inv.received.replace(/[^0-9.]/g, "")) || 0);
    if (recNum > 0) { setReceivedEnabled(true); setReceivedAmt(String(recNum)); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editId, invoices.length]);

  useEffect(() => {
    function out(e: MouseEvent) {
      if (partyDropRef.current && !partyDropRef.current.contains(e.target as Node)) {
        setPartyOpen(false); setPartySearch("");
      }
    }
    document.addEventListener("mousedown", out);
    return () => document.removeEventListener("mousedown", out);
  }, []);

  // Calculations
  const subTotal = rows.reduce((s, r) => s + calcRow(r), 0);

  // Discount: if % entered → compute Rs. amount; if Rs. entered directly use that.
  // Only applied when the discount row has actually been added.
  const discountRs = showDiscount
    ? discPct
      ? (subTotal * (parseFloat(discPct) || 0)) / 100
      : parseFloat(discAmt) || 0
    : 0;

  // Tax: only applied when the tax row has actually been added.
  const taxRate = taxType === "VAT 13%" ? 0.13 : taxType === "VAT 5%" ? 0.05 : 0;
  const taxAmt = showTax ? (subTotal - discountRs) * taxRate : 0;

  const totalAmount = subTotal - discountRs + taxAmt;
  const receivedNum = receivedEnabled ? (parseFloat(receivedAmt) || 0) : 0;
  const balanceDue = totalAmount - receivedNum;

  // Row helpers
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


  function buildInvoice(id?: string): FullInvoice {
    const status: FullInvoice["status"] =
      balanceDue <= 0 ? "PAID" : receivedNum > 0 ? "PARTIAL" : "UNPAID";
    const matchedParty = parties.find((p) => p.name === party);
    return {
      id: id ?? Date.now().toString(),
      no: invoiceNo,
      party,
      partyId: matchedParty?.id,
      date: invoiceDate,
      due: invoiceDate,
      amount: `Rs. ${totalAmount > 0 ? Math.round(totalAmount).toLocaleString("en-US") : "0"}`,
      received: `Rs. ${receivedNum > 0 ? Math.round(receivedNum).toLocaleString("en-US") : "0"}`,
      balance: `Rs. ${balanceDue > 0 ? Math.round(balanceDue).toLocaleString("en-US") : "0"}`,
      status,
      mode: paymentMode,
      creator: "Admin",
      rows,
      notes,
      attachImages,
    };
  }

  function pushPartyTransaction(inv: ReturnType<typeof buildInvoice>) {
    // Skip Cash Sale — no party record to update
    if (inv.party === "Cash Sale") return;
    const matched = parties.find((p) => p.name === inv.party);
    if (!matched) return;

    const newTxn = {
      kind: "invoice" as const,
      type: "Sales Invoice",
      date: inv.date,
      total: inv.amount,
      status: inv.status,
      bal: inv.balance,
      rem: inv.balance,
      rcpt: inv.no,
      creator: inv.creator,
    };

    // Party balance and txns are derived from invoices context in PartiesPage;
    // no need to mutate party.amt or txns here.
  }

  function validateStock(): boolean {
    const errors: Record<number, string> = {};

    for (const row of rows) {
      if (!row.name || !row.qty) continue;
      const requestedQty = parseFloat(row.qty) || 0;
      if (requestedQty <= 0) continue;

      const inventoryItem = inventoryItems.find(
        (it) => it.name.toLowerCase() === row.name.toLowerCase()
      );
      if (!inventoryItem) continue;

      // inventoryItem.qty is already the current stock after all past deductions.
      // When editing, add back the qty this invoice previously committed so we don't under-count.
      const prevQtyForItem = editId
        ? (invoices.find((inv) => inv.id === editId)?.rows ?? [])
            .filter((r) => r.name.toLowerCase() === row.name.toLowerCase())
            .reduce((sum, r) => sum + (parseFloat(r.qty) || 0), 0)
        : 0;

      const availableQty = inventoryItem.qty + prevQtyForItem;

      if (requestedQty > availableQty) {
        errors[row.id] = `Only ${availableQty} PCS available`;
      }
    }

    setStockErrors(errors);
    return Object.keys(errors).length === 0;
  }

  function deductStock(inv: ReturnType<typeof buildInvoice>, previousRows?: LineItem[]) {
    for (const row of inv.rows) {
      if (!row.name || !row.qty) continue;
      const soldQty = parseFloat(row.qty) || 0;
      if (soldQty <= 0) continue;
      const inventoryItem = inventoryItems.find(
        (it) => it.name.toLowerCase() === row.name.toLowerCase()
      );
      if (!inventoryItem || !inventoryItem.id) continue;

      // When editing, restore previous qty for this item before deducting new qty
      const prevQty = previousRows
        ? previousRows
            .filter((r) => r.name.toLowerCase() === row.name.toLowerCase())
            .reduce((s, r) => s + (parseFloat(r.qty) || 0), 0)
        : 0;

      const newQty = Math.max(0, inventoryItem.qty + prevQty - soldQty);
      updateInventoryItem(inventoryItem.id, { ...inventoryItem, qty: newQty });
    }
  }

  function handleSave(saveAndNew = false) {
    if (!party) { setPartyError(true); return; }
    if (!validateStock()) return;
    if (isEdit && editId) {
      const prevInv = invoices.find((x) => x.id === editId);
      const inv = buildInvoice(editId);
      updateInvoice(inv);
      pushPartyTransaction(inv);
      deductStock(inv, prevInv?.rows);
      router.back();
    } else {
      const inv = buildInvoice();
      addInvoice(inv);
      pushPartyTransaction(inv);
      deductStock(inv);
      if (saveAndNew) {
        setParty(""); setRows([{ id: nextId++, name: "", qty: "", rate: "", discPct: "", discAmt: "" }]);
        setNotes(""); setAttachImages([]); setPartyError(false); setStockErrors({});
        setShowDiscount(false); setShowTax(false);
        setDiscPct(""); setDiscAmt(""); setReceivedEnabled(false); setReceivedAmt("");
      } else {
        router.back();
      }
    }
  }

  function handleDelete() {
    if (editId) { deleteInvoice(editId); router.back(); }
  }

  const selectedParty = parties.find((p) => p.name === party);
  const filteredParties = partySearch
    ? parties.filter((p) => p.name.toLowerCase().includes(partySearch.toLowerCase()))
    : parties;

  const inputCls = "w-full px-3 py-2 text-[13px] text-[#1a1a1a] outline-none bg-transparent placeholder:text-gray-300";

  return (
    <div className="flex flex-col h-full bg-white">
      {/* ── Header ── */}
      <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-[#f0f0f0] flex-shrink-0">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-[15px] font-bold text-[#1a1a1a] hover:opacity-70 transition-opacity">
          <ArrowLeft size={17} />
          {isEdit ? "Edit Sales Invoice" : "Create Sales Invoice"}
        </button>
        <button className="w-8 h-8 rounded-full border border-[#e5e5e5] flex items-center justify-center text-gray-400 hover:bg-gray-50">
          <Settings size={15} />
        </button>
      </div>

      {/* ── Body ── */}
      <div className="flex-1 overflow-y-auto">
        <div className="w-full px-4 py-4 space-y-3">

          {/* Party + Invoice meta */}
          <div className="bg-white border border-[#efefef] rounded-xl px-4 py-4">
            <div className="grid grid-cols-2 gap-5">
              {/* Select Party */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[12.5px] text-gray-500 font-medium">Select Party</label>
                  {selectedParty && <span className="text-[12.5px] font-semibold text-gray-500">{selectedParty.amt}</span>}
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
                        <button onClick={() => { setParty("Cash Sale"); setPartyOpen(false); setPartySearch(""); setPartyError(false); }} className="flex items-center gap-3 w-full px-3.5 py-2.5 hover:bg-gray-50 transition-colors">
                          <div className="w-8 h-8 rounded-lg bg-[#29ad82] flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0">CS</div>
                          <span className="text-[13px] font-medium text-[#1a1a1a]">Cash Sale</span>
                        </button>
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
                    </div>
                  )}
                </div>
                {partyError && <span className="text-red-500 text-[11.5px] mt-1.5 block">Please select a party to continue</span>}
              </div>

              {/* Invoice No + Date */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <label className="text-[12.5px] text-gray-500 font-medium">Invoice No</label>
                    <span className="text-[11.5px] text-[#29ad82] font-medium cursor-pointer hover:underline">Manual</span>
                  </div>
                  <input className="w-full border border-[#e5e5e5] rounded-xl px-3.5 py-2.5 text-[13px] outline-none focus:border-[#29ad82] bg-white text-[#1a1a1a]" value={invoiceNo} onChange={(e) => setInvoiceNo(e.target.value)} />
                </div>
                <div>
                  <label className="text-[12.5px] text-gray-500 font-medium block mb-1.5">Invoice Date</label>
                  <div className="relative">
                    <input className="w-full border border-[#e5e5e5] rounded-xl px-3.5 py-2.5 text-[13px] outline-none focus:border-[#29ad82] bg-white text-[#1a1a1a] pr-10" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} />
                    <input ref={dateRef} type="date" className="absolute inset-0 opacity-0 w-full cursor-pointer"
                      onChange={(e) => { if (!e.target.value) return; const d = new Date(e.target.value); setInvoiceDate(`${d.getFullYear()} ${d.toLocaleString("en", { month: "short" })} ${String(d.getDate()).padStart(2, "0")}`); }} />
                    <Calendar size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Line items table ── */}
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
                        <div className="flex flex-col px-3 gap-0.5">
                          <div className="flex items-center gap-1">
                            <input
                              className={`w-10 py-2 text-[13px] outline-none bg-transparent placeholder:text-gray-300 ${stockErrors[row.id] ? "text-red-500" : ""}`}
                              placeholder="0"
                              type="number"
                              value={row.qty}
                              onChange={(e) => {
                                updateRow(row.id, "qty", e.target.value);
                                setStockErrors((prev) => { const n = { ...prev }; delete n[row.id]; return n; });
                              }}
                            />
                            <div className="flex items-center gap-0.5 text-[12px] text-gray-400 border border-[#e5e5e5] rounded px-1.5 py-0.5 cursor-pointer hover:border-gray-400">
                              PCS <ChevronDown size={10} />
                            </div>
                          </div>
                          {stockErrors[row.id] && (
                            <span className="text-[11px] text-red-500 leading-tight pb-1">{stockErrors[row.id]}</span>
                          )}
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

          {/* ── Notes + Images (left) · Adjustments + Totals (right) ── */}
          <div className="grid grid-cols-2 gap-3 items-start">

            {/* ── BOX 3: Notes + Attach Images ── */}
            <div className="flex flex-col gap-3">
              {/* Notes section */}
              <div className="p-0">
                <label className="text-[12.5px] text-gray-500 font-medium block mb-2">Notes or Remarks</label>
                <textarea
                  className="w-full border border-[#e5e5e5] rounded-xl px-3.5 py-2 text-[13px] bg-white outline-none focus:border-[#29ad82] resize-none h-14 placeholder:text-gray-300"
                  placeholder="Enter note or description..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              {/* Attach Images section */}
              <div className="p-0">
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

            {/* ── BOX 4: Discount / Tax + Totals ── */}
            <div className="bg-white rounded-xl overflow-hidden">

              {/* Discount row */}
              {showDiscount && (
                <div className="flex items-center gap-2 px-4 py-3 border-b border-[#f5f5f5]">
                  <span className="text-[13px] text-gray-600 font-medium w-20 flex-shrink-0">Discount</span>
                  <div className="flex items-center gap-1 border border-[#e5e5e5] rounded-lg px-2 py-1.5 flex-1">
                    <input type="number" className="w-full text-[13px] outline-none bg-transparent placeholder:text-gray-300" placeholder="0"
                      value={discPct}
                      onChange={(e) => { setDiscPct(e.target.value); if (e.target.value) setDiscAmt(""); }}
                    />
                    <span className="text-[12px] text-gray-400 flex-shrink-0">%</span>
                  </div>
                  <button className="text-gray-300 hover:text-[#29ad82] transition-colors flex-shrink-0"><Link2 size={14} /></button>
                  <div className="flex items-center gap-1 border border-[#e5e5e5] rounded-lg px-2 py-1.5 flex-1">
                    <span className="text-[12px] text-gray-400 flex-shrink-0">Rs.</span>
                    <input type="number" className="w-full text-[13px] outline-none bg-transparent placeholder:text-gray-300" placeholder="0"
                      value={discAmt || (discPct ? Math.round(discountRs).toString() : "")}
                      readOnly={!!discPct}
                      onChange={(e) => { if (!discPct) { setDiscAmt(e.target.value); } }}
                    />
                  </div>
                  <button onClick={() => { setShowDiscount(false); setDiscPct(""); setDiscAmt(""); }} className="text-red-400 hover:text-red-500 flex-shrink-0"><Trash2 size={14} /></button>
                </div>
              )}

              {/* Tax row */}
              {showTax && (
                <div className="flex items-center gap-2 px-4 py-3 border-b border-[#f5f5f5]">
                  <span className="text-[13px] text-gray-600 font-medium w-20 flex-shrink-0">Tax</span>
                  <div className="relative flex-1">
                    <select
                      value={taxType}
                      onChange={(e) => setTaxType(e.target.value)}
                      className="w-full border border-[#e5e5e5] rounded-lg px-2 py-1.5 text-[13px] text-[#1a1a1a] outline-none focus:border-[#29ad82] bg-white appearance-none pr-6"
                    >
                      {TAX_OPTIONS.map((t) => <option key={t}>{t}</option>)}
                    </select>
                    <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                  <div className="flex items-center gap-1 border border-[#e5e5e5] rounded-lg px-2 py-1.5 flex-1 bg-[#f7f8fa]">
                    <span className="text-[12px] text-gray-400 flex-shrink-0">Rs.</span>
                    <span className="text-[13px] text-[#1a1a1a]">{taxAmt > 0 ? Math.round(taxAmt).toLocaleString("en-US") : "0"}</span>
                  </div>
                  <button onClick={() => { setShowTax(false); }} className="text-red-400 hover:text-red-500 flex-shrink-0"><Trash2 size={14} /></button>
                </div>
              )}

              {/* Add Discount / Tax buttons */}
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

              {/* Total Amount */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-[#f0f0f0]">
                <span className="text-[13px] font-semibold text-[#1a1a1a]">Total Amount</span>
                <div className="flex items-center gap-1.5 bg-[#f7f8fa] border border-[#e5e5e5] rounded-lg px-3 py-1.5 w-40">
                  <span className="text-[12.5px] text-gray-400">Rs.</span>
                  <span className="text-[13px] font-semibold text-[#1a1a1a]">
                    {totalAmount > 0 ? Math.round(totalAmount).toLocaleString("en-US") : "0"}
                  </span>
                </div>
              </div>

              {/* Received Amount */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-[#f0f0f0]">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={receivedEnabled}
                    onChange={(e) => { setReceivedEnabled(e.target.checked); if (!e.target.checked) setReceivedAmt(""); }}
                    className="w-4 h-4 rounded accent-[#29ad82] cursor-pointer"
                  />
                  <span className="text-[13px] text-gray-600 font-medium">Received Amount</span>
                </label>
                <div className={`flex items-center gap-1 border rounded-lg px-3 py-1.5 w-40 transition-colors ${receivedEnabled ? "border-[#29ad82] bg-white" : "border-[#e5e5e5] bg-[#f7f8fa]"}`}>
                  <span className="text-[12.5px] text-gray-400">Rs.</span>
                  <input
                    type="number"
                    disabled={!receivedEnabled}
                    className="flex-1 text-[13px] outline-none bg-transparent placeholder:text-gray-300 disabled:cursor-not-allowed"
                    placeholder="0"
                    value={receivedAmt}
                    onChange={(e) => setReceivedAmt(e.target.value)}
                  />
                </div>
              </div>

              {/* Balance Due (shown when received is enabled) */}
              {receivedEnabled && (
                <div className="flex items-center justify-between px-4 py-3 border-b border-[#f0f0f0] bg-[#fafafa]">
                  <span className="text-[13px] font-semibold text-[#1a1a1a]">Balance Due</span>
                  <span className="text-[13px] font-bold text-[#1a1a1a] w-40 text-right pr-1">
                    Rs. {balanceDue > 0 ? Math.round(balanceDue).toLocaleString("en-US") : "0"}
                  </span>
                </div>
              )}

              {/* Payment Mode */}
              <div className="flex items-center justify-between px-4 py-3">
                <span className="text-[13px] text-gray-600 font-medium">Payment Mode</span>
                <div className="relative w-40">
                  <select
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value)}
                    className="w-full border border-[#e5e5e5] rounded-lg px-3 py-1.5 text-[13px] text-[#1a1a1a] outline-none focus:border-[#29ad82] bg-white appearance-none pr-7"
                  >
                    {["Cash", "Credit", "Bank Transfer", "QR / Wallet"].map((m) => <option key={m}>{m}</option>)}
                  </select>
                  <ChevronDown size={13} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ── Item suggestion dropdown (fixed, escapes overflow-hidden parents) ── */}
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
            {/* Header */}
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
                    const saleNum = parseInt(it.sale.replace(/[^0-9]/g, "")) || 0;
                    setRows((prev) => prev.map((r) =>
                      r.id === itemSuggestRowId
                        ? { ...r, name: it.name, rate: String(saleNum) }
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
            <button
              type="button"
              className="flex items-center gap-1.5 w-full px-4 py-2.5 text-[12.5px] text-[#29ad82] font-semibold hover:bg-[#edfaf4] border-t border-[#efefef] flex-shrink-0"
              onMouseDown={() => { setItemSuggestRowId(null); setItemDropdownPos(null); }}
            >
              <Plus size={12} /> Add New Item
            </button>
          </div>
        );
      })()}

      {/* ── Footer ── */}
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
              {isEdit ? "Update Sales Invoice" : "Save Sales Invoice"}
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

      {/* Delete confirmation popup */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/40 z-[60] flex items-center justify-center" onClick={() => setShowDeleteConfirm(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-[360px] p-6 flex flex-col gap-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between">
              <h2 className="text-[16px] font-bold text-[#1a1a1a]">Delete Sales Invoice?</h2>
              <button onClick={() => setShowDeleteConfirm(false)} className="w-7 h-7 border border-[#e5e5e5] rounded-md flex items-center justify-center hover:bg-gray-50 ml-3">
                <X size={14} className="text-gray-500" />
              </button>
            </div>
            <p className="text-[13px] text-gray-500 leading-relaxed">
              Are you sure you want to delete this transaction? The transaction cannot be recovered once it has been deleted.
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
