import { apiFetch } from "../../lib/api-client";
import type { WeeklyBOQControl, WeeklyBOQCreateInput, WeeklyBOQStats } from "./types";

export function fetchWeeklyBOQList(params?: {
  search?: string;
  status?: string;
  knmp_id?: string;
  start_date?: string;
  end_date?: string;
}): Promise<WeeklyBOQControl[]> {
  const query = new URLSearchParams();
  if (params?.search) query.append("search", params.search);
  if (params?.status) query.append("status", params.status);
  if (params?.knmp_id) query.append("knmp_id", params.knmp_id);
  if (params?.start_date) query.append("start_date", params.start_date);
  if (params?.end_date) query.append("end_date", params.end_date);
  const suffix = query.toString() ? `?${query.toString()}` : "";
  return apiFetch<WeeklyBOQControl[]>(`/api/v1/boq-weekly${suffix}`);
}

export function fetchWeeklyBOQStats(params?: {
  status?: string;
  knmp_id?: string;
  start_date?: string;
  end_date?: string;
}): Promise<WeeklyBOQStats> {
  const query = new URLSearchParams();
  if (params?.status) query.append("status", params.status);
  if (params?.knmp_id) query.append("knmp_id", params.knmp_id);
  if (params?.start_date) query.append("start_date", params.start_date);
  if (params?.end_date) query.append("end_date", params.end_date);
  const suffix = query.toString() ? `?${query.toString()}` : "";
  return apiFetch<WeeklyBOQStats>(`/api/v1/boq-weekly/stats${suffix}`);
}

export function fetchWeeklyBOQDetail(id: number): Promise<WeeklyBOQControl> {
  return apiFetch<WeeklyBOQControl>(`/api/v1/boq-weekly/${id}`);
}

export function createWeeklyBOQ(payload: WeeklyBOQCreateInput): Promise<WeeklyBOQControl> {
  return apiFetch<WeeklyBOQControl>("/api/v1/boq-weekly", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateWeeklyBOQStatus(id: number, status: string): Promise<WeeklyBOQControl> {
  return apiFetch<WeeklyBOQControl>(`/api/v1/boq-weekly/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export function deleteWeeklyBOQ(id: number): Promise<{ message: string }> {
  return apiFetch<{ message: string }>(`/api/v1/boq-weekly/${id}`, {
    method: "DELETE",
  });
}
