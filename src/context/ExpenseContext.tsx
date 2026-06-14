"use client";
import { createContext, useContext, useEffect, useState } from "react";
import type { FullExpense } from "@/lib/api/expense";
import {
  fetchExpensesApi, createExpenseApi, updateExpenseApi,
  deleteExpenseApi, apiExpenseToLocal,
} from "@/lib/api/expense";

export type { FullExpense };

interface ExpenseCtx {
  expenses: FullExpense[];
  addExpense: (exp: FullExpense) => Promise<void>;
  updateExpense: (exp: FullExpense) => void;
  deleteExpense: (id: string) => void;
}

const Ctx = createContext<ExpenseCtx | null>(null);
const LS_KEY = "gf_expenses";

export function ExpenseProvider({ children }: { children: React.ReactNode }) {
  const [expenses, setExpenses] = useState<FullExpense[]>([]);

  useEffect(() => {
    fetchExpensesApi()
      .then((data) => {
        const mapped = data.map(apiExpenseToLocal);
        setExpenses(mapped);
        localStorage.setItem(LS_KEY, JSON.stringify(mapped));
      })
      .catch(() => {
        try {
          const raw = localStorage.getItem(LS_KEY);
          setExpenses(raw ? JSON.parse(raw) : []);
        } catch { setExpenses([]); }
      });
  }, []);

  function save(next: FullExpense[]) {
    try { localStorage.setItem(LS_KEY, JSON.stringify(next)); } catch {}
  }

  async function addExpense(exp: FullExpense) {
    setExpenses((prev) => { const next = [exp, ...prev]; save(next); return next; });
    try {
      const created = await createExpenseApi(exp);
      setExpenses((prev) => {
        const next = prev.map((x) => x.id === exp.id ? { ...x, id: created.id } : x);
        save(next); return next;
      });
    } catch (err) { console.error("Failed to save expense:", err); }
  }

  function updateExpense(exp: FullExpense) {
    setExpenses((prev) => { const next = prev.map((x) => x.id === exp.id ? exp : x); save(next); return next; });
    updateExpenseApi(exp.id, exp).catch((err) => console.error("Failed to update expense:", err));
  }

  function deleteExpense(id: string) {
    setExpenses((prev) => { const next = prev.filter((x) => x.id !== id); save(next); return next; });
    deleteExpenseApi(id).catch((err) => console.error("Failed to delete expense:", err));
  }

  return <Ctx.Provider value={{ expenses, addExpense, updateExpense, deleteExpense }}>{children}</Ctx.Provider>;
}

export function useExpense() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useExpense must be inside ExpenseProvider");
  return ctx;
}
