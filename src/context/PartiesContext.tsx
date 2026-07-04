"use client";

import { createContext, useContext } from "react";
import type { Party } from "@/lib/types";
import {
  usePartiesQuery,
  useCreateParty,
  useUpdateParty,
  useDeleteParty,
} from "@/lib/hooks/usePartiesQuery";

interface PartiesCtx {
  parties: Party[];
  isLoading: boolean;
  addParty: (p: Party) => Promise<void>;
  deleteParty: (id: string) => Promise<void>;
  updateParty: (id: string, updated: Party) => void;
}

const Ctx = createContext<PartiesCtx | null>(null);

export function PartiesProvider({ children }: { children: React.ReactNode }) {
  const { data: parties = [], isLoading } = usePartiesQuery();
  const createMutation = useCreateParty();
  const updateMutation = useUpdateParty();
  const deleteMutation = useDeleteParty();

  async function addParty(p: Party) {
    await createMutation.mutateAsync(p);
  }

  async function deleteParty(id: string) {
    await deleteMutation.mutateAsync(id);
  }

  function updateParty(id: string, updated: Party) {
    updateMutation.mutate({ id, party: updated });
  }

  return (
    <Ctx.Provider value={{ parties, isLoading, addParty, deleteParty, updateParty }}>
      {children}
    </Ctx.Provider>
  );
}

export function useParties() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useParties must be inside PartiesProvider");
  return ctx;
}
