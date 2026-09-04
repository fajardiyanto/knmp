package service

import (
	"context"
	"testing"

	"knmp-v2-backend/internal/domain"
)

type mockNotulenRepo struct {
	notulens []*domain.Notulen
	shares   map[int64][]domain.ShareUserItem // notulenID -> []ShareUserItem
}

func (m *mockNotulenRepo) GetByID(ctx context.Context, id int64) (*domain.Notulen, error) {
	for _, n := range m.notulens {
		if n.ID == id {
			var details []*domain.NotulenShareDetail
			var uids []int64
			for _, s := range m.shares[id] {
				details = append(details, &domain.NotulenShareDetail{
					UserID:     s.UserID,
					Name:       "User Test",
					Email:      "user@test.com",
					AccessType: s.AccessType,
				})
				uids = append(uids, s.UserID)
			}
			n.SharedUsers = details
			n.SharedUserIDs = uids
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
			for _, s := range m.shares[n.ID] {
				if s.UserID == filter.UserID {
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

func (m *mockNotulenRepo) Create(ctx context.Context, n *domain.Notulen, sharedUsers []domain.ShareUserItem) error {
	n.ID = int64(len(m.notulens) + 1)
	m.notulens = append(m.notulens, n)
	if m.shares == nil {
		m.shares = make(map[int64][]domain.ShareUserItem)
	}
	m.shares[n.ID] = sharedUsers
	for _, s := range sharedUsers {
		n.SharedUserIDs = append(n.SharedUserIDs, s.UserID)
	}
	return nil
}

func (m *mockNotulenRepo) Update(ctx context.Context, n *domain.Notulen, sharedUsers []domain.ShareUserItem) error {
	for i, item := range m.notulens {
		if item.ID == n.ID {
			m.notulens[i] = n
			if sharedUsers != nil {
				m.shares[n.ID] = sharedUsers
				var uids []int64
				for _, s := range sharedUsers {
					uids = append(uids, s.UserID)
				}
				n.SharedUserIDs = uids
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

func (m *mockNotulenRepo) ShareToUsers(ctx context.Context, notulenID int64, sharedUsers []domain.ShareUserItem) error {
	if m.shares == nil {
		m.shares = make(map[int64][]domain.ShareUserItem)
	}
	m.shares[notulenID] = sharedUsers
	return nil
}

func (m *mockNotulenRepo) GetSharedDetails(ctx context.Context, notulenID int64) ([]*domain.NotulenShareDetail, error) {
	var details []*domain.NotulenShareDetail
	for _, s := range m.shares[notulenID] {
		details = append(details, &domain.NotulenShareDetail{
			UserID:     s.UserID,
			Name:       "User Test",
			Email:      "user@test.com",
			AccessType: s.AccessType,
		})
	}
	return details, nil
}

func (m *mockNotulenRepo) GetSharedUserIDs(ctx context.Context, notulenID int64) ([]int64, error) {
	var ids []int64
	for _, s := range m.shares[notulenID] {
		ids = append(ids, s.UserID)
	}
	return ids, nil
}

func (m *mockNotulenRepo) GetUserAccess(ctx context.Context, notulenID int64, userID int64) (string, error) {
	for _, s := range m.shares[notulenID] {
		if s.UserID == userID {
			return s.AccessType, nil
		}
	}
	return "", nil
}

func TestNotulenService_RBACAndScoping(t *testing.T) {
	repo := &mockNotulenRepo{
		notulens: []*domain.Notulen{},
		shares:   make(map[int64][]domain.ShareUserItem),
	}
	docRepo := &mockDocRepo{}
	storageSvc := &mockStorage{}

	svc := NewNotulenService(repo, docRepo, storageSvc)
	ctx := context.Background()

	superAdminRole := "superadmin"
	adminPPKRole := "admin_ppk"
	pengawasRole := "pengawas"
	kontraktorRole := "kontraktor"

	// 1. Non-admin (Pengawas/Kontraktor) cannot CREATE notulen
	err := svc.Create(ctx, &domain.Notulen{
		Judul:           "Rapat Lapangan Aceh",
		Tanggal:         "2026-08-31",
		HasilPembahasan: "Pengecoran selesai",
	}, nil, pengawasRole)
	if err == nil {
		t.Errorf("Expected error when non-admin creates notulen, got nil")
	}

	// 2. SuperAdmin CAN create notulen and share with Pengawas (as Editor) & Kontraktor (as Viewer)
	notulen1 := &domain.Notulen{
		Judul:           "Rapat Koordinasi Mingguan Progres 346 Titik",
		Tanggal:         "2026-08-31",
		HasilPembahasan: "Seluruh kontraktor wajib mengirimkan laporan cuaca dan progres fisik tepat waktu.",
		Status:          "published",
	}
	sharedUsers := []domain.ShareUserItem{
		{UserID: 10, AccessType: "editor"}, // Pengawas ID 10 is Editor
		{UserID: 20, AccessType: "viewer"}, // Kontraktor ID 20 is Viewer
	}
	err = svc.Create(ctx, notulen1, sharedUsers, superAdminRole)
	if err != nil {
		t.Fatalf("SuperAdmin failed to create notulen: %v", err)
	}

	// 3. Admin PPK creates Notulen 2 (not shared with User 10 or 20)
	notulen2 := &domain.Notulen{
		Judul:           "Rapat Internal PPK Pertamina",
		Tanggal:         "2026-08-31",
		HasilPembahasan: "Evaluasi anggaran termin pembayaran termin 1.",
		Status:          "published",
	}
	err = svc.Create(ctx, notulen2, nil, adminPPKRole)
	if err != nil {
		t.Fatalf("Admin PPK failed to create notulen: %v", err)
	}

	// 4. Test Scoping:
	// SuperAdmin sees ALL 2 notulens
	listSuper, _ := svc.List(ctx, domain.NotulenFilter{UserRole: superAdminRole})
	if len(listSuper) != 2 {
		t.Errorf("SuperAdmin should see all 2 notulens, got %d", len(listSuper))
	}

	// Pengawas (User ID 10) ONLY sees Notulen 1 (which was shared with him)
	listPengawas, _ := svc.List(ctx, domain.NotulenFilter{UserID: 10, UserRole: pengawasRole})
	if len(listPengawas) != 1 {
		t.Errorf("Pengawas (User 10) should only see 1 notulen, got %d", len(listPengawas))
	}
	if len(listPengawas) > 0 && listPengawas[0].ID != notulen1.ID {
		t.Errorf("Pengawas saw wrong notulen ID: %d", listPengawas[0].ID)
	}

	// 5. Test Editor Access:
	// Pengawas (User 10) has 'editor' access on Notulen 1 -> CAN update
	notulen1.HasilPembahasan = "Updated hasil pembahasan oleh editor"
	err = svc.Update(ctx, notulen1, nil, 10, pengawasRole)
	if err != nil {
		t.Errorf("Pengawas with 'editor' access should be able to update notulen, got: %v", err)
	}

	// Kontraktor (User 20) has 'viewer' access on Notulen 1 -> CANNOT update
	err = svc.Update(ctx, notulen1, nil, 20, kontraktorRole)
	if err == nil {
		t.Errorf("Kontraktor with 'viewer' access should NOT be able to update notulen")
	}

	// 6. Test UserAccess computation on GetByID
	nDetail, _ := svc.GetByID(ctx, notulen1.ID, 10, pengawasRole)
	if nDetail.UserAccess != "editor" {
		t.Errorf("Expected UserAccess 'editor' for User 10, got '%s'", nDetail.UserAccess)
	}

	nDetailViewer, _ := svc.GetByID(ctx, notulen1.ID, 20, kontraktorRole)
	if nDetailViewer.UserAccess != "viewer" {
		t.Errorf("Expected UserAccess 'viewer' for User 20, got '%s'", nDetailViewer.UserAccess)
	}
}
