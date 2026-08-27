package postgres

import (
	"context"
	"database/sql"
	"errors"
	"fmt"

	"github.com/jmoiron/sqlx"
	"knmp-v2-backend/internal/domain"
	"knmp-v2-backend/internal/repository"
)

// --- DOCUMENT REPOSITORY ---

type docRepo struct {
	db *sqlx.DB
}

func NewDocumentRepo(db *sqlx.DB) repository.DocumentRepository {
	return &docRepo{db: db}
}

func (r *docRepo) GetByID(ctx context.Context, id int64) (*domain.Document, error) {
	var doc domain.Document
	query := `
		SELECT id, documentable_type, documentable_id, file_name, file_path,
		       file_type, category, version, status, note, uploaded_at, verified_at,
		       uploaded_by, verified_by, created_at, updated_at, deleted_at
		FROM documents
		WHERE id = $1 AND deleted_at IS NULL
	`
	err := r.db.GetContext(ctx, &doc, query, id)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil
		}
		return nil, fmt.Errorf("get document by id: %w", err)
	}
	return &doc, nil
}

func (r *docRepo) ListByEntity(ctx context.Context, docType string, docID int64) ([]*domain.Document, error) {
	var docs []*domain.Document
	query := `
		SELECT id, documentable_type, documentable_id, file_name, file_path,
		       file_type, category, version, status, note, uploaded_at, verified_at,
		       uploaded_by, verified_by, created_at, updated_at, deleted_at
		FROM documents
		WHERE documentable_type = $1 AND documentable_id = $2 AND deleted_at IS NULL
		ORDER BY id ASC
	`
	err := r.db.SelectContext(ctx, &docs, query, docType, docID)
	return docs, err
}

func (r *docRepo) ListByEntityAndCategory(ctx context.Context, docType string, docID int64, category string) ([]*domain.Document, error) {
	var docs []*domain.Document
	query := `
		SELECT id, documentable_type, documentable_id, file_name, file_path,
		       file_type, category, version, status, note, uploaded_at, verified_at,
		       uploaded_by, verified_by, created_at, updated_at, deleted_at
		FROM documents
		WHERE documentable_type = $1 AND documentable_id = $2 AND category = $3 AND deleted_at IS NULL
		ORDER BY id ASC
	`
	err := r.db.SelectContext(ctx, &docs, query, docType, docID, category)
	return docs, err
}

func (r *docRepo) Create(ctx context.Context, doc *domain.Document) error {
	query := `
		INSERT INTO documents (documentable_type, documentable_id, file_name, file_path, file_type, category, version, status, note, uploaded_at, uploaded_by, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), $10, NOW(), NOW())
		RETURNING id, uploaded_at, created_at, updated_at
	`
	if doc.Version == "" {
		doc.Version = "1.0"
	}
	if doc.Status == "" {
		doc.Status = "pending"
	}
	return r.db.QueryRowContext(ctx, query,
		doc.DocumentableType, doc.DocumentableID, doc.FileName, doc.FilePath,
		doc.FileType, doc.Category, doc.Version, doc.Status, doc.Note, doc.UploadedBy,
	).Scan(&doc.ID, &doc.UploadedAt, &doc.CreatedAt, &doc.UpdatedAt)
}

func (r *docRepo) Update(ctx context.Context, doc *domain.Document) error {
	query := `
		UPDATE documents
		SET file_name = $1, file_path = $2, file_type = $3, category = $4,
		    version = $5, status = $6, note = $7, updated_at = NOW()
		WHERE id = $8 AND deleted_at IS NULL
	`
	_, err := r.db.ExecContext(ctx, query,
		doc.FileName, doc.FilePath, doc.FileType, doc.Category,
		doc.Version, doc.Status, doc.Note, doc.ID,
	)
	return err
}

func (r *docRepo) Delete(ctx context.Context, id int64) error {
	_, err := r.db.ExecContext(ctx, `UPDATE documents SET deleted_at = NOW() WHERE id = $1`, id)
	return err
}

func (r *docRepo) Verify(ctx context.Context, id int64, status string, note *string, verifiedBy int64) error {
	query := `
		UPDATE documents
		SET status = $1, note = $2, verified_by = $3, verified_at = NOW(), updated_at = NOW()
		WHERE id = $4 AND deleted_at IS NULL
	`
	_, err := r.db.ExecContext(ctx, query, status, note, verifiedBy, id)
	return err
}

// --- VERIFICATION REPOSITORY ---

type verifRepo struct {
	db *sqlx.DB
}

func NewVerificationRepo(db *sqlx.DB) repository.VerificationRepository {
	return &verifRepo{db: db}
}

func (r *verifRepo) GetLatestVerification(ctx context.Context, verifiableType string, verifiableID int64, step string) (*domain.Verification, error) {
	var v domain.Verification
	query := `
		SELECT v.id, v.verifiable_type, v.verifiable_id, v.step, v.status, v.note,
		       v.verified_by, v.verified_at, v.is_current, v.superseded_at, v.created_at, v.updated_at, v.deleted_at,
		       u.name as verifier_name
		FROM verifications v
		LEFT JOIN users u ON v.verified_by = u.id
		WHERE v.verifiable_type = $1 AND v.verifiable_id = $2 AND v.step = $3 AND v.is_current = true AND v.deleted_at IS NULL
		ORDER BY v.id DESC LIMIT 1
	`
	err := r.db.GetContext(ctx, &v, query, verifiableType, verifiableID, step)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}
	return &v, nil
}

func (r *verifRepo) ListVerifications(ctx context.Context, verifiableType string, verifiableID int64) ([]*domain.Verification, error) {
	var results []*domain.Verification
	query := `
		SELECT v.id, v.verifiable_type, v.verifiable_id, v.step, v.status, v.note,
		       v.verified_by, v.verified_at, v.is_current, v.superseded_at, v.created_at, v.updated_at, v.deleted_at,
		       u.name as verifier_name
		FROM verifications v
		LEFT JOIN users u ON v.verified_by = u.id
		WHERE v.verifiable_type = $1 AND v.verifiable_id = $2 AND v.deleted_at IS NULL
		ORDER BY v.id DESC
	`
	err := r.db.SelectContext(ctx, &results, query, verifiableType, verifiableID)
	return results, err
}

func (r *verifRepo) CreateVerification(ctx context.Context, v *domain.Verification) error {
	// If marking as current, supersede old active verifications for same step
	if v.IsCurrent {
		_, _ = r.db.ExecContext(ctx, `
			UPDATE verifications
			SET is_current = false, superseded_at = NOW(), updated_at = NOW()
			WHERE verifiable_type = $1 AND verifiable_id = $2 AND step = $3 AND is_current = true
		`, v.VerifiableType, v.VerifiableID, v.Step)
	}

	query := `
		INSERT INTO verifications (verifiable_type, verifiable_id, step, status, note, verified_by, verified_at, is_current, superseded_at, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, NOW(), $7, $8, NOW(), NOW())
		RETURNING id, verified_at, created_at, updated_at
	`
	return r.db.QueryRowContext(ctx, query,
		v.VerifiableType, v.VerifiableID, v.Step, v.Status, v.Note, v.VerifiedBy, v.IsCurrent, v.SupersededAt,
	).Scan(&v.ID, &v.VerifiedAt, &v.CreatedAt, &v.UpdatedAt)
}

func (r *verifRepo) SupersedeActiveVerifications(ctx context.Context, verifiableType string, verifiableID int64) error {
	query := `
		UPDATE verifications
		SET is_current = false, superseded_at = NOW(), updated_at = NOW()
		WHERE verifiable_type = $1 AND verifiable_id = $2 AND is_current = true
	`
	_, err := r.db.ExecContext(ctx, query, verifiableType, verifiableID)
	return err
}
