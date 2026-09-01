package service

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
	"knmp-v2-backend/internal/domain"
	"knmp-v2-backend/internal/repository"
)

type AuthService struct {
	userRepo  repository.UserRepository
	jwtSecret string
}

func NewAuthService(userRepo repository.UserRepository, jwtSecret string) *AuthService {
	return &AuthService{
		userRepo:  userRepo,
		jwtSecret: jwtSecret,
	}
}

type JWTClaims struct {
	UserID      int64    `json:"user_id"`
	Email       string   `json:"email"`
	Roles       []string `json:"roles"`
	Permissions []string `json:"permissions"`
	KnmpIDs     []int64  `json:"knmp_ids"`
	jwt.RegisteredClaims
}

func superAdminPermissions() []string {
	return []string{
		"knmp_read", "knmp_create", "knmp_update", "knmp_delete",
		"kontrak_read", "kontrak_create", "kontrak_update", "kontrak_delete",
		"lapangan_read", "lapangan_create", "lapangan_update", "lapangan_delete",
		"pelaksanaan_read", "pelaksanaan_create", "pelaksanaan_update", "pelaksanaan_delete",
		"laporan_read", "laporan_create", "laporan_update", "laporan_delete", "laporan_verify",
		"absensi_read", "absensi_create", "absensi_update", "absensi_delete", "absensi_verify",
		"issue_read", "issue_create", "issue_update", "issue_delete", "issue_verify",
		"pembayaran_read", "pembayaran_create", "pembayaran_update", "pembayaran_delete",
		"user_read", "user_create", "user_update", "user_delete",
		"periode_read", "periode_create", "periode_update", "periode_delete",
		"jenis_bangunan_read", "jenis_bangunan_create", "jenis_bangunan_update", "jenis_bangunan_delete",
		"document_read", "document_create", "document_verify", "document_delete",
		"*",
	}
}

func (s *AuthService) Login(ctx context.Context, email, password string) (string, *domain.User, error) {
	user, err := s.userRepo.GetByEmail(ctx, email)
	if err != nil {
		return "", nil, fmt.Errorf("lookup user: %w", err)
	}
	if user == nil {
		return "", nil, errors.New("kredensial login tidak valid")
	}

	// Verify Bcrypt password
	err = bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(password))
	if err != nil {
		return "", nil, errors.New("kredensial login tidak valid")
	}

	// Populate roles, permissions, and KNMP IDs
	roles, err := s.userRepo.GetUserRoles(ctx, user.ID)
	if err != nil {
		return "", nil, fmt.Errorf("fetch user roles: %w", err)
	}
	permissions, err := s.userRepo.GetUserPermissions(ctx, user.ID)
	if err != nil {
		return "", nil, fmt.Errorf("fetch user permissions: %w", err)
	}
	knmpIDs, err := s.userRepo.GetUserKnmpIDs(ctx, user.ID)
	if err != nil {
		return "", nil, fmt.Errorf("fetch user knmp ids: %w", err)
	}

	isSuper := false
	for _, r := range roles {
		if domain.IsSuperAdminRole(r) {
			isSuper = true
			break
		}
	}
	if isSuper {
		permissions = append(permissions, superAdminPermissions()...)
	}

	user.Roles = roles
	user.Permissions = permissions
	user.KnmpIDs = knmpIDs

	// Generate JWT
	claims := JWTClaims{
		UserID:      user.ID,
		Email:       user.Email,
		Roles:       roles,
		Permissions: permissions,
		KnmpIDs:     knmpIDs,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(24 * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	signedToken, err := token.SignedString([]byte(s.jwtSecret))
	if err != nil {
		return "", nil, fmt.Errorf("sign jwt: %w", err)
	}

	return signedToken, user, nil
}

func (s *AuthService) GetUserProfile(ctx context.Context, userID int64) (*domain.User, error) {
	user, err := s.userRepo.GetByID(ctx, userID)
	if err != nil || user == nil {
		return nil, errors.New("user tidak ditemukan")
	}

	roles, err := s.userRepo.GetUserRoles(ctx, user.ID)
	if err != nil {
		return nil, fmt.Errorf("fetch user roles: %w", err)
	}
	permissions, err := s.userRepo.GetUserPermissions(ctx, user.ID)
	if err != nil {
		return nil, fmt.Errorf("fetch user permissions: %w", err)
	}
	knmpIDs, err := s.userRepo.GetUserKnmpIDs(ctx, user.ID)
	if err != nil {
		return nil, fmt.Errorf("fetch user knmp ids: %w", err)
	}

	isSuper := false
	for _, r := range roles {
		if domain.IsSuperAdminRole(r) {
			isSuper = true
			break
		}
	}
	if isSuper {
		permissions = append(permissions, superAdminPermissions()...)
	}

	user.Roles = roles
	user.Permissions = permissions
	user.KnmpIDs = knmpIDs

	return user, nil
}

func (s *AuthService) ListUsers(ctx context.Context, search string) ([]*domain.User, error) {
	users, err := s.userRepo.List(ctx, search)
	if err != nil {
		return nil, err
	}
	for _, u := range users {
		u.Roles, _ = s.userRepo.GetUserRoles(ctx, u.ID)
		u.Permissions, _ = s.userRepo.GetUserPermissions(ctx, u.ID)
		u.KnmpIDs, _ = s.userRepo.GetUserKnmpIDs(ctx, u.ID)
	}
	return users, nil
}

func (s *AuthService) CreateUser(ctx context.Context, name, email, password, role string, knmpIDs []int64, permissions []string) (*domain.User, error) {
	existing, _ := s.userRepo.GetByEmail(ctx, email)
	if existing != nil {
		return nil, errors.New("email sudah terdaftar")
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return nil, fmt.Errorf("hash password: %w", err)
	}

	user := &domain.User{
		Name:     name,
		Email:    email,
		Password: string(hashedPassword),
	}

	if err := s.userRepo.Create(ctx, user); err != nil {
		return nil, err
	}

	if role != "" {
		_ = s.userRepo.AssignRole(ctx, user.ID, role)
	}
	if len(knmpIDs) > 0 {
		_ = s.userRepo.AssignKnmps(ctx, user.ID, knmpIDs)
	}
	if len(permissions) > 0 {
		_ = s.userRepo.AssignPermissions(ctx, user.ID, permissions)
	}

	return s.GetUserProfile(ctx, user.ID)
}

func (s *AuthService) UpdateUser(ctx context.Context, id int64, name, email, password, role string, knmpIDs []int64, permissions []string) (*domain.User, error) {
	user, err := s.userRepo.GetByID(ctx, id)
	if err != nil || user == nil {
		return nil, errors.New("user tidak ditemukan")
	}

	user.Name = name
	user.Email = email
	if password != "" {
		hashed, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
		if err != nil {
			return nil, err
		}
		user.Password = string(hashed)
	} else {
		user.Password = ""
	}

	if err := s.userRepo.Update(ctx, user); err != nil {
		return nil, err
	}

	if role != "" {
		_ = s.userRepo.AssignRole(ctx, user.ID, role)
	}
	if knmpIDs != nil {
		_ = s.userRepo.AssignKnmps(ctx, user.ID, knmpIDs)
	}
	if permissions != nil {
		_ = s.userRepo.AssignPermissions(ctx, user.ID, permissions)
	}

	return s.GetUserProfile(ctx, user.ID)
}

func (s *AuthService) DeleteUser(ctx context.Context, id int64) error {
	return s.userRepo.Delete(ctx, id)
}

func (s *AuthService) ListRoles(ctx context.Context) ([]*domain.Role, error) {
	return s.userRepo.ListRoles(ctx)
}

func (s *AuthService) ListPermissions(ctx context.Context) ([]*domain.Permission, error) {
	return s.userRepo.ListPermissions(ctx)
}
