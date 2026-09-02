import { apiFetch } from "../../lib/api-client";
import type { AIAnalysis, AIAnalysisStats } from "./types";

export function fetchAIAnalyses(params?: {
  search?: string;
  source_channel?: string;
  risk_level?: string;
  status?: string;
  knmp_id?: number;
  assigned_user_id?: number;
}): Promise<AIAnalysis[]> {
  const query = new URLSearchParams();
  if (params?.search) query.append("search", params.search);
  if (params?.source_channel) query.append("source_channel", params.source_channel);
  if (params?.risk_level) query.append("risk_level", params.risk_level);
  if (params?.status) query.append("status", params.status);
  if (params?.knmp_id) query.append("knmp_id", String(params.knmp_id));
  if (params?.assigned_user_id) query.append("assigned_user_id", String(params.assigned_user_id));
  const suffix = query.toString() ? `?${query.toString()}` : "";
  return apiFetch<AIAnalysis[]>(`/api/v1/ai-analysis${suffix}`);
}

export function fetchAIAnalysisStats(): Promise<AIAnalysisStats> {
  return apiFetch<AIAnalysisStats>("/api/v1/ai-analysis/stats");
}

export function createAIAnalysis(data: FormData): Promise<AIAnalysis> {
  return apiFetch<AIAnalysis>("/api/v1/ai-analysis", {
    method: "POST",
    body: data,
  });
}

export function updateAIAnalysisStatus(id: number, status: AIAnalysis["status"]): Promise<AIAnalysis> {
  return apiFetch<AIAnalysis>(`/api/v1/ai-analysis/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export function deleteAIAnalysis(id: number): Promise<{ message: string }> {
  return apiFetch<{ message: string }>(`/api/v1/ai-analysis/${id}`, {
    method: "DELETE",
  });
}
