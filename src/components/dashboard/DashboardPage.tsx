"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Eye, EyeOff, Plus, ChevronRight, AlertTriangle, Loader2 } from "lucide-react";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { getDashboardSummary, DashboardSummary } from "@/lib/api/dashboard";

const productionOrders: { id: string; style: string; qty: number; stage: string; progress: number; due: string; stageColor: string }[] = [];
const transferHistory: { id: string; from: string; to: string; items: string; date: string; st: string }[] = [];
const locationBars: { l: string; v: number }[] = [];

function formatRs(value: number): string {
  return (
    "Rs. " +
    Math.round(Math.abs(value)).toLocaleString("en-IN")
  );
}

// Returns current Nepali month name (approximate Gregorian → Nepali mapping)
function getNepaliMonthName(): string {
  const months = [
    "Magh", "Falgun", "Chaitra", "Baisakh", "Jestha", "Ashadh",
    "Shrawan", "Bhadra", "Ashwin", "Kartik", "Mangsir", "Poush",
  ];
  // Nepali month roughly starts mid-Gregorian month
  // Baisakh = April 14 – May 14, offset from January = index 3
  const now = new Date();
  const gregMonth = now.getMonth(); // 0 = Jan
  const day = now.getDate();
  // Nepali new year starts ~April 14
  const nepaliMonthIndex = (gregMonth - 3 + (day < 14 ? 0 : 0) + 12) % 12;
  return months[nepaliMonthIndex];
}

export function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [privacyMode, setPrivacyMode] = useState(false);
  const monthName = getNepaliMonthName();

  useEffect(() => {
    getDashboardSummary()
      .then(setSummary)
      .finally(() => setLoading(false));
  }, []);

  const summaryCards = [
    {
      label: "To Receive",
      value: summary ? formatRs(summary.toReceive) : "—",
      color: "text-[#29ad82]",
      icon: "↓",
    },
    {
      label: "To Give",
      value: summary ? formatRs(summary.toGive) : "—",
      color: "text-[#c0392b]",
      icon: "↑",
    },
    {
      label: `Sales (${monthName})`,
      value: summary ? formatRs(summary.currentMonthSales) : "—",
      color: "text-[#2471a3]",
      icon: "🏷",
    },
    {
      label: `Purchase (${monthName})`,
      value: summary ? formatRs(summary.currentMonthPurchase) : "—",
      color: "text-[#d35400]",
      icon: "🛒",
    },
    {
      label: `Expense (${monthName})`,
      value: summary ? formatRs(summary.currentMonthExpense) : "—",
      color: "text-[#7d3c98]",
      icon: "🧾",
    },
  ];

  const belowReorder = summary?.materialAlerts ?? [];

  return (
    <div className="flex-1 overflow-y-auto p-5 bg-[#f9fafb]">
      {/* Header row */}
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-[20px] font-bold text-[#1a1a1a]">
          Welcome
        </h1>
        <div className="flex gap-2">
          <button
            onClick={() => setPrivacyMode((p) => !p)}
            className={`flex items-center gap-1.5 text-sm border rounded-lg px-3 py-1.5 transition-colors ${privacyMode ? "border-[#29ad82] bg-[#f0fdf9] text-[#29ad82]" : "border-[#e0e0e0] bg-white hover:bg-gray-50 text-gray-700"}`}
          >
            {privacyMode ? <EyeOff size={14} /> : <Eye size={14} />} Privacy Mode
          </button>
          <button className="flex items-center gap-1.5 text-sm bg-[#29ad82] text-white rounded-lg px-3 py-1.5 hover:bg-[#1d9470] transition-colors">
            <Plus size={14} /> Sales
          </button>
          <button className="flex items-center gap-1.5 text-sm bg-[#29ad82] text-white rounded-lg px-3 py-1.5 hover:bg-[#1d9470] transition-colors">
            <Plus size={14} /> Purchase
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-5 gap-3 mb-5">
        {summaryCards.map((c) => (
          <div
            key={c.label}
            className="bg-white border border-[#efefef] rounded-xl p-4"
          >
            <div className={`text-xl mb-2 ${c.color}`}>{c.icon}</div>
            <div className="text-[11px] text-gray-400 mb-1">{c.label}</div>
            <div className={`text-[15px] font-bold ${c.color}`}>
              {loading ? (
                <Loader2 size={14} className="animate-spin inline" />
              ) : privacyMode ? (
                <span className="tracking-widest">••••••</span>
              ) : (
                c.value
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Alert */}
      {!loading && belowReorder.length > 0 && (
        <div className="bg-[#fff8e1] border border-[#ffe082] rounded-lg px-4 py-3 flex gap-2.5 items-start mb-5 text-[12px] text-[#e65100]">
          <AlertTriangle size={15} className="flex-shrink-0 mt-0.5" />
          <div>
            {belowReorder.length} material{belowReorder.length > 1 ? "s" : ""} below reorder level:{" "}
            {belowReorder.map((a, i) => (
              <span key={a.id}>
                <strong>{a.name}</strong>
                {i < belowReorder.length - 1 ? ", " : ""}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Main grid */}
      <div className="grid grid-cols-[1fr_340px] gap-4">
        {/* Left col */}
        <div>
          {/* Production orders */}
          <div className="bg-white border border-[#efefef] rounded-xl p-4 mb-4">
            <div className="flex items-center justify-between mb-3.5">
              <span className="text-[13.5px] font-semibold text-[#1a1a1a]">
                Active Production Orders
              </span>
              <Link
                href="/production"
                className="text-[12px] text-[#29ad82] flex items-center gap-1 hover:underline"
              >
                View All <ChevronRight size={13} />
              </Link>
            </div>
            <table className="w-full text-[12.5px] border-collapse">
              <thead>
                <tr className="border-b border-[#f0f0f0]">
                  {["Order #", "Style", "Qty", "Stage", "Progress", "Due"].map(
                    (h) => (
                      <th
                        key={h}
                        className="text-left py-2 px-2.5 text-[11px] text-gray-400 font-medium"
                      >
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {productionOrders.map((o) => (
                  <tr
                    key={o.id}
                    className="border-b border-[#f8f8f8] hover:bg-gray-50"
                  >
                    <td className="py-2.5 px-2.5 text-[#29ad82] font-semibold">
                      {o.id}
                    </td>
                    <td className="py-2.5 px-2.5 text-gray-700">{o.style}</td>
                    <td className="py-2.5 px-2.5 text-gray-700">{o.qty}</td>
                    <td className="py-2.5 px-2.5">
                      <StatusBadge label={o.stage} />
                    </td>
                    <td className="py-2.5 px-2.5">
                      <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#29ad82] rounded-full"
                          style={{ width: `${o.progress}%` }}
                        />
                      </div>
                    </td>
                    <td className="py-2.5 px-2.5 text-[11.5px] text-gray-400">
                      {o.due}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Recent transfers */}
          <div className="bg-white border border-[#efefef] rounded-xl p-4">
            <div className="flex items-center justify-between mb-3.5">
              <span className="text-[13.5px] font-semibold text-[#1a1a1a]">
                Recent Stock Transfers
              </span>
              <Link
                href="/transfer"
                className="text-[12px] text-[#29ad82] flex items-center gap-1 hover:underline"
              >
                View All <ChevronRight size={13} />
              </Link>
            </div>
            <table className="w-full text-[12.5px] border-collapse">
              <thead>
                <tr className="border-b border-[#f0f0f0]">
                  {["Transfer #", "From → To", "Items", "Date", "Status"].map(
                    (h) => (
                      <th
                        key={h}
                        className="text-left py-2 px-2.5 text-[11px] text-gray-400 font-medium"
                      >
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {transferHistory.map((t) => (
                  <tr
                    key={t.id}
                    className="border-b border-[#f8f8f8] hover:bg-gray-50"
                  >
                    <td className="py-2.5 px-2.5 text-[#29ad82] font-semibold">
                      {t.id}
                    </td>
                    <td className="py-2.5 px-2.5 text-gray-700">
                      {t.from} → {t.to}
                    </td>
                    <td className="py-2.5 px-2.5 text-gray-700">{t.items}</td>
                    <td className="py-2.5 px-2.5 text-gray-400 text-[11.5px]">
                      {t.date}
                    </td>
                    <td className="py-2.5 px-2.5">
                      <StatusBadge
                        label={
                          t.st === "done"
                            ? "Done"
                            : t.st === "transit"
                              ? "Transit"
                              : "Pending"
                        }
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right col */}
        <div>
          {/* Balance card */}
          <div className="bg-white border border-[#efefef] rounded-xl p-4 mb-3">
            <div className="text-[11.5px] text-gray-400 mb-1">
              Total Balance (Cash & Bank)
            </div>
            <div className="text-[20px] font-bold text-[#1a1a1a]">
              {loading ? (
                <Loader2 size={16} className="animate-spin inline" />
              ) : privacyMode ? (
                <span className="tracking-widest text-[16px]">••••••</span>
              ) : summary ? (
                formatRs(summary.totalBalance)
              ) : (
                "—"
              )}
            </div>
          </div>

          {/* Location stock */}
          <div className="bg-white border border-[#efefef] rounded-xl p-4 mb-3">
            <div className="text-[13px] font-semibold text-[#1a1a1a] mb-3">
              Location Stock Levels
            </div>
            {locationBars.map((b) => (
              <div key={b.l} className="mb-3 last:mb-0">
                <div className="flex justify-between text-[12px] text-gray-600 mb-1">
                  <span>{b.l}</span>
                  <span className="text-gray-400">{b.v}%</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#29ad82] rounded-full"
                    style={{ width: `${b.v}%`, opacity: b.v > 80 ? 1 : 0.7 }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Material alerts */}
          <div className="bg-white border border-[#efefef] rounded-xl p-4">
            <div className="text-[13px] font-semibold text-[#1a1a1a] mb-2.5">
              Material Alerts
            </div>
            <div className="text-[12.5px] space-y-0">
              {loading ? (
                <div className="flex justify-center py-3">
                  <Loader2 size={16} className="animate-spin text-gray-400" />
                </div>
              ) : belowReorder.length === 0 ? (
                <p className="text-gray-400 text-[12px] py-2">No alerts</p>
              ) : (
                belowReorder.map((a) => (
                  <div
                    key={a.id}
                    className="flex justify-between items-center py-1.5 border-b border-[#f5f5f5] last:border-b-0"
                  >
                    <span className="text-gray-700">{a.name}</span>
                    <StatusBadge label={a.status} />
                  </div>
                ))
              )}
            </div>
            <button className="mt-3 w-full flex items-center justify-center gap-1.5 text-[12px] bg-[#29ad82] text-white rounded-lg py-2 hover:bg-[#1d9470] transition-colors">
              <Plus size={13} /> Create Purchase Order
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
