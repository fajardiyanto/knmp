# Build stage
FROM golang:alpine AS builder

WORKDIR /app

RUN apk add --no-cache git

COPY go.mod go.sum ./
RUN go mod download

COPY . .

RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-w -s" -o /app/server ./cmd/api

# Runtime stage
FROM alpine:3.19

WORKDIR /app
RUN apk add --no-cache ca-certificates tzdata
ENV TZ=Asia/Jakarta

COPY --from=builder /app/server /app/server
COPY migrations /app/migrations

RUN chmod +x /app/server && mkdir -p /app/storage/uploads

EXPOSE 8080
CMD ["/app/server"]
