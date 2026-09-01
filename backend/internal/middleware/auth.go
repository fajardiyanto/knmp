package middleware

import (
	"strings"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
	"knmp-v2-backend/internal/domain"
	"knmp-v2-backend/internal/service"
)

const (
	CtxUserKey        = "currentUser"
	CtxUserIDKey      = "currentUserID"
	CtxUserRolesKey   = "currentUserRoles"
	CtxUserPermsKey   = "currentUserPerms"
	CtxUserKnmpIDsKey = "currentUserKnmpIDs"
)

func JWTProtected(jwtSecret string) fiber.Handler {
	return func(c *fiber.Ctx) error {
		authHeader := c.Get("Authorization")
		if authHeader == "" {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "Authorization header required",
			})
		}

		tokenString := strings.TrimPrefix(authHeader, "Bearer ")
		if tokenString == authHeader {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "Bearer token format required",
			})
		}

		token, err := jwt.ParseWithClaims(tokenString, &service.JWTClaims{}, func(token *jwt.Token) (interface{}, error) {
			return []byte(jwtSecret), nil
		})

		if err != nil || !token.Valid {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "Token tidak valid atau sudah kedaluwarsa",
			})
		}

		claims, ok := token.Claims.(*service.JWTClaims)
		if !ok {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "Klaim token tidak valid",
			})
		}

		c.Locals(CtxUserIDKey, claims.UserID)
		c.Locals(CtxUserRolesKey, claims.Roles)
		c.Locals(CtxUserPermsKey, claims.Permissions)
		c.Locals(CtxUserKnmpIDsKey, claims.KnmpIDs)

		return c.Next()
	}
}

func WSAuthMiddleware(jwtSecret string) fiber.Handler {
	return func(c *fiber.Ctx) error {
		tokenString := c.Query("token")
		if tokenString == "" {
			authHeader := c.Get("Authorization")
			tokenString = strings.TrimPrefix(authHeader, "Bearer ")
		}

		if tokenString == "" {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "Authentication token required for WebSocket",
			})
		}

		token, err := jwt.ParseWithClaims(tokenString, &service.JWTClaims{}, func(token *jwt.Token) (interface{}, error) {
			return []byte(jwtSecret), nil
		})

		if err != nil || !token.Valid {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "Invalid or expired token",
			})
		}

		claims, ok := token.Claims.(*service.JWTClaims)
		if !ok {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "Invalid token claims",
			})
		}

		c.Locals(CtxUserIDKey, claims.UserID)
		c.Locals(CtxUserRolesKey, claims.Roles)
		c.Locals(CtxUserPermsKey, claims.Permissions)
		c.Locals(CtxUserKnmpIDsKey, claims.KnmpIDs)

		return c.Next()
	}
}

func RequirePermission(requiredPerms ...string) fiber.Handler {
	return func(c *fiber.Ctx) error {
		userPerms, _ := c.Locals(CtxUserPermsKey).([]string)

		// Super admin bypass
		userRoles, _ := c.Locals(CtxUserRolesKey).([]string)
		for _, r := range userRoles {
			if domain.IsSuperAdminRole(r) {
				return c.Next()
			}
		}

		// Check if user possesses at least one of the required permissions
		permMap := make(map[string]bool)
		for _, p := range userPerms {
			trimmed := strings.ToLower(strings.TrimSpace(p))
			permMap[p] = true
			permMap[trimmed] = true
		}

		for _, req := range requiredPerms {
			reqLower := strings.ToLower(strings.TrimSpace(req))
			if permMap[req] || permMap[reqLower] || permMap["*"] {
				return c.Next()
			}
		}

		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"error": "Akses ditolak: Anda tidak memiliki izin untuk tindakan ini",
		})
	}
}

func RequireRole(requiredRoles ...string) fiber.Handler {
	return func(c *fiber.Ctx) error {
		userRoles, ok := c.Locals(CtxUserRolesKey).([]string)
		if !ok {
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
				"error": "Akses ditolak",
			})
		}

		for _, ur := range userRoles {
			if domain.IsSuperAdminRole(ur) {
				return c.Next()
			}
			for _, rr := range requiredRoles {
				if strings.EqualFold(ur, rr) {
					return c.Next()
				}
			}
		}

		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"error": "Akses ditolak: Peran Anda tidak diizinkan",
		})
	}
}
