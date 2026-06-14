"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { InventoryItem } from "@/lib/types";
import {
  fetchInventoryApi,
  createInventoryApi,
  updateInventoryApi,
  deleteInventoryApi,
  apiInventoryToLocal,
} from "@/lib/api/inventory";

export const INVENTORY_KEY = ["inventory"] as const;

export function useInventoryQuery() {
  return useQuery({
    queryKey: INVENTORY_KEY,
    queryFn: async () => {
      const data = await fetchInventoryApi();
      return data.map(apiInventoryToLocal);
    },
    staleTime: 30_000,
  });
}

export function useCreateInventoryItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createInventoryApi,
    onSuccess: () => qc.invalidateQueries({ queryKey: INVENTORY_KEY }),
  });
}

export function useUpdateInventoryItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, item }: { id: string; item: InventoryItem }) =>
      updateInventoryApi(id, item),
    onSuccess: () => qc.invalidateQueries({ queryKey: INVENTORY_KEY }),
  });
}

export function useDeleteInventoryItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteInventoryApi,
    onSuccess: () => qc.invalidateQueries({ queryKey: INVENTORY_KEY }),
  });
}
