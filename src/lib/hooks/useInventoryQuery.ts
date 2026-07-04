"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { InventoryItem } from "@/lib/types";
import {
  fetchInventoryApi,
  createInventoryApi,
  updateInventoryApi,
  deleteInventoryApi,
  apiInventoryToLocal,
  saveVariantsLocally,
  deleteVariantsLocally,
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
    onSuccess: (apiItem, localItem) => {
      saveVariantsLocally(apiItem.id, localItem);
      qc.setQueryData<InventoryItem[]>(INVENTORY_KEY, (prev = []) => [
        ...prev,
        {
          ...apiInventoryToLocal(apiItem),
          variants: localItem.variants,
          varLabels: localItem.varLabels,
          images: localItem.images,
          color: localItem.color,
        },
      ]);
    },
  });
}

export function useUpdateInventoryItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, item }: { id: string; item: InventoryItem }) =>
      updateInventoryApi(id, item),
    onSuccess: (apiItem, { item: localItem }) => {
      saveVariantsLocally(apiItem.id, localItem);
      qc.setQueryData<InventoryItem[]>(INVENTORY_KEY, (prev = []) =>
        prev.map((existing) =>
          existing.id === apiItem.id
            ? {
                ...apiInventoryToLocal(apiItem),
                variants: localItem.variants,
                varLabels: localItem.varLabels,
                images: localItem.images,
                color: localItem.color,
              }
            : existing
        )
      );
    },
  });
}

export function useDeleteInventoryItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteInventoryApi,
    onSuccess: (_, id) => {
      deleteVariantsLocally(id);
      qc.invalidateQueries({ queryKey: INVENTORY_KEY });
    },
  });
}
