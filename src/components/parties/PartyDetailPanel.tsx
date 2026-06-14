"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Bell,
  Copy,
  UserPen,
  ArrowUpDown,
  Trash2,
  Pencil,
  Plus,
  Tag,
  ShoppingCart,
  ArrowDownLeft,
  ArrowUpRight,
  FileText,
  RotateCcw,
  RefreshCcw,
} from "lucide-react";
import type { Party, Transaction } from "@/lib/types";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { DeleteConfirmModal } from "./DeleteConfirmModal";

function parsePartyAmount(value: string) {
  const match = value.match(/[\d,]+(\.\d+)?/);
  if (!match) return 0;
  return parseFloat(match[0].replace(/,/g, "")) || 0;
}

export function partyStatus(p: Party): "To Receive" | "To Give" | "Settled" {
  const num = parsePartyAmount(p.amt);
  if (num === 0) return "Settled";
  if (p.g) return "To Receive";
  return "To Give";
}

export function statusColor(status: "To Receive" | "To Give" | "Settled") {
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
  { label: "Sales Invoice", icon: Tag, route: "/sales/invoices/create" },
  { label: "Purchase", icon: ShoppingCart, route: "/purchase/bills/create" },
  { label: "Payment In", icon: ArrowDownLeft, route: "/sales/payments" },
  { label: "Payment Out", icon: ArrowUpRight, route: "/purchase/payments" },
  { label: "Sales Return", icon: RotateCcw, route: "/sales/returns" },
  { label: "Purchase Return", icon: RefreshCcw, route: "/purchase/returns" },
];

export function PartyDetailPanel({
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
  const manageRef = useRef<HTMLDivElement>(null);
  const addTxnRef = useRef<HTMLDivElement>(null);
  const status = partyStatus(party);

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
              {TRANSACTION_TYPES.map(({ label, icon: Icon, route }) => (
                <button
                  key={label}
                  onClick={() => {
                    setAddTxnOpen(false);
                    router.push(`${route}?partyId=${party.id}`);
                  }}
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
            <svg
              width="160"
              height="160"
              viewBox="0 0 160 160"
              fill="none"
              className="mb-4 opacity-80"
            >
              <ellipse cx="80" cy="130" rx="50" ry="10" fill="#f0f0f0" />
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
              <rect
                x="58"
                y="24"
                width="32"
                height="14"
                rx="7"
                fill="#d0d0d0"
              />
              <rect x="63" y="27" width="22" height="8" rx="4" fill="#bbb" />
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
              <circle cx="108" cy="88" r="18" fill="#e0e0e0" />
              <circle cx="108" cy="82" r="9" fill="#c8c8c8" />
              <path
                d="M93 106c0-8.28 6.72-15 15-15s15 6.72 15 15"
                fill="#e0e0e0"
              />
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
