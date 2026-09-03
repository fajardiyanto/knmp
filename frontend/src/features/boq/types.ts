export interface WeeklyBOQItem {
  id: number;
  boq_control_id: number;
  item_code: string;
  item_name: string;
  contract_value: number;
  weight_pct: number;
  contract_volume: number;
  unit: string;
  plan_pct: number;
  last_week_actual_pct: number;
  contractor_claim_pct: number;
  supervisor_verified_pct: number;
  evidence_supported_pct: number;
  deviation_pct: number;
  actual_value: number;
  evidence_status: "complete" | "partial" | "missing" | string;
  risk_level: "rendah" | "sedang" | "kritis" | string;
  notes?: string;
}

export interface WeeklyBOQControl {
  id: number;
  knmp_id: number;
  week_start: string;
  week_end: string;
  title: string;
  source_document?: string;
  contractor_claim_pct: number;
  supervisor_verified_pct: number;
  evidence_supported_pct: number;
  audit_exposure_value: number;
  status: string;
  summary: string;
  manual_tables?: Record<string, unknown>;
  knmp_name?: string;
  regency_name?: string;
  province_name?: string;
  claim_vs_verified_gap: number;
  evidence_gap: number;
  items_total: number;
  items_with_evidence: number;
  critical_items: number;
  items?: WeeklyBOQItem[];
}

export interface WeeklyBOQStats {
  total_controls: number;
  open_controls: number;
  avg_claim_pct: number;
  avg_verified_pct: number;
  avg_evidence_pct: number;
  total_exposure_value: number;
  critical_items: number;
}

export type WeeklyBOQItemInput = Partial<Pick<
  WeeklyBOQItem,
  | "item_code"
  | "item_name"
  | "contract_value"
  | "weight_pct"
  | "contract_volume"
  | "unit"
  | "plan_pct"
  | "last_week_actual_pct"
  | "contractor_claim_pct"
  | "supervisor_verified_pct"
  | "evidence_supported_pct"
  | "deviation_pct"
  | "actual_value"
  | "evidence_status"
  | "risk_level"
  | "notes"
>>;

export interface WeeklyBOQCreateInput {
  knmp_id: number;
  week_start: string;
  week_end: string;
  title: string;
  source_document?: string;
  contractor_claim_pct: number;
  supervisor_verified_pct: number;
  evidence_supported_pct: number;
  audit_exposure_value: number;
  status: string;
  summary: string;
  manual_tables?: Record<string, unknown>;
  items: WeeklyBOQItemInput[];
}
