import { apiFetch } from "../../lib/api-client";
import type { Pembayaran, PembayaranSummary, TerminStats } from "./types";

export function fetchPembayaranList(persiapanKontrakId?: number): Promise<Pembayaran[]> {
  const query = persiapanKontrakId ? `?persiapan_kontrak_id=${persiapanKontrakId}` : "";
  return apiFetch<Pembayaran[]>(`/api/v1/pembayaran${query}`);
}

export function fetchPembayaranSummary(): Promise<PembayaranSummary> {
  return apiFetch<PembayaranSummary>("/api/v1/pembayaran/summary");
}

export function fetchTerminStats(): Promise<TerminStats[]> {
  return apiFetch<TerminStats[]>("/api/v1/pembayaran/termin");
}

export function createPembayaran(data: Partial<Pembayaran>): Promise<Pembayaran> {
  return apiFetch<Pembayaran>("/api/v1/pembayaran", {
    method: "POST",
    body: JSON.stringify(data),
  });
}
