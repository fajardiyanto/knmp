export interface AIAnalysis {
  id: number;
  knmp_id?: number;
  assigned_user_id?: number;
  submitted_by?: number;
  source_channel: "web" | "telegram" | "whatsapp";
  source_sender?: string;
  model_provider: "rule_based" | "codex" | "deepseek" | "gemini" | "claude";
  title: string;
  summary: string;
  input_text?: string;
  extracted_text?: string;
  risk_level: "rendah" | "sedang" | "tinggi";
  risk_score: number;
  status: "perlu_review" | "ditindaklanjuti" | "selesai" | "diabaikan";
  findings: string[];
  recommendations: string[];
  metadata?: string;
  created_at: string;
  knmp_name?: string;
  assigned_user_name?: string;
  submitted_by_name?: string;
  documents?: Array<{
    id: number;
    file_name: string;
    file_url: string;
    category: string;
    status: string;
  }>;
}

export interface AIAnalysisStats {
  total: number;
  high_risk: number;
  medium_risk: number;
  low_risk: number;
  needs_review: number;
}
