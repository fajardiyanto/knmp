package telemetry

import (
	"context"
	"log"
	"os"
	"time"

	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/exporters/otlp/otlptrace/otlptracegrpc"
	"go.opentelemetry.io/otel/propagation"
	"go.opentelemetry.io/otel/sdk/resource"
	sdktrace "go.opentelemetry.io/otel/sdk/trace"
	semconv "go.opentelemetry.io/otel/semconv/v1.24.0"
	"go.opentelemetry.io/otel/trace"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
)

var Tracer trace.Tracer

// InitTracer initializes OpenTelemetry OTLP exporter to send traces & spans to Jaeger
func InitTracer(ctx context.Context, serviceName, endpoint string) (func(context.Context) error, error) {
	if serviceName == "" {
		serviceName = os.Getenv("OTEL_SERVICE_NAME")
		if serviceName == "" {
			serviceName = "knmp-backend"
		}
	}

	if endpoint == "" {
		endpoint = os.Getenv("OTEL_EXPORTER_OTLP_ENDPOINT")
		if endpoint == "" {
			endpoint = "localhost:4317"
		}
	}

	log.Printf("[Jaeger/OTel] Connecting OTLP gRPC exporter to %s (service: %s)...", endpoint, serviceName)

	conn, err := grpc.NewClient(
		endpoint,
		grpc.WithTransportCredentials(insecure.NewCredentials()),
	)
	if err != nil {
		log.Printf("[Jaeger/OTel] Warning: Failed to connect to OTLP endpoint: %v", err)
	}

	exporter, err := otlptracegrpc.New(ctx, otlptracegrpc.WithGRPCConn(conn))
	if err != nil {
		log.Printf("[Jaeger/OTel] Warning: Failed to create OTLP trace exporter: %v", err)
		return func(context.Context) error { return nil }, nil
	}

	res, err := resource.New(ctx,
		resource.WithAttributes(
			semconv.ServiceNameKey.String(serviceName),
			semconv.ServiceVersionKey.String("2.0.0"),
			semconv.DeploymentEnvironmentKey.String(os.Getenv("APP_ENV")),
		),
	)
	if err != nil {
		res = resource.Default()
	}

	bsp := sdktrace.NewBatchSpanProcessor(exporter)
	tp := sdktrace.NewTracerProvider(
		sdktrace.WithSampler(sdktrace.AlwaysSample()),
		sdktrace.WithResource(res),
		sdktrace.WithSpanProcessor(bsp),
	)

	otel.SetTracerProvider(tp)
	otel.SetTextMapPropagator(propagation.NewCompositeTextMapPropagator(
		propagation.TraceContext{},
		propagation.Baggage{},
	))

	Tracer = otel.GetTracerProvider().Tracer(serviceName)

	log.Printf("[Jaeger/OTel] Tracer initialized successfully. Traces & logs streaming to Jaeger.")

	return tp.Shutdown, nil
}

// LogSpanEvent records a structured log message inside the active span
func LogSpanEvent(ctx context.Context, name string, details map[string]interface{}) {
	span := trace.SpanFromContext(ctx)
	if !span.IsRecording() {
		return
	}

	attrs := make([]trace.EventOption, 0)
	// Add current timestamp
	attrs = append(attrs, trace.WithTimestamp(time.Now()))
	span.AddEvent(name, attrs...)
}
