# External Integrations Specification — KNMP V2

This document details all external services, cloud integrations, and protocols interfacing with KNMP V2.

---

## 1. Cloud & Object Storage Integration (MinIO / AWS S3)

- **Purpose**: Centralized, secure storage for uploaded project documentation (PDF, Word, Excel) and field inspection / attendance photos (JPEG, PNG, HEIC).
- **Protocol**: AWS S3 REST API (compatible with MinIO for on-premise/local dev).
- **Authentication**: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `AWS_BUCKET`.
- **Upload Flow**:
  1. Backend validates MIME types, magic numbers, and size limits (max 20MB).
  2. Generates unique UUID-based path: `documents/{year}/{month}/{uuid}_{filename}`.
  3. Uploads file to bucket via Go AWS SDK / MinIO SDK.
  4. Returns secure presigned URL or proxy streaming endpoint.
- **Resilience & Retry**: 3-retries with exponential backoff on network errors; fallback to local storage disk if cloud storage is unreachable.

---

## 2. Mail & Notification Service

- **Purpose**: Email notifications for account invitations, password reset requests, and critical issue alerts.
- **Protocol**: SMTP / Mailgun / AWS SES.
- **Authentication**: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_ENCRYPTION`.
- **Failure Behavior**: Asynchronous background dispatch (non-blocking for HTTP requests); failed emails queued for retry up to 5 times.

---

## 3. Geographic Mapping & Tile Providers

- **Purpose**: Interactive GIS mapping of KNMP locations across Indonesia.
- **Protocol**: OpenStreetMap (OSM) / ESRI Satellite Tile Services via HTTPS.
- **Authentication**: Public OSM tile endpoints / API keys for commercial satellite layers.
- **Data Exchange**: GeoJSON payloads containing coordinate pairs `[longitude, latitude]` and feature properties (location name, status, active issues).

---

## 4. Mobile Client Push Notifications (Roadmap / V2 Extension)

- **Purpose**: Push alerts to mobile contractors when a report or attendance is rejected or needs action.
- **Protocol**: Firebase Cloud Messaging (FCM) HTTP v1 API.
- **Configuration**: Service Account JSON Credentials.
