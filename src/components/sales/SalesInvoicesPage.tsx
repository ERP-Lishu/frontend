"use client";

import { useState, useRef, useEffect } from "react";
import {
  Plus, Search, ChevronDown, X, Trash2, Pencil,
  FileText, Download, Copy, RotateCcw, MoreVertical, Settings2, Loader2,
} from "lucide-react";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { useSales, type FullInvoice } from "@/context/SalesContext";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createSalesReturnApi } from "@/lib/api/sales-return";
import { exportToExcel } from "@/lib/exportExcel";

/* ── Delete confirmation popup ── */
function DeleteConfirmModal({
  invoiceNo,
  onConfirm,
  onCancel,
}: {
  invoiceNo: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div
      className="fixed inset-0 bg-black/40 z-[60] flex items-center justify-center"
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-[360px] p-6 flex flex-col gap-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between">
          <h2 className="text-[16px] font-bold text-[#1a1a1a]">Delete Sales Invoice?</h2>
          <button
            onClick={onCancel}
            className="w-7 h-7 border border-[#e5e5e5] rounded-md flex items-center justify-center hover:bg-gray-50 flex-shrink-0 ml-3"
          >
            <X size={14} className="text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <p className="text-[13px] text-gray-500 leading-relaxed">
          Are you sure you want to delete this transaction?{" "}
          The transaction cannot be recovered once it has been deleted.
        </p>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-1">
          <button
            onClick={onConfirm}
            className="text-[13.5px] text-gray-700 font-medium hover:text-red-500 transition-colors px-2"
          >
            Yes, Delete
          </button>
          <button
            onClick={onCancel}
            className="text-[13.5px] font-semibold bg-red-500 text-white rounded-xl px-5 py-2 hover:bg-red-600 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Three-dot action menu ── */
function ActionMenu({
  invoice,
  onEdit,
  onDelete,
  onConvert,
}: {
  invoice: FullInvoice;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onConvert: (invoice: FullInvoice) => void;
}) {
  const [open, setOpen] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function out(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", out);
    return () => document.removeEventListener("mousedown", out);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={(e) => { e.stopPropagation(); setOpen((o) => !o); }}
        className="w-7 h-7 rounded-md flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors"
      >
        <MoreVertical size={15} />
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-1 w-[210px] bg-white rounded-xl shadow-2xl border border-[#efefef] z-50 py-1 overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Edit */}
          <button
            onClick={() => { setOpen(false); onEdit(invoice.id); }}
            className="flex items-center gap-2.5 w-full px-4 py-2.5 text-[13px] text-[#1a1a1a] hover:bg-gray-50 transition-colors"
          >
            <Pencil size={14} className="text-gray-500" />
            Edit Sales Invoice
          </button>

          {/* Duplicate */}
          <button
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 w-full px-4 py-2.5 text-[13px] text-[#1a1a1a] hover:bg-gray-50 transition-colors"
          >
            <Copy size={14} className="text-gray-500" />
            Duplicate Transaction
          </button>

          {/* Convert */}
          <button
            onClick={() => { setOpen(false); onConvert(invoice); }}
            className="flex items-center gap-2.5 w-full px-4 py-2.5 text-[13px] text-[#1a1a1a] hover:bg-gray-50 transition-colors"
          >
            <RotateCcw size={14} className="text-gray-500" />
            Convert to Sales Return
          </button>

          <div className="h-px bg-[#f0f0f0] mx-3 my-1" />

          {/* Delete */}
          <button
            onClick={() => { setOpen(false); setShowDeleteModal(true); }}
            className="flex items-center gap-2.5 w-full px-4 py-2.5 text-[13px] text-red-500 hover:bg-red-50 transition-colors"
          >
            <Trash2 size={14} />
            Delete Sales Invoice
          </button>
        </div>
      )}

      {/* Delete confirmation popup */}
      {showDeleteModal && (
        <DeleteConfirmModal
          invoiceNo={invoice.no}
          onConfirm={() => { onDelete(invoice.id); setShowDeleteModal(false); }}
          onCancel={() => setShowDeleteModal(false)}
        />
      )}
    </div>
  );
}

/* ── Invoice detail modal ── */
function InvoiceModal({
  invoice,
  onClose,
  onDelete,
  onEdit,
  onConvert,
}: {
  invoice: FullInvoice;
  onClose: () => void;
  onDelete: (id: string) => void;
  onEdit: (id: string) => void;
  onConvert: (invoice: FullInvoice) => void;
}) {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function out(e: MouseEvent) {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) setMoreOpen(false);
    }
    document.addEventListener("mousedown", out);
    return () => document.removeEventListener("mousedown", out);
  }, []);

  const subTotal = invoice.rows.reduce((s, r) => {
    const qty = parseFloat(r.qty) || 0;
    const rate = parseFloat(r.rate) || 0;
    const discPct = parseFloat(r.discPct) || 0;
    const gross = qty * rate;
    const disc = discPct > 0 ? (gross * discPct) / 100 : parseFloat(r.discAmt) || 0;
    return s + Math.max(0, gross - disc);
  }, 0);

  return (
    <>
    <div className={`fixed inset-0 bg-black/45 z-50 flex items-center justify-center ${showDeleteModal ? "invisible" : ""}`} onClick={onClose}>
      <div
        className="bg-white rounded-[13px] shadow-2xl w-[700px] max-h-[88vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#f0f0f0] flex-shrink-0">
          <div className="text-[16px] font-bold text-[#1a1a1a]">Sales Invoice {invoice.no}</div>
          <button onClick={onClose} className="w-7 h-7 border border-[#e5e5e5] rounded-md flex items-center justify-center hover:bg-gray-50">
            <X size={14} className="text-gray-500" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Party info + Invoice meta */}
          <div className="flex justify-between mb-5 gap-5">
            <div className="flex flex-col gap-1.5 text-[13px]">
              <div className="flex items-center gap-2">
                <span className="text-gray-400 w-[76px] flex-shrink-0">Party:</span>
                <span className="font-semibold text-[#1a1a1a]">{invoice.party}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-400 w-[76px] flex-shrink-0">Phone No.</span>
                <span className="font-semibold text-[#1a1a1a]">—</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-400 w-[76px] flex-shrink-0">Balance:</span>
                <span className="font-semibold text-[#29ad82]">{invoice.balance}</span>
                <span className="text-[12px] text-gray-400">(To Receive)</span>
              </div>
            </div>
            <div className="flex flex-col gap-1.5 text-right text-[13px]">
              {[
                ["Invoice No", invoice.no],
                ["Invoice Date:", invoice.date],
                ["Payment Mode:", invoice.mode],
              ].map(([l, v]) => (
                <div key={l} className="flex items-center justify-end gap-3">
                  <span className="text-gray-400">{l}</span>
                  <span className="font-semibold text-[#1a1a1a] min-w-[80px] text-right">{v}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="border border-[#efefef] rounded-lg overflow-hidden mb-4">
            <table className="w-full border-collapse text-[13px]">
              <thead className="bg-[#fafafa]">
                <tr>
                  {["S.N.", "Name", "Quantity", "Rate", "Amount"].map((h, i) => (
                    <th key={h} className={`text-left px-4 py-2.5 text-[12px] text-gray-400 font-medium border-b border-[#efefef] ${i === 4 ? "text-right" : ""}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {invoice.rows.filter((r) => r.name).map((row, idx) => {
                  const qty = parseFloat(row.qty) || 0;
                  const rate = parseFloat(row.rate) || 0;
                  const discPct = parseFloat(row.discPct) || 0;
                  const gross = qty * rate;
                  const disc = discPct > 0 ? (gross * discPct) / 100 : parseFloat(row.discAmt) || 0;
                  const amt = Math.max(0, gross - disc);
                  return (
                    <tr key={row.id} className="border-b border-[#f8f8f8]">
                      <td className="px-4 py-3.5 text-gray-400">{idx + 1}</td>
                      <td className="px-4 py-3.5 font-medium text-[#1a1a1a]">{row.name}</td>
                      <td className="px-4 py-3.5 text-gray-600">{row.qty} PCS</td>
                      <td className="px-4 py-3.5 text-gray-600">Rs. {rate.toLocaleString("en-US")}</td>
                      <td className="px-4 py-3.5 font-semibold text-[#1a1a1a] text-right">Rs. {amt > 0 ? amt.toLocaleString("en-US") : "0"}</td>
                    </tr>
                  );
                })}
                {invoice.rows.every((r) => !r.name) && (
                  <tr><td colSpan={5} className="px-4 py-4 text-center text-[12.5px] text-gray-400">No items</td></tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end">
            <div className="w-72 text-[13px]">
              {[
                ["Sub Total:", `Rs. ${subTotal > 0 ? subTotal.toLocaleString("en-US") : "0"}`],
                ["Total Amount:", invoice.amount],
                ["Received Amount:", invoice.received],
              ].map(([l, v]) => (
                <div key={l} className="flex justify-between py-1.5 border-b border-[#f5f5f5]">
                  <span className="text-gray-500">{l}</span>
                  <span className="font-medium text-[#1a1a1a]">{v}</span>
                </div>
              ))}
              <div className="flex justify-between py-2.5 text-[14px] font-bold">
                <span className="text-[#1a1a1a]">Amount Due:</span>
                <span>{invoice.balance}</span>
              </div>
            </div>
          </div>

          {/* Remarks + Images side by side with totals */}
          <div className="flex gap-6 mt-4">
            <div className="flex-1">
              {invoice.notes && (
                <div className="mb-4">
                  <p className="text-[13px] font-semibold text-[#1a1a1a] mb-1">Remarks</p>
                  <p className="text-[13px] text-gray-500">{invoice.notes}</p>
                </div>
              )}
              {invoice.attachImages && invoice.attachImages.length > 0 && (
                <div>
                  <p className="text-[13px] font-semibold text-[#1a1a1a] mb-2">Images</p>
                  <div className="flex flex-wrap gap-2">
                    {invoice.attachImages.map((src, i) => (
                      <img key={i} src={src} alt="" className="w-14 h-14 rounded-lg object-cover border border-[#e5e5e5]" />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-[#f5f5f5] text-[12px] text-gray-400">
            Created by: <span className="text-gray-600">{invoice.creator}</span>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center gap-2 px-6 py-3.5 border-t border-[#f0f0f0] bg-white flex-shrink-0">
          {/* More Actions dropdown */}
          <div className="relative" ref={moreRef}>
            <button
              onClick={() => setMoreOpen((o) => !o)}
              className="flex items-center gap-1.5 text-[12.5px] border border-[#e5e5e5] rounded-lg px-3.5 py-1.5 hover:bg-gray-50 text-gray-700"
            >
              More Actions <ChevronDown size={12} className={`transition-transform ${moreOpen ? "rotate-180" : ""}`} />
            </button>
            {moreOpen && (
              <div className="absolute left-0 bottom-full mb-1.5 w-[210px] bg-white rounded-xl shadow-2xl border border-[#efefef] z-50 py-1 overflow-hidden">
                <button
                  onClick={() => setMoreOpen(false)}
                  className="flex items-center gap-2.5 w-full px-4 py-2.5 text-[13px] text-[#1a1a1a] hover:bg-gray-50 transition-colors"
                >
                  <Copy size={14} className="text-gray-500" />
                  Duplicate Transaction
                </button>
                <button
                  onClick={() => { setMoreOpen(false); onConvert(invoice); }}
                  className="flex items-center gap-2.5 w-full px-4 py-2.5 text-[13px] text-[#1a1a1a] hover:bg-gray-50 transition-colors"
                >
                  <RotateCcw size={14} className="text-gray-500" />
                  Convert to Sales Return
                </button>
              </div>
            )}
          </div>
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => setShowDeleteModal(true)}
              className="w-8 h-8 border border-[#e5e5e5] rounded-lg flex items-center justify-center hover:bg-red-50 hover:border-red-200 text-red-400 transition-colors"
              title="Delete"
            >
              <Trash2 size={14} />
            </button>
            <button
              onClick={() => onEdit(invoice.id)}
              className="w-8 h-8 border-2 border-[#29ad82] rounded-lg flex items-center justify-center hover:bg-[#edfaf4] text-[#29ad82] transition-colors"
              title="Edit"
            >
              <Pencil size={14} />
            </button>
            <button className="flex items-center gap-1.5 text-[12.5px] border border-[#e5e5e5] rounded-lg px-3.5 py-1.5 hover:bg-gray-50 text-gray-700">
              <FileText size={13} /> Print PDF
            </button>
            <button onClick={onClose} className="flex items-center gap-1.5 text-[12.5px] bg-[#29ad82] text-white rounded-lg px-3.5 py-1.5 hover:bg-[#1d9470] transition-colors">
              <Download size={13} /> Download PDF
            </button>
          </div>
        </div>
      </div>

    </div>

    {showDeleteModal && (
      <DeleteConfirmModal
        invoiceNo={invoice.no}
        onConfirm={() => { onDelete(invoice.id); onClose(); }}
        onCancel={() => setShowDeleteModal(false)}
      />
    )}
    </>
  );
}

/* ── Main page ── */
export function SalesInvoicesPage() {
  const router = useRouter();
  const { invoices, deleteInvoice } = useSales();
  const [selected, setSelected] = useState<FullInvoice | null>(null);
  const [search, setSearch] = useState("");
  const [converting, setConverting] = useState(false);

  const filtered = search
    ? invoices.filter(
        (inv) =>
          inv.party.toLowerCase().includes(search.toLowerCase()) ||
          inv.no.toLowerCase().includes(search.toLowerCase())
      )
    : invoices;

  function handleEdit(id: string) {
    setSelected(null);
    router.push(`/sales/invoices/create?edit=${id}`);
  }

  function handleExport() {
    exportToExcel("Sales_Invoices", "Sales Invoices", [
      { header: "Invoice No", key: "no", width: 16 },
      { header: "Party", key: "party", width: 24 },
      { header: "Date", key: "date", width: 16 },
      { header: "Status", key: "status", width: 12 },
      { header: "Total Amount", key: "amount", width: 18 },
      { header: "Received", key: "received", width: 18 },
      { header: "Balance", key: "balance", width: 18 },
      { header: "Payment Mode", key: "mode", width: 18 },
    ], filtered.map((inv) => ({
      no: inv.no,
      party: inv.party,
      date: inv.date,
      status: inv.status,
      amount: inv.amount,
      received: inv.received,
      balance: inv.balance,
      mode: inv.mode,
    })));
  }

  async function handleConvert(invoice: FullInvoice) {
    setConverting(true);
    setSelected(null);
    try {
      const subTotal = invoice.rows.reduce((s, r) => {
        const qty = parseFloat(r.qty) || 0;
        const rate = parseFloat(r.rate) || 0;
        return s + qty * rate;
      }, 0);
      const totalAmount = Math.round(parseFloat((invoice.amount.match(/[\d,]+/)?.[0] ?? "").replace(/,/g, "")) || subTotal);
      const returnNumber = `SR-${invoice.no.replace(/^#/, "")}-${Date.now().toString().slice(-4)}`;

      await createSalesReturnApi({
        partyId: invoice.partyId,
        returnNumber,
        returnDate: new Date().toISOString(),
        notes: invoice.notes || `Converted from invoice ${invoice.no}`,
        paymentMode: "CASH",
        subTotal: Math.round(subTotal),
        totalAmount,
        items: invoice.rows
          .filter((r) => r.name)
          .map((r) => {
            const qty = parseFloat(r.qty) || 0;
            const rate = parseFloat(r.rate) || 0;
            return { itemName: r.name, quantity: qty, rate: Math.round(rate), amount: Math.round(qty * rate) };
          }),
      });
      router.push("/sales/returns");
    } catch (err) {
      console.error("Failed to convert to sales return:", err);
      alert("Failed to convert invoice to sales return. Please try again.");
    } finally {
      setConverting(false);
    }
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#efefef]">
        <h1 className="text-[18px] font-bold text-[#1a1a1a]">
          Sales Invoices{" "}
          <span className="text-[14px] font-normal text-gray-400">({filtered.length})</span>
        </h1>
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExport}
            className="text-[12.5px] border border-[#e0e0e0] rounded-lg px-3 py-1.5 hover:bg-gray-50 flex items-center gap-1.5 text-gray-600"
          >
            <Download size={13} /> Export
          </button>
          <button className="w-8 h-8 border border-[#e0e0e0] rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-50">
            <Settings2 size={15} />
          </button>
          <Link
            href="/sales/invoices/create"
            className="flex items-center gap-1.5 text-[13px] font-semibold bg-[#29ad82] text-white rounded-lg px-4 py-2 hover:bg-[#1d9470] transition-colors"
          >
            <Plus size={14} /> Create Sales Invoice
          </Link>
        </div>
      </div>

      {/* Filters bar */}
      <div className="flex items-center gap-2.5 px-6 py-3 border-b border-[#f5f5f5]">
        <div className="flex items-center gap-2 bg-[#f7f7f7] border border-[#ebebeb] rounded-lg px-3 py-1.5 w-64">
          <Search size={13} className="text-gray-400 flex-shrink-0" />
          <input
            className="flex-1 bg-transparent outline-none text-[12.5px] text-gray-700 placeholder:text-gray-400"
            placeholder="Search invoices..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button className="flex items-center gap-1.5 text-[12.5px] border border-[#e5e5e5] rounded-lg px-3 py-1.5 bg-white hover:bg-gray-50 text-gray-600">
          All Status <ChevronDown size={12} />
        </button>
        <button className="flex items-center gap-1.5 text-[12.5px] border border-[#e5e5e5] rounded-lg px-3 py-1.5 bg-white hover:bg-gray-50 text-gray-600">
          All Date <ChevronDown size={12} />
        </button>
        <div className="ml-auto">
          <button className="flex items-center gap-1.5 text-[12.5px] border border-[#e5e5e5] rounded-lg px-3 py-1.5 bg-white hover:bg-gray-50 text-gray-600">
            Sort By <ChevronDown size={12} />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-y-auto">
        <table className="w-full border-collapse">
          <thead className="sticky top-0 bg-white border-b border-[#f0f0f0] z-10">
            <tr>
              <th className="text-left px-5 py-3 text-[12px] text-gray-400 font-medium">Invoice No</th>
              <th className="text-left px-5 py-3 text-[12px] text-gray-400 font-medium">Party Name</th>
              <th className="text-left px-5 py-3 text-[12px] text-gray-400 font-medium">Date</th>
              <th className="text-left px-5 py-3 text-[12px] text-gray-400 font-medium">Status</th>
              <th className="text-left px-5 py-3 text-[12px] text-gray-400 font-medium">Total Amount</th>
              <th className="text-left px-5 py-3 text-[12px] text-gray-400 font-medium">Unpaid Amount</th>
              <th className="text-left px-5 py-3 text-[12px] text-gray-400 font-medium">Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center py-16 text-[13px] text-gray-400">No invoices found</td>
              </tr>
            )}
            {filtered.map((inv) => (
              <tr
                key={inv.id}
                onClick={() => setSelected(inv)}
                className="border-b border-[#f8f8f8] hover:bg-[#fafafa] cursor-pointer group"
              >
                {/* Invoice No */}
                <td className="px-5 py-3.5">
                  <div className="flex flex-col gap-1.5">
                    {/* Invoice number always on top */}
                    <span className="text-[13px] font-semibold text-[#1a1a1a]">{inv.no}</span>

                    {/* Photo thumbnail below if images exist, otherwise show PDF lines icon */}
                    {inv.attachImages && inv.attachImages.length > 0 ? (
                      <div className="flex gap-1">
                        {inv.attachImages.slice(0, 2).map((src, i) => (
                          <img
                            key={i}
                            src={src}
                            alt=""
                            className="w-8 h-8 rounded-md object-cover border border-[#e5e5e5] flex-shrink-0"
                          />
                        ))}
                        {inv.attachImages.length > 2 && (
                          <div className="w-8 h-8 rounded-md bg-gray-100 border border-[#e5e5e5] flex items-center justify-center text-[10px] text-gray-400 font-medium flex-shrink-0">
                            +{inv.attachImages.length - 2}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="w-8 h-8 bg-[#f5f5f5] rounded-md border border-[#ebebeb] flex items-center justify-center flex-shrink-0">
                        <div className="flex flex-col items-center gap-[3px]">
                          <div className="w-3.5 h-[1.5px] bg-[#ccc] rounded" />
                          <div className="w-3.5 h-[1.5px] bg-[#ccc] rounded" />
                          <div className="w-2.5 h-[1.5px] bg-[#ccc] rounded" />
                        </div>
                      </div>
                    )}
                  </div>
                </td>

                {/* Party */}
                <td className="px-5 py-3.5 text-[13px] text-gray-700">{inv.party}</td>

                {/* Date */}
                <td className="px-5 py-3.5 text-[13px] text-gray-500">{inv.date}</td>

                {/* Status */}
                <td className="px-5 py-3.5">
                  <StatusBadge label={inv.status} />
                </td>

                {/* Total Amount */}
                <td className="px-5 py-3.5 text-[13px] font-medium text-[#1a1a1a]">{inv.amount}</td>

                {/* Unpaid Amount */}
                <td className="px-5 py-3.5 text-[13px] font-medium text-[#1a1a1a]">{inv.balance}</td>

                {/* Action */}
                <td className="px-5 py-3.5" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center gap-1">
                    {/* PDF download icon */}
                    <button
                      className="w-7 h-7 rounded-md flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors"
                      title="Download PDF"
                    >
                      <FileText size={15} />
                    </button>
                    {/* Three-dot menu */}
                    <ActionMenu invoice={inv} onEdit={handleEdit} onDelete={deleteInvoice} onConvert={handleConvert} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selected && (
        <InvoiceModal
          invoice={selected}
          onClose={() => setSelected(null)}
          onDelete={(id) => { deleteInvoice(id); setSelected(null); }}
          onEdit={handleEdit}
          onConvert={handleConvert}
        />
      )}

      {converting && (
        <div className="fixed inset-0 bg-black/30 z-[70] flex items-center justify-center">
          <div className="bg-white rounded-xl px-6 py-5 flex items-center gap-3 shadow-2xl">
            <Loader2 size={18} className="animate-spin text-[#29ad82]" />
            <span className="text-[13.5px] font-medium text-[#1a1a1a]">Converting to Sales Return…</span>
          </div>
        </div>
      )}
    </div>
  );
}
