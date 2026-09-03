package postgres

import (
	"context"
	"database/sql"
	"errors"
	"fmt"

	"github.com/jmoiron/sqlx"
	"github.com/lib/pq"
	"knmp-v2-backend/internal/domain"
	"knmp-v2-backend/internal/repository"
)

type weeklyBOQRepo struct {
	db *sqlx.DB
}

func NewWeeklyBOQRepo(db *sqlx.DB) repository.WeeklyBOQRepository {
	return &weeklyBOQRepo{db: db}
}

func (r *weeklyBOQRepo) baseSelect() string {
	return `
		SELECT b.id, b.knmp_id, CAST(b.week_start AS TEXT) AS week_start, CAST(b.week_end AS TEXT) AS week_end,
		       b.title, b.source_document, b.contractor_claim_pct, b.supervisor_verified_pct,
		       b.evidence_supported_pct, b.audit_exposure_value, b.status, b.summary,
		       COALESCE(b.manual_tables, '{}'::jsonb) AS manual_tables,
		       b.created_by, b.created_at, b.updated_at, b.deleted_at,
		       COALESCE(k.name, '-') AS knmp_name,
		       COALESCE(reg.name, '') AS regency_name,
		       COALESCE(prov.name, '') AS province_name,
		       COUNT(i.id) AS items_total,
		       COUNT(i.id) FILTER (WHERE i.evidence_status = 'complete') AS items_with_evidence,
		       COUNT(i.id) FILTER (WHERE i.risk_level = 'kritis') AS critical_items
		FROM weekly_boq_controls b
		LEFT JOIN knmps k ON k.id = b.knmp_id
		LEFT JOIN regencies reg ON reg.id = k.regency_id
		LEFT JOIN provinces prov ON prov.id = k.province_id
		LEFT JOIN weekly_boq_items i ON i.boq_control_id = b.id AND i.deleted_at IS NULL
		WHERE b.deleted_at IS NULL
	`
}

func (r *weeklyBOQRepo) appendFilters(query string, args []any, argIdx int, filter repository.WeeklyBOQFilter) (string, []any, int) {
	if filter.KnmpID != nil {
		query += fmt.Sprintf(" AND b.knmp_id = $%d", argIdx)
		args = append(args, *filter.KnmpID)
		argIdx++
	}
	if len(filter.UserKnmpIDs) > 0 {
		query += fmt.Sprintf(" AND b.knmp_id = ANY($%d)", argIdx)
		args = append(args, pq.Array(filter.UserKnmpIDs))
		argIdx++
	}
	if filter.Status != "" {
		query += fmt.Sprintf(" AND b.status = $%d", argIdx)
		args = append(args, filter.Status)
		argIdx++
	}
	if filter.StartDate != "" {
		query += fmt.Sprintf(" AND b.week_end >= $%d", argIdx)
		args = append(args, filter.StartDate)
		argIdx++
	}
	if filter.EndDate != "" {
		query += fmt.Sprintf(" AND b.week_start <= $%d", argIdx)
		args = append(args, filter.EndDate)
		argIdx++
	}
	if filter.Search != "" {
		query += fmt.Sprintf(" AND (b.title ILIKE $%d OR k.name ILIKE $%d OR b.summary ILIKE $%d)", argIdx, argIdx, argIdx)
		args = append(args, "%"+filter.Search+"%")
		argIdx++
	}
	return query, args, argIdx
}

func (r *weeklyBOQRepo) GetByID(ctx context.Context, id int64) (*domain.WeeklyBOQControl, error) {
	var control domain.WeeklyBOQControl
	query := r.baseSelect() + `
		AND b.id = $1
		GROUP BY b.id, k.name, reg.name, prov.name
	`
	if err := r.db.GetContext(ctx, &control, query, id); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil
		}
		return nil, fmt.Errorf("get weekly boq: %w", err)
	}
	items, err := r.listItems(ctx, control.ID)
	if err != nil {
		return nil, err
	}
	control.Items = items
	deriveBOQGaps(&control)
	return &control, nil
}

func (r *weeklyBOQRepo) List(ctx context.Context, filter repository.WeeklyBOQFilter) ([]*domain.WeeklyBOQControl, error) {
	results := make([]*domain.WeeklyBOQControl, 0)
	query := r.baseSelect()
	var args []any
	query, args, _ = r.appendFilters(query, args, 1, filter)
	query += `
		GROUP BY b.id, k.name, reg.name, prov.name
		ORDER BY b.week_end DESC, b.id DESC
	`
	if err := r.db.SelectContext(ctx, &results, query, args...); err != nil {
		return nil, fmt.Errorf("list weekly boq: %w", err)
	}
	for _, control := range results {
		deriveBOQGaps(control)
	}
	return results, nil
}

func (r *weeklyBOQRepo) Create(ctx context.Context, control *domain.WeeklyBOQControl, items []*domain.WeeklyBOQItem) error {
	tx, err := r.db.BeginTxx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()
	manualTables := string(control.ManualTables)
	if manualTables == "" {
		manualTables = "{}"
	}

	query := `
		INSERT INTO weekly_boq_controls (
			knmp_id, week_start, week_end, title, source_document, contractor_claim_pct,
			supervisor_verified_pct, evidence_supported_pct, audit_exposure_value,
			status, summary, manual_tables, created_by, created_at, updated_at
		)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, COALESCE($12::jsonb, '{}'::jsonb), $13, NOW(), NOW())
		RETURNING id, created_at, updated_at
	`
	if err := tx.QueryRowContext(ctx, query,
		control.KnmpID, control.WeekStart, control.WeekEnd, control.Title, control.SourceDocument,
		control.ContractorClaimPct, control.SupervisorVerifiedPct, control.EvidenceSupportedPct,
		control.AuditExposureValue, control.Status, control.Summary, manualTables, control.CreatedBy,
	).Scan(&control.ID, &control.CreatedAt, &control.UpdatedAt); err != nil {
		return fmt.Errorf("create weekly boq control: %w", err)
	}

	for _, item := range items {
		item.BOQControlID = control.ID
		if err := insertWeeklyBOQItem(ctx, tx, item); err != nil {
			return err
		}
	}
	return tx.Commit()
}

func insertWeeklyBOQItem(ctx context.Context, tx *sqlx.Tx, item *domain.WeeklyBOQItem) error {
	query := `
		INSERT INTO weekly_boq_items (
			boq_control_id, item_code, item_name, contract_value, weight_pct, contract_volume, unit,
			plan_pct, last_week_actual_pct, contractor_claim_pct, supervisor_verified_pct,
			evidence_supported_pct, deviation_pct, actual_value, evidence_status, risk_level,
			notes, created_at, updated_at
		)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, NOW(), NOW())
		RETURNING id, created_at, updated_at
	`
	return tx.QueryRowContext(ctx, query,
		item.BOQControlID, item.ItemCode, item.ItemName, item.ContractValue, item.WeightPct,
		item.ContractVolume, item.Unit, item.PlanPct, item.LastWeekActualPct, item.ContractorClaimPct,
		item.SupervisorVerifiedPct, item.EvidenceSupportedPct, item.DeviationPct, item.ActualValue,
		item.EvidenceStatus, item.RiskLevel, item.Notes,
	).Scan(&item.ID, &item.CreatedAt, &item.UpdatedAt)
}

func (r *weeklyBOQRepo) UpdateStatus(ctx context.Context, id int64, status string) error {
	_, err := r.db.ExecContext(ctx, `UPDATE weekly_boq_controls SET status = $1, updated_at = NOW() WHERE id = $2 AND deleted_at IS NULL`, status, id)
	return err
}

func (r *weeklyBOQRepo) Delete(ctx context.Context, id int64) error {
	tx, err := r.db.BeginTxx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()

	if _, err := tx.ExecContext(ctx, `UPDATE weekly_boq_items SET deleted_at = NOW(), updated_at = NOW() WHERE boq_control_id = $1 AND deleted_at IS NULL`, id); err != nil {
		return fmt.Errorf("delete weekly boq items: %w", err)
	}
	if _, err := tx.ExecContext(ctx, `UPDATE weekly_boq_controls SET deleted_at = NOW(), updated_at = NOW() WHERE id = $1 AND deleted_at IS NULL`, id); err != nil {
		return fmt.Errorf("delete weekly boq control: %w", err)
	}
	return tx.Commit()
}

func (r *weeklyBOQRepo) GetStats(ctx context.Context, filter repository.WeeklyBOQFilter) (*domain.WeeklyBOQStats, error) {
	stats := &domain.WeeklyBOQStats{}
	query := `
		SELECT COUNT(*) AS total_controls,
		       COUNT(*) FILTER (WHERE b.status <> 'closed') AS open_controls,
		       COALESCE(AVG(b.contractor_claim_pct), 0) AS avg_claim_pct,
		       COALESCE(AVG(b.supervisor_verified_pct), 0) AS avg_verified_pct,
		       COALESCE(AVG(b.evidence_supported_pct), 0) AS avg_evidence_pct,
		       COALESCE(SUM(b.audit_exposure_value), 0) AS total_exposure_value,
		       COALESCE(SUM(item_counts.critical_items), 0) AS critical_items
		FROM weekly_boq_controls b
		LEFT JOIN knmps k ON k.id = b.knmp_id
		LEFT JOIN (
			SELECT boq_control_id, COUNT(*) FILTER (WHERE risk_level = 'kritis' AND deleted_at IS NULL) AS critical_items
			FROM weekly_boq_items
			GROUP BY boq_control_id
		) item_counts ON item_counts.boq_control_id = b.id
		WHERE b.deleted_at IS NULL
	`
	var args []any
	query, args, _ = r.appendFilters(query, args, 1, filter)
	if err := r.db.GetContext(ctx, stats, query, args...); err != nil {
		return nil, fmt.Errorf("weekly boq stats: %w", err)
	}
	return stats, nil
}

func (r *weeklyBOQRepo) listItems(ctx context.Context, controlID int64) ([]*domain.WeeklyBOQItem, error) {
	items := make([]*domain.WeeklyBOQItem, 0)
	query := `
		SELECT id, boq_control_id, item_code, item_name, contract_value, weight_pct,
		       contract_volume, unit, plan_pct, last_week_actual_pct, contractor_claim_pct,
		       supervisor_verified_pct, evidence_supported_pct, deviation_pct, actual_value,
		       evidence_status, risk_level, notes, created_at, updated_at, deleted_at
		FROM weekly_boq_items
		WHERE boq_control_id = $1 AND deleted_at IS NULL
		ORDER BY id ASC
	`
	if err := r.db.SelectContext(ctx, &items, query, controlID); err != nil {
		return nil, fmt.Errorf("list weekly boq items: %w", err)
	}
	return items, nil
}

func deriveBOQGaps(control *domain.WeeklyBOQControl) {
	control.ClaimVsVerifiedGap = control.ContractorClaimPct - control.SupervisorVerifiedPct
	control.EvidenceGap = control.SupervisorVerifiedPct - control.EvidenceSupportedPct
}
