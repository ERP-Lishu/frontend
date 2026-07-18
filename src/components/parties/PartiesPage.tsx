"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { isAxiosError } from "axios";
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
  Calendar,
  X,
} from "lucide-react";
import type { Party, Transaction } from "@/lib/types";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { AddPartyModal } from "./AddPartyModal";
import { useParties } from "@/context/PartiesContext";
import { useSales } from "@/context/SalesContext";
import { usePurchase } from "@/context/PurchaseContext";
import { usePayments } from "@/context/PaymentsContext";
import {
  createPaymentInApi,
  updatePaymentInApi,
  type PaymentInApiResponse,
} from "@/lib/api/payment-in";
import {
  createPaymentOutApi,
  updatePaymentOutApi,
  type PaymentOutApiResponse,
} from "@/lib/api/payment-out";
import {
  fetchSalesReturnsApi,
  type SalesReturnApiResponse,
} from "@/lib/api/sales-return";
import {
  fetchPurchaseReturnsApi,
  type PurchaseReturnApiResponse,
} from "@/lib/api/purchase-return";
import { parsePartyAmount, computePartyRunningBalance } from "@/lib/partyBalance";

/** Format a payment's ISO date into the same readable style as invoices/bills. */
function fmtPaymentDate(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}

/** Derive human-readable status from party fields */
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

function TransactionRow({
  tx,
  onClick,
}: {
  tx: Transaction;
  onClick?: () => void;
}) {
  const isInvoice = tx.kind === "invoice";
  const isPaymentIn = tx.kind === "payment_in" || tx.kind === "sales_return";
  return (
    <tr
      onClick={onClick}
      className="border-b border-[#f7f7f7] hover:bg-gray-50 cursor-pointer"
    >
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
  // { label: "Quotation", icon: FileText },
  { label: "Sales Return", icon: RotateCcw },
  { label: "Purchase Return", icon: RefreshCcw },
  // { label: "Adjust Balance", icon: ArrowUpDown },
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

function CannotDeletePartyModal({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-[420px] p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-3">
          <h2 className="text-[16px] font-bold text-[#1a1a1a]">
            Cannot Delete This Party
          </h2>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={14} />
          </button>
        </div>
        <p className="text-[13.5px] text-gray-500 mb-6">
          You can&apos;t delete this party because there are transactions
          linked to it. Please remove or settle the transactions before
          deleting the party.
        </p>
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-[13px] border border-[#29ad82] text-[#29ad82] rounded-xl hover:bg-[#edfaf4] font-semibold transition-colors"
          >
            Okay, Got It
          </button>
        </div>
      </div>
    </div>
  );
}

function EditOpeningBalanceModal({
  party,
  onClose,
  onSave,
  onDelete,
}: {
  party: Party;
  onClose: () => void;
  onSave: (amt: string, g: boolean) => void;
  onDelete: () => void;
}) {
  const [amount, setAmount] = useState(() =>
    party.amt.replace(/[^0-9]/g, ""),
  );
  const [balType, setBalType] = useState<"r" | "g">(party.g ? "r" : "g");

  function handleEditDetails() {
    const num = parseFloat(amount) || 0;
    onSave(
      `Rs. ${num > 0 ? Math.round(num).toLocaleString("en-IN") : "0"}`,
      balType === "r",
    );
  }

  return (
    <div
      className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-[440px] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#f0f0f0]">
          <span className="text-[16px] font-bold text-[#1a1a1a]">
            Edit Opening Balance
          </span>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-5 grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-[12px] text-gray-600 font-medium">
              Opening Balance
            </label>
            <div className="flex border border-[#e5e5e5] rounded-lg overflow-hidden bg-[#f8f8f8] focus-within:border-[#29ad82]">
              <span className="px-3 py-2 bg-[#f0f0f0] text-[12px] text-gray-400 border-r border-[#e5e5e5] font-medium">
                Rs.
              </span>
              <input
                className="flex-1 min-w-0 px-3 py-2 text-[13px] outline-none bg-transparent"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[12px] text-gray-600 font-medium">
              Date
            </label>
            <div className="flex items-center gap-2 border border-[#e5e5e5] rounded-lg px-3 py-2 bg-[#f8f8f8]">
              <span className="flex-1 text-[13px] text-gray-700">
                2083 Asa 20
              </span>
              <Calendar size={15} className="text-gray-400 flex-shrink-0" />
            </div>
          </div>
          <div className="col-span-2 flex flex-col gap-1">
            <label className="text-[12px] text-gray-600 font-medium">
              Opening Balance Type
            </label>
            <div className="flex gap-2">
              {(["r", "g"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setBalType(t)}
                  className={`px-4 py-1.5 text-[12.5px] rounded-lg border-[1.5px] font-medium transition-colors ${balType === t ? "border-[#29ad82] text-[#29ad82] bg-[#edfaf4]" : "border-[#e5e5e5] text-gray-400 bg-[#fafafa]"}`}
                >
                  {t === "r" ? "To Receive" : "To Give"}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2.5 px-5 py-3.5 border-t border-[#f0f0f0]">
          <button
            onClick={onDelete}
            className="flex items-center gap-1.5 px-4 py-2 text-[13px] border border-[#e5e5e5] rounded-xl text-gray-600 hover:bg-gray-50 font-medium transition-colors"
          >
            <Trash2 size={13} /> Delete
          </button>
          <button
            onClick={handleEditDetails}
            className="flex items-center gap-1.5 px-5 py-2 text-[13px] bg-[#29ad82] text-white rounded-xl hover:bg-[#1d9470] font-semibold transition-colors"
          >
            <Pencil size={13} /> Edit Details
          </button>
        </div>
      </div>
    </div>
  );
}

const PAYMENT_METHODS = ["Cash", "Cheque", "Bank Transfer", "Credit Card"];

/** Convert a backend payment-method enum value (e.g. "BANK_TRANSFER") into its UI label. */
function methodEnumToLabel(method: string): string {
  const found = PAYMENT_METHODS.find(
    (m) => m.toUpperCase().replace(/ /g, "_") === method,
  );
  return found ?? "Cash";
}

interface EditingPayment {
  id: string;
  amount: number;
  method: string;
  remarks: string;
}

function PaymentModal({
  title,
  partyId,
  type,
  editing,
  onClose,
  onSuccess,
}: {
  title: string;
  partyId: string;
  type: "in" | "out";
  editing?: EditingPayment | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const isEdit = !!editing;
  const [amount, setAmount] = useState(editing ? String(editing.amount) : "");
  const [method, setMethod] = useState(
    editing ? methodEnumToLabel(editing.method) : "Cash",
  );
  const [remarks, setRemarks] = useState(editing?.remarks ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSave() {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) {
      setError("Enter a valid amount");
      return;
    }
    setSaving(true);
    try {
      if (isEdit && editing) {
        const paymentMethod = method.toUpperCase().replace(/ /g, "_");
        if (type === "in") {
          await updatePaymentInApi(editing.id, {
            receivedAmount: amt,
            paymentMethod,
            remarks: remarks || undefined,
          });
        } else {
          await updatePaymentOutApi(editing.id, {
            paidAmount: amt,
            paymentMethod,
            remarks: remarks || undefined,
          });
        }
      } else {
        const receiptNumber = `${type === "in" ? "PI" : "PO"}-${Date.now()}`;
        if (type === "in") {
          await createPaymentInApi({
            receiptNumber,
            partyId,
            receivedAmount: amt,
            paymentMethod: method.toUpperCase().replace(/ /g, "_"),
            remarks: remarks || undefined,
            date: new Date().toISOString(),
          });
        } else {
          await createPaymentOutApi({
            receiptNumber,
            partyId,
            paidAmount: amt,
            paymentMethod: method.toUpperCase().replace(/ /g, "_"),
            remarks: remarks || undefined,
            date: new Date().toISOString(),
          });
        }
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
    <div
      className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-[400px] p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <span className="text-[16px] font-bold text-[#1a1a1a]">{title}</span>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={18} />
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-[12px] text-gray-500 font-medium block mb-1">
              Amount *
            </label>
            <div className="flex items-center border border-[#e5e5e5] rounded-lg px-3 py-2 focus-within:border-[#29ad82]">
              <span className="text-[13px] text-gray-400 mr-2">Rs.</span>
              <input
                autoFocus
                type="number"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  setError("");
                }}
                className="flex-1 text-[13px] outline-none"
                placeholder="0"
              />
            </div>
          </div>
          <div>
            <label className="text-[12px] text-gray-500 font-medium block mb-1">
              Payment Method
            </label>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              className="w-full border border-[#e5e5e5] rounded-lg px-3 py-2 text-[13px] outline-none focus:border-[#29ad82]"
            >
              {PAYMENT_METHODS.map((m) => (
                <option key={m}>{m}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[12px] text-gray-500 font-medium block mb-1">
              Remarks
            </label>
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
          <button
            onClick={onClose}
            className="flex-1 border border-[#e5e5e5] rounded-lg py-2 text-[13px] font-medium text-gray-600 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 bg-[#29ad82] text-white rounded-lg py-2 text-[13px] font-semibold hover:bg-[#1d9470] disabled:opacity-60"
          >
            {saving ? "Saving…" : isEdit ? "Update" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

function PartyDetail({
  party,
  paymentsIn,
  paymentsOut,
  onDelete,
  onEdit,
  onPaymentSaved,
  onUpdateOpeningBalance,
}: {
  party: Party;
  paymentsIn: PaymentInApiResponse[];
  paymentsOut: PaymentOutApiResponse[];
  onDelete: (id: string) => Promise<void>;
  onEdit: (party: Party) => void;
  onPaymentSaved: () => void;
  onUpdateOpeningBalance: (amt: string, g: boolean) => void;
}) {
  const router = useRouter();
  const [manageOpen, setManageOpen] = useState(false);
  const [addTxnOpen, setAddTxnOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [cannotDeleteOpen, setCannotDeleteOpen] = useState(false);
  const [openingBalanceModalOpen, setOpeningBalanceModalOpen] =
    useState(false);
  const [activeModal, setActiveModal] = useState<
    "payment-in" | "payment-out" | null
  >(null);
  const [editingPayment, setEditingPayment] = useState<EditingPayment | null>(
    null,
  );
  const manageRef = useRef<HTMLDivElement>(null);
  const addTxnRef = useRef<HTMLDivElement>(null);
  const status = partyStatus(party);

  function openTransaction(tx: Transaction) {
    if (tx.type === "Opening Balance") {
      setOpeningBalanceModalOpen(true);
      return;
    }
    if (!tx.refId) return;
    if (tx.kind === "payment_in" || tx.kind === "payment_out") {
      const record =
        tx.kind === "payment_in"
          ? paymentsIn.find((p) => p.id === tx.refId)
          : paymentsOut.find((p) => p.id === tx.refId);
      if (!record) return;
      setEditingPayment({
        id: record.id,
        amount:
          tx.kind === "payment_in"
            ? (record as PaymentInApiResponse).receivedAmount
            : (record as PaymentOutApiResponse).paidAmount,
        method: record.paymentMethod,
        remarks: record.remarks ?? "",
      });
      setActiveModal(tx.kind === "payment_in" ? "payment-in" : "payment-out");
      return;
    }
    // Pass partyId alongside edit so the create/edit form can navigate back
    // to this same party's detail view (instead of the generic parties list)
    // once the edit is saved.
    const partyParam = party.id ? `&partyId=${party.id}` : "";
    if (tx.type === "Sales Invoice") {
      router.push(`/sales/invoices/create?edit=${tx.refId}${partyParam}`);
    } else if (tx.type === "Purchase Bill") {
      router.push(`/purchase/bills/create?edit=${tx.refId}${partyParam}`);
    }
  }

  async function handleConfirmDelete() {
    setDeleteConfirm(false);
    try {
      await onDelete(party.id!);
    } catch (err) {
      if (isAxiosError(err) && err.response?.status === 409) {
        setCannotDeleteOpen(true);
      }
    }
  }

  function handleTransactionType(label: string) {
    setAddTxnOpen(false);
    setEditingPayment(null);
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
      router.push(`/sales/returns/create?partyId=${id}`);
    } else if (label === "Purchase Return") {
      router.push(`/purchase/returns/create?partyId=${id}`);
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
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeleteConfirm(false)}
        />
      )}

      {cannotDeleteOpen && (
        <CannotDeletePartyModal onClose={() => setCannotDeleteOpen(false)} />
      )}

      {openingBalanceModalOpen && (
        <EditOpeningBalanceModal
          party={party}
          onClose={() => setOpeningBalanceModalOpen(false)}
          onSave={(amt, g) => {
            onUpdateOpeningBalance(amt, g);
            setOpeningBalanceModalOpen(false);
          }}
          onDelete={() => {
            onUpdateOpeningBalance("Rs. 0", true);
            setOpeningBalanceModalOpen(false);
          }}
        />
      )}

      {activeModal === "payment-in" && party.id && (
        <PaymentModal
          title={editingPayment ? "Edit Payment In" : "Record Payment In"}
          partyId={party.id}
          type="in"
          editing={editingPayment}
          onClose={() => {
            setActiveModal(null);
            setEditingPayment(null);
          }}
          onSuccess={onPaymentSaved}
        />
      )}
      {activeModal === "payment-out" && party.id && (
        <PaymentModal
          title={editingPayment ? "Edit Payment Out" : "Record Payment Out"}
          partyId={party.id}
          type="out"
          editing={editingPayment}
          onClose={() => {
            setActiveModal(null);
            setEditingPayment(null);
          }}
          onSuccess={onPaymentSaved}
        />
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
                {[
                  { label: "Type" },
                  { label: "Date" },
                  { label: "Total" },
                  { label: "Status" },
                  {
                    label: "Balance Due",
                    tooltip:
                      "Outstanding amount for this transaction only — not the party's overall running balance.",
                  },
                  { label: "Remarks" },
                ].map(({ label, tooltip }) => (
                  <th
                    key={label}
                    title={tooltip}
                    className="text-left py-2.5 px-4 text-[12px] text-gray-400 font-medium"
                  >
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {party.txns.map((tx, i) => (
                <TransactionRow
                  key={i}
                  tx={tx}
                  onClick={() => openTransaction(tx)}
                />
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
  const searchParams = useSearchParams();
  const { parties, addParty, deleteParty, updateParty } = useParties();
  const { invoices } = useSales();
  const { bills } = usePurchase();
  const { paymentsIn, paymentsOut, refresh: refreshPayments } = usePayments();
  const [salesReturns, setSalesReturns] = useState<SalesReturnApiResponse[]>([]);
  const [purchaseReturns, setPurchaseReturns] = useState<PurchaseReturnApiResponse[]>([]);
  const refreshReturns = async () => {
    const [sr, pr] = await Promise.allSettled([
      fetchSalesReturnsApi(),
      fetchPurchaseReturnsApi(),
    ]);
    if (sr.status === "fulfilled") setSalesReturns(sr.value);
    if (pr.status === "fulfilled") setPurchaseReturns(pr.value);
  };
  useEffect(() => {
    void refreshReturns();
  }, []);
  // Restore the previously-open party (passed back as ?selected=<id> after
  // saving a transaction from this party's "Add Transaction" menu) instead
  // of always landing with nothing selected.
  const [selected, setSelected] = useState<string | null>(
    () => searchParams.get("selected"),
  );
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

  function paymentsForParty(p: Party) {
    const ins = paymentsIn.filter(
      (pi) => (p.id && pi.partyId === p.id) || pi.partyName === p.name,
    );
    const outs = paymentsOut.filter(
      (po) => (p.id && po.partyId === p.id) || po.partyName === p.name,
    );
    return { ins, outs };
  }

  function returnsForParty(p: Party) {
    const sales = salesReturns.filter(
      (sr) => (p.id && sr.partyId === p.id) || sr.partyName === p.name,
    );
    const purchase = purchaseReturns.filter(
      (pr) => (p.id && pr.partyId === p.id) || pr.partyName === p.name,
    );
    return { sales, purchase };
  }

  function withComputedAmt(p: Party): Party {
    const { amt, g } = computePartyRunningBalance(p, {
      invoices,
      bills,
      paymentsIn,
      paymentsOut,
      salesReturns,
      purchaseReturns,
    });
    return { ...p, amt, g };
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

  const selectedPartyBase =
    parties.find((p) => (p.id ?? p.name) === selected) ?? null;
  const selectedParty = selectedPartyBase
    ? {
        ...withComputedAmt(selectedPartyBase),
        txns: [
          // Opening balance predates every real transaction, so it's pinned
          // to the epoch to always sort first in FIFO order below.
          ...(parsePartyAmount(selectedPartyBase.amt) > 0
            ? [
                {
                  kind: "invoice" as const,
                  type: "Opening Balance",
                  date: "Opening",
                  mdate: new Date(0).toISOString(),
                  total: selectedPartyBase.amt,
                  status: "--",
                  bal: selectedPartyBase.amt,
                  rem: "--",
                },
              ]
            : []),
          ...invoices
            .filter(
              (inv) =>
                inv.party === selectedPartyBase.name ||
                (selectedPartyBase.id && inv.partyId === selectedPartyBase.id),
            )
            .map((inv) => ({
              kind: "invoice" as const,
              type: "Sales Invoice",
              date: inv.date,
              mdate: inv.createdAt ?? inv.date,
              total: inv.amount,
              status: inv.status,
              bal: inv.balance,
              rem: inv.notes || "--",
              rcpt: inv.no,
              refId: inv.id,
              creator: inv.creator,
            })),
          ...bills
            .filter(
              (b) =>
                b.supplier === selectedPartyBase.name ||
                (selectedPartyBase.id && b.supplierId === selectedPartyBase.id),
            )
            .map((b) => ({
              kind: "invoice" as const,
              type: "Purchase Bill",
              date: b.date,
              mdate: b.createdAt ?? b.date,
              total: b.amount,
              status: b.status,
              bal: b.balance,
              rem: b.notes || "--",
              rcpt: b.no,
              refId: b.id,
              creator: "Admin",
            })),
          ...paymentsForParty(selectedPartyBase).ins.map((pi) => ({
            kind: "payment_in" as const,
            type: "Payment In",
            date: fmtPaymentDate(pi.date),
            mdate: pi.createdAt ?? pi.date,
            total: `Rs. ${Math.round(pi.receivedAmount || 0).toLocaleString("en-IN")}`,
            status: "PAID",
            bal: "--",
            rem: pi.remarks || "--",
            rcpt: pi.receiptNumber,
            refId: pi.id,
          })),
          ...paymentsForParty(selectedPartyBase).outs.map((po) => ({
            kind: "payment_out" as const,
            type: "Payment Out",
            date: fmtPaymentDate(po.date),
            mdate: po.createdAt ?? po.date,
            total: `Rs. ${Math.round(po.paidAmount || 0).toLocaleString("en-IN")}`,
            status: "PAID",
            bal: "--",
            rem: po.remarks || "--",
            rcpt: po.receiptNumber,
            refId: po.id,
          })),
          ...returnsForParty(selectedPartyBase).sales.map((sr) => ({
            kind: "sales_return" as const,
            type: "Sales Return",
            date: fmtPaymentDate(sr.returnDate),
            mdate: sr.createdAt ?? sr.returnDate,
            total: `Rs. ${Math.round(sr.totalAmount || 0).toLocaleString("en-IN")}`,
            status: "PAID",
            bal: "--",
            rem: sr.notes || "--",
            rcpt: sr.returnNumber,
          })),
          ...returnsForParty(selectedPartyBase).purchase.map((pr) => ({
            kind: "purchase_return" as const,
            type: "Purchase Return",
            date: fmtPaymentDate(pr.returnDate),
            mdate: pr.createdAt ?? pr.returnDate,
            total: `Rs. ${Math.round(pr.totalAmount || 0).toLocaleString("en-IN")}`,
            status: "PAID",
            bal: "--",
            rem: pr.notes || "--",
            rcpt: pr.returnNumber,
          })),
        ]
          // Newest transaction first — using each entry's real creation
          // timestamp (mdate) rather than the display date, so same-day
          // entries still order correctly by actual creation time.
          .sort(
            (a, b) => new Date(b.mdate).getTime() - new Date(a.mdate).getTime(),
          ),
      }
    : null;

  function handleAddParty(party: Party) {
    void addParty(party);
    setSearch("");
    setSelected(party.id ?? party.name);
  }

  function handleEditParty(party: Party) {
    setEditingParty(party);
    setEditOpen(true);
  }

  function handleUpdateParty(updated: Party) {
    if (!editingParty) return;
    updateParty(editingParty.id!, updated);
    setSelected(editingParty.id ?? updated.name);
    setEditingParty(null);
  }

  function handleOpeningBalanceSave(amt: string, g: boolean) {
    if (!selectedPartyBase?.id) return;
    updateParty(selectedPartyBase.id, { ...selectedPartyBase, amt, g });
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
            const isSelected = selected === (p.id ?? p.name);
            return (
              <div
                key={p.id ?? p.name}
                onClick={() => setSelected(p.id ?? p.name)}
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
            paymentsIn={paymentsIn}
            paymentsOut={paymentsOut}
            onDelete={deleteParty}
            onEdit={handleEditParty}
            onPaymentSaved={() => void refreshPayments()}
            onUpdateOpeningBalance={handleOpeningBalanceSave}
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
