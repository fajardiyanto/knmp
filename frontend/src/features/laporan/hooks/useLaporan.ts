import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchLaporanList,
  fetchLaporanDetail,
  createLaporan,
  createMobileLaporan,
  verifyLaporan,
  unverifyLaporan,
  deleteLaporan,
} from "../api";

export function useLaporanList(params?: {
  pelaksanaan_id?: number;
  status?: string;
  jenis_laporan?: string;
  search?: string;
}) {
  return useQuery({
    queryKey: ["laporan", "list", params],
    queryFn: () => fetchLaporanList(params),
  });
}

export function useLaporanDetail(id?: number) {
  return useQuery({
    queryKey: ["laporan", "detail", id],
    queryFn: () => fetchLaporanDetail(id!),
    enabled: !!id,
  });
}

export function useLaporanMutations() {
  const queryClient = useQueryClient();

  const create = useMutation({
    mutationFn: (data: any) => createLaporan(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["laporan"] });
    },
  });

  const createMobile = useMutation({
    mutationFn: (formData: FormData) => createMobileLaporan(formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["laporan"] });
    },
  });

  const verify = useMutation({
    mutationFn: ({ id, status, note }: { id: number; status: "approved" | "rejected"; note: string }) =>
      verifyLaporan(id, status, note),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["laporan"] });
    },
  });

  const unverify = useMutation({
    mutationFn: ({ id, note }: { id: number; note: string }) => unverifyLaporan(id, note),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["laporan"] });
    },
  });

  const remove = useMutation({
    mutationFn: (id: number) => deleteLaporan(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["laporan"] });
    },
  });

  return { create, createMobile, verify, unverify, remove };
}
