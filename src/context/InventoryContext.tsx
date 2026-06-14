"use client";

import { createContext, useContext } from "react";
import type { InventoryItem } from "@/lib/types";
import {
  useInventoryQuery,
  useCreateInventoryItem,
  useUpdateInventoryItem,
  useDeleteInventoryItem,
} from "@/lib/hooks/useInventoryQuery";

interface InventoryCtx {
  items: InventoryItem[];
  isLoading: boolean;
  addItem: (item: InventoryItem) => Promise<void>;
  deleteItem: (id: string) => void;
  updateItem: (id: string, updated: InventoryItem) => void;
}

const Ctx = createContext<InventoryCtx | null>(null);

export function InventoryProvider({ children }: { children: React.ReactNode }) {
  const { data: items = [], isLoading } = useInventoryQuery();
  const createMutation = useCreateInventoryItem();
  const updateMutation = useUpdateInventoryItem();
  const deleteMutation = useDeleteInventoryItem();

  async function addItem(item: InventoryItem) {
    await createMutation.mutateAsync(item);
  }

  function deleteItem(id: string) {
    deleteMutation.mutate(id);
  }

  function updateItem(id: string, updated: InventoryItem) {
    updateMutation.mutate({ id, item: updated });
  }

  return (
    <Ctx.Provider value={{ items, isLoading, addItem, deleteItem, updateItem }}>
      {children}
    </Ctx.Provider>
  );
}

export function useInventory() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useInventory must be inside InventoryProvider");
  return ctx;
}
