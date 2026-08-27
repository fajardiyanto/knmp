import { apiFetch } from "../../lib/api-client";
import type { Persiapan, PCM } from "./types";

export function fetchPersiapanList(jenis?: string, knmpId?: number): Promise<Persiapan[]> {
  const query = new URLSearchParams();
  if (jenis) query.append("jenis", jenis);
  if (knmpId) query.append("knmp_id", knmpId.toString());
  const qStr = query.toString() ? `?${query.toString()}` : "";
  return apiFetch<Persiapan[]>(`/api/v1/persiapan${qStr}`);
}

export function fetchPersiapanDetail(id: number): Promise<Persiapan> {
  return apiFetch<Persiapan>(`/api/v1/persiapan/${id}`);
}

export function createPersiapan(data: Partial<Persiapan>): Promise<Persiapan> {
  return apiFetch<Persiapan>("/api/v1/persiapan", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updatePersiapan(id: number, data: Partial<Persiapan>): Promise<Persiapan> {
  return apiFetch<Persiapan>(`/api/v1/persiapan/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function deletePersiapan(id: number): Promise<{ message: string }> {
  return apiFetch<{ message: string }>(`/api/v1/persiapan/${id}`, {
    method: "DELETE",
  });
}

export function fetchPCM(persiapanKontrakId: number): Promise<PCM> {
  return apiFetch<PCM>(`/api/v1/persiapan/${persiapanKontrakId}/pcm`);
}

export function savePCM(data: Partial<PCM>): Promise<PCM> {
  return apiFetch<PCM>("/api/v1/pcm", {
    method: "POST",
    body: JSON.stringify(data),
  });
}
