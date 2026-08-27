import { apiFetch } from "../../lib/api-client";
import type { Issue } from "./types";

export function fetchIssueList(params?: { knmp_id?: number; tingkat?: string; status?: string }): Promise<Issue[]> {
  const query = new URLSearchParams();
  if (params?.knmp_id) query.append("knmp_id", params.knmp_id.toString());
  if (params?.tingkat) query.append("tingkat", params.tingkat);
  if (params?.status) query.append("status", params.status);
  const qStr = query.toString() ? `?${query.toString()}` : "";
  return apiFetch<Issue[]>(`/api/v1/issue${qStr}`);
}

export function fetchIssueDetail(id: number): Promise<Issue> {
  return apiFetch<Issue>(`/api/v1/issue/${id}`);
}

export function createMobileIssue(formData: FormData): Promise<Issue> {
  return apiFetch<Issue>("/api/v1/mobile/issue", {
    method: "POST",
    body: formData,
  });
}

export function verifyIssue(id: number, status: "approved" | "rejected", note: string): Promise<Issue> {
  return apiFetch<Issue>(`/api/v1/issue/${id}/verify`, {
    method: "PATCH",
    body: JSON.stringify({ status, note }),
  });
}

export function unverifyIssue(id: number, note: string): Promise<Issue> {
  return apiFetch<Issue>(`/api/v1/issue/${id}/unverify`, {
    method: "PATCH",
    body: JSON.stringify({ note }),
  });
}
