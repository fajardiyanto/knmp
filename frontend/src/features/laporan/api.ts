import { apiFetch } from "../../lib/api-client";
import type { Laporan } from "./types";

export function fetchLaporanList(params?: {
  pelaksanaan_id?: number;
  status?: string;
  jenis_laporan?: string;
  search?: string;
}): Promise<Laporan[]> {
  const query = new URLSearchParams();
  if (params?.pelaksanaan_id) query.append("pelaksanaan_id", params.pelaksanaan_id.toString());
  if (params?.status) query.append("status", params.status);
  if (params?.jenis_laporan) query.append("jenis_laporan", params.jenis_laporan);
  if (params?.search) query.append("search", params.search);
  const qStr = query.toString() ? `?${query.toString()}` : "";
  return apiFetch<Laporan[]>(`/api/v1/laporan${qStr}`);
}

export function fetchLaporanDetail(id: number): Promise<Laporan> {
  return apiFetch<Laporan>(`/api/v1/laporan/${id}`);
}

export function createLaporan(data: any): Promise<Laporan> {
  return apiFetch<Laporan>("/api/v1/laporan", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function createMobileLaporan(formData: FormData): Promise<Laporan> {
  return apiFetch<Laporan>("/api/v1/mobile/laporan", {
    method: "POST",
    body: formData,
  });
}

export function verifyLaporan(id: number, status: "approved" | "rejected", note: string): Promise<Laporan> {
  return apiFetch<Laporan>(`/api/v1/laporan/${id}/verify`, {
    method: "PATCH",
    body: JSON.stringify({ status, note }),
  });
}

export function unverifyLaporan(id: number, note: string): Promise<Laporan> {
  return apiFetch<Laporan>(`/api/v1/laporan/${id}/unverify`, {
    method: "PATCH",
    body: JSON.stringify({ note }),
  });
}

export function deleteLaporan(id: number): Promise<{ message: string }> {
  return apiFetch<{ message: string }>(`/api/v1/laporan/${id}`, {
    method: "DELETE",
  });
}

export function fetchMonthlyProjectReport(
  knmpId: number,
  params?: {
    laporan_id?: number;
    period_type?: string;
    date?: string;
    week?: number;
    month?: number;
    year?: number;
    start_date?: string;
    end_date?: string;
  }
) {
  const query = new URLSearchParams();
  if (knmpId > 0) {
    query.append("knmp_id", knmpId.toString());
  }
  if (params?.laporan_id) query.append("laporan_id", params.laporan_id.toString());
  if (params?.period_type) query.append("period_type", params.period_type);
  if (params?.date) query.append("date", params.date);
  if (params?.week) query.append("week", params.week.toString());
  if (params?.month) query.append("month", params.month.toString());
  if (params?.year) query.append("year", params.year.toString());
  if (params?.start_date) query.append("start_date", params.start_date);
  if (params?.end_date) query.append("end_date", params.end_date);

  return apiFetch<import("./types").MonthlyProjectReportData>(
    `/api/v1/laporan/monthly-project-report?${query.toString()}`
  );
}
