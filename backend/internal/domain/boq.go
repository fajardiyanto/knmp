package domain

import (
	"encoding/json"
	"time"
)

type WeeklyBOQControl struct {
	ID                    int64           `db:"id" json:"id"`
	KnmpID                int64           `db:"knmp_id" json:"knmp_id"`
	WeekStart             string          `db:"week_start" json:"week_start"`
	WeekEnd               string          `db:"week_end" json:"week_end"`
	Title                 string          `db:"title" json:"title"`
	SourceDocument        *string         `db:"source_document" json:"source_document,omitempty"`
	ContractorClaimPct    float64         `db:"contractor_claim_pct" json:"contractor_claim_pct"`
	SupervisorVerifiedPct float64         `db:"supervisor_verified_pct" json:"supervisor_verified_pct"`
	EvidenceSupportedPct  float64         `db:"evidence_supported_pct" json:"evidence_supported_pct"`
	AuditExposureValue    float64         `db:"audit_exposure_value" json:"audit_exposure_value"`
	Status                string          `db:"status" json:"status"`
	Summary               string          `db:"summary" json:"summary"`
	ManualTables          json.RawMessage `db:"manual_tables" json:"manual_tables,omitempty"`
	CreatedBy             *int64          `db:"created_by" json:"created_by,omitempty"`
	CreatedAt             time.Time       `db:"created_at" json:"created_at"`
	UpdatedAt             time.Time       `db:"updated_at" json:"updated_at"`
	DeletedAt             *time.Time      `db:"deleted_at" json:"deleted_at,omitempty"`

	KnmpName           *string          `db:"knmp_name" json:"knmp_name,omitempty"`
	RegencyName        *string          `db:"regency_name" json:"regency_name,omitempty"`
	ProvinceName       *string          `db:"province_name" json:"province_name,omitempty"`
	Items              []*WeeklyBOQItem `db:"-" json:"items,omitempty"`
	ClaimVsVerifiedGap float64          `db:"-" json:"claim_vs_verified_gap"`
	EvidenceGap        float64          `db:"-" json:"evidence_gap"`
	ItemsTotal         int              `db:"items_total" json:"items_total"`
	ItemsWithEvidence  int              `db:"items_with_evidence" json:"items_with_evidence"`
	CriticalItems      int              `db:"critical_items" json:"critical_items"`
}

type WeeklyBOQItem struct {
	ID                    int64      `db:"id" json:"id"`
	BOQControlID          int64      `db:"boq_control_id" json:"boq_control_id"`
	ItemCode              string     `db:"item_code" json:"item_code"`
	ItemName              string     `db:"item_name" json:"item_name"`
	ContractValue         float64    `db:"contract_value" json:"contract_value"`
	WeightPct             float64    `db:"weight_pct" json:"weight_pct"`
	ContractVolume        float64    `db:"contract_volume" json:"contract_volume"`
	Unit                  string     `db:"unit" json:"unit"`
	PlanPct               float64    `db:"plan_pct" json:"plan_pct"`
	LastWeekActualPct     float64    `db:"last_week_actual_pct" json:"last_week_actual_pct"`
	ContractorClaimPct    float64    `db:"contractor_claim_pct" json:"contractor_claim_pct"`
	SupervisorVerifiedPct float64    `db:"supervisor_verified_pct" json:"supervisor_verified_pct"`
	EvidenceSupportedPct  float64    `db:"evidence_supported_pct" json:"evidence_supported_pct"`
	DeviationPct          float64    `db:"deviation_pct" json:"deviation_pct"`
	ActualValue           float64    `db:"actual_value" json:"actual_value"`
	EvidenceStatus        string     `db:"evidence_status" json:"evidence_status"`
	RiskLevel             string     `db:"risk_level" json:"risk_level"`
	Notes                 *string    `db:"notes" json:"notes,omitempty"`
	CreatedAt             time.Time  `db:"created_at" json:"created_at"`
	UpdatedAt             time.Time  `db:"updated_at" json:"updated_at"`
	DeletedAt             *time.Time `db:"deleted_at" json:"deleted_at,omitempty"`
}

type WeeklyBOQStats struct {
	TotalControls      int     `db:"total_controls" json:"total_controls"`
	OpenControls       int     `db:"open_controls" json:"open_controls"`
	AvgClaimPct        float64 `db:"avg_claim_pct" json:"avg_claim_pct"`
	AvgVerifiedPct     float64 `db:"avg_verified_pct" json:"avg_verified_pct"`
	AvgEvidencePct     float64 `db:"avg_evidence_pct" json:"avg_evidence_pct"`
	TotalExposureValue float64 `db:"total_exposure_value" json:"total_exposure_value"`
	CriticalItems      int     `db:"critical_items" json:"critical_items"`
}
