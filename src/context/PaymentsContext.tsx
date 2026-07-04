"use client";
import { createContext, useContext, useCallback, useEffect, useState } from "react";
import {
  fetchPaymentInApi,
  type PaymentInApiResponse,
} from "@/lib/api/payment-in";
import {
  fetchPaymentOutApi,
  type PaymentOutApiResponse,
} from "@/lib/api/payment-out";

interface PaymentsCtx {
  paymentsIn: PaymentInApiResponse[];
  paymentsOut: PaymentOutApiResponse[];
  /** Re-fetch both payment lists from the backend (e.g. after recording one). */
  refresh: () => Promise<void>;
}

const Ctx = createContext<PaymentsCtx | null>(null);

export function PaymentsProvider({ children }: { children: React.ReactNode }) {
  const [paymentsIn, setPaymentsIn] = useState<PaymentInApiResponse[]>([]);
  const [paymentsOut, setPaymentsOut] = useState<PaymentOutApiResponse[]>([]);

  const refresh = useCallback(async () => {
    const [inRes, outRes] = await Promise.allSettled([
      fetchPaymentInApi(),
      fetchPaymentOutApi(),
    ]);
    if (inRes.status === "fulfilled") setPaymentsIn(inRes.value);
    if (outRes.status === "fulfilled") setPaymentsOut(outRes.value);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return (
    <Ctx.Provider value={{ paymentsIn, paymentsOut, refresh }}>
      {children}
    </Ctx.Provider>
  );
}

export function usePayments() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("usePayments must be inside PaymentsProvider");
  return ctx;
}
