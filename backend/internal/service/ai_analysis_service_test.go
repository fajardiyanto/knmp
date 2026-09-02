package service

import (
	"strings"
	"testing"
)

func TestAnalyzeAnomaliesDetectsHighRiskDocument(t *testing.T) {
	result := analyzeAnomalies("Lokasi KNMP Batee Shoek tanggal 31/08/2026 progres 15% realisasi 60% ada kendala K3 kritis dan terlambat", "Laporan lapangan")

	if result.riskLevel != "tinggi" {
		t.Fatalf("expected high risk, got %s with score %d", result.riskLevel, result.riskScore)
	}
	if result.riskScore < 70 {
		t.Fatalf("expected score >= 70, got %d", result.riskScore)
	}
	if len(result.findings) == 0 {
		t.Fatal("expected anomaly findings")
	}
	if len(result.recommendations) == 0 {
		t.Fatal("expected recommendations")
	}
	if result.summary == "" {
		t.Fatal("expected summary")
	}
}

func TestAnalyzeAnomaliesWarnsWhenInputHasNoExtractedText(t *testing.T) {
	result := analyzeAnomalies("", "Foto progres")

	if result.riskScore < 35 {
		t.Fatalf("expected missing text to raise score, got %d", result.riskScore)
	}
	if result.findings[0] == "" {
		t.Fatal("expected non-empty finding")
	}
}

func TestAnalyzeAnomaliesBuildsDocumentSummaryAndDraftInput(t *testing.T) {
	result := analyzeAnomalies("Laporan mingguan KNMP Batee Shoek tanggal 31/08/2026 cuaca cerah rencana 40% realisasi 60% tenaga kerja 20 orang", "Laporan Mingguan")

	if result.summary == "" {
		t.Fatal("expected document summary")
	}
	if result.targetModule != "laporan" {
		t.Fatalf("expected target module laporan, got %s", result.targetModule)
	}
	if result.draftInput["tanggal"] != "2026-08-31" {
		t.Fatalf("expected parsed date, got %#v", result.draftInput["tanggal"])
	}
	if result.draftInput["jenis_laporan"] != "mingguan" {
		t.Fatalf("expected jenis_laporan mingguan, got %#v", result.draftInput["jenis_laporan"])
	}
	if len(result.extractedFacts) == 0 {
		t.Fatal("expected extracted facts")
	}
}

func TestUnreadableExtractedTextDoesNotLeakGibberishIntoSummary(t *testing.T) {
	gibberish := "Ï+\x14 ÐT jgi\\YT\x14\\fYTÝTHgNZT:ZGTMM\\fiTgiY:iH T HZpHgiN:gTÝT"

	if isReadableExtractedText(gibberish) {
		t.Fatal("expected gibberish text to be marked unreadable")
	}

	result := markUnreadableDocumentResult(analyzeAnomalies(sanitizeExtractedText(gibberish), "Scan Web"))
	if strings.Contains(result.summary, "jgi\\YT") {
		t.Fatalf("summary leaked gibberish text: %s", result.summary)
	}
	if result.documentType != "Dokumen tidak terbaca" {
		t.Fatalf("expected unreadable document type, got %s", result.documentType)
	}
	if result.isKNMPRelated {
		t.Fatal("unreadable document should not be marked KNMP related")
	}
}

func TestParseAIAnalysisJSONIncludesTargetModuleAndDraftInput(t *testing.T) {
	raw := `{
		"risk_level":"sedang",
		"risk_score":55,
		"summary":"Dokumen laporan mingguan memuat progres dan tenaga kerja.",
		"findings":["Ada deviasi progres"],
		"recommendations":["Review bukti foto"],
		"target_module":"laporan",
		"draft_input":{"tanggal":"2026-08-31","jenis_laporan":"mingguan","jumlah_tenaga_kerja":20},
		"extracted_facts":["Tanggal terdeteksi 2026-08-31"]
	}`

	result, err := parseAIAnalysisJSON(raw)
	if err != nil {
		t.Fatalf("expected valid provider json, got error: %v", err)
	}
	if result.targetModule != "laporan" {
		t.Fatalf("expected target module laporan, got %s", result.targetModule)
	}
	if result.draftInput["jenis_laporan"] != "mingguan" {
		t.Fatalf("expected draft jenis_laporan, got %#v", result.draftInput["jenis_laporan"])
	}
	if len(result.extractedFacts) != 1 {
		t.Fatalf("expected extracted facts, got %#v", result.extractedFacts)
	}
}

func TestNormalizeAIProvider(t *testing.T) {
	tests := map[string]string{
		"Codex":         "codex",
		"openai":        "codex",
		"DeepSeek":      "deepseek",
		"google gemini": "gemini",
		"Anthropic":     "claude",
		"unknown-model": "rule_based",
		"":              "rule_based",
	}

	for input, expected := range tests {
		if got := normalizeAIProvider(input); got != expected {
			t.Fatalf("provider %q expected %q, got %q", input, expected, got)
		}
	}
}

func TestParseAIAnalysisJSONFromProviderResponse(t *testing.T) {
	raw := "```json\n{\"risk_level\":\"tinggi\",\"risk_score\":82,\"summary\":\"Pekerjaan perlu perhatian karena deviasi progres besar.\",\"findings\":[\"Realisasi jauh di bawah rencana\"],\"recommendations\":[\"Minta klarifikasi kontraktor\"]}\n```"

	result, err := parseAIAnalysisJSON(raw)
	if err != nil {
		t.Fatalf("expected valid provider json, got error: %v", err)
	}
	if result.riskLevel != "tinggi" {
		t.Fatalf("expected risk level tinggi, got %s", result.riskLevel)
	}
	if result.riskScore != 82 {
		t.Fatalf("expected score 82, got %d", result.riskScore)
	}
	if result.summary == "" {
		t.Fatal("expected provider summary")
	}
	if len(result.findings) != 1 || len(result.recommendations) != 1 {
		t.Fatal("expected provider findings and recommendations")
	}
}
