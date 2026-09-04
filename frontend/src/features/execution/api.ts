import { apiFetch } from "../../lib/api-client";
import type { Pelaksanaan } from "./types";

export function fetchPelaksanaanList(knmpId?: number): Promise<Pelaksanaan[]> {
  const query = knmpId ? `?knmp_id=${knmpId}` : "";
  return apiFetch<Pelaksanaan[]>(`/api/v1/pelaksanaan${query}`);
}

export function fetchPelaksanaanDetail(id: number): Promise<Pelaksanaan> {
  return apiFetch<Pelaksanaan>(`/api/v1/pelaksanaan/${id}`);
}

export function createPelaksanaan(data: Partial<Pelaksanaan>): Promise<Pelaksanaan> {
  return apiFetch<Pelaksanaan>("/api/v1/pelaksanaan", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updatePelaksanaan(id: number, data: Partial<Pelaksanaan>): Promise<Pelaksanaan> {
  return apiFetch<Pelaksanaan>(`/api/v1/pelaksanaan/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function deletePelaksanaan(id: number): Promise<{ message: string }> {
  return apiFetch<{ message: string }>(`/api/v1/pelaksanaan/${id}`, {
    method: "DELETE",
  });
}
