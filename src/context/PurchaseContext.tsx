"use client";
import { createContext, useContext, useEffect, useState } from "react";
import type { FullBill } from "@/lib/types";
import {
  fetchPurchaseBillsApi,
  createPurchaseBillApi,
  updatePurchaseBillApi,
  deletePurchaseBillApi,
  apiBillToLocal,
} from "@/lib/api/purchase-bill";

export type { FullBill };

interface PurchaseCtx {
  bills: FullBill[];
  addBill: (bill: FullBill) => Promise<void>;
  updateBill: (bill: FullBill) => Promise<void>;
  deleteBill: (id: string) => void;
}

const Ctx = createContext<PurchaseCtx | null>(null);
const LS_KEY = "gf_purchase_bills";

export function PurchaseProvider({ children }: { children: React.ReactNode }) {
  const [bills, setBills] = useState<FullBill[]>([]);

  useEffect(() => {
    fetchPurchaseBillsApi()
      .then((data) => {
        let cached: FullBill[] = [];
        try {
          const raw = localStorage.getItem(LS_KEY);
          cached = raw ? JSON.parse(raw) : [];
        } catch {}
        const cachedById = Object.fromEntries(cached.map((x) => [x.id, x]));
        const mapped = data.map((api) => {
          const base = apiBillToLocal(api);
          const saved = cachedById[base.id];
          if (saved) {
            // Backend is the source of truth for amount/balance; only restore
            // locally-tracked fields (paid/status) and the supplier link.
            return {
              ...base,
              status: saved.status ?? base.status,
              paid: saved.paid ?? base.paid,
              supplier: base.supplier && base.supplier !== "—" ? base.supplier : (saved.supplier || base.supplier),
              supplierId: base.supplierId ?? saved.supplierId,
            };
          }
          return base;
        });
        setBills(mapped);
        localStorage.setItem(LS_KEY, JSON.stringify(mapped));
      })
      .catch(() => {
        try {
          const raw = localStorage.getItem(LS_KEY);
          setBills(raw ? JSON.parse(raw) : []);
        } catch {
          setBills([]);
        }
      });
  }, []);

  function saveToStorage(next: FullBill[]) {
    try { localStorage.setItem(LS_KEY, JSON.stringify(next)); } catch {}
  }

  async function addBill(bill: FullBill) {
    setBills((prev) => {
      const next = [bill, ...prev];
      saveToStorage(next);
      return next;
    });

    try {
      const created = await createPurchaseBillApi(bill);
      setBills((prev) => {
        const next = prev.map((x) => x.id === bill.id ? { ...x, id: created.id } : x);
        saveToStorage(next);
        return next;
      });
    } catch (err) {
      console.error("Failed to save purchase bill to backend:", err);
    }
  }

  async function updateBill(bill: FullBill) {
    setBills((prev) => {
      const next = prev.map((x) => (x.id === bill.id ? bill : x));
      saveToStorage(next);
      return next;
    });
    try {
      await updatePurchaseBillApi(bill.id, bill);
    } catch (err) {
      console.error("Failed to update purchase bill in backend:", err);
    }
  }

  function deleteBill(id: string) {
    setBills((prev) => {
      const next = prev.filter((x) => x.id !== id);
      saveToStorage(next);
      return next;
    });
    deletePurchaseBillApi(id).catch((err) =>
      console.error("Failed to delete purchase bill from backend:", err)
    );
  }

  return (
    <Ctx.Provider value={{ bills, addBill, updateBill, deleteBill }}>
      {children}
    </Ctx.Provider>
  );
}

export function usePurchase() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("usePurchase must be inside PurchaseProvider");
  return ctx;
}
