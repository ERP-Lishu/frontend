"use client";
import { createContext, useContext, useEffect, useState } from "react";
import type { InvoiceRow, FullInvoice } from "@/lib/types";
import {
  fetchSalesInvoicesApi,
  createSalesInvoiceApi,
  updateSalesInvoiceApi,
  deleteSalesInvoiceApi,
  apiInvoiceToLocal,
} from "@/lib/api/sales-invoice";

export type { InvoiceRow, FullInvoice };

interface SalesCtx {
  invoices: FullInvoice[];
  addInvoice: (inv: FullInvoice) => Promise<void>;
  updateInvoice: (inv: FullInvoice) => void;
  deleteInvoice: (id: string) => void;
}

const Ctx = createContext<SalesCtx | null>(null);
const LS_KEY = "gf_sales_invoices";

export function SalesProvider({ children }: { children: React.ReactNode }) {
  const [invoices, setInvoices] = useState<FullInvoice[]>([]);

  useEffect(() => {
    fetchSalesInvoicesApi()
      .then((data) => {
        let cached: FullInvoice[] = [];
        try {
          const raw = localStorage.getItem(LS_KEY);
          cached = raw ? JSON.parse(raw) : [];
        } catch {}
        const cachedById = Object.fromEntries(cached.map((x) => [x.id, x]));
        const mapped = data.map((api) => {
          const base = apiInvoiceToLocal(api);
          const saved = cachedById[base.id];
          if (saved) {
            return {
              ...base,
              amount: saved.amount,
              status: saved.status,
              received: saved.received,
              balance: saved.balance,
            };
          }
          return base;
        });
        setInvoices(mapped);
        localStorage.setItem(LS_KEY, JSON.stringify(mapped));
      })
      .catch(() => {
        try {
          const raw = localStorage.getItem(LS_KEY);
          setInvoices(raw ? JSON.parse(raw) : []);
        } catch {
          setInvoices([]);
        }
      });
  }, []);

  function saveToStorage(next: FullInvoice[]) {
    try { localStorage.setItem(LS_KEY, JSON.stringify(next)); } catch {}
  }

  async function addInvoice(inv: FullInvoice) {
    setInvoices((prev) => {
      const next = [inv, ...prev];
      saveToStorage(next);
      return next;
    });

    try {
      const created = await createSalesInvoiceApi(inv);
      setInvoices((prev) => {
        const next = prev.map((x) =>
          x.id === inv.id ? { ...x, id: created.id } : x
        );
        saveToStorage(next);
        return next;
      });
    } catch (err) {
      console.error("Failed to save sales invoice to backend:", err);
    }
  }

  function updateInvoice(inv: FullInvoice) {
    setInvoices((prev) => {
      const next = prev.map((x) => (x.id === inv.id ? inv : x));
      saveToStorage(next);
      return next;
    });

    updateSalesInvoiceApi(inv.id, inv).catch((err) =>
      console.error("Failed to update sales invoice in backend:", err)
    );
  }

  function deleteInvoice(id: string) {
    setInvoices((prev) => {
      const next = prev.filter((x) => x.id !== id);
      saveToStorage(next);
      return next;
    });

    deleteSalesInvoiceApi(id).catch((err) =>
      console.error("Failed to delete sales invoice from backend:", err)
    );
  }

  return (
    <Ctx.Provider value={{ invoices, addInvoice, updateInvoice, deleteInvoice }}>
      {children}
    </Ctx.Provider>
  );
}

export function useSales() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useSales must be inside SalesProvider");
  return ctx;
}
