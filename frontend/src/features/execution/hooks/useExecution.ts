import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchPelaksanaanList,
  fetchPelaksanaanDetail,
  createPelaksanaan,
  updatePelaksanaan,
  deletePelaksanaan,
} from "../api";
import type { Pelaksanaan } from "../types";

export function useExecutionList(knmpId?: number) {
  return useQuery({
    queryKey: ["pelaksanaan", "list", knmpId],
    queryFn: () => fetchPelaksanaanList(knmpId),
  });
}

export function useExecutionDetail(id?: number) {
  return useQuery({
    queryKey: ["pelaksanaan", "detail", id],
    queryFn: () => fetchPelaksanaanDetail(id!),
    enabled: !!id,
  });
}

export function useExecutionMutations() {
  const queryClient = useQueryClient();

  const create = useMutation({
    mutationFn: (data: Partial<Pelaksanaan>) => createPelaksanaan(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pelaksanaan"] });
    },
  });

  const update = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Pelaksanaan> }) => updatePelaksanaan(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pelaksanaan"] });
    },
  });

  const remove = useMutation({
    mutationFn: (id: number) => deletePelaksanaan(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pelaksanaan"] });
    },
  });

  return { create, update, remove };
}
