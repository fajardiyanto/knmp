import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchPembayaranList,
  fetchPembayaranSummary,
  fetchTerminStats,
  createPembayaran,
} from "../api";
import type { Pembayaran } from "../types";

export function usePaymentsList(persiapanKontrakId?: number) {
  return useQuery({
    queryKey: ["pembayaran", "list", persiapanKontrakId],
    queryFn: () => fetchPembayaranList(persiapanKontrakId),
  });
}

export function usePaymentsSummary() {
  return useQuery({
    queryKey: ["pembayaran", "summary"],
    queryFn: fetchPembayaranSummary,
  });
}

export function useTerminStats() {
  return useQuery({
    queryKey: ["pembayaran", "termin"],
    queryFn: fetchTerminStats,
  });
}

export function usePaymentsMutations() {
  const queryClient = useQueryClient();

  const create = useMutation({
    mutationFn: (data: Partial<Pembayaran>) => createPembayaran(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pembayaran"] });
    },
  });

  return { create };
}
