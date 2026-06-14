"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  SlidersHorizontal,
  Plus,
  ChevronDown,
  Bell,
  Copy,
  UserPen,
  ArrowUpDown,
  Trash2,
  Pencil,
  Tag,
  ShoppingCart,
  ArrowDownLeft,
  ArrowUpRight,
  FileText,
  RotateCcw,
  RefreshCcw,
  X,
} from "lucide-react";
import type { Party, Transaction } from "@/lib/types";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { AddPartyModal } from "./AddPartyModal";
import { useParties } from "@/context/PartiesContext";
import { useSales } from "@/context/SalesContext";
import { usePurchase } from "@/context/PurchaseContext";
import { createPaymentInApi } from "@/lib/api/payment-in";
import { createPaymentOutApi } from "@/lib/api/payment-out";
import { createSalesReturnApi } from "@/lib/api/sales-return";
import { createPurchaseReturnApi } from "@/lib/api/purchase-return";

/** Derive human-readable status from party fields */
function parsePartyAmount(value: string) {
  const match = value.match(/[\d,]+(\.\d+)?/);
  if (!match) return 0;
  return parseFloat(match[0].replace(/,/g, "")) || 0;
}

function partyStatus(p: Party): "To Receive" | "To Give" | "Settled" {
  const num = parsePartyAmount(p.amt);
  if (num === 0) return "Settled";
  if (p.g) return "To Receive";
  return "To Give";
}

function statusColor(status: "To Receive" | "To Give" | "Settled") {
  if (status === "To Receive") return "text-[#29ad82]";
  if (status === "To Give") return "text-red-500";
  return "text-[#1a1a1a]";
}

function TransactionRow({ tx }: { tx: Transaction }) {
  const isInvoice = tx.kind === "invoice";
  const isPaymentIn = tx.kind === "payment_in";
  return (
    <tr className="border-b border-[#f7f7f7] hover:bg-gray-50 cursor-pointer">
      <td className="py-3 px-4">
        <div className="flex items-center gap-2.5">
          <div
            className={`w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 ${isInvoice ? "bg-blue-50" : isPaymentIn ? "bg-green-50" : "bg-red-50"}`}
          >
            <span className="text-[10px]">
              {isInvoice ? "📄" : isPaymentIn ? "↓" : "↑"}
            </span>
          </div>
          <span className="text-[12.5px] text-gray-700">{tx.type}</span>
        </div>
      </td>
      <td className="py-3 px-4 text-[12.5px] text-gray-500">{tx.date}</td>
      <td className="py-3 px-4 text-[12.5px] font-medium text-[#1a1a1a]">
        {tx.total}
      </td>
      <td className="py-3 px-4">
        {tx.status !== "--" ? (
          <StatusBadge label={tx.status} />
        ) : (
          <span className="text-gray-300 text-[12px]">--</span>
        )}
      </td>
      <td className="py-3 px-4 text-[12.5px] text-[#29ad82] font-medium">
        {tx.bal}
      </td>
      <td className="py-3 px-4 text-[11.5px] text-gray-400">
        {tx.rem === "--" ? "--" : tx.rem}
      </td>
    </tr>
  );
}

const TRANSACTION_TYPES = [
  { label: "Sales Invoice", icon: Tag },
  { label: "Purchase", icon: ShoppingCart },
  { label: "Payment In", icon: ArrowDownLeft },
  { label: "Payment Out", icon: ArrowUpRight },
  { label: "Quotation", icon: FileText },
  { label: "Sales Return", icon: RotateCcw },
  { label: "Purchase Return", icon: RefreshCcw },
  { label: "Adjust Balance", icon: ArrowUpDown },
];

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
          <h2 className="text-[16px] font-bold text-[#1a1a1a]">
            Delete Party?
          </h2>
          <button
            onClick={onCancel}
            className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
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
          Are you sure you want to delete this party?
        </p>
        <div className="flex justify-end gap-2.5">
          <button
            onClick={onCancel}
            className="px-5 py-2 text-[13px] border border-[#e0e0e0] rounded-xl text-gray-600 hover:bg-gray-50 font-medium transition-colors"
          >
            No, Keep
          </button>
          <button
            onClick={onConfirm}
            className="px-5 py-2 text-[13px] bg-red-500 text-white rounded-xl hover:bg-red-600 font-semibold transition-colors"
          >
            Yes, Delete
          </button>
        </div>
      </div>
    </div>
  );
}

const PAYMENT_METHODS = ["Cash", "Cheque", "Bank Transfer", "Credit Card"];

function PaymentModal({
  title,
  partyId,
  type,
  onClose,
  onSuccess,
}: {
  title: string;
  partyId: string;
  type: "in" | "out";
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("Cash");
  const [remarks, setRemarks] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSave() {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) { setError("Enter a valid amount"); return; }
    setSaving(true);
    try {
      if (type === "in") {
        await createPaymentInApi({ partyId, receivedAmount: amt, paymentMethod: method.toUpperCase().replace(/ /g, "_"), remarks: remarks || undefined, date: new Date().toISOString() });
      } else {
        await createPaymentOutApi({ partyId, paidAmount: amt, paymentMethod: method.toUpperCase().replace(/ /g, "_"), remarks: remarks || undefined, date: new Date().toISOString() });
      }
      onSuccess();
      onClose();
    } catch {
      setError("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-[400px] p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <span className="text-[16px] font-bold text-[#1a1a1a]">{title}</span>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-[12px] text-gray-500 font-medium block mb-1">Amount *</label>
            <div className="flex items-center border border-[#e5e5e5] rounded-lg px-3 py-2 focus-within:border-[#29ad82]">
              <span className="text-[13px] text-gray-400 mr-2">Rs.</span>
              <input
                autoFocus
                type="number"
                value={amount}
                onChange={(e) => { setAmount(e.target.value); setError(""); }}
                className="flex-1 text-[13px] outline-none"
                placeholder="0"
              />
            </div>
          </div>
          <div>
            <label className="text-[12px] text-gray-500 font-medium block mb-1">Payment Method</label>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              className="w-full border border-[#e5e5e5] rounded-lg px-3 py-2 text-[13px] outline-none focus:border-[#29ad82]"
            >
              {PAYMENT_METHODS.map((m) => <option key={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[12px] text-gray-500 font-medium block mb-1">Remarks</label>
            <input
              type="text"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className="w-full border border-[#e5e5e5] rounded-lg px-3 py-2 text-[13px] outline-none focus:border-[#29ad82]"
              placeholder="Optional note"
            />
          </div>
          {error && <p className="text-[12px] text-red-500">{error}</p>}
        </div>
        <div className="flex gap-2 mt-6">
          <button onClick={onClose} className="flex-1 border border-[#e5e5e5] rounded-lg py-2 text-[13px] font-medium text-gray-600 hover:bg-gray-50">Cancel</button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 bg-[#29ad82] text-white rounded-lg py-2 text-[13px] font-semibold hover:bg-[#1d9470] disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ReturnModal({
  title,
  partyId,
  type,
  onClose,
  onSuccess,
}: {
  title: string;
  partyId: string;
  type: "sales" | "purchase";
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [itemName, setItemName] = useState("");
  const [qty, setQty] = useState("");
  const [rate, setRate] = useState("");
  const [method, setMethod] = useState("Cash");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const amount = (parseFloat(qty) || 0) * (parseFloat(rate) || 0);

  async function handleSave() {
    if (!itemName.trim()) { setError("Enter item name"); return; }
    const q = parseFloat(qty) || 0;
    const r = parseFloat(rate) || 0;
    if (q <= 0 || r <= 0) { setError("Enter valid quantity and rate"); return; }
    setSaving(true);
    const returnNo = `RET-${Date.now()}`;
    const payload = {
      partyId,
      returnNumber: returnNo,
      returnDate: new Date().toISOString(),
      notes: notes || undefined,
      paymentMode: method.toUpperCase().replace(/ /g, "_"),
      subTotal: amount,
      totalAmount: amount,
      items: [{ itemName: itemName.trim(), quantity: q, rate: r, amount }],
    };
    try {
      if (type === "sales") {
        await createSalesReturnApi(payload);
      } else {
        await createPurchaseReturnApi(payload);
      }
      onSuccess();
      onClose();
    } catch {
      setError("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-[440px] p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <span className="text-[16px] font-bold text-[#1a1a1a]">{title}</span>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-[12px] text-gray-500 font-medium block mb-1">Item Name *</label>
            <input
              autoFocus
              type="text"
              value={itemName}
              onChange={(e) => { setItemName(e.target.value); setError(""); }}
              className="w-full border border-[#e5e5e5] rounded-lg px-3 py-2 text-[13px] outline-none focus:border-[#29ad82]"
              placeholder="Enter item name"
            />
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-[12px] text-gray-500 font-medium block mb-1">Quantity *</label>
              <input
                type="number"
                value={qty}
                onChange={(e) => setQty(e.target.value)}
                className="w-full border border-[#e5e5e5] rounded-lg px-3 py-2 text-[13px] outline-none focus:border-[#29ad82]"
                placeholder="0"
              />
            </div>
            <div className="flex-1">
              <label className="text-[12px] text-gray-500 font-medium block mb-1">Rate *</label>
              <input
                type="number"
                value={rate}
                onChange={(e) => setRate(e.target.value)}
                className="w-full border border-[#e5e5e5] rounded-lg px-3 py-2 text-[13px] outline-none focus:border-[#29ad82]"
                placeholder="0"
              />
            </div>
          </div>
          {amount > 0 && (
            <div className="text-[13px] text-gray-600">Total: <span className="font-semibold text-[#1a1a1a]">Rs. {Math.round(amount).toLocaleString("en-IN")}</span></div>
          )}
          <div>
            <label className="text-[12px] text-gray-500 font-medium block mb-1">Payment Mode</label>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              className="w-full border border-[#e5e5e5] rounded-lg px-3 py-2 text-[13px] outline-none focus:border-[#29ad82]"
            >
              {PAYMENT_METHODS.map((m) => <option key={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[12px] text-gray-500 font-medium block mb-1">Notes</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full border border-[#e5e5e5] rounded-lg px-3 py-2 text-[13px] outline-none focus:border-[#29ad82]"
              placeholder="Optional"
            />
          </div>
          {error && <p className="text-[12px] text-red-500">{error}</p>}
        </div>
        <div className="flex gap-2 mt-6">
          <button onClick={onClose} className="flex-1 border border-[#e5e5e5] rounded-lg py-2 text-[13px] font-medium text-gray-600 hover:bg-gray-50">Cancel</button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 bg-[#29ad82] text-white rounded-lg py-2 text-[13px] font-semibold hover:bg-[#1d9470] disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

function PartyDetail({
  party,
  onDelete,
  onEdit,
}: {
  party: Party;
  onDelete: (id: string) => void;
  onEdit: (party: Party) => void;
}) {
  const router = useRouter();
  const [manageOpen, setManageOpen] = useState(false);
  const [addTxnOpen, setAddTxnOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [activeModal, setActiveModal] = useState<"payment-in" | "payment-out" | "sales-return" | "purchase-return" | null>(null);
  const manageRef = useRef<HTMLDivElement>(null);
  const addTxnRef = useRef<HTMLDivElement>(null);
  const status = partyStatus(party);

  function handleTransactionType(label: string) {
    setAddTxnOpen(false);
    const id = party.id;
    if (!id) return;
    if (label === "Sales Invoice") {
      router.push(`/sales/invoices/create?partyId=${id}`);
    } else if (label === "Purchase") {
      router.push(`/purchase/bills/create?partyId=${id}`);
    } else if (label === "Payment In") {
      setActiveModal("payment-in");
    } else if (label === "Payment Out") {
      setActiveModal("payment-out");
    } else if (label === "Sales Return") {
      setActiveModal("sales-return");
    } else if (label === "Purchase Return") {
      setActiveModal("purchase-return");
    }
  }

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (addTxnRef.current && !addTxnRef.current.contains(e.target as Node)) {
        setAddTxnOpen(false);
      }
    }
    if (addTxnOpen) document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [addTxnOpen]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (manageRef.current && !manageRef.current.contains(e.target as Node)) {
        setManageOpen(false);
      }
    }
    if (manageOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [manageOpen]);

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-white">
      {deleteConfirm && (
        <DeleteConfirmModal
          name={party.name}
          onConfirm={() => {
            setDeleteConfirm(false);
            onDelete(party.id!);
          }}
          onCancel={() => setDeleteConfirm(false)}
        />
      )}

      {activeModal === "payment-in" && party.id && (
        <PaymentModal title="Record Payment In" partyId={party.id} type="in" onClose={() => setActiveModal(null)} onSuccess={() => {}} />
      )}
      {activeModal === "payment-out" && party.id && (
        <PaymentModal title="Record Payment Out" partyId={party.id} type="out" onClose={() => setActiveModal(null)} onSuccess={() => {}} />
      )}
      {activeModal === "sales-return" && party.id && (
        <ReturnModal title="Create Sales Return" partyId={party.id} type="sales" onClose={() => setActiveModal(null)} onSuccess={() => {}} />
      )}
      {activeModal === "purchase-return" && party.id && (
        <ReturnModal title="Create Purchase Return" partyId={party.id} type="purchase" onClose={() => setActiveModal(null)} onSuccess={() => {}} />
      )}

      {/* Header */}
      <div className="flex items-center gap-4 px-6 py-4 border-b border-[#f0f0f0] flex-shrink-0">
        <div className="w-[56px] h-[56px] rounded-xl bg-[#29ad82] text-white flex items-center justify-center text-[19px] font-bold flex-shrink-0">
          {party.init}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[19px] font-bold text-[#1a1a1a] leading-snug">
            {party.name}
          </div>
          <div className="text-[13px] text-gray-400 mt-0.5">
            {party.ph || "---"}
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <div className="text-[12px] text-gray-400 font-medium">{status}</div>
          <div
            className={`text-[24px] font-bold leading-snug mt-0.5 ${statusColor(status)}`}
          >
            {party.amt}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2.5 px-6 py-2.5 border-b border-[#f0f0f0] flex-shrink-0">
        {/* Manage Party dropdown */}
        <div className="relative" ref={manageRef}>
          <button
            onClick={() => setManageOpen((o) => !o)}
            className="flex items-center gap-1.5 text-[12.5px] border border-[#e5e5e5] rounded-lg px-3 py-1.5 bg-white hover:bg-gray-50 transition-colors"
          >
            <UserPen size={14} className="text-gray-500" />
            <span>Manage Party</span>
          </button>
          {manageOpen && (
            <div className="absolute left-0 top-full mt-1.5 w-[170px] bg-white rounded-xl shadow-xl border border-[#efefef] z-30 overflow-hidden">
              <div className="px-3.5 py-2 text-[11px] text-gray-400 font-semibold uppercase tracking-wide border-b border-[#f5f5f5]">
                Manage Party
              </div>
              <button
                onClick={() => {
                  setManageOpen(false);
                  onEdit(party);
                }}
                className="flex items-center gap-2.5 w-full px-3.5 py-2.5 text-[13px] text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Pencil size={13} className="text-gray-400" /> Edit Party
              </button>
              <button
                onClick={() => {
                  setManageOpen(false);
                  setDeleteConfirm(true);
                }}
                className="flex items-center gap-2.5 w-full px-3.5 py-2.5 text-[13px] text-red-500 hover:bg-red-50 transition-colors"
              >
                <Trash2 size={13} /> Delete Party
              </button>
            </div>
          )}
        </div>

        <button className="flex items-center justify-center border border-[#e5e5e5] rounded-lg w-8 h-8 bg-white hover:bg-gray-50 transition-colors">
          <Copy size={14} className="text-gray-500" />
        </button>

        <button className="ml-auto flex items-center gap-1.5 text-[12.5px] border border-[#e5e5e5] rounded-lg px-3 py-1.5 bg-white hover:bg-gray-50 transition-colors">
          <Bell size={14} className="text-gray-500" /> Send Reminder
        </button>
      </div>

      {/* Transactions header */}
      <div className="flex items-center gap-2.5 px-6 py-3 border-b border-[#f0f0f0] flex-shrink-0">
        <span className="text-[15px] font-bold text-[#1a1a1a]">
          Transactions ({party.txns.length})
        </span>
        <button className="w-8 h-8 border border-[#e5e5e5] rounded-lg flex items-center justify-center hover:bg-gray-50 transition-colors">
          <Search size={13} className="text-gray-500" />
        </button>
        <button className="flex items-center gap-1.5 text-[12.5px] border border-[#e5e5e5] rounded-lg px-2.5 py-1.5 bg-white hover:bg-gray-50 transition-colors">
          <ArrowUpDown size={13} className="text-gray-500" /> Sort
        </button>
        <div className="ml-auto relative" ref={addTxnRef}>
          <button
            onClick={() => setAddTxnOpen((o) => !o)}
            className="flex items-center gap-1.5 text-[12.5px] bg-[#29ad82] text-white rounded-lg px-3 py-1.5 hover:bg-[#1d9470] transition-colors font-medium"
          >
            <Plus size={13} /> Add Transaction
          </button>
          {addTxnOpen && (
            <div className="absolute right-0 top-full mt-1.5 w-[185px] bg-white rounded-xl shadow-lg border border-[#efefef] z-30 overflow-hidden py-1">
              {TRANSACTION_TYPES.map(({ label, icon: Icon }) => (
                <button
                  key={label}
                  onClick={() => handleTransactionType(label)}
                  className="flex items-center gap-2.5 w-full px-3.5 py-2 text-[12.5px] text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Icon size={13} className="text-gray-400 flex-shrink-0" />
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Transaction table */}
      <div className="flex-1 overflow-y-auto">
        {party.txns.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-10">
            {/* Illustration */}
            <svg
              width="160"
              height="160"
              viewBox="0 0 160 160"
              fill="none"
              className="mb-4 opacity-80"
            >
              {/* Background circle */}
              <ellipse cx="80" cy="130" rx="50" ry="10" fill="#f0f0f0" />
              {/* Clipboard body */}
              <rect
                x="38"
                y="30"
                width="72"
                height="90"
                rx="8"
                fill="#e8e8e8"
              />
              <rect
                x="38"
                y="30"
                width="72"
                height="90"
                rx="8"
                stroke="#d0d0d0"
                strokeWidth="1.5"
              />
              {/* Clipboard top clip */}
              <rect
                x="58"
                y="24"
                width="32"
                height="14"
                rx="7"
                fill="#d0d0d0"
              />
              <rect x="63" y="27" width="22" height="8" rx="4" fill="#bbb" />
              {/* Lines on clipboard */}
              <rect
                x="50"
                y="55"
                width="48"
                height="5"
                rx="2.5"
                fill="#c8c8c8"
              />
              <rect
                x="50"
                y="67"
                width="38"
                height="5"
                rx="2.5"
                fill="#c8c8c8"
              />
              <rect
                x="50"
                y="79"
                width="44"
                height="5"
                rx="2.5"
                fill="#c8c8c8"
              />
              {/* Person body */}
              <circle cx="108" cy="88" r="18" fill="#e0e0e0" />
              <circle cx="108" cy="82" r="9" fill="#c8c8c8" />
              <path
                d="M93 106c0-8.28 6.72-15 15-15s15 6.72 15 15"
                fill="#e0e0e0"
              />
              {/* Magnifying glass */}
              <circle
                cx="100"
                cy="100"
                r="14"
                fill="white"
                stroke="#c0c0c0"
                strokeWidth="3"
              />
              <circle
                cx="100"
                cy="100"
                r="9"
                fill="#efefef"
                stroke="#c8c8c8"
                strokeWidth="2"
              />
              <line
                x1="111"
                y1="111"
                x2="122"
                y2="122"
                stroke="#c0c0c0"
                strokeWidth="4"
                strokeLinecap="round"
              />
            </svg>
            <div className="text-[15px] font-bold text-gray-500 mb-1">
              No Transactions Found
            </div>
            <div className="text-[12.5px] text-gray-400">
              Try searching for other keywords
            </div>
          </div>
        ) : (
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-[#f0f0f0]">
                {["Type", "Date", "Total", "Status", "Balance", "Remarks"].map(
                  (h) => (
                    <th
                      key={h}
                      className="text-left py-2.5 px-4 text-[12px] text-gray-400 font-medium"
                    >
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {party.txns.map((tx, i) => (
                <TransactionRow key={i} tx={tx} />
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

type PaymentFilter = "All Payment" | "To Receive" | "To Give" | "Settled";
type TypeFilter = "all" | "c" | "s";
const PAYMENT_OPTIONS: PaymentFilter[] = [
  "All Payment",
  "To Receive",
  "To Give",
  "Settled",
];

export function PartiesPage() {
  const { parties, addParty, deleteParty, updateParty } = useParties();
  const { invoices } = useSales();
  const { bills } = usePurchase();
  const [selected, setSelected] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingParty, setEditingParty] = useState<Party | null>(null);
  const [paymentFilter, setPaymentFilter] =
    useState<PaymentFilter>("All Payment");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [paymentDropOpen, setPaymentDropOpen] = useState(false);
  const paymentDropRef = useRef<HTMLDivElement>(null);
  const [sortBy, setSortBy] = useState("Latest");
  const [sortDropOpen, setSortDropOpen] = useState(false);
  const sortDropRef = useRef<HTMLDivElement>(null);

  const SORT_OPTIONS = [
    "Latest",
    "Amount: High to Low",
    "Amount: Low to High",
    "Name: A to Z",
    "Name: Z to A",
  ];

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (
        paymentDropRef.current &&
        !paymentDropRef.current.contains(e.target as Node)
      ) {
        setPaymentDropOpen(false);
      }
      if (
        sortDropRef.current &&
        !sortDropRef.current.contains(e.target as Node)
      ) {
        setSortDropOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  function getOutstanding(p: Party): number {
    const salesTotal = invoices
      .filter((inv) => inv.party === p.name || (p.id && inv.partyId === p.id))
      .reduce((sum, inv) => sum + parsePartyAmount(inv.balance), 0);
    const purchaseTotal = bills
      .filter((b) => b.supplier === p.name || (p.id && b.supplierId === p.id))
      .reduce((sum, b) => sum + parsePartyAmount(b.balance), 0);
    return salesTotal + purchaseTotal;
  }

  function withComputedAmt(p: Party): Party {
    const total = getOutstanding(p);
    return {
      ...p,
      amt: total > 0 ? `Rs. ${Math.round(total).toLocaleString("en-IN")}` : "Rs. 0",
      g: total > 0,
    };
  }

  const getAmt = (p: Party) => parsePartyAmount(withComputedAmt(p).amt);

  const filtered = parties
    .filter((p) => {
      const matchSearch =
        !search.trim() ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.ph.includes(search);
      const st = partyStatus(withComputedAmt(p));
      const matchPayment =
        paymentFilter === "All Payment" || st === paymentFilter;
      const matchType = typeFilter === "all" || (p.type ?? "c") === typeFilter;
      return matchSearch && matchPayment && matchType;
    })
    .sort((a, b) => {
      if (sortBy === "Amount: High to Low") return getAmt(b) - getAmt(a);
      if (sortBy === "Amount: Low to High") return getAmt(a) - getAmt(b);
      if (sortBy === "Name: A to Z") return a.name.localeCompare(b.name);
      if (sortBy === "Name: Z to A") return b.name.localeCompare(a.name);
      return 0; // Latest: keep insertion order
    });

  const selectedPartyBase = parties.find((p) => p.name === selected) ?? null;
  const selectedParty = selectedPartyBase
    ? {
        ...withComputedAmt(selectedPartyBase),
        txns: [
          ...invoices
            .filter(
              (inv) =>
                inv.party === selectedPartyBase.name ||
                (selectedPartyBase.id && inv.partyId === selectedPartyBase.id)
            )
            .map((inv) => ({
              kind: "invoice" as const,
              type: "Sales Invoice",
              date: inv.date,
              total: inv.amount,
              status: inv.status,
              bal: inv.balance,
              rem: inv.balance,
              rcpt: inv.no,
              creator: inv.creator,
            })),
          ...bills
            .filter(
              (b) =>
                b.supplier === selectedPartyBase.name ||
                (selectedPartyBase.id && b.supplierId === selectedPartyBase.id)
            )
            .map((b) => ({
              kind: "invoice" as const,
              type: "Purchase Bill",
              date: b.date,
              total: b.amount,
              status: b.status,
              bal: b.balance,
              rem: b.balance,
              rcpt: b.no,
              creator: "Admin",
            })),
        ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
      }
    : null;

  function handleAddParty(party: Party) {
    void addParty(party);
    setSelected(party.name);
  }

  function handleEditParty(party: Party) {
    setEditingParty(party);
    setEditOpen(true);
  }

  function handleUpdateParty(updated: Party) {
    if (!editingParty) return;
    updateParty(editingParty.id!, updated);
    setSelected(updated.name);
    setEditingParty(null);
  }

  return (
    <div className="flex h-full">
      {/* ── Left panel – party list ── */}
      <div className="w-[360px] flex-shrink-0 border-r border-[#efefef] flex flex-col bg-white">
        {/* Header */}
        <div className="px-4 pt-4 pb-3 border-b border-[#f0f0f0]">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[15.5px] font-bold text-[#1a1a1a]">
              Parties ({parties.length})
            </span>
            <div className="flex rounded-lg overflow-hidden">
              <button
                onClick={() => setAddOpen(true)}
                className="flex items-center gap-1.5 bg-[#29ad82] text-white px-3.5 py-1.5 text-[13px] font-semibold hover:bg-[#1d9470] transition-colors"
              >
                <Plus size={14} /> Add Party
              </button>
              <div className="w-px bg-white/30" />
              <button
                onClick={() => setAddOpen(true)}
                className="bg-[#29ad82] text-white px-2.5 py-1.5 hover:bg-[#1d9470] transition-colors"
              >
                <ChevronDown size={14} />
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="flex gap-2 mb-2.5">
            <div className="flex-1 flex items-center gap-2 bg-[#f7f7f7] border border-[#e8e8e8] rounded-lg px-2.5 py-1.5">
              <Search size={13} className="text-gray-400 flex-shrink-0" />
              <input
                className="flex-1 bg-transparent outline-none text-[12.5px] text-gray-700 placeholder:text-gray-400"
                placeholder="Search parties..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="relative" ref={sortDropRef}>
              <button
                onClick={() => setSortDropOpen((o) => !o)}
                className={`w-8 h-8 border rounded-lg flex items-center justify-center bg-white hover:bg-gray-50 flex-shrink-0 transition-colors ${sortDropOpen ? "border-[#29ad82] text-[#29ad82]" : "border-[#e5e5e5] text-gray-500"}`}
              >
                <SlidersHorizontal size={14} />
              </button>
              {sortDropOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-[185px] bg-white rounded-xl shadow-xl border border-[#efefef] z-30 overflow-hidden py-0.5">
                  <div className="px-3.5 py-1.5 text-[10.5px] text-gray-400 font-semibold uppercase tracking-wide border-b border-[#f5f5f5]">
                    Sort By
                  </div>
                  {SORT_OPTIONS.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => {
                        setSortBy(opt);
                        setSortDropOpen(false);
                      }}
                      className="flex items-center gap-2 w-full px-3.5 py-2 text-[12.5px] text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <span
                        className={`w-3.5 text-[#29ad82] text-[12px] ${sortBy === opt ? "opacity-100" : "opacity-0"}`}
                      >
                        ✓
                      </span>
                      {opt}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Filter tabs */}
          <div className="flex gap-1.5">
            <button
              onClick={() => setTypeFilter(typeFilter === "c" ? "all" : "c")}
              className={`px-3 py-1 text-[12.5px] border rounded-lg whitespace-nowrap transition-colors ${typeFilter === "c" ? "border-[#29ad82] text-[#29ad82] bg-[#edfaf4]" : "border-[#d9d9d9] text-gray-600 hover:bg-gray-50"}`}
            >
              Customer
            </button>
            <button
              onClick={() => setTypeFilter(typeFilter === "s" ? "all" : "s")}
              className={`px-3 py-1 text-[12.5px] border rounded-lg whitespace-nowrap transition-colors ${typeFilter === "s" ? "border-[#29ad82] text-[#29ad82] bg-[#edfaf4]" : "border-[#d9d9d9] text-gray-600 hover:bg-gray-50"}`}
            >
              Supplier
            </button>

            {/* All Payment dropdown */}
            <div className="relative" ref={paymentDropRef}>
              <button
                onClick={() => setPaymentDropOpen((o) => !o)}
                className="flex items-center gap-1 px-3 py-1 text-[12.5px] border border-[#d9d9d9] rounded-lg hover:bg-gray-50 text-gray-600 whitespace-nowrap"
              >
                {paymentFilter} <ChevronDown size={11} />
              </button>
              {paymentDropOpen && (
                <div className="absolute left-0 top-full mt-1.5 w-[160px] bg-white rounded-xl shadow-xl border border-[#efefef] z-30 overflow-hidden py-1">
                  {PAYMENT_OPTIONS.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => {
                        setPaymentFilter(opt);
                        setPaymentDropOpen(false);
                      }}
                      className="flex items-center gap-2.5 w-full px-4 py-2.5 text-[13px] text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <span
                        className={`w-4 text-[#29ad82] ${paymentFilter === opt ? "opacity-100" : "opacity-0"}`}
                      >
                        ✓
                      </span>
                      {opt}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Party list */}
        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 && (
            <div className="text-center py-8 text-[13px] text-gray-400">
              No parties found
            </div>
          )}
          {filtered.map((p) => {
            const p2 = withComputedAmt(p);
            const st = partyStatus(p2);
            const isSelected = selected === p.name;
            return (
              <div
                key={p.name}
                onClick={() => setSelected(p.name)}
                className={`flex items-center gap-3.5 px-4 py-3.5 border-b border-[#f5f5f5] cursor-pointer transition-colors relative ${isSelected ? "bg-[#edfaf4]" : "hover:bg-[#fafafa]"}`}
              >
                {/* Selected left border accent */}
                {isSelected && (
                  <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-[#29ad82] rounded-r-sm" />
                )}
                <div className="w-[44px] h-[44px] rounded-xl bg-[#29ad82] text-white flex items-center justify-center text-[13px] font-bold flex-shrink-0">
                  {p.init}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13.5px] font-semibold text-[#1a1a1a] truncate">
                    {p2.name}
                  </div>
                  <div className="text-[12px] text-gray-400 mt-0.5">
                    {p2.ph || "---"}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div
                    className={`text-[13.5px] font-semibold ${statusColor(st)}`}
                  >
                    {p2.amt}
                  </div>
                  <div className={`text-[11px] mt-0.5 ${statusColor(st)}`}>
                    {st}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Right panel ── */}
      <div className="flex-1 flex flex-col overflow-hidden bg-white">
        {selectedParty === null ? (
          <div className="flex-1 flex flex-col items-center justify-center">
            <svg
              width="110"
              height="100"
              viewBox="0 0 110 100"
              fill="none"
              style={{ opacity: 0.12, marginBottom: 16 }}
            >
              <rect x="18" y="12" width="74" height="76" rx="9" fill="#888" />
              <rect x="28" y="28" width="54" height="9" rx="4.5" fill="#bbb" />
              <rect x="28" y="44" width="42" height="9" rx="4.5" fill="#bbb" />
              <rect x="28" y="60" width="30" height="9" rx="4.5" fill="#bbb" />
            </svg>
            <div className="text-[16px] font-bold text-gray-400 mb-1.5">
              No Party Selected
            </div>
            <div className="text-[12.5px] text-gray-400">
              Click any party to view their transactions.
            </div>
          </div>
        ) : (
          <PartyDetail
            party={selectedParty}
            onDelete={deleteParty}
            onEdit={handleEditParty}
          />
        )}
      </div>

      <AddPartyModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSave={handleAddParty}
      />
      <AddPartyModal
        open={editOpen}
        onClose={() => {
          setEditOpen(false);
          setEditingParty(null);
        }}
        onSave={handleUpdateParty}
        initialParty={editingParty}
      />
    </div>
  );
}
