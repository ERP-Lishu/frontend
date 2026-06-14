"use client";

import { useState, useRef, useEffect } from "react";
import {
  Plus, Search, ChevronDown, X, Trash2, Pencil, MoreVertical,
  ArrowLeft, Settings, Camera, Download,
} from "lucide-react";
import { useExpense, type FullExpense } from "@/context/ExpenseContext";
import { exportToExcel } from "@/lib/exportExcel";

const CATEGORIES = [
  "General", "Office Supplies", "Rent", "Utilities", "Salary",
  "Travel", "Marketing", "Maintenance", "Food & Beverages", "Other",
];

let nextItemId = 300;

// ── Delete confirmation ──
function DeleteConfirm({ label, onConfirm, onCancel }: { label: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/40 z-[70] flex items-center justify-center" onClick={onCancel}>
      <div className="bg-white rounded-2xl shadow-2xl w-[360px] p-6 flex flex-col gap-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between">
          <h2 className="text-[16px] font-bold text-[#1a1a1a]">Delete Expense?</h2>
          <button onClick={onCancel} className="w-7 h-7 border border-[#e5e5e5] rounded-md flex items-center justify-center hover:bg-gray-50 ml-3">
            <X size={14} className="text-gray-500" />
          </button>
        </div>
        <p className="text-[13px] text-gray-500 leading-relaxed">
          Are you sure you want to delete <strong>{label}</strong>? This cannot be undone.
        </p>
        <div className="flex items-center justify-end gap-3 pt-1">
          <button onClick={onConfirm} className="text-[13.5px] text-gray-700 font-medium hover:text-red-500 transition-colors px-2">Yes, Delete</button>
          <button onClick={onCancel} className="text-[13.5px] font-semibold bg-red-500 text-white rounded-xl px-5 py-2 hover:bg-red-600 transition-colors">Cancel</button>
        </div>
      </div>
    </div>
  );
}

// ── Row action menu ──
function ActionMenu({ exp, onEdit, onDelete }: { exp: FullExpense; onEdit: () => void; onDelete: () => void }) {
  const [open, setOpen] = useState(false);
  const [showDel, setShowDel] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function out(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); }
    document.addEventListener("mousedown", out);
    return () => document.removeEventListener("mousedown", out);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button onClick={(e) => { e.stopPropagation(); setOpen((o) => !o); }} className="w-7 h-7 rounded-md flex items-center justify-center text-gray-400 hover:bg-gray-100">
        <MoreVertical size={15} />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 w-[180px] bg-white rounded-xl shadow-2xl border border-[#efefef] z-50 py-1 overflow-hidden" onClick={(e) => e.stopPropagation()}>
          <button onClick={() => { setOpen(false); onEdit(); }} className="flex items-center gap-2.5 w-full px-4 py-2.5 text-[13px] text-[#1a1a1a] hover:bg-gray-50">
            <Pencil size={14} className="text-gray-500" /> Edit Expense
          </button>
          <div className="h-px bg-[#f0f0f0] mx-3 my-1" />
          <button onClick={() => { setOpen(false); setShowDel(true); }} className="flex items-center gap-2.5 w-full px-4 py-2.5 text-[13px] text-red-500 hover:bg-red-50">
            <Trash2 size={14} /> Delete
          </button>
        </div>
      )}
      {showDel && <DeleteConfirm label={`#${exp.no}`} onConfirm={() => { onDelete(); setShowDel(false); }} onCancel={() => setShowDel(false)} />}
    </div>
  );
}

// ── Detail modal ──
function ExpenseModal({ exp, onClose, onEdit, onDelete }: { exp: FullExpense; onClose: () => void; onEdit: () => void; onDelete: () => void }) {
  const [showDel, setShowDel] = useState(false);
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-[520px] max-h-[80vh] flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#f0f0f0] flex-shrink-0">
          <div>
            <div className="text-[16px] font-bold text-[#1a1a1a]">Expense #{exp.no}</div>
            <div className="text-[12.5px] text-gray-400 mt-0.5">{exp.category} · {exp.date}</div>
          </div>
          <button onClick={onClose} className="w-8 h-8 border border-[#e5e5e5] rounded-lg flex items-center justify-center hover:bg-gray-50">
            <X size={15} className="text-gray-500" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <table className="w-full border-collapse mb-4">
            <thead>
              <tr className="border-b border-[#f0f0f0]">
                <th className="text-left py-2 px-2 text-[11px] text-gray-400 font-medium">#</th>
                <th className="text-left py-2 px-2 text-[11px] text-gray-400 font-medium">Description</th>
                <th className="text-right py-2 px-2 text-[11px] text-gray-400 font-medium">Amount</th>
              </tr>
            </thead>
            <tbody>
              {exp.items.filter((it) => it.name).map((it, i) => (
                <tr key={it.id} className="border-b border-[#f8f8f8]">
                  <td className="py-2.5 px-2 text-[12.5px] text-gray-400">{i + 1}</td>
                  <td className="py-2.5 px-2 text-[13px] text-gray-700">{it.name}</td>
                  <td className="py-2.5 px-2 text-[13px] font-semibold text-[#1a1a1a] text-right">Rs. {Math.round(parseFloat(it.amount) || 0).toLocaleString("en-US")}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex justify-end">
            <div className="flex gap-6 text-[13px]">
              <span className="text-gray-500">Total Amount</span>
              <span className="font-bold text-[#1a1a1a] w-28 text-right">Rs. {exp.totalAmount.toLocaleString("en-US")}</span>
            </div>
          </div>
          {exp.remarks && (
            <div className="mt-4 bg-[#f9fafb] rounded-xl px-4 py-3 text-[12.5px] text-gray-600">
              <span className="font-medium text-gray-500">Remarks: </span>{exp.remarks}
            </div>
          )}
          <div className="mt-3 text-[12.5px] text-gray-500">
            Payment: <span className="font-medium text-[#1a1a1a]">{exp.mode}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 px-6 py-3.5 border-t border-[#f0f0f0] bg-white flex-shrink-0">
          <div className="ml-auto flex items-center gap-2">
            <button onClick={() => setShowDel(true)} className="w-8 h-8 border border-[#e5e5e5] rounded-lg flex items-center justify-center hover:bg-red-50 hover:border-red-200 text-red-400">
              <Trash2 size={14} />
            </button>
            <button onClick={onEdit} className="w-8 h-8 border-2 border-[#29ad82] rounded-lg flex items-center justify-center hover:bg-[#edfaf4] text-[#29ad82]">
              <Pencil size={14} />
            </button>
            <button onClick={onClose} className="flex items-center gap-1.5 text-[12.5px] bg-[#29ad82] text-white rounded-lg px-3.5 py-1.5 hover:bg-[#1d9470]">Close</button>
          </div>
        </div>
      </div>
      {showDel && <DeleteConfirm label={`#${exp.no}`} onConfirm={() => { onDelete(); onClose(); }} onCancel={() => setShowDel(false)} />}
    </div>
  );
}

// ── Create / Edit form ──
function ExpenseForm({ editExp, onDone }: { editExp: FullExpense | null; onDone: () => void }) {
  const { addExpense, updateExpense } = useExpense();
  const isEdit = !!editExp;

  const [expNo, setExpNo] = useState(() => editExp?.no ?? `EXP-${Date.now().toString().slice(-6)}`);
  const [date, setDate] = useState(() => {
    if (editExp) return editExp.date;
    const d = new Date();
    return `${d.getFullYear()} ${d.toLocaleString("en", { month: "short" })} ${String(d.getDate()).padStart(2, "0")}`;
  });
  const [category, setCategory] = useState(editExp?.category ?? "General");
  const [mode, setMode] = useState(editExp?.mode ?? "Cash");
  const [remarks, setRemarks] = useState(editExp?.remarks ?? "");
  const [items, setItems] = useState<{ id: number; name: string; amount: string }[]>(
    editExp?.items?.length ? editExp.items : [{ id: nextItemId++, name: "", amount: "" }]
  );
  const [attachImages, setAttachImages] = useState<string[]>(editExp?.attachImages ?? []);
  const imgRef = useRef<HTMLInputElement>(null);
  const dateRef = useRef<HTMLInputElement>(null);

  const total = items.reduce((s, it) => s + (Math.round(parseFloat(it.amount) || 0)), 0);

  function addItem() { setItems((p) => [...p, { id: nextItemId++, name: "", amount: "" }]); }
  function removeItem(id: number) { setItems((p) => p.length > 1 ? p.filter((it) => it.id !== id) : p); }
  function updateItem(id: number, field: "name" | "amount", val: string) {
    setItems((p) => p.map((it) => it.id === id ? { ...it, [field]: val } : it));
  }

  function handleSave() {
    const exp: FullExpense = {
      id: editExp?.id ?? Date.now().toString(),
      no: expNo,
      date,
      category,
      totalAmount: total,
      mode,
      remarks,
      items,
      attachImages,
    };
    if (isEdit) { updateExpense(exp); } else { addExpense(exp); }
    onDone();
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-[#f0f0f0] flex-shrink-0">
        <button onClick={onDone} className="flex items-center gap-2 text-[15px] font-bold text-[#1a1a1a] hover:opacity-70 transition-opacity">
          <ArrowLeft size={17} /> {isEdit ? "Edit Expense" : "Create Expense"}
        </button>
        <button className="w-8 h-8 rounded-full border border-[#e5e5e5] flex items-center justify-center text-gray-400 hover:bg-gray-50">
          <Settings size={15} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="w-full px-4 py-4 space-y-3">

          {/* Meta */}
          <div className="bg-white border border-[#efefef] rounded-xl px-4 py-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-[12.5px] text-gray-500 font-medium block mb-1.5">Expense No</label>
                <input className="w-full border border-[#e5e5e5] rounded-xl px-3.5 py-2.5 text-[13px] outline-none focus:border-[#29ad82] bg-white text-[#1a1a1a]" value={expNo} onChange={(e) => setExpNo(e.target.value)} />
              </div>
              <div>
                <label className="text-[12.5px] text-gray-500 font-medium block mb-1.5">Category</label>
                <div className="relative">
                  <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full border border-[#e5e5e5] rounded-xl px-3.5 py-2.5 text-[13px] outline-none focus:border-[#29ad82] bg-white text-[#1a1a1a] appearance-none pr-8">
                    {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                  </select>
                  <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="text-[12.5px] text-gray-500 font-medium block mb-1.5">Date</label>
                <div className="relative">
                  <input className="w-full border border-[#e5e5e5] rounded-xl px-3.5 py-2.5 text-[13px] outline-none focus:border-[#29ad82] bg-white text-[#1a1a1a] pr-10" value={date} onChange={(e) => setDate(e.target.value)} />
                  <input ref={dateRef} type="date" className="absolute inset-0 opacity-0 w-full cursor-pointer"
                    onChange={(e) => { if (!e.target.value) return; const d = new Date(e.target.value); setDate(`${d.getFullYear()} ${d.toLocaleString("en", { month: "short" })} ${String(d.getDate()).padStart(2, "0")}`); }} />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-[11px] pointer-events-none">📅</span>
                </div>
              </div>
            </div>
          </div>

          {/* Line items */}
          <div className="bg-white border border-[#efefef] rounded-xl overflow-hidden">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-[#f0f0f0] bg-[#fafafa]">
                  <th className="text-left px-5 py-3 text-[12px] text-gray-400 font-medium w-12">S.N.</th>
                  <th className="text-left px-4 py-3 text-[12px] text-gray-400 font-medium border-l border-[#efefef]">Description</th>
                  <th className="text-left px-4 py-3 text-[12px] text-gray-400 font-medium border-l border-[#efefef] w-44">Amount</th>
                  <th className="w-10 border-l border-[#efefef]" />
                </tr>
              </thead>
              <tbody>
                {items.map((it, idx) => (
                  <tr key={it.id} className="border-b border-[#f8f8f8] hover:bg-[#fafafa]">
                    <td className="px-5 py-2 text-[13px] text-gray-400 text-center">{idx + 1}</td>
                    <td className="border-l border-[#efefef] align-middle">
                      <input className="w-full px-3 py-2 text-[13px] text-[#1a1a1a] outline-none bg-transparent placeholder:text-gray-300" placeholder="Enter description" value={it.name} onChange={(e) => updateItem(it.id, "name", e.target.value)} />
                    </td>
                    <td className="border-l border-[#efefef] align-middle">
                      <div className="flex items-center gap-1 px-3">
                        <span className="text-[12.5px] text-gray-400">Rs.</span>
                        <input className="flex-1 py-2 text-[13px] outline-none bg-transparent placeholder:text-gray-300 min-w-0" placeholder="0" type="number" value={it.amount} onChange={(e) => updateItem(it.id, "amount", e.target.value)} />
                      </div>
                    </td>
                    <td className="border-l border-[#efefef] text-center align-middle px-2">
                      <button onClick={() => removeItem(it.id)} className="w-6 h-6 rounded flex items-center justify-center mx-auto hover:opacity-80">
                        <Trash2 size={14} className="text-red-400" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex items-center border-t border-[#f0f0f0]">
              <button onClick={addItem} className="flex items-center gap-1.5 text-[12.5px] text-[#29ad82] font-semibold px-5 py-3 hover:bg-[#edfaf4] transition-colors">
                <Plus size={13} /> Add Item
              </button>
              <div className="ml-auto flex items-center gap-6 px-5 py-3 border-l border-[#f0f0f0]">
                <span className="text-[13px] text-gray-500 font-medium">Total Amount</span>
                <span className="text-[13px] font-bold text-[#1a1a1a] min-w-[80px] text-right">Rs. {total.toLocaleString("en-US")}</span>
              </div>
            </div>
          </div>

          {/* Remarks + images + payment */}
          <div className="grid grid-cols-2 gap-3 items-start">
            <div className="flex flex-col gap-3">
              <div>
                <label className="text-[12.5px] text-gray-500 font-medium block mb-2">Remarks</label>
                <textarea className="w-full border border-[#e5e5e5] rounded-xl px-3.5 py-2 text-[13px] bg-white outline-none focus:border-[#29ad82] resize-none h-14 placeholder:text-gray-300" placeholder="Enter remarks..." value={remarks} onChange={(e) => setRemarks(e.target.value)} />
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

            <div className="bg-white rounded-xl overflow-hidden border border-[#efefef]">
              <div className="flex items-center justify-between px-4 py-3 border-b border-[#f0f0f0]">
                <span className="text-[13px] font-semibold text-[#1a1a1a]">Total Amount</span>
                <div className="flex items-center gap-1.5 bg-[#f7f8fa] border border-[#e5e5e5] rounded-lg px-3 py-1.5 w-40">
                  <span className="text-[12.5px] text-gray-400">Rs.</span>
                  <span className="text-[13px] font-semibold text-[#1a1a1a]">{total.toLocaleString("en-US")}</span>
                </div>
              </div>
              <div className="flex items-center justify-between px-4 py-3">
                <span className="text-[13px] text-gray-600 font-medium">Payment Mode</span>
                <div className="relative w-40">
                  <select value={mode} onChange={(e) => setMode(e.target.value)} className="w-full border border-[#e5e5e5] rounded-lg px-3 py-1.5 text-[13px] text-[#1a1a1a] outline-none focus:border-[#29ad82] bg-white appearance-none pr-7">
                    {["Cash", "Bank Transfer", "QR / Wallet", "Credit Card"].map((m) => <option key={m}>{m}</option>)}
                  </select>
                  <ChevronDown size={13} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-end px-4 py-3 bg-white border-t border-[#f0f0f0] flex-shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={onDone} className="text-[13.5px] text-gray-500 font-medium px-5 py-2.5 border border-[#e5e5e5] rounded-xl hover:bg-gray-50 transition-colors">
            Cancel
          </button>
          <button onClick={handleSave} className="bg-[#29ad82] text-white text-[13.5px] font-semibold px-5 py-2.5 rounded-xl hover:bg-[#1d9470] transition-colors">
            {isEdit ? "Update Expense" : "Save Expense"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main page ──
export function ExpensePage() {
  const { expenses, deleteExpense } = useExpense();
  const [view, setView] = useState<"list" | "create">("list");
  const [editExp, setEditExp] = useState<FullExpense | null>(null);
  const [selected, setSelected] = useState<FullExpense | null>(null);
  const [search, setSearch] = useState("");

  const filtered = search
    ? expenses.filter((e) =>
        e.no.toLowerCase().includes(search.toLowerCase()) ||
        e.category.toLowerCase().includes(search.toLowerCase()) ||
        e.remarks.toLowerCase().includes(search.toLowerCase())
      )
    : expenses;

  function handleExport() {
    exportToExcel("Expenses", "Expenses", [
      { header: "Expense No", key: "no", width: 16 },
      { header: "Date", key: "date", width: 16 },
      { header: "Category", key: "category", width: 20 },
      { header: "Total Amount", key: "amount", width: 18 },
      { header: "Payment Mode", key: "mode", width: 18 },
      { header: "Remarks", key: "remarks", width: 30 },
    ], filtered.map((e) => ({
      no: e.no,
      date: e.date,
      category: e.category,
      amount: `Rs. ${e.totalAmount.toLocaleString("en-US")}`,
      mode: e.mode,
      remarks: e.remarks,
    })));
  }

  if (view === "create") {
    return <ExpenseForm editExp={editExp} onDone={() => { setView("list"); setEditExp(null); }} />;
  }

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#efefef]">
        <h1 className="text-[18px] font-bold text-[#1a1a1a]">
          Expenses <span className="text-[14px] font-normal text-gray-400">({filtered.length})</span>
        </h1>
        <div className="flex items-center gap-2.5">
          <button onClick={handleExport} className="text-[12.5px] border border-[#e0e0e0] rounded-lg px-3 py-1.5 hover:bg-gray-50 flex items-center gap-1.5 text-gray-600">
            <Download size={13} /> Export
          </button>
          <button onClick={() => { setEditExp(null); setView("create"); }} className="flex items-center gap-1.5 text-[12.5px] bg-[#29ad82] text-white rounded-lg px-3 py-1.5 hover:bg-[#1d9470] transition-colors">
            <Plus size={13} /> Create Expense
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2.5 px-6 py-3 border-b border-[#f5f5f5]">
        <div className="flex items-center gap-2 bg-[#f7f7f7] border border-[#ebebeb] rounded-lg px-3 py-1.5 w-60">
          <Search size={13} className="text-gray-400 flex-shrink-0" />
          <input className="flex-1 bg-transparent outline-none text-[12.5px] text-gray-700 placeholder:text-gray-400" placeholder="Search expenses..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        {["All Categories", "All Date"].map((f) => (
          <button key={f} className="flex items-center gap-1.5 text-[12.5px] border border-[#e5e5e5] rounded-lg px-3 py-1.5 bg-white hover:bg-gray-50 text-gray-600">
            {f} <ChevronDown size={12} />
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto">
        <table className="w-full border-collapse">
          <thead className="sticky top-0 bg-white border-b border-[#f0f0f0] z-10">
            <tr>
              {["Expense No", "Date", "Category", "Total Amount", "Payment Mode", "Remarks"].map((h) => (
                <th key={h} className="text-left px-5 py-3 text-[12px] text-gray-400 font-medium">{h}</th>
              ))}
              <th className="w-14 px-5 py-3" />
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-16 text-[13px] text-gray-400">
                  No expenses found.{" "}
                  <button onClick={() => setView("create")} className="text-[#29ad82] hover:underline font-medium">Add one</button>
                </td>
              </tr>
            ) : (
              filtered.map((exp) => (
                <tr key={exp.id} className="border-b border-[#f8f8f8] hover:bg-gray-50 cursor-pointer" onClick={() => setSelected(exp)}>
                  <td className="px-5 py-3.5 text-[13px] font-medium text-[#29ad82]">#{exp.no}</td>
                  <td className="px-5 py-3.5 text-[13px] text-gray-500">{exp.date}</td>
                  <td className="px-5 py-3.5">
                    <span className="text-[12px] bg-[#f3f4f6] text-gray-600 rounded-full px-2.5 py-1 font-medium">{exp.category}</span>
                  </td>
                  <td className="px-5 py-3.5 text-[13px] font-semibold text-[#1a1a1a]">Rs. {exp.totalAmount.toLocaleString("en-US")}</td>
                  <td className="px-5 py-3.5 text-[13px] text-gray-600">{exp.mode}</td>
                  <td className="px-5 py-3.5 text-[13px] text-gray-400 max-w-[200px] truncate">{exp.remarks || "—"}</td>
                  <td className="px-5 py-3.5" onClick={(e) => e.stopPropagation()}>
                    <ActionMenu
                      exp={exp}
                      onEdit={() => { setEditExp(exp); setView("create"); }}
                      onDelete={() => deleteExpense(exp.id)}
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {selected && (
        <ExpenseModal
          exp={selected}
          onClose={() => setSelected(null)}
          onEdit={() => { setEditExp(selected); setSelected(null); setView("create"); }}
          onDelete={() => { deleteExpense(selected.id); setSelected(null); }}
        />
      )}
    </div>
  );
}
