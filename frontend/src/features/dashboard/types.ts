import type { Knmp } from "../knmp/types";

export interface DashboardStats {
  total_knmps: number;
  total_existing: number;
  total_baru: number;
  total_active_issues: number;
  total_reports: number;
}

export interface MapPoint extends Knmp {}
