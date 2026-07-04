"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Party } from "@/lib/types";
import {
  fetchPartiesApi,
  createPartyApi,
  updatePartyApi,
  deletePartyApi,
  apiPartyToLocal,
  savePartyBalanceLocally,
  deletePartyBalanceLocally,
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
  return {
    mutateAsync: async (localParty: Party): Promise<void> => {
      // Immediately add to cache so the party appears without waiting for the API.
      // Prepend so the newest party shows at the top of the list (matching the
      // order the server returns after a refresh).
      qc.setQueryData<Party[]>(PARTIES_KEY, (prev = []) => [
        { ...localParty, txns: localParty.txns ?? [] },
        ...prev,
      ]);
      try {
        const apiParty = await createPartyApi(localParty);
        savePartyBalanceLocally(apiParty.id, localParty.amt, localParty.g);
        // Replace the optimistic entry with the real one (has the server id)
        qc.setQueryData<Party[]>(PARTIES_KEY, (prev = []) =>
          prev.map((p) =>
            !p.id && p.name === localParty.name
              ? { ...apiPartyToLocal(apiParty), amt: localParty.amt, g: localParty.g }
              : p,
          ),
        );
      } catch {
        // Roll back on failure
        qc.setQueryData<Party[]>(PARTIES_KEY, (prev = []) =>
          (prev ?? []).filter((p) => !(p.id === undefined && p.name === localParty.name)),
        );
      }
    },
  };
}

export function useUpdateParty() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, party }: { id: string; party: Party }) =>
      updatePartyApi(id, party),
    onSuccess: (apiParty, { party: localParty }) => {
      savePartyBalanceLocally(apiParty.id, localParty.amt, localParty.g);
      qc.setQueryData<Party[]>(PARTIES_KEY, (prev = []) =>
        prev.map((p) =>
          p.id === apiParty.id
            ? { ...apiPartyToLocal(apiParty), amt: localParty.amt, g: localParty.g }
            : p
        )
      );
    },
  });
}

export function useDeleteParty() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deletePartyApi,
    onSuccess: (_, id) => {
      deletePartyBalanceLocally(id);
      qc.invalidateQueries({ queryKey: PARTIES_KEY });
    },
  });
}
