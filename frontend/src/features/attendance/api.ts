import { apiFetch } from "../../lib/api-client";
import type { Absensi } from "./types";

export function fetchAbsensiList(params?: { pelaksanaan_id?: number; tipe_absensi?: string; status?: string }): Promise<Absensi[]> {
  const query = new URLSearchParams();
  if (params?.pelaksanaan_id) query.append("pelaksanaan_id", params.pelaksanaan_id.toString());
  if (params?.tipe_absensi) query.append("tipe_absensi", params.tipe_absensi);
  if (params?.status) query.append("status", params.status);
  const qStr = query.toString() ? `?${query.toString()}` : "";
  return apiFetch<Absensi[]>(`/api/v1/absensi${qStr}`);
}

export function fetchAbsensiDetail(id: number): Promise<Absensi> {
  return apiFetch<Absensi>(`/api/v1/absensi/${id}`);
}

export function createMobileAbsensi(formData: FormData): Promise<Absensi> {
  return apiFetch<Absensi>("/api/v1/mobile/absensi", {
    method: "POST",
    body: formData,
  });
}

export function verifyAbsensi(id: number, status: "approved" | "rejected", note: string): Promise<Absensi> {
  return apiFetch<Absensi>(`/api/v1/absensi/${id}/verify`, {
    method: "PATCH",
    body: JSON.stringify({ status, note }),
  });
}

export function unverifyAbsensi(id: number, note: string): Promise<Absensi> {
  return apiFetch<Absensi>(`/api/v1/absensi/${id}/unverify`, {
    method: "PATCH",
    body: JSON.stringify({ note }),
  });
}
