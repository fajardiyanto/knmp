package service

import (
	"context"
	"testing"
	"time"

	"knmp-v2-backend/internal/domain"
)

type mockNotulenRepo struct {
	notulens []*domain.Notulen
	shares   map[int64][]int64 // notulenID -> []userID
}

func (m *mockNotulenRepo) GetByID(ctx context.Context, id int64) (*domain.Notulen, error) {
	for _, n := range m.notulens {
		if n.ID == id {
			n.SharedUserIDs = m.shares[id]
			return n, nil
		}
	}
	return nil, nil
}

func (m *mockNotulenRepo) List(ctx context.Context, filter domain.NotulenFilter) ([]*domain.Notulen, error) {
	var res []*domain.Notulen
	isGlobal := domain.IsAdminRole(filter.UserRole)

	for _, n := range m.notulens {
		if isGlobal {
			res = append(res, n)
		} else {
			// Check if user is creator or in shared list
			isShared := false
			for _, uid := range m.shares[n.ID] {
				if uid == filter.UserID {
					isShared = true
					break
				}
			}
			if (n.CreatedBy != nil && *n.CreatedBy == filter.UserID) || isShared {
				res = append(res, n)
			}
		}
	}
	return res, nil
}

func (m *mockNotulenRepo) Create(ctx context.Context, n *domain.Notulen, sharedUserIDs []int64) error {
	n.ID = int64(len(m.notulens) + 1)
	m.notulens = append(m.notulens, n)
	if m.shares == nil {
		m.shares = make(map[int64][]int64)
	}
	m.shares[n.ID] = sharedUserIDs
	n.SharedUserIDs = sharedUserIDs
	return nil
}

func (m *mockNotulenRepo) Update(ctx context.Context, n *domain.Notulen, sharedUserIDs []int64) error {
	for i, item := range m.notulens {
		if item.ID == n.ID {
			m.notulens[i] = n
			if sharedUserIDs != nil {
				m.shares[n.ID] = sharedUserIDs
				n.SharedUserIDs = sharedUserIDs
			}
			return nil
		}
	}
	return nil
}

func (m *mockNotulenRepo) Delete(ctx context.Context, id int64) error {
	var filtered []*domain.Notulen
	for _, item := range m.notulens {
		if item.ID != id {
			filtered = append(filtered, item)
		}
	}
	m.notulens = filtered
	delete(m.shares, id)
	return nil
}

func (m *mockNotulenRepo) ShareToUsers(ctx context.Context, notulenID int64, userIDs []int64) error {
	if m.shares == nil {
		m.shares = make(map[int64][]int64)
	}
	existing := m.shares[notulenID]
	for _, uid := range userIDs {
		found := false
		for _, e := range existing {
			if e == uid {
				found = true
				break
			}
		}
		if !found {
			existing = append(existing, uid)
		}
	}
	m.shares[notulenID] = existing
	return nil
}

func (m *mockNotulenRepo) GetSharedUsers(ctx context.Context, notulenID int64) ([]*domain.User, error) {
	var users []*domain.User
	for _, uid := range m.shares[notulenID] {
		users = append(users, &domain.User{ID: uid, Name: "User Shared"})
	}
	return users, nil
}

func (m *mockNotulenRepo) GetSharedUserIDs(ctx context.Context, notulenID int64) ([]int64, error) {
	return m.shares[notulenID], nil
}

func TestNotulenService_RBACAndScoping(t *testing.T) {
	mockRepo := &mockNotulenRepo{
		notulens: []*domain.Notulen{},
		shares:   make(map[int64][]int64),
	}
	mockDoc := &mockDocRepo{docs: make(map[int64]*domain.Document)}
	mockSto := &mockStorage{}

	svc := NewNotulenService(mockRepo, mockDoc, mockSto)
	ctx := context.Background()

	adminID := int64(1)
	notulen := &domain.Notulen{
		Judul:           "Rapat Koordinasi Mingguan KNMP Aceh",
		Tanggal:         time.Now().Format("2006-01-02"),
		PimpinanRapat:   func() *string { s := "PPK Pertamina"; return &s }(),
		Notulis:         "Super Admin",
		Agenda:          func() *string { s := "Evaluasi Progres Fisik & Rantai Pasok"; return &s }(),
		HasilPembahasan: "1. Pasokan pasir semen berjalan lancar. 2. Target minggu depan 60%.",
		TindakLanjut:    func() *string { s := "Site engineer koordinasi pengiriman besi"; return &s }(),
		Status:          "published",
		CreatedBy:       &adminID,
	}

	// 1. Negative Test: Kontraktor / Pengawas cannot create notulen
	err := svc.Create(ctx, notulen, []int64{2, 3}, "kontraktor")
	if err == nil {
		t.Fatalf("expected error when contractor tries to create notulen, got nil")
	}

	// 2. Positive Test: SuperAdmin creates notulen and shares with user 2 (Kontraktor)
	err = svc.Create(ctx, notulen, []int64{2}, "superadmin")
	if err != nil {
		t.Fatalf("expected superadmin to create notulen successfully, got: %v", err)
	}
	if notulen.ID == 0 {
		t.Fatalf("expected generated notulen ID, got 0")
	}

	// 3. Positive Test: Admin PPK creates second notulen
	notulen2 := &domain.Notulen{
		Judul:           "Rapat Evaluasi Khusus PPK",
		Tanggal:         time.Now().Format("2006-01-02"),
		Notulis:         "Super Admin",
		HasilPembahasan: "Pembahasan teknis tertutup",
		CreatedBy:       &adminID,
	}
	err = svc.Create(ctx, notulen2, []int64{4}, "admin_ppk")
	if err != nil {
		t.Fatalf("expected admin_ppk to create notulen successfully, got: %v", err)
	}

	// 4. Scoping Test: SuperAdmin sees all notulens (2 items)
	adminList, err := svc.List(ctx, domain.NotulenFilter{UserRole: "superadmin", UserID: 1})
	if err != nil || len(adminList) != 2 {
		t.Fatalf("expected superadmin to see all 2 notulens, got: %d", len(adminList))
	}

	// 5. Scoping Test: Kontraktor (User 2) only sees notulen 1 (which was shared to him)
	kontraktorList, err := svc.List(ctx, domain.NotulenFilter{UserRole: "kontraktor", UserID: 2})
	if err != nil || len(kontraktorList) != 1 {
		t.Fatalf("expected contractor user 2 to see exactly 1 shared notulen, got: %d", len(kontraktorList))
	}
	if kontraktorList[0].ID != notulen.ID {
		t.Errorf("expected notulen ID %d, got %d", notulen.ID, kontraktorList[0].ID)
	}

	// 6. ShareToUsers Test: SuperAdmin shares notulen 2 with User 2
	err = svc.ShareToUsers(ctx, notulen2.ID, []int64{2}, "superadmin")
	if err != nil {
		t.Fatalf("failed to share notulen: %v", err)
	}

	// Kontraktor User 2 should now see both notulens (2 items)
	kontraktorListUpdated, err := svc.List(ctx, domain.NotulenFilter{UserRole: "kontraktor", UserID: 2})
	if err != nil || len(kontraktorListUpdated) != 2 {
		t.Fatalf("expected contractor user 2 to see 2 notulens after sharing, got: %d", len(kontraktorListUpdated))
	}
}
