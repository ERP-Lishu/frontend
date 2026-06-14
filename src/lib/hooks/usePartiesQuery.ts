"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Party } from "@/lib/types";
import {
  fetchPartiesApi,
  createPartyApi,
  updatePartyApi,
  deletePartyApi,
  apiPartyToLocal,
} from "@/lib/api/parties";

export const PARTIES_KEY = ["parties"] as const;

export function usePartiesQuery() {
  return useQuery({
    queryKey: PARTIES_KEY,
    queryFn: async () => {
      const data = await fetchPartiesApi();
      return data.map(apiPartyToLocal);
    },
    staleTime: 30_000,
  });
}

export function useCreateParty() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createPartyApi,
    onSuccess: () => qc.invalidateQueries({ queryKey: PARTIES_KEY }),
  });
}

export function useUpdateParty() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, party }: { id: string; party: Party }) =>
      updatePartyApi(id, party),
    onSuccess: () => qc.invalidateQueries({ queryKey: PARTIES_KEY }),
  });
}

export function useDeleteParty() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deletePartyApi,
    onSuccess: () => qc.invalidateQueries({ queryKey: PARTIES_KEY }),
  });
}
