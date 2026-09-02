package domain

import "time"

type AIAnalysis struct {
	ID              int64      `db:"id" json:"id"`
	KnmpID          *int64     `db:"knmp_id" json:"knmp_id,omitempty"`
	AssignedUserID  *int64     `db:"assigned_user_id" json:"assigned_user_id,omitempty"`
	SubmittedBy     *int64     `db:"submitted_by" json:"submitted_by,omitempty"`
	SourceChannel   string     `db:"source_channel" json:"source_channel"`
	SourceSender    *string    `db:"source_sender" json:"source_sender,omitempty"`
	ModelProvider   string     `db:"model_provider" json:"model_provider"`
	Title           string     `db:"title" json:"title"`
	Summary         string     `db:"summary" json:"summary"`
	InputText       *string    `db:"input_text" json:"input_text,omitempty"`
	ExtractedText   *string    `db:"extracted_text" json:"extracted_text,omitempty"`
	RiskLevel       string     `db:"risk_level" json:"risk_level"`
	RiskScore       int        `db:"risk_score" json:"risk_score"`
	Status          string     `db:"status" json:"status"`
	Findings        []string   `db:"findings" json:"findings"`
	Recommendations []string   `db:"recommendations" json:"recommendations"`
	Metadata        *string    `db:"metadata" json:"metadata,omitempty"`
	CreatedAt       time.Time  `db:"created_at" json:"created_at"`
	UpdatedAt       time.Time  `db:"updated_at" json:"updated_at"`
	DeletedAt       *time.Time `db:"deleted_at" json:"deleted_at,omitempty"`

	KnmpName         *string     `db:"knmp_name" json:"knmp_name,omitempty"`
	AssignedUserName *string     `db:"assigned_user_name" json:"assigned_user_name,omitempty"`
	SubmittedByName  *string     `db:"submitted_by_name" json:"submitted_by_name,omitempty"`
	Documents        []*Document `db:"-" json:"documents,omitempty"`
}

type AIAnalysisStats struct {
	Total       int `db:"total" json:"total"`
	HighRisk    int `db:"high_risk" json:"high_risk"`
	MediumRisk  int `db:"medium_risk" json:"medium_risk"`
	LowRisk     int `db:"low_risk" json:"low_risk"`
	NeedsReview int `db:"needs_review" json:"needs_review"`
}
