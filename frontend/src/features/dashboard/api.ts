import { apiFetch } from "../../lib/api-client";
import type { DashboardStats } from "./types";
import type { Knmp } from "../knmp/types";

export function fetchDashboardWidget(): Promise<DashboardStats> {
  return apiFetch<DashboardStats>("/api/v1/knmp/widget");
}

export function fetchDashboardMap(): Promise<Knmp[]> {
  return apiFetch<Knmp[]>("/api/v1/knmp/map");
}
