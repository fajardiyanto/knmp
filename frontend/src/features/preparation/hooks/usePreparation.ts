import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchPersiapanList,
  fetchPersiapanDetail,
  createPersiapan,
  updatePersiapan,
  deletePersiapan,
  fetchPCM,
  savePCM,
} from "../api";
import type { Persiapan, PCM } from "../types";

export function usePreparationList(jenis?: string, knmpId?: number) {
  return useQuery({
    queryKey: ["persiapan", "list", { jenis, knmpId }],
    queryFn: () => fetchPersiapanList(jenis, knmpId),
  });
}

export function usePreparationDetail(id?: number) {
  return useQuery({
    queryKey: ["persiapan", "detail", id],
    queryFn: () => fetchPersiapanDetail(id!),
    enabled: !!id,
  });
}

export function usePreparationMutations() {
  const queryClient = useQueryClient();

  const create = useMutation({
    mutationFn: (data: Partial<Persiapan>) => createPersiapan(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["persiapan"] });
    },
  });

  const update = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Persiapan> }) => updatePersiapan(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["persiapan"] });
    },
  });

  const remove = useMutation({
    mutationFn: (id: number) => deletePersiapan(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["persiapan"] });
    },
  });

  return { create, update, remove };
}

export function usePCM(persiapanKontrakId?: number) {
  return useQuery({
    queryKey: ["pcm", persiapanKontrakId],
    queryFn: () => fetchPCM(persiapanKontrakId!),
    enabled: !!persiapanKontrakId,
  });
}

export function usePCMMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<PCM>) => savePCM(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pcm"] });
    },
  });
}
