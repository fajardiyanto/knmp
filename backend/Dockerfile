FROM alpine:3.19

WORKDIR /app
RUN apk add --no-cache ca-certificates tzdata
ENV TZ=Asia/Jakarta

COPY bin/server /app/server
COPY bin/seed /app/seed
COPY migrations /app/migrations

RUN chmod +x /app/server /app/seed && mkdir -p /app/storage/uploads

EXPOSE 8080
CMD ["/app/server"]
