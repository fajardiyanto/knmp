import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchAbsensiList,
  fetchAbsensiDetail,
  createMobileAbsensi,
  verifyAbsensi,
  unverifyAbsensi,
} from "../api";

export function useAttendanceList(params?: { pelaksanaan_id?: number; tipe_absensi?: string; status?: string }) {
  return useQuery({
    queryKey: ["absensi", "list", params],
    queryFn: () => fetchAbsensiList(params),
  });
}

export function useAttendanceDetail(id?: number) {
  return useQuery({
    queryKey: ["absensi", "detail", id],
    queryFn: () => fetchAbsensiDetail(id!),
    enabled: !!id,
  });
}

export function useAttendanceMutations() {
  const queryClient = useQueryClient();

  const create = useMutation({
    mutationFn: (formData: FormData) => createMobileAbsensi(formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["absensi"] });
    },
  });

  const verify = useMutation({
    mutationFn: ({ id, status, note }: { id: number; status: "approved" | "rejected"; note: string }) =>
      verifyAbsensi(id, status, note),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["absensi"] });
    },
  });

  const unverify = useMutation({
    mutationFn: ({ id, note }: { id: number; note: string }) => unverifyAbsensi(id, note),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["absensi"] });
    },
  });

  return { create, verify, unverify };
}
