"use client";

import { useState, useRef, useEffect } from "react";
import { Plus, Search, ChevronDown, X, Trash2, Pencil, MoreVertical, Download } from "lucide-react";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { usePurchase, type FullBill } from "@/context/PurchaseContext";
import { useRouter } from "next/navigation";
import { exportToExcel } from "@/lib/exportExcel";

function DeleteConfirmModal({ billNo, onConfirm, onCancel }: { billNo: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/40 z-[60] flex items-center justify-center" onClick={onCancel}>
      <div className="bg-white rounded-2xl shadow-2xl w-[360px] p-6 flex flex-col gap-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between">
          <h2 className="text-[16px] font-bold text-[#1a1a1a]">Delete Purchase Bill?</h2>
          <button onClick={onCancel} className="w-7 h-7 border border-[#e5e5e5] rounded-md flex items-center justify-center hover:bg-gray-50 ml-3">
            <X size={14} className="text-gray-500" />
          </button>
        </div>
        <p className="text-[13px] text-gray-500 leading-relaxed">
          Are you sure you want to delete <strong>{billNo}</strong>? This cannot be undone.
        </p>
        <div className="flex items-center justify-end gap-3 pt-1">
          <button onClick={onConfirm} className="text-[13.5px] text-gray-700 font-medium hover:text-red-500 transition-colors px-2">Yes, Delete</button>
          <button onClick={onCancel} className="text-[13.5px] font-semibold bg-red-500 text-white rounded-xl px-5 py-2 hover:bg-red-600 transition-colors">Cancel</button>
        </div>
      </div>
    </div>
  );
}

function ActionMenu({ bill, onEdit, onDelete }: { bill: FullBill; onEdit: (id: string) => void; onDelete: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function out(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", out);
    return () => document.removeEventListener("mousedown", out);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button onClick={(e) => { e.stopPropagation(); setOpen((o) => !o); }} className="w-7 h-7 rounded-md flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors">
        <MoreVertical size={15} />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 w-[200px] bg-white rounded-xl shadow-2xl border border-[#efefef] z-50 py-1 overflow-hidden" onClick={(e) => e.stopPropagation()}>
          <button onClick={() => { setOpen(false); onEdit(bill.id); }} className="flex items-center gap-2.5 w-full px-4 py-2.5 text-[13px] text-[#1a1a1a] hover:bg-gray-50 transition-colors">
            <Pencil size={14} className="text-gray-500" /> Edit Purchase Bill
          </button>
          <div className="h-px bg-[#f0f0f0] mx-3 my-1" />
          <button onClick={() => { setOpen(false); setShowDeleteModal(true); }} className="flex items-center gap-2.5 w-full px-4 py-2.5 text-[13px] text-red-500 hover:bg-red-50 transition-colors">
            <Trash2 size={14} /> Delete Bill
          </button>
        </div>
      )}
      {showDeleteModal && (
        <DeleteConfirmModal billNo={bill.no} onConfirm={() => { onDelete(bill.id); setShowDeleteModal(false); }} onCancel={() => setShowDeleteModal(false)} />
      )}
    </div>
  );
}

function BillDetailModal({ bill, onClose, onDelete, onEdit }: { bill: FullBill; onClose: () => void; onDelete: (id: string) => void; onEdit: (id: string) => void }) {
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const subTotal = bill.rows.reduce((s, r) => {
    const qty = parseFloat(r.qty) || 0;
    const rate = parseFloat(r.rate) || 0;
    const discPct = parseFloat(r.discPct) || 0;
    const gross = qty * rate;
    const disc = discPct > 0 ? (gross * discPct) / 100 : parseFloat(r.discAmt) || 0;
    return s + Math.max(0, gross - disc);
  }, 0);

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-[600px] max-h-[85vh] flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#f0f0f0] flex-shrink-0">
          <div>
            <div className="text-[16px] font-bold text-[#1a1a1a]">Purchase Bill {bill.no}</div>
            <div className="text-[12.5px] text-gray-400 mt-0.5">{bill.supplier} · {bill.date}</div>
          </div>
          <button onClick={onClose} className="w-8 h-8 border border-[#e5e5e5] rounded-lg flex items-center justify-center hover:bg-gray-50">
            <X size={15} className="text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          <table className="w-full border-collapse mb-4">
            <thead>
              <tr className="border-b border-[#f0f0f0]">
                {["#", "Item", "Qty", "Rate", "Amount"].map((h) => (
                  <th key={h} className="text-left py-2 px-3 text-[11px] text-gray-400 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {bill.rows.filter((r) => r.name).map((r, i) => {
                const qty = parseFloat(r.qty) || 0;
                const rate = parseFloat(r.rate) || 0;
                const discPct = parseFloat(r.discPct) || 0;
                const gross = qty * rate;
                const disc = discPct > 0 ? (gross * discPct) / 100 : parseFloat(r.discAmt) || 0;
                const amt = Math.max(0, gross - disc);
                return (
                  <tr key={r.id} className="border-b border-[#f8f8f8]">
                    <td className="py-2.5 px-3 text-[12.5px] text-gray-400">{i + 1}</td>
                    <td className="py-2.5 px-3 text-[13px] text-gray-700 font-medium">{r.name}</td>
                    <td className="py-2.5 px-3 text-gray-600">{r.qty} PCS</td>
                    <td className="py-2.5 px-3 text-gray-600">Rs. {Math.round(rate).toLocaleString("en-US")}</td>
                    <td className="py-2.5 px-3 font-semibold text-[#1a1a1a] text-right">Rs. {amt > 0 ? Math.round(amt).toLocaleString("en-US") : "0"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div className="flex flex-col items-end gap-1.5 text-[13px]">
            {[
              ["Sub Total:", `Rs. ${subTotal > 0 ? Math.round(subTotal).toLocaleString("en-US") : "0"}`],
              ["Total Amount:", bill.amount],
              ...(parseFloat(bill.paid.replace(/[^0-9.]/g, "")) > 0 ? [["Paid:", bill.paid], ["Balance Due:", bill.balance]] : []),
            ].map(([label, val]) => (
              <div key={label} className="flex gap-6">
                <span className="text-gray-500">{label}</span>
                <span className="font-semibold text-[#1a1a1a] w-28 text-right">{val}</span>
              </div>
            ))}
          </div>

          {bill.notes && (
            <div className="mt-4 bg-[#f9fafb] rounded-xl px-4 py-3 text-[12.5px] text-gray-600">
              <span className="font-medium text-gray-500">Notes: </span>{bill.notes}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 px-6 py-3.5 border-t border-[#f0f0f0] bg-white flex-shrink-0">
          <StatusBadge label={bill.status} />
          <div className="ml-auto flex items-center gap-2">
            <button onClick={() => setShowDeleteModal(true)} className="w-8 h-8 border border-[#e5e5e5] rounded-lg flex items-center justify-center hover:bg-red-50 hover:border-red-200 text-red-400 transition-colors">
              <Trash2 size={14} />
            </button>
            <button onClick={() => onEdit(bill.id)} className="w-8 h-8 border-2 border-[#29ad82] rounded-lg flex items-center justify-center hover:bg-[#edfaf4] text-[#29ad82] transition-colors">
              <Pencil size={14} />
            </button>
            <button onClick={onClose} className="flex items-center gap-1.5 text-[12.5px] bg-[#29ad82] text-white rounded-lg px-3.5 py-1.5 hover:bg-[#1d9470] transition-colors">
              Close
            </button>
          </div>
        </div>
      </div>

      {showDeleteModal && (
        <DeleteConfirmModal billNo={bill.no} onConfirm={() => { onDelete(bill.id); onClose(); setShowDeleteModal(false); }} onCancel={() => setShowDeleteModal(false)} />
      )}
    </div>
  );
}

export function PurchaseBillsPage() {
  const router = useRouter();
  const { bills, deleteBill } = usePurchase();
  const [selected, setSelected] = useState<FullBill | null>(null);
  const [search, setSearch] = useState("");

  const filtered = search
    ? bills.filter(
        (b) =>
          b.supplier.toLowerCase().includes(search.toLowerCase()) ||
          b.no.toLowerCase().includes(search.toLowerCase())
      )
    : bills;

  function handleEdit(id: string) {
    setSelected(null);
    router.push(`/purchase/bills/create?edit=${id}`);
  }

  function handleExport() {
    exportToExcel("Purchase_Bills", "Purchase Bills", [
      { header: "Bill No", key: "no", width: 16 },
      { header: "Supplier", key: "supplier", width: 24 },
      { header: "Date", key: "date", width: 16 },
      { header: "Status", key: "status", width: 12 },
      { header: "Total Amount", key: "amount", width: 18 },
      { header: "Paid", key: "paid", width: 18 },
      { header: "Balance", key: "balance", width: 18 },
      { header: "Payment Mode", key: "mode", width: 18 },
    ], filtered.map((b) => ({
      no: b.no,
      supplier: b.supplier,
      date: b.date,
      status: b.status,
      amount: b.amount,
      paid: b.paid,
      balance: b.balance,
      mode: b.mode,
    })));
  }

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#efefef]">
        <h1 className="text-[18px] font-bold text-[#1a1a1a]">
          Purchase Bills{" "}
          <span className="text-[14px] font-normal text-gray-400">({filtered.length})</span>
        </h1>
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExport}
            className="text-[12.5px] border border-[#e0e0e0] rounded-lg px-3 py-1.5 hover:bg-gray-50 flex items-center gap-1.5 text-gray-600"
          >
            <Download size={13} /> Export
          </button>
          <button
            onClick={() => router.push("/purchase/bills/create")}
            className="flex items-center gap-1.5 text-[12.5px] bg-[#29ad82] text-white rounded-lg px-3 py-1.5 hover:bg-[#1d9470] transition-colors"
          >
            <Plus size={13} /> Create Bill
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2.5 px-6 py-3 border-b border-[#f5f5f5]">
        <div className="flex items-center gap-2 bg-[#f7f7f7] border border-[#ebebeb] rounded-lg px-3 py-1.5 w-60">
          <Search size={13} className="text-gray-400 flex-shrink-0" />
          <input
            className="flex-1 bg-transparent outline-none text-[12.5px] text-gray-700 placeholder:text-gray-400"
            placeholder="Search bills..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {["All Status", "All Date"].map((f) => (
          <button key={f} className="flex items-center gap-1.5 text-[12.5px] border border-[#e5e5e5] rounded-lg px-3 py-1.5 bg-white hover:bg-gray-50 text-gray-600">
            {f} <ChevronDown size={12} />
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto">
        <table className="w-full border-collapse">
          <thead className="sticky top-0 bg-white border-b border-[#f0f0f0] z-10">
            <tr>
              {["Bill No", "Supplier", "Date", "Total Amount", "Unpaid Amount", "Status"].map((h) => (
                <th key={h} className="text-left px-5 py-3 text-[12px] text-gray-400 font-medium">{h}</th>
              ))}
              <th className="w-16 px-5 py-3 text-[12px] text-gray-400 font-medium">Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-16 text-[13px] text-gray-400">
                  No purchase bills found.{" "}
                  <button onClick={() => router.push("/purchase/bills/create")} className="text-[#29ad82] hover:underline font-medium">Create one</button>
                </td>
              </tr>
            ) : (
              filtered.map((bill) => (
                <tr key={bill.id} className="border-b border-[#f8f8f8] hover:bg-gray-50 cursor-pointer" onClick={() => setSelected(bill)}>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-md bg-[#f3f4f6] flex items-center justify-center text-[10px] text-gray-500 font-bold flex-shrink-0">PB</div>
                      <span className="text-[13px] font-medium text-[#29ad82]">{bill.no}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-[13px] text-gray-700">{bill.supplier}</td>
                  <td className="px-5 py-3.5 text-[13px] text-gray-500">{bill.date}</td>
                  <td className="px-5 py-3.5 text-[13px] text-gray-700 font-medium">{bill.amount}</td>
                  <td className="px-5 py-3.5 text-[13px] text-gray-700">{bill.balance}</td>
                  <td className="px-5 py-3.5"><StatusBadge label={bill.status} /></td>
                  <td className="px-5 py-3.5" onClick={(e) => e.stopPropagation()}>
                    <ActionMenu bill={bill} onEdit={handleEdit} onDelete={deleteBill} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {selected && (
        <BillDetailModal
          bill={selected}
          onClose={() => setSelected(null)}
          onDelete={(id) => { deleteBill(id); setSelected(null); }}
          onEdit={handleEdit}
        />
      )}
    </div>
  );
}
