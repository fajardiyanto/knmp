package postgres

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"strings"

	"github.com/jmoiron/sqlx"
	"github.com/lib/pq"
	"knmp-v2-backend/internal/domain"
	"knmp-v2-backend/internal/repository"
)

type aiAnalysisRepo struct {
	db *sqlx.DB
}

func NewAIAnalysisRepo(db *sqlx.DB) repository.AIAnalysisRepository {
	return &aiAnalysisRepo{db: db}
}

type aiAnalysisRow struct {
	domain.AIAnalysis
	FindingsJSON        []byte `db:"findings"`
	RecommendationsJSON []byte `db:"recommendations"`
}

func (r aiAnalysisRow) toDomain() *domain.AIAnalysis {
	item := r.AIAnalysis
	_ = json.Unmarshal(r.FindingsJSON, &item.Findings)
	_ = json.Unmarshal(r.RecommendationsJSON, &item.Recommendations)
	if item.Findings == nil {
		item.Findings = []string{}
	}
	if item.Recommendations == nil {
		item.Recommendations = []string{}
	}
	return &item
}

func (r *aiAnalysisRepo) GetByID(ctx context.Context, id int64) (*domain.AIAnalysis, error) {
	var row aiAnalysisRow
	err := r.db.GetContext(ctx, &row, `
		SELECT a.id, a.knmp_id, a.assigned_user_id, a.submitted_by, a.source_channel,
		       a.source_sender, a.model_provider, a.title, a.summary, a.input_text, a.extracted_text, a.risk_level,
		       a.risk_score, a.status, a.findings, a.recommendations, a.metadata::text AS metadata,
		       a.created_at, a.updated_at, a.deleted_at,
		       k.name AS knmp_name,
		       au.name AS assigned_user_name,
		       su.name AS submitted_by_name
		FROM ai_analyses a
		LEFT JOIN knmps k ON a.knmp_id = k.id
		LEFT JOIN users au ON a.assigned_user_id = au.id
		LEFT JOIN users su ON a.submitted_by = su.id
		WHERE a.id = $1 AND a.deleted_at IS NULL
	`, id)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil
		}
		return nil, fmt.Errorf("get ai analysis by id: %w", err)
	}
	return row.toDomain(), nil
}

func (r *aiAnalysisRepo) List(ctx context.Context, filter repository.AIAnalysisFilter) ([]*domain.AIAnalysis, error) {
	rows := make([]aiAnalysisRow, 0)
	query := `
		SELECT a.id, a.knmp_id, a.assigned_user_id, a.submitted_by, a.source_channel,
		       a.source_sender, a.model_provider, a.title, a.summary, a.input_text, a.extracted_text, a.risk_level,
		       a.risk_score, a.status, a.findings, a.recommendations, a.metadata::text AS metadata,
		       a.created_at, a.updated_at, a.deleted_at,
		       k.name AS knmp_name,
		       au.name AS assigned_user_name,
		       su.name AS submitted_by_name
		FROM ai_analyses a
		LEFT JOIN knmps k ON a.knmp_id = k.id
		LEFT JOIN users au ON a.assigned_user_id = au.id
		LEFT JOIN users su ON a.submitted_by = su.id
		WHERE a.deleted_at IS NULL
	`
	args := []any{}
	argIdx := 1

	if len(filter.UserKnmpIDs) > 0 {
		query += fmt.Sprintf(" AND (a.knmp_id = ANY($%d) OR a.knmp_id IS NULL)", argIdx)
		args = append(args, pq.Array(filter.UserKnmpIDs))
		argIdx++
	}
	if filter.Search != "" {
		query += fmt.Sprintf(" AND (a.title ILIKE $%d OR a.input_text ILIKE $%d OR a.extracted_text ILIKE $%d OR k.name ILIKE $%d)", argIdx, argIdx, argIdx, argIdx)
		args = append(args, "%"+filter.Search+"%")
		argIdx++
	}
	if filter.SourceChannel != "" {
		query += fmt.Sprintf(" AND a.source_channel = $%d", argIdx)
		args = append(args, filter.SourceChannel)
		argIdx++
	}
	if filter.RiskLevel != "" {
		query += fmt.Sprintf(" AND a.risk_level = $%d", argIdx)
		args = append(args, filter.RiskLevel)
		argIdx++
	}
	if filter.Status != "" {
		query += fmt.Sprintf(" AND a.status = $%d", argIdx)
		args = append(args, filter.Status)
		argIdx++
	}
	if filter.KnmpID != nil {
		query += fmt.Sprintf(" AND a.knmp_id = $%d", argIdx)
		args = append(args, *filter.KnmpID)
		argIdx++
	}
	if filter.AssignedUserID != nil {
		query += fmt.Sprintf(" AND a.assigned_user_id = $%d", argIdx)
		args = append(args, *filter.AssignedUserID)
		argIdx++
	}

	limit := filter.Limit
	if limit <= 0 || limit > 100 {
		limit = 50
	}
	query += fmt.Sprintf(" ORDER BY a.created_at DESC, a.id DESC LIMIT $%d", argIdx)
	args = append(args, limit)

	if err := r.db.SelectContext(ctx, &rows, query, args...); err != nil {
		return nil, err
	}

	results := make([]*domain.AIAnalysis, 0, len(rows))
	for _, row := range rows {
		results = append(results, row.toDomain())
	}
	return results, nil
}

func (r *aiAnalysisRepo) Create(ctx context.Context, analysis *domain.AIAnalysis) error {
	findings, _ := json.Marshal(analysis.Findings)
	recommendations, _ := json.Marshal(analysis.Recommendations)
	query := `
		INSERT INTO ai_analyses (
			knmp_id, assigned_user_id, submitted_by, source_channel, source_sender, model_provider,
			title, summary, input_text, extracted_text, risk_level, risk_score, status,
			findings, recommendations, metadata, created_at, updated_at
		)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14::jsonb, $15::jsonb, $16::jsonb, NOW(), NOW())
		RETURNING id, created_at, updated_at
	`
	return r.db.QueryRowContext(ctx, query,
		analysis.KnmpID,
		analysis.AssignedUserID,
		analysis.SubmittedBy,
		analysis.SourceChannel,
		analysis.SourceSender,
		analysis.ModelProvider,
		analysis.Title,
		analysis.Summary,
		analysis.InputText,
		analysis.ExtractedText,
		analysis.RiskLevel,
		analysis.RiskScore,
		analysis.Status,
		string(findings),
		string(recommendations),
		analysis.Metadata,
	).Scan(&analysis.ID, &analysis.CreatedAt, &analysis.UpdatedAt)
}

func (r *aiAnalysisRepo) UpdateStatus(ctx context.Context, id int64, status string) error {
	_, err := r.db.ExecContext(ctx, `
		UPDATE ai_analyses
		SET status = $1, updated_at = NOW()
		WHERE id = $2 AND deleted_at IS NULL
	`, status, id)
	return err
}

func (r *aiAnalysisRepo) Delete(ctx context.Context, id int64) error {
	_, err := r.db.ExecContext(ctx, `UPDATE ai_analyses SET deleted_at = NOW(), updated_at = NOW() WHERE id = $1`, id)
	return err
}

func (r *aiAnalysisRepo) GetStats(ctx context.Context, userKnmpIDs []int64) (*domain.AIAnalysisStats, error) {
	stats := &domain.AIAnalysisStats{}
	query := `
		SELECT
			COUNT(*) AS total,
			COUNT(*) FILTER (WHERE risk_level = 'tinggi') AS high_risk,
			COUNT(*) FILTER (WHERE risk_level = 'sedang') AS medium_risk,
			COUNT(*) FILTER (WHERE risk_level = 'rendah') AS low_risk,
			COUNT(*) FILTER (WHERE status = 'perlu_review') AS needs_review
		FROM ai_analyses
		WHERE deleted_at IS NULL
	`
	args := []any{}
	if len(userKnmpIDs) > 0 {
		query += " AND (knmp_id = ANY($1) OR knmp_id IS NULL)"
		args = append(args, pq.Array(userKnmpIDs))
	}
	err := r.db.GetContext(ctx, stats, query, args...)
	return stats, err
}

func (r *aiAnalysisRepo) UserCanAccessKNMP(ctx context.Context, userID, knmpID int64) (bool, error) {
	var ok bool
	err := r.db.GetContext(ctx, &ok, `SELECT EXISTS(SELECT 1 FROM user_knmps WHERE user_id = $1 AND knmp_id = $2)`, userID, knmpID)
	return ok, err
}

func (r *aiAnalysisRepo) DetectKNMPFromText(ctx context.Context, text string, userKnmpIDs []int64) (*int64, error) {
	type candidate struct {
		ID   int64  `db:"id"`
		Name string `db:"name"`
	}

	candidates := []candidate{}
	query := `SELECT id, name FROM knmps WHERE status = 'aktif'`
	args := []any{}
	if len(userKnmpIDs) > 0 {
		query += " AND id = ANY($1)"
		args = append(args, pq.Array(userKnmpIDs))
	}
	query += " ORDER BY LENGTH(name) DESC, id ASC"

	if err := r.db.SelectContext(ctx, &candidates, query, args...); err != nil {
		return nil, err
	}

	normalizedText := normalizeKNMPText(text)
	for _, item := range candidates {
		name := normalizeKNMPText(item.Name)
		if name != "" && strings.Contains(normalizedText, name) {
			id := item.ID
			return &id, nil
		}

		shortName := strings.TrimSpace(strings.TrimPrefix(name, "knmp "))
		if shortName != "" && strings.Contains(normalizedText, shortName) {
			id := item.ID
			return &id, nil
		}
	}

	return nil, nil
}

func normalizeKNMPText(value string) string {
	value = strings.ToLower(value)
	replacer := strings.NewReplacer(".", " ", ",", " ", "-", " ", "_", " ", "/", " ", "(", " ", ")", " ")
	value = replacer.Replace(value)
	return strings.Join(strings.Fields(value), " ")
}
