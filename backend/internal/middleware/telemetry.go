package middleware

import (
	"context"
	"fmt"
	"time"

	"github.com/gofiber/fiber/v2"
	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/attribute"
	"go.opentelemetry.io/otel/codes"
	"go.opentelemetry.io/otel/propagation"
	semconv "go.opentelemetry.io/otel/semconv/v1.24.0"
	"go.opentelemetry.io/otel/trace"
)

// OTelMiddleware creates a root Span for each HTTP request and logs execution metrics to Jaeger
func OTelMiddleware(serviceName string) fiber.Handler {
	tracer := otel.GetTracerProvider().Tracer(serviceName)

	return func(c *fiber.Ctx) error {
		// Extract incoming trace context from HTTP headers if any
		carrier := propagation.HeaderCarrier{}
		c.Request().Header.VisitAll(func(key, val []byte) {
			carrier.Set(string(key), string(val))
		})

		ctx := otel.GetTextMapPropagator().Extract(c.Context(), carrier)

		spanName := fmt.Sprintf("%s %s", c.Method(), c.Path())
		ctx, span := tracer.Start(ctx, spanName,
			trace.WithSpanKind(trace.SpanKindServer),
			trace.WithAttributes(
				semconv.HTTPMethodKey.String(c.Method()),
				semconv.HTTPURLKey.String(c.OriginalURL()),
				semconv.HTTPTargetKey.String(c.Path()),
				semconv.UserAgentOriginal(string(c.Request().Header.UserAgent())),
				attribute.String("http.client_ip", c.IP()),
			),
		)
		defer span.End()

		// Save context with span to Fiber locals so downstream handlers can access it
		c.Locals("otel_ctx", ctx)
		c.Locals("otel_span", span)

		// Record start log event
		span.AddEvent("http.request.start", trace.WithAttributes(
			attribute.String("ip", c.IP()),
			attribute.String("query_params", c.Request().URI().QueryArgs().String()),
		))

		startTime := time.Now()

		// Process request
		err := c.Next()
		duration := time.Since(startTime)

		statusCode := c.Response().StatusCode()
		span.SetAttributes(
			semconv.HTTPStatusCodeKey.Int(statusCode),
			attribute.Int64("http.duration_ms", duration.Milliseconds()),
		)

		// Record user context if authenticated
		if userID, ok := c.Locals("user_id").(int64); ok {
			span.SetAttributes(attribute.Int64("user.id", userID))
		}
		if userEmail, ok := c.Locals("user_email").(string); ok {
			span.SetAttributes(attribute.String("user.email", userEmail))
		}
		if userRole, ok := c.Locals("user_role").(string); ok {
			span.SetAttributes(attribute.String("user.role", userRole))
		}

		// Log error or success event to Jaeger
		if err != nil {
			span.RecordError(err)
			span.SetStatus(codes.Error, err.Error())
			span.AddEvent("http.request.error", trace.WithAttributes(
				attribute.String("error.message", err.Error()),
				attribute.Int("http.status_code", statusCode),
				attribute.Float64("duration_ms", float64(duration.Microseconds())/1000.0),
			))
		} else if statusCode >= 400 {
			span.SetStatus(codes.Error, fmt.Sprintf("HTTP %d", statusCode))
			span.AddEvent("http.request.error_status", trace.WithAttributes(
				attribute.Int("http.status_code", statusCode),
				attribute.Float64("duration_ms", float64(duration.Microseconds())/1000.0),
			))
		} else {
			span.SetStatus(codes.Ok, "OK")
			span.AddEvent("http.request.success", trace.WithAttributes(
				attribute.Int("http.status_code", statusCode),
				attribute.Float64("duration_ms", float64(duration.Microseconds())/1000.0),
			))
		}

		return err
	}
}

// GetTraceContext retrieves active context with OpenTelemetry span from fiber.Ctx
func GetTraceContext(c *fiber.Ctx) context.Context {
	if otelCtx, ok := c.Locals("otel_ctx").(context.Context); ok {
		return otelCtx
	}
	return context.Background()
}
