package service

import (
	"context"
	"fmt"

	"knmp-v2-backend/internal/domain"
	"knmp-v2-backend/internal/repository/postgres"
)

type NotificationService interface {
	ListNotifications(ctx context.Context, userID int64, userRoles []string, limit int) (*domain.NotificationListResponse, error)
	CreateNotification(ctx context.Context, notif *domain.Notification) error
	MarkAsRead(ctx context.Context, id int64, userID int64) error
	MarkAllAsRead(ctx context.Context, userID int64, userRoles []string) error
	DeleteNotification(ctx context.Context, id int64, userID int64) error

	// Event helper emitters
	NotifyNewChat(ctx context.Context, senderID int64, senderName string, recipientUserID *int64, roleTarget *string, messagePreview string)
	NotifyNewLaporan(ctx context.Context, creatorName string, laporanJudul string, knmpName string)
	NotifyDocumentVerified(ctx context.Context, verifierName string, docName string, status string, targetUserID *int64, link string)
	NotifyNewIssue(ctx context.Context, reporterName string, issueTitle string, knmpName string)
}

type notificationService struct {
	repo postgres.NotificationRepo
}

func NewNotificationService(repo postgres.NotificationRepo) NotificationService {
	return &notificationService{repo: repo}
}

func (s *notificationService) ListNotifications(ctx context.Context, userID int64, userRoles []string, limit int) (*domain.NotificationListResponse, error) {
	notifs, err := s.repo.GetByUserID(ctx, userID, userRoles, limit)
	if err != nil {
		return nil, err
	}

	unreadCount, err := s.repo.CountUnread(ctx, userID, userRoles)
	if err != nil {
		return nil, err
	}

	return &domain.NotificationListResponse{
		Notifications: notifs,
		UnreadCount:   unreadCount,
	}, nil
}

func (s *notificationService) CreateNotification(ctx context.Context, notif *domain.Notification) error {
	return s.repo.Create(ctx, notif)
}

func (s *notificationService) MarkAsRead(ctx context.Context, id int64, userID int64) error {
	return s.repo.MarkAsRead(ctx, id, userID)
}

func (s *notificationService) MarkAllAsRead(ctx context.Context, userID int64, userRoles []string) error {
	return s.repo.MarkAllAsRead(ctx, userID, userRoles)
}

func (s *notificationService) DeleteNotification(ctx context.Context, id int64, userID int64) error {
	return s.repo.Delete(ctx, id, userID)
}

func (s *notificationService) NotifyNewChat(ctx context.Context, senderID int64, senderName string, recipientUserID *int64, roleTarget *string, messagePreview string) {
	if len(messagePreview) > 60 {
		messagePreview = messagePreview[:57] + "..."
	}
	link := "/chat"
	notif := &domain.Notification{
		UserID:     recipientUserID,
		RoleTarget: roleTarget,
		Title:      fmt.Sprintf("Pesan Baru dari %s", senderName),
		Message:    messagePreview,
		Category:   "chat",
		Type:       "primary",
		Link:       &link,
		IsRead:     false,
	}
	_ = s.repo.Create(ctx, notif)
}

func (s *notificationService) NotifyNewLaporan(ctx context.Context, creatorName string, laporanJudul string, knmpName string) {
	link := "/laporan"
	msg := fmt.Sprintf("Laporan baru '%s' telah dibuat oleh %s (%s)", laporanJudul, creatorName, knmpName)
	role := "superadmin"
	notif := &domain.Notification{
		RoleTarget: &role,
		Title:      "Laporan Baru Masuk",
		Message:    msg,
		Category:   "laporan",
		Type:       "info",
		Link:       &link,
		IsRead:     false,
	}
	_ = s.repo.Create(ctx, notif)
}

func (s *notificationService) NotifyDocumentVerified(ctx context.Context, verifierName string, docName string, status string, targetUserID *int64, link string) {
	statusTitle := "Dokumen Disetujui (ACC)"
	notifType := "success"
	if status == "rejected" {
		statusTitle = "Dokumen Ditolak / Butuh Revisi"
		notifType = "warning"
	}

	msg := fmt.Sprintf("Dokumen '%s' telah diverifikasi (%s) oleh %s", docName, status, verifierName)
	notif := &domain.Notification{
		UserID:   targetUserID,
		Title:    statusTitle,
		Message:  msg,
		Category: "verifikasi",
		Type:     notifType,
		Link:     &link,
		IsRead:   false,
	}
	_ = s.repo.Create(ctx, notif)
}

func (s *notificationService) NotifyNewIssue(ctx context.Context, reporterName string, issueTitle string, knmpName string) {
	link := "/issue"
	msg := fmt.Sprintf("Kendala '%s' dilaporkan oleh %s pada %s", issueTitle, reporterName, knmpName)
	role := "superadmin"
	notif := &domain.Notification{
		RoleTarget: &role,
		Title:      "Kendala / Issue Baru",
		Message:    msg,
		Category:   "issue",
		Type:       "warning",
		Link:       &link,
		IsRead:     false,
	}
	_ = s.repo.Create(ctx, notif)
}
