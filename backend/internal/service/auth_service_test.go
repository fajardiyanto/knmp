package service

import (
	"context"
	"testing"

	"golang.org/x/crypto/bcrypt"
	"knmp-v2-backend/internal/domain"
)

type mockUserRepo struct {
	users map[string]*domain.User
}

func (m *mockUserRepo) GetByID(ctx context.Context, id int64) (*domain.User, error) {
	for _, u := range m.users {
		if u.ID == id {
			return u, nil
		}
	}
	return nil, nil
}

func (m *mockUserRepo) GetByEmail(ctx context.Context, email string) (*domain.User, error) {
	if u, ok := m.users[email]; ok {
		return u, nil
	}
	return nil, nil
}

func (m *mockUserRepo) List(ctx context.Context, search string) ([]*domain.User, error) {
	var list []*domain.User
	for _, u := range m.users {
		list = append(list, u)
	}
	return list, nil
}

func (m *mockUserRepo) Create(ctx context.Context, user *domain.User) error {
	m.users[user.Email] = user
	return nil
}

func (m *mockUserRepo) Update(ctx context.Context, user *domain.User) error {
	m.users[user.Email] = user
	return nil
}

func (m *mockUserRepo) Delete(ctx context.Context, id int64) error {
	for email, u := range m.users {
		if u.ID == id {
			delete(m.users, email)
			return nil
		}
	}
	return nil
}

func (m *mockUserRepo) GetUserRoles(ctx context.Context, userID int64) ([]string, error) {
	for _, u := range m.users {
		if u.ID == userID {
			return u.Roles, nil
		}
	}
	return []string{}, nil
}

func (m *mockUserRepo) GetUserPermissions(ctx context.Context, userID int64) ([]string, error) {
	for _, u := range m.users {
		if u.ID == userID {
			return u.Permissions, nil
		}
	}
	return []string{}, nil
}

func (m *mockUserRepo) GetUserKnmpIDs(ctx context.Context, userID int64) ([]int64, error) {
	return []int64{1, 2}, nil
}

func (m *mockUserRepo) AssignRole(ctx context.Context, userID int64, roleName string) error {
	return nil
}

func (m *mockUserRepo) AssignKnmps(ctx context.Context, userID int64, knmpIDs []int64) error {
	return nil
}

func (m *mockUserRepo) AssignPermissions(ctx context.Context, userID int64, permissions []string) error {
	return nil
}

func (m *mockUserRepo) ListRoles(ctx context.Context) ([]*domain.Role, error) {
	return []*domain.Role{
		{ID: 1, Name: "SuperAdmin"},
		{ID: 2, Name: "Pengawas"},
		{ID: 3, Name: "Kontraktor"},
	}, nil
}

func (m *mockUserRepo) ListPermissions(ctx context.Context) ([]*domain.Permission, error) {
	return []*domain.Permission{
		{ID: 1, Name: "laporan_read"},
		{ID: 2, Name: "laporan_create"},
	}, nil
}

func TestAuthService_Login(t *testing.T) {
	hash, err := bcrypt.GenerateFromPassword([]byte("secret123"), bcrypt.MinCost)
	if err != nil {
		t.Fatalf("failed to hash password: %v", err)
	}

	mockRepo := &mockUserRepo{
		users: map[string]*domain.User{
			"admin@pertamina.com": {
				ID:          1,
				Name:        "Super Admin",
				Email:       "admin@pertamina.com",
				Password:    string(hash),
				Roles:       []string{"superadmin"},
				Permissions: []string{"*"},
			},
		},
	}

	svc := NewAuthService(mockRepo, "test-super-secret-jwt-key-minimum-32")

	// Case 1: Valid Login
	token, user, err := svc.Login(context.Background(), "admin@pertamina.com", "secret123")
	if err != nil {
		t.Fatalf("expected login success, got error: %v", err)
	}
	if token == "" || user == nil {
		t.Fatalf("expected valid token and user, got empty token")
	}
	if user.Email != "admin@pertamina.com" {
		t.Errorf("expected email admin@pertamina.com, got %s", user.Email)
	}

	// Case 2: Invalid Password
	_, _, err = svc.Login(context.Background(), "admin@pertamina.com", "wrongpassword")
	if err == nil {
		t.Fatalf("expected login error for wrong password, got nil")
	}

	// Case 3: User Not Found
	_, _, err = svc.Login(context.Background(), "nonexistent@pertamina.com", "secret123")
	if err == nil {
		t.Fatalf("expected login error for nonexistent user, got nil")
	}
}

func TestAuthService_SuperAdminPermissions(t *testing.T) {
	perms := superAdminPermissions()
	if len(perms) == 0 {
		t.Fatalf("expected non-empty superadmin permissions")
	}

	hasWildcard := false
	for _, p := range perms {
		if p == "*" {
			hasWildcard = true
			break
		}
	}
	if !hasWildcard {
		t.Errorf("expected superadmin permissions to have wildcard '*' permission")
	}
}
