package handler

import (
	"strconv"

	"github.com/gofiber/fiber/v2"
	"knmp-v2-backend/internal/middleware"
	"knmp-v2-backend/internal/service"
	"knmp-v2-backend/pkg/validator"
)

type AuthHandler struct {
	authSvc *service.AuthService
}

func NewAuthHandler(authSvc *service.AuthService) *AuthHandler {
	return &AuthHandler{authSvc: authSvc}
}

type LoginRequest struct {
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required"`
}

func (h *AuthHandler) Login(c *fiber.Ctx) error {
	var req LoginRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(ErrorResponse("Payload request tidak valid"))
	}
	if err := validator.Validate(&req); err != nil {
		return c.Status(fiber.StatusUnprocessableEntity).JSON(ValidationErrorResponse("Validasi gagal", err.Error()))
	}

	token, user, err := h.authSvc.Login(c.Context(), req.Email, req.Password)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(ErrorResponse(err.Error()))
	}

	return c.JSON(OKResponse(fiber.Map{
		"token": token,
		"user":  user,
	}))
}

func (h *AuthHandler) Me(c *fiber.Ctx) error {
	userID, ok := c.Locals(middleware.CtxUserIDKey).(int64)
	if !ok {
		return c.Status(fiber.StatusUnauthorized).JSON(ErrorResponse("Unauthorized"))
	}

	user, err := h.authSvc.GetUserProfile(c.Context(), userID)
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(ErrorResponse(err.Error()))
	}

	return c.JSON(OKResponse(user))
}

func (h *AuthHandler) Logout(c *fiber.Ctx) error {
	return c.JSON(OKResponse(fiber.Map{
		"message": "Logout berhasil",
	}))
}

func (h *AuthHandler) ListUsers(c *fiber.Ctx) error {
	search := c.Query("search")
	users, err := h.authSvc.ListUsers(c.Context(), search)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(ErrorResponse(err.Error()))
	}
	return c.JSON(OKResponse(users))
}

type CreateUserRequest struct {
	Name     string  `json:"name" validate:"required,min=2"`
	Email    string  `json:"email" validate:"required,email"`
	Password string  `json:"password" validate:"required,min=6"`
	Role     string  `json:"role"`
	KnmpIDs  []int64 `json:"knmp_ids"`
}

func (h *AuthHandler) CreateUser(c *fiber.Ctx) error {
	var req CreateUserRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(ErrorResponse("Payload tidak valid"))
	}
	if err := validator.Validate(&req); err != nil {
		return c.Status(fiber.StatusUnprocessableEntity).JSON(ValidationErrorResponse("Validasi gagal", err.Error()))
	}

	user, err := h.authSvc.CreateUser(c.Context(), req.Name, req.Email, req.Password, req.Role, req.KnmpIDs)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(ErrorResponse(err.Error()))
	}
	return c.Status(fiber.StatusCreated).JSON(OKResponse(user))
}

type UpdateUserRequest struct {
	Name     string  `json:"name" validate:"required,min=2"`
	Email    string  `json:"email" validate:"required,email"`
	Password string  `json:"password"`
	Role     string  `json:"role"`
	KnmpIDs  []int64 `json:"knmp_ids"`
}

func (h *AuthHandler) UpdateUser(c *fiber.Ctx) error {
	id, err := strconv.ParseInt(c.Params("id"), 10, 64)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(ErrorResponse("ID user tidak valid"))
	}

	var req UpdateUserRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(ErrorResponse("Payload tidak valid"))
	}
	if err := validator.Validate(&req); err != nil {
		return c.Status(fiber.StatusUnprocessableEntity).JSON(ValidationErrorResponse("Validasi gagal", err.Error()))
	}

	user, err := h.authSvc.UpdateUser(c.Context(), id, req.Name, req.Email, req.Password, req.Role, req.KnmpIDs)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(ErrorResponse(err.Error()))
	}
	return c.JSON(OKResponse(user))
}

func (h *AuthHandler) DeleteUser(c *fiber.Ctx) error {
	id, err := strconv.ParseInt(c.Params("id"), 10, 64)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(ErrorResponse("ID user tidak valid"))
	}

	if err := h.authSvc.DeleteUser(c.Context(), id); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(ErrorResponse(err.Error()))
	}
	return c.JSON(OKResponse(fiber.Map{"message": "User berhasil dihapus"}))
}

func (h *AuthHandler) ListRoles(c *fiber.Ctx) error {
	roles, err := h.authSvc.ListRoles(c.Context())
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(ErrorResponse(err.Error()))
	}
	return c.JSON(OKResponse(roles))
}
