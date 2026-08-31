import { apiFetch } from "../../lib/api-client";
import type { Notulen, NotulenFilter, NotulenFormData, NotulenUser } from "./types/notulen.types";

export function fetchNotulenList(params?: NotulenFilter): Promise<Notulen[]> {
  const query = new URLSearchParams();
  if (params?.knmp_id) query.append("knmp_id", params.knmp_id.toString());
  if (params?.search) query.append("search", params.search);
  if (params?.tanggal_awal) query.append("tanggal_awal", params.tanggal_awal);
  if (params?.tanggal_akhir) query.append("tanggal_akhir", params.tanggal_akhir);
  if (params?.limit) query.append("limit", params.limit.toString());
  if (params?.offset) query.append("offset", params.offset.toString());

  const qStr = query.toString() ? `?${query.toString()}` : "";
  return apiFetch<Notulen[]>(`/api/v1/notulen${qStr}`);
}

export function fetchNotulenDetail(id: number): Promise<Notulen> {
  return apiFetch<Notulen>(`/api/v1/notulen/${id}`);
}

export function createNotulen(data: NotulenFormData): Promise<Notulen> {
  return apiFetch<Notulen>("/api/v1/notulen", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateNotulen(id: number, data: NotulenFormData): Promise<Notulen> {
  return apiFetch<Notulen>(`/api/v1/notulen/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function deleteNotulen(id: number): Promise<{ message: string }> {
  return apiFetch<{ message: string }>(`/api/v1/notulen/${id}`, {
    method: "DELETE",
  });
}

export function shareNotulen(id: number, userIds: number[]): Promise<{ message: string }> {
  return apiFetch<{ message: string }>(`/api/v1/notulen/${id}/share`, {
    method: "POST",
    body: JSON.stringify({ user_ids: userIds }),
  });
}

export function fetchUsersForShare(): Promise<NotulenUser[]> {
  return apiFetch<NotulenUser[]>("/api/v1/users/list");
}
