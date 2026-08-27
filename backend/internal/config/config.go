package config

import (
	"fmt"
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	AppEnv          string
	Port            string
	DatabaseURL     string
	JWTSecret       string
	StorageDisk     string // "local" or "s3"
	StorageLocalDir string
	S3Endpoint      string
	S3Bucket        string
	S3AccessKey     string
	S3SecretKey     string
	S3UseSSL        bool
	OtelEndpoint    string
	OtelServiceName string
}

func Load() *Config {
	// Attempt to load .env if available
	_ = godotenv.Load()

	appEnv := getEnv("APP_ENV", "development")
	port := getEnv("APP_PORT", "8080")

	// Construct Database URL from separate variables if DATABASE_URL is not explicitly set
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		dbHost := getEnv("DB_HOST", "localhost")
		dbPort := getEnv("DB_PORT", "5432")
		dbUser := getEnv("DB_USER", "knmp")
		dbPass := getEnv("DB_PASSWORD", "secretpassword")
		dbName := getEnv("DB_NAME", "knmp_db")
		dbSSL := getEnv("DB_SSLMODE", "disable")

		dbURL = fmt.Sprintf("postgres://%s:%s@%s:%s/%s?sslmode=%s", dbUser, dbPass, dbHost, dbPort, dbName, dbSSL)
	}

	jwtSecret := getEnv("JWT_SECRET", "knmp-v2-super-secret-key-change-in-production")
	storageDisk := getEnv("STORAGE_DISK", "local")
	storageLocalDir := getEnv("STORAGE_LOCAL_DIR", "./storage/uploads")

	return &Config{
		AppEnv:          appEnv,
		Port:            port,
		DatabaseURL:     dbURL,
		JWTSecret:       jwtSecret,
		StorageDisk:     storageDisk,
		StorageLocalDir: storageLocalDir,
		S3Endpoint:      getEnv("S3_ENDPOINT", "localhost:9000"),
		S3Bucket:        getEnv("S3_BUCKET", "knmp-documents"),
		S3AccessKey:     getEnv("S3_ACCESS_KEY", "minioadmin"),
		S3SecretKey:     getEnv("S3_SECRET_KEY", "minioadminpassword"),
		S3UseSSL:        getEnv("S3_USE_SSL", "false") == "true",
		OtelEndpoint:    getEnv("OTEL_EXPORTER_OTLP_ENDPOINT", "localhost:4317"),
		OtelServiceName: getEnv("OTEL_SERVICE_NAME", "knmp-backend"),
	}
}

func getEnv(key, defaultVal string) string {
	if val := os.Getenv(key); val != "" {
		return val
	}
	return defaultVal
}
