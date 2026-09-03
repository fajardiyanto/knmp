import React, { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import ExcelJS from "exceljs";
import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  ClipboardCheck,
  Download,
  Eye,
  FileSpreadsheet,
  FileText,
  Gauge,
  Pencil,
  PieChart,
  Plus,
  Search,
  ShieldCheck,
  Square,
  CheckSquare,
  Target,
  Trash2,
  TrendingDown,
  X,
  ZoomIn,
} from "lucide-react";
import { SearchableSelect } from "../../../components/ui/SearchableSelect";
import { getFileUrl } from "../../../lib/api-client";
import { useAlert } from "../../../context/AlertContext";
import { formatDate } from "../../../lib/utils";
import { useAuth } from "../../auth/hooks/useAuth";
import { fetchKnmpList } from "../../knmp/api";
import {
  deleteWeeklyBOQ,
  fetchWeeklyBOQDetail,
  fetchWeeklyBOQList,
  fetchWeeklyBOQStats,
  updateWeeklyBOQStatus,
} from "../api";
import type { WeeklyBOQControl } from "../types";

const formatPct = (value?: number) => `${Number(value || 0).toFixed(2)}%`;
const formatRp = (value?: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
const num = (value?: number) => Number(value || 0);

type ManualColumn = {
  id: string;
  label: string;
  kind?: "text" | "money";
};

type ManualImage = {
  name: string;
  data_url: string;
};

type ManualRow = {
  id: string;
  kind?: "section" | "item" | "total";
  cells?: Record<string, string>;
  placeholders?: Record<string, string>;
  images?: ManualImage[];
};

type ManualTableState = {
  columns?: ManualColumn[];
  rows?: ManualRow[];
};

type ManualTablesPayload = {
  lampiran_2?: ManualTableState;
  lampiran_3?: ManualTableState;
  lampiran_4?: ManualTableState;
};

type FollowUpRecommendation = {
  title: string;
  detail: string;
  tone: "danger" | "warning" | "info" | "success";
};

type EvidencePreview = {
  key: string;
  lampiran: string;
  title: string;
  image: ManualImage;
};

const emptyManualTables: Required<ManualTablesPayload> = {
  lampiran_2: {
    columns: [
      { id: "no", label: "No" },
      { id: "uraian", label: "Uraian Pekerjaan" },
      { id: "sat", label: "Sat" },
      { id: "volume", label: "Volume" },
      { id: "nilai", label: "Nilai Total Kontrak", kind: "money" },
      { id: "rab", label: "RAB" },
      { id: "spek", label: "Gambar/RKS/Spektek" },
      { id: "terpasang", label: "Terpasang" },
      { id: "keterangan", label: "Keterangan" },
    ],
    rows: [],
  },
  lampiran_3: {
    columns: [
      { id: "no", label: "No" },
      { id: "uraian", label: "Uraian Pekerjaan" },
      { id: "kondisi", label: "Kondisi/Foto" },
      { id: "keterangan", label: "Keterangan" },
    ],
    rows: [],
  },
  lampiran_4: {
    columns: [
      { id: "no", label: "No" },
      { id: "uraian", label: "Uraian Pekerjaan" },
      { id: "kontrak_awal", label: "Kontrak Awal (Rp)", kind: "money" },
      { id: "cco3", label: "CCO3 (Rp)", kind: "money" },
      { id: "rencana_mc100", label: "Rencana MC-100 (Rp)", kind: "money" },
      { id: "tambah", label: "Pekerjaan Tambah (Rp)", kind: "money" },
      { id: "kurang", label: "Pekerjaan Kurang (Rp)", kind: "money" },
    ],
    rows: [],
  },
};

const evidenceLabel = (status: string) => {
  if (status === "complete") return "Lengkap";
  if (status === "partial") return "Sebagian";
  return "Belum Ada";
};

const statusLabel = (status?: string) => {
  if (status === "closed") return "Selesai";
  if (status === "in_review") return "Review";
  return "Open";
};

const useReportMath = (control?: WeeklyBOQControl) =>
  useMemo(() => {
    const rows = control?.items || [];
    const totalContract = rows.reduce((sum, item) => sum + num(item.contract_value), 0);
    const realizationValue = rows.reduce((sum, item) => sum + (num(item.actual_value) || (num(item.contract_value) * num(item.evidence_supported_pct)) / 100), 0);
    const planValue = totalContract;
    const itemPlanTotal = rows.reduce((sum, item) => sum + num(item.plan_pct), 0);
    const actual = control?.evidence_supported_pct || 0;
    const claim = control?.contractor_claim_pct || itemPlanTotal;
    const delta = actual - claim;
    const remaining = Math.max(totalContract - realizationValue, 0);
    const critical = rows.filter((item) => item.risk_level === "kritis" || item.deviation_pct < -5);
    const partialEvidence = rows.filter((item) => item.evidence_status !== "complete");
    return { rows, totalContract, realizationValue, planValue, itemPlanTotal, actual, claim, delta, remaining, critical, partialEvidence };
  }, [control]);

const buildFollowUpRecommendations = (report: ReturnType<typeof useReportMath>): FollowUpRecommendation[] => {
  const rows = report.rows;
  if (rows.length === 0) {
    return [{
      title: "Data BOQ belum tersedia",
      detail: "Isi item pada Lampiran 1 terlebih dahulu supaya sistem bisa menghitung kekurangan dan tindak lanjut.",
      tone: "info",
    }];
  }

  const evidenceGaps = rows
    .map((item) => ({
      item,
      gapPct: Math.max(num(item.contractor_claim_pct) - num(item.evidence_supported_pct), 0),
    }))
    .filter(({ item, gapPct }) => item.evidence_status !== "complete" || gapPct > 0)
    .sort((a, b) => b.gapPct - a.gapPct);

  const negativeDeviations = rows
    .filter((item) => num(item.deviation_pct) < 0)
    .sort((a, b) => num(a.deviation_pct) - num(b.deviation_pct));

  const valueShortfalls = rows
    .map((item) => {
      const gapPct = Math.max(num(item.contractor_claim_pct) - num(item.evidence_supported_pct), 0);
      return { item, value: (num(item.contract_value) * gapPct) / 100 };
    })
    .filter(({ value }) => value > 0)
    .sort((a, b) => b.value - a.value);

  const recommendations: FollowUpRecommendation[] = [];
  if (evidenceGaps.length > 0) {
    const top = evidenceGaps[0];
    const missingValue = (num(top.item.contract_value) * top.gapPct) / 100;
    recommendations.push({
      title: `Evidence kurang: ${top.item.item_code} - ${top.item.item_name}`,
      detail: `Di Lampiran 1 kolom Hasil Cek Fisik/Evidence masih kurang ${formatPct(top.gapPct)} dari klaim. Lengkapi foto/dokumen pendukung atau turunkan nilai cek fisik; estimasi nilai yang belum didukung ${formatRp(missingValue)}. Total item serupa: ${evidenceGaps.length}.`,
      tone: "danger",
    });
  }
  if (negativeDeviations.length > 0) {
    const worst = negativeDeviations[0];
    recommendations.push({
      title: `Deviasi negatif terbesar: ${worst.item_code} - ${worst.item_name}`,
      detail: `Cek ulang volume terpasang pada Lampiran 1 baris kode ${worst.item_code}. Deviasi saat ini ${formatPct(worst.deviation_pct)}, berarti hasil cek fisik lebih rendah dari progres yang diklaim.`,
      tone: "warning",
    });
  }
  if (valueShortfalls.length > 0) {
    const largest = valueShortfalls[0];
    recommendations.push({
      title: `Selisih nilai terbesar: ${largest.item.item_code} - ${largest.item.item_name}`,
      detail: `Prioritaskan klarifikasi pada item ini karena nilai kurangnya paling besar, yaitu ${formatRp(largest.value)}. Periksa kolom Laporan Kemajuan dan Hasil Cek Fisik di Lampiran 1.`,
      tone: "warning",
    });
  }
  if (report.delta < 0) {
    recommendations.push({
      title: "Klaim belum selaras dengan cek fisik",
      detail: `Total klaim laporan lebih tinggi ${formatPct(Math.abs(report.delta))} dibanding hasil cek fisik. Sesuaikan item yang belum punya bukti sebelum laporan dipindahkan ke status selesai.`,
      tone: "info",
    });
  }
  if (report.critical.length > 0) {
    recommendations.push({
      title: "Ada item risiko kritis",
      detail: `${report.critical.length} item masih bertanda kritis. Review catatan item dan lengkapi tindak lanjut sebelum laporan dinyatakan siap audit.`,
      tone: "danger",
    });
  }

  return recommendations.length > 0
    ? recommendations.slice(0, 4)
    : [{
      title: "Tidak ada kekurangan utama",
      detail: "Evidence dan progres sudah selaras berdasarkan data BOQ saat ini; laporan dapat dilanjutkan ke proses review.",
      tone: "success",
    }];
};

const collectManualEvidence = (tables: Required<ManualTablesPayload>): EvidencePreview[] => {
  const sources: Array<[keyof Required<ManualTablesPayload>, string]> = [
    ["lampiran_2", "Lampiran 2"],
    ["lampiran_3", "Lampiran 3"],
    ["lampiran_4", "Lampiran 4"],
  ];

  return sources.flatMap(([tableKey, label]) =>
    (tables[tableKey].rows || []).flatMap((row) => {
      const images = row.images || [];
      if (images.length === 0) return [];
      const title = row.cells?.uraian || row.placeholders?.uraian || row.cells?.keterangan || label;
      return images.map((image, index) => ({
        key: `${tableKey}-${row.id}-${index}`,
        lampiran: label,
        title,
        image,
      }));
    })
  );
};

const escapeHtml = (value: unknown) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const fileNameSafe = (value?: string) =>
  (value || "laporan-boq").replace(/[\\/:*?"<>|]+/g, "-").replace(/\s+/g, "-").toLowerCase();

const downloadBlob = (content: BlobPart, filename: string, type: string) => {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

const manualTableHtml = (title: string, table: ManualTableState) => {
  const columns = table.columns || [];
  const rows = table.rows || [];
  const header = columns.map((column) => `<th>${escapeHtml(column.label)}</th>`).join("");
  const body = rows.length === 0
    ? `<tr><td colspan="${Math.max(columns.length, 1)}">Belum ada data lampiran.</td></tr>`
    : rows.map((row) => {
      if (row.kind === "section") {
        return `<tr class="section"><td>${escapeHtml(row.cells?.no || "")}</td><td colspan="${Math.max(columns.length - 1, 1)}">${escapeHtml(row.cells?.uraian || "")}</td></tr>`;
      }
      return `<tr>${columns.map((column) => {
        const value = manualCellValue(row, column);
        const images = row.images?.length && ["kondisi", "keterangan"].includes(column.id)
          ? row.images.map((image) => `<img src="${escapeHtml(getFileUrl(image.data_url))}" alt="${escapeHtml(image.name)}" />`).join("")
          : "";
        return `<td>${escapeHtml(value)}${images}</td>`;
      }).join("")}</tr>`;
    }).join("");
  return `<h2>${escapeHtml(title)}</h2><table><thead><tr>${header}</tr></thead><tbody>${body}</tbody></table>`;
};

const buildExportHtml = (
  control: WeeklyBOQControl,
  report: ReturnType<typeof useReportMath>,
  tables: Required<ManualTablesPayload>,
  recommendations: FollowUpRecommendation[],
) => {
  const itemRows = report.rows.map((item, index) => {
    const planValue = num(item.contract_value);
    const actualValue = num(item.actual_value) || (num(item.contract_value) * num(item.evidence_supported_pct)) / 100;
    return `
      <tr>
        <td>${index + 1}</td>
        <td>${escapeHtml(item.item_code)}</td>
        <td>${escapeHtml(item.item_name)}</td>
        <td>${escapeHtml(item.unit)}</td>
        <td>${formatPct(item.weight_pct)}</td>
        <td>${formatPct(item.plan_pct)}</td>
        <td>${formatRp(planValue)}</td>
        <td>${formatPct(item.evidence_supported_pct)}</td>
        <td>${formatRp(actualValue)}</td>
        <td>${formatPct(item.deviation_pct)}</td>
        <td>${formatRp(actualValue - planValue)}</td>
      </tr>
    `;
  }).join("");

  const recommendationRows = recommendations.map((item, index) => `<tr><td>${index + 1}</td><td>${escapeHtml(item.title)}</td><td>${escapeHtml(item.detail)}</td></tr>`).join("");

  return `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>${escapeHtml(control.title)}</title>
        <style>
          body { font-family: Arial, sans-serif; color: #0f172a; margin: 24px; }
          h1 { font-size: 18px; margin: 0 0 6px; }
          h2 { font-size: 14px; margin: 20px 0 8px; }
          p { font-size: 11px; margin: 3px 0; }
          table { border-collapse: collapse; width: 100%; margin-bottom: 14px; page-break-inside: auto; }
          th, td { border: 1px solid #94a3b8; padding: 5px; font-size: 10px; vertical-align: top; }
          th { background: #e2e8f0; font-weight: 700; text-transform: uppercase; }
          .section td { background: #f1f5f9; font-weight: 700; text-transform: uppercase; }
          img { display: block; max-width: 180px; max-height: 140px; margin-top: 6px; object-fit: contain; }
          @media print { body { margin: 12mm; } button { display: none; } }
        </style>
      </head>
      <body>
        <h1>${escapeHtml(control.title)}</h1>
        <p>Periode: ${escapeHtml(formatDate(control.week_start))} s.d. ${escapeHtml(formatDate(control.week_end))}</p>
        <p>Titik: ${escapeHtml(control.knmp_name || "-")} - ${escapeHtml(control.regency_name || "-")}, ${escapeHtml(control.province_name || "-")}</p>
        <h2>Lampiran 1. Pemantauan Progress Berbasis BOQ</h2>
        <table>
          <thead>
            <tr><th>No</th><th>Kode</th><th>Uraian Pekerjaan</th><th>Sat</th><th>Bobot Kontrak</th><th>Laporan Bobot</th><th>Laporan Nilai</th><th>Cek Fisik Bobot</th><th>Cek Fisik Nilai</th><th>Selisih Bobot</th><th>Selisih Nilai</th></tr>
          </thead>
          <tbody>${itemRows || `<tr><td colspan="11">Belum ada item BOQ.</td></tr>`}</tbody>
        </table>
        ${manualTableHtml("Lampiran 2. Rincian Material Terpasang/Hasil Uji Material Tidak Sesuai Spesifikasi Teknis", tables.lampiran_2)}
        ${manualTableHtml("Lampiran 3. Pekerjaan Terpasang Tidak Sesuai Perencanaan atau Terdapat Cacat", tables.lampiran_3)}
        ${manualTableHtml("Lampiran 4. Rincian Rencana Pekerjaan Tambah Kurang", tables.lampiran_4)}
        <h2>Rekomendasi & Tindak Lanjut</h2>
        <table><thead><tr><th>No</th><th>Temuan</th><th>Tindak Lanjut</th></tr></thead><tbody>${recommendationRows}</tbody></table>
      </body>
    </html>
  `;
};

// Helper: compute max content width for auto-column sizing
const autoColWidths = (rows: (string | number | undefined)[][], headers: string[]): number[] =>
  headers.map((h, i) => {
    const maxData = rows.reduce((max, row) => Math.max(max, String(row[i] ?? "").length), 0);
    return Math.min(Math.max(h.length, maxData) + 4, 60);
  });

// Helper: base64 data URL → Uint8Array buffer
const dataUrlToBuffer = (dataUrl: string): Uint8Array => {
  const base64 = dataUrl.split(",")[1] || "";
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
};

const exportBOQToExcel = async (
  control: WeeklyBOQControl,
  report: ReturnType<typeof useReportMath>,
  tables: Required<ManualTablesPayload>,
  recommendations: FollowUpRecommendation[],
) => {
  const wb = new ExcelJS.Workbook();
  wb.creator = "KNMP v2";
  wb.created = new Date();

  const headerFill: ExcelJS.Fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E3A5F" } };
  const headerFont: Partial<ExcelJS.Font> = { bold: true, color: { argb: "FFFFFFFF" }, size: 10 };
  const borderThin: Partial<ExcelJS.Borders> = {
    top: { style: "thin" }, bottom: { style: "thin" },
    left: { style: "thin" }, right: { style: "thin" },
  };

  const applyHeader = (ws: ExcelJS.Worksheet, headers: string[]) => {
    const row = ws.getRow(1);
    headers.forEach((h, i) => {
      const cell = row.getCell(i + 1);
      cell.value = h;
      cell.font = headerFont;
      cell.fill = headerFill;
      cell.border = borderThin;
      cell.alignment = { vertical: "middle", wrapText: true };
    });
    row.height = 28;
    ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: headers.length } };
  };

  const applyColWidths = (ws: ExcelJS.Worksheet, widths: number[]) => {
    widths.forEach((w, i) => { ws.getColumn(i + 1).width = w; });
  };

  // ── Sheet 1: Lampiran 1 – BOQ
  const ws1 = wb.addWorksheet("Lampiran 1");
  ws1.views = [{ state: "frozen", ySplit: 1 }];
  const l1Headers = ["No", "Kode", "Uraian Pekerjaan", "Sat", "Bobot Kontrak (%)", "Laporan Bobot (%)", "Laporan Nilai (Rp)", "Cek Fisik Bobot (%)", "Cek Fisik Nilai (Rp)", "Selisih Bobot (%)", "Selisih Nilai (Rp)"];
  applyHeader(ws1, l1Headers);
  const l1DataRows = report.rows.map((item, idx) => {
    const planValue = num(item.contract_value);
    const actualValue = num(item.actual_value) || (num(item.contract_value) * num(item.evidence_supported_pct)) / 100;
    return [idx + 1, item.item_code, item.item_name, item.unit, num(item.weight_pct), num(item.plan_pct), planValue, num(item.evidence_supported_pct), actualValue, num(item.deviation_pct), actualValue - planValue];
  });
  l1DataRows.forEach((dataRow, ri) => {
    const row = ws1.addRow(dataRow);
    row.height = 20;
    row.eachCell((cell) => {
      cell.border = borderThin;
      cell.alignment = { vertical: "middle" };
      if (ri % 2 === 1) cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF8FAFC" } };
    });
    // Currency columns (Rp)
    [7, 9, 11].forEach((colIdx) => { row.getCell(colIdx).numFmt = '#,##0'; });
  });
  applyColWidths(ws1, autoColWidths(l1DataRows as (string|number)[][], l1Headers));

  // ── Sheets 2-4: Manual Lampiran (with images)
  const lampiranKeys = ["lampiran_2", "lampiran_3", "lampiran_4"] as const;
  for (let li = 0; li < lampiranKeys.length; li++) {
    const key = lampiranKeys[li];
    const table = tables[key];
    const cols = table.columns || [];
    const allRows = table.rows || [];
    const sheetName = `Lampiran ${li + 2}`;
    const ws = wb.addWorksheet(sheetName);
    ws.views = [{ state: "frozen", ySplit: 1 }];

    const colLabels = cols.map((c) => c.label);
    applyHeader(ws, colLabels);
    applyColWidths(ws, cols.map((c) => (c.id === "uraian" ? 48 : c.id === "keterangan" ? 36 : c.id === "kondisi" ? 28 : 16)));

    let excelRow = 2;
    for (const row of allRows) {
      const isSection = row.kind === "section";
      const rowValues = cols.map((col) => manualCellValue(row, col));
      const exRow = ws.getRow(excelRow);
      rowValues.forEach((val, ci) => {
        const cell = exRow.getCell(ci + 1);
        cell.value = val || "";
        cell.border = borderThin;
        cell.alignment = { vertical: "top", wrapText: true };
        if (isSection) {
          cell.font = { bold: true };
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE2E8F0" } };
        }
      });

      // Embed images
      const images = row.images || [];
      if (images.length > 0 && !isSection) {
        const imgColIdx = cols.findIndex((c) => ["kondisi", "keterangan"].includes(c.id));
        const imgColExcel = imgColIdx >= 0 ? imgColIdx + 1 : cols.length;
        const rowHeight = 100; // px per image
        exRow.height = rowHeight;
        for (let imgIdx = 0; imgIdx < Math.min(images.length, 3); imgIdx++) {
          const img = images[imgIdx];
          try {
            let imageId: number;
            if (img.data_url.startsWith("data:")) {
              const ext = img.data_url.startsWith("data:image/png") ? "png" : "jpeg";
              imageId = wb.addImage({ base64: img.data_url.split(",")[1] || "", extension: ext });
            } else {
              const fullUrl = getFileUrl(img.data_url);
              const resp = await fetch(fullUrl);
              const arrayBuf = await resp.arrayBuffer();
              const ext = fullUrl.endsWith(".png") ? "png" : "jpeg";
              imageId = wb.addImage({ buffer: arrayBuf, extension: ext });
            }
            ws.addImage(imageId, {
              tl: { col: imgColExcel - 1 + imgIdx * 0.34, row: excelRow - 1 },
              ext: { width: 90, height: 90 },
            });
          } catch (_) { /* skip broken images */ }
        }
      } else {
        exRow.height = 22;
      }
      excelRow++;
    }
  }

  // ── Sheet 5: Rekomendasi
  const wsRec = wb.addWorksheet("Rekomendasi");
  wsRec.views = [{ state: "frozen", ySplit: 1 }];
  const recHeaders = ["No", "Temuan", "Detail Tindak Lanjut", "Prioritas"];
  applyHeader(wsRec, recHeaders);
  applyColWidths(wsRec, [6, 44, 70, 14]);
  recommendations.forEach((r, idx) => {
    const row = wsRec.addRow([idx + 1, r.title, r.detail, r.tone]);
    row.height = 36;
    row.eachCell((cell) => {
      cell.border = borderThin;
      cell.alignment = { vertical: "top", wrapText: true };
    });
    const toneColor: Record<string, string> = { danger: "FFFEE2E2", warning: "FFFEF9C3", success: "FFD1FAE5", info: "FFDBEAFE" };
    const bg = toneColor[r.tone] || "FFFFFFFF";
    row.eachCell((cell) => { cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: bg } }; });
  });

  // ── Write file
  const buf = await wb.xlsx.writeBuffer();
  downloadBlob(buf, `${fileNameSafe(control.title)}.xlsx`, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
};

const exportBOQToPDF = (control: WeeklyBOQControl, report: ReturnType<typeof useReportMath>, tables: Required<ManualTablesPayload>, recommendations: FollowUpRecommendation[]) => {
  const popup = window.open("", "_blank");
  if (!popup) return;
  popup.document.open();
  popup.document.write(buildExportHtml(control, report, tables, recommendations));
  popup.document.close();
  popup.focus();
  window.setTimeout(() => popup.print(), 400);
};

const getManualTables = (control?: WeeklyBOQControl): Required<ManualTablesPayload> => {
  const tables = (control?.manual_tables || {}) as ManualTablesPayload;
  return {
    lampiran_2: { ...emptyManualTables.lampiran_2, ...(tables.lampiran_2 || {}) },
    lampiran_3: { ...emptyManualTables.lampiran_3, ...(tables.lampiran_3 || {}) },
    lampiran_4: { ...emptyManualTables.lampiran_4, ...(tables.lampiran_4 || {}) },
  };
};

const manualCellValue = (row: ManualRow, column: ManualColumn) => {
  const value = row.cells?.[column.id] || row.placeholders?.[column.id] || "";
  if (!value || column.kind !== "money") return value;
  const parsed = Number(String(value).replace(/[^\d-]/g, ""));
  return Number.isFinite(parsed) && parsed !== 0 ? formatRp(parsed) : value;
};

const ManualTablePreview: React.FC<{ title: string; table: ManualTableState; groupedSpec?: boolean; onPreviewImage?: (image: ManualImage, title: string) => void }> = ({ title, table, groupedSpec, onPreviewImage }) => {
  const columns = table.columns || [];
  const rows = table.rows || [];
  const specColumns = columns.filter((column) => ["rab", "spek", "terpasang"].includes(column.id));
  const leadingColumns = groupedSpec ? columns.filter((column) => !["rab", "spek", "terpasang", "keterangan"].includes(column.id)) : columns;
  const trailingColumn = groupedSpec ? columns.find((column) => column.id === "keterangan") : undefined;
  const hasImages = (row: ManualRow, column: ManualColumn) => row.images?.length && ["kondisi", "keterangan"].includes(column.id);

  return (
    <div className="rounded-xl border border-slate-200 bg-white">
      <div className="border-b border-slate-100 px-4 py-3">
        <h2 className="text-sm font-black text-blue-950">{title}</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-[1120px] w-full border-collapse text-left text-xs">
          <thead className="bg-slate-50 text-[10px] uppercase text-blue-950">
            {groupedSpec ? (
              <>
                <tr>
                  {leadingColumns.map((column) => (
                    <th key={column.id} rowSpan={2} className="border border-slate-200 px-3 py-3">{column.label}</th>
                  ))}
                  <th colSpan={specColumns.length} className="border border-slate-200 px-3 py-2 text-center">Spesifikasi Teknis</th>
                  {trailingColumn && <th rowSpan={2} className="border border-slate-200 px-3 py-3">{trailingColumn.label}</th>}
                </tr>
                <tr>
                  {specColumns.map((column) => (
                    <th key={column.id} className="border border-slate-200 px-3 py-2">{column.label}</th>
                  ))}
                </tr>
              </>
            ) : (
              <tr>
                {columns.map((column) => (
                  <th key={column.id} className={`border border-slate-200 px-3 py-3 ${column.id === "kondisi" ? "w-[30%]" : ""}`}>{column.label}</th>
                ))}
              </tr>
            )}
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={Math.max(columns.length, 1)} className="border border-slate-200 px-3 py-5 text-center text-xs font-semibold text-slate-400">Belum ada data lampiran.</td>
              </tr>
            ) : (
              rows.map((row) => {
                if (row.kind === "section") {
                  const noValue = row.cells?.no || "";
                  const titleValue = row.cells?.uraian || "";
                  return (
                    <tr key={row.id} className="bg-slate-100 font-black uppercase text-blue-950">
                      <td className="border border-slate-300 px-3 py-2 text-center">{noValue}</td>
                      <td colSpan={Math.max(columns.length - 1, 1)} className="border border-slate-300 px-3 py-2">{titleValue}</td>
                    </tr>
                  );
                }

                return (
                  <tr key={row.id} className={row.kind === "total" ? "bg-slate-100 font-black" : "align-top"}>
                    {columns.map((column) => {
                      const value = manualCellValue(row, column);
                      const isPlaceholder = !row.cells?.[column.id] && !!row.placeholders?.[column.id];
                      return (
                        <td key={column.id} className={`border border-slate-200 px-3 py-3 ${column.kind === "money" ? "text-right font-bold" : ""}`}>
                          {value && <div className={isPlaceholder ? "text-slate-400" : "text-slate-800"}>{value}</div>}
                          {hasImages(row, column) && (
                            <div className="mt-2 grid grid-cols-2 gap-2">
                              {row.images!.map((image, index) => (
                                <button key={`${image.name}-${index}`} type="button" onClick={() => onPreviewImage?.(image, row.cells?.uraian || row.placeholders?.uraian || image.name)} className="group relative overflow-hidden rounded-md border border-slate-200 bg-slate-50">
                                  <img src={getFileUrl(image.data_url)} alt={image.name} className="max-h-40 w-full object-cover transition-transform group-hover:scale-[1.03]" />
                                  <span className="absolute inset-0 hidden items-center justify-center bg-slate-950/35 text-white group-hover:flex">
                                    <Eye className="h-5 w-5" />
                                  </span>
                                </button>
                              ))}
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const MiniCurve: React.FC<{ plan: number; actual: number }> = ({ plan, actual }) => {
  const planY = Math.max(14, 112 - Math.min(plan, 100));
  const actualY = Math.max(14, 112 - Math.min(actual, 100));
  return (
    <svg viewBox="0 0 280 130" className="h-40 w-full">
      {[0, 25, 50, 75, 100].map((tick) => (
        <g key={tick}>
          <line x1="30" x2="270" y1={112 - tick} y2={112 - tick} stroke="#e2e8f0" strokeWidth="1" />
          <text x="2" y={116 - tick} fontSize="9" fill="#64748b">{tick}%</text>
        </g>
      ))}
      <polyline points={`35,110 75,94 120,76 165,54 215,${planY} 265,${planY - 4}`} fill="none" stroke="#2563eb" strokeWidth="3" />
      <polyline points={`35,112 75,102 120,88 165,68 215,${actualY} 265,${actualY - 2}`} fill="none" stroke="#16a34a" strokeWidth="3" />
      <polyline points="35,116 265,102" fill="none" stroke="#ef4444" strokeWidth="2" strokeDasharray="7 6" />
      <circle cx="215" cy={planY} r="4" fill="#2563eb" />
      <circle cx="215" cy={actualY} r="4" fill="#16a34a" />
    </svg>
  );
};

export const WeeklyBOQPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showAlert, showConfirm } = useAlert();
  const { hasPermission } = useAuth();
  const [search, setSearch] = useState("");
  const [selectedKnmp, setSelectedKnmp] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedControlId, setSelectedControlId] = useState<number | null>(null);
  const [previewImage, setPreviewImage] = useState<{ src: string; name: string; lampiran: string } | null>(null);
  const [itjenChecklist, setItjenChecklist] = useState<Record<string, boolean>>({
    data_akurat: false,
    evidence_lengkap: false,
    audit_trail: false,
    laporan_siap: false,
  });

  const itjenItems = [
    { key: "data_akurat", label: "Data akurat dan valid" },
    { key: "evidence_lengkap", label: "Evidence lengkap" },
    { key: "audit_trail", label: "Audit trail otomatis" },
    { key: "laporan_siap", label: "Laporan siap audit" },
  ];

  const itjenCheckedCount = Object.values(itjenChecklist).filter(Boolean).length;

  const handlePreviewImage = (image: ManualImage, lampiran: string) =>
    setPreviewImage({ src: getFileUrl(image.data_url), name: image.name, lampiran });

  const filterParams = useMemo(
    () => ({ search, status: selectedStatus, knmp_id: selectedKnmp, start_date: startDate, end_date: endDate }),
    [search, selectedStatus, selectedKnmp, startDate, endDate]
  );

  const { data: controls = [], isLoading } = useQuery({
    queryKey: ["weekly-boq", filterParams],
    queryFn: () => fetchWeeklyBOQList(filterParams),
  });
  const { data: stats } = useQuery({
    queryKey: ["weekly-boq-stats", filterParams],
    queryFn: () => fetchWeeklyBOQStats(filterParams),
  });
  const { data: knmpOptions = [] } = useQuery({
    queryKey: ["knmp-options-boq"],
    queryFn: () => fetchKnmpList(),
  });
  const { data: selectedControl } = useQuery({
    queryKey: ["weekly-boq-detail", selectedControlId],
    queryFn: () => fetchWeeklyBOQDetail(selectedControlId!),
    enabled: selectedControlId !== null,
  });

  const activeControls = Array.isArray(controls) ? controls : [];

  useEffect(() => {
    if (activeControls.length === 0) {
      if (selectedControlId !== null) setSelectedControlId(null);
      return;
    }
    if (selectedControlId && !activeControls.some((control) => control.id === selectedControlId)) {
      setSelectedControlId(null);
    }
  }, [activeControls, selectedControlId]);

  const report = useReportMath(selectedControl);
  const manualTables = useMemo(() => getManualTables(selectedControl), [selectedControl]);
  const recommendations = useMemo(() => buildFollowUpRecommendations(report), [report]);
  const evidencePreviews = useMemo(() => collectManualEvidence(manualTables), [manualTables]);

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => updateWeeklyBOQStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["weekly-boq"] });
      queryClient.invalidateQueries({ queryKey: ["weekly-boq-detail"] });
      queryClient.invalidateQueries({ queryKey: ["weekly-boq-stats"] });
      showAlert({ title: "Status Diperbarui", message: "Status kontrol BOQ berhasil disimpan.", type: "success" });
    },
    onError: (err: any) => showAlert({ title: "Gagal", message: err.message || "Gagal memperbarui status BOQ.", type: "error" }),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteWeeklyBOQ,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["weekly-boq"] });
      queryClient.invalidateQueries({ queryKey: ["weekly-boq-stats"] });
      setSelectedControlId(null);
      showAlert({ title: "Berhasil Dihapus", message: "Data BOQ weekly berhasil dihapus.", type: "success" });
    },
    onError: (err: any) => showAlert({ title: "Gagal Menghapus", message: err.message || "Gagal menghapus data BOQ.", type: "error" }),
  });

  const topGaps = [...report.rows].sort((a, b) => a.deviation_pct - b.deviation_pct).slice(0, 5);

  return (
    <div className="w-full pb-10 text-slate-900">
      <div className="mb-4 flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-xs lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <div className="relative min-w-[240px] flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari titik, dokumen, item BOQ..." className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-3 text-xs outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
          </div>
          <SearchableSelect value={selectedKnmp} onChange={setSelectedKnmp} options={[{ value: "", label: "Semua Titik KNMP" }, ...knmpOptions.map((k) => ({ value: String(k.id), label: k.name }))]} placeholder="Semua Titik KNMP" searchPlaceholder="Cari titik..." className="w-full sm:w-64" />
          <SearchableSelect value={selectedStatus} onChange={setSelectedStatus} options={[{ value: "", label: "Semua Status" }, { value: "open", label: "Open" }, { value: "in_review", label: "Review" }, { value: "closed", label: "Selesai" }]} placeholder="Semua Status" searchPlaceholder="Cari status..." className="w-full sm:w-44" />
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="rounded-xl border border-slate-200 px-3 py-2.5 text-xs outline-none" />
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="rounded-xl border border-slate-200 px-3 py-2.5 text-xs outline-none" />
        </div>
        <button type="button" onClick={() => navigate("/boq-weekly/create")} className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-blue-700">
          <Plus className="h-4 w-4" /> Input BOQ Mingguan
        </button>
      </div>

      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {[
          { label: "Kontrol BOQ", value: stats?.total_controls || 0, icon: FileSpreadsheet, tone: "text-blue-600 bg-blue-50" },
          { label: "Rata-rata Claim", value: formatPct(stats?.avg_claim_pct), icon: Gauge, tone: "text-violet-600 bg-violet-50" },
          { label: "Verified", value: formatPct(stats?.avg_verified_pct), icon: CheckCircle2, tone: "text-emerald-600 bg-emerald-50" },
          { label: "Item Kritis", value: stats?.critical_items || 0, icon: AlertTriangle, tone: "text-rose-600 bg-rose-50" },
          { label: "Audit Exposure", value: formatRp(stats?.total_exposure_value), icon: ClipboardCheck, tone: "text-amber-600 bg-amber-50" },
        ].map((card) => (
          <div key={card.label} className="flex min-h-[92px] items-start justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-500">{card.label}</p>
              <p className="mt-2 truncate text-lg font-black text-slate-950">{card.value}</p>
            </div>
            <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${card.tone}`}>
              <card.icon className="h-5 w-5" />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[290px_minmax(0,1fr)]">
        <aside className="rounded-xl border border-slate-200 bg-white shadow-xs">
          <div className="border-b border-slate-100 px-4 py-3">
            <h2 className="text-sm font-black text-slate-900">Daftar Laporan BOQ</h2>
            <p className="mt-1 text-xs text-slate-500">{activeControls.length} laporan pada filter aktif</p>
          </div>
          <div className="max-h-[720px] overflow-y-auto">
            {isLoading ? (
              <div className="p-8 text-center text-sm text-slate-400">Memuat data BOQ...</div>
            ) : activeControls.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-400">Belum ada laporan BOQ.</div>
            ) : (
              activeControls.map((control) => (
                <button key={control.id} type="button" onClick={() => setSelectedControlId(control.id)} className={`w-full border-b border-slate-100 p-4 text-left transition-colors hover:bg-slate-50 ${selectedControlId === control.id ? "bg-blue-50" : "bg-white"}`}>
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="line-clamp-2 text-xs font-black text-slate-900">{control.title}</h3>
                    <span className="shrink-0 rounded-full border border-blue-100 bg-blue-50 px-2 py-0.5 text-[10px] font-black text-blue-700">{statusLabel(control.status)}</span>
                  </div>
                  <p className="mt-2 line-clamp-2 text-[11px] leading-relaxed text-slate-500">{control.knmp_name || "Titik KNMP"} - {formatDate(control.week_start)}</p>
                </button>
              ))
            )}
          </div>
        </aside>

        {!selectedControl ? (
          <section className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-400">Pilih laporan BOQ atau buat input baru.</section>
        ) : (
          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
            <div className="border-b border-blue-100 bg-gradient-to-r from-blue-950 via-blue-900 to-slate-900 p-5 text-white">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div className="min-w-0">
                  <div className="mb-2 flex flex-wrap items-center gap-2 text-[11px] font-black uppercase tracking-wide text-blue-100">
                    <span className="rounded-md bg-white/10 px-2 py-1">SIMANDOR 360</span>
                    <span>Laporan Mingguan</span>
                  </div>
                  <h1 className="text-xl font-black leading-tight md:text-2xl">Laporan Pemantauan Progress Berbasis BOQ</h1>
                  <p className="mt-2 text-sm text-blue-50">Periode: {formatDate(selectedControl.week_start)} s.d. {formatDate(selectedControl.week_end)} - Titik: {selectedControl.knmp_name || "-"}</p>
                  <p className="mt-1 text-xs text-blue-100">{selectedControl.regency_name || "-"}, {selectedControl.province_name || "-"}</p>
                </div>
                <div className="grid min-w-[230px] grid-cols-2 gap-2 rounded-xl border border-white/15 bg-white/10 p-3 text-xs">
                  <div><p className="text-blue-100">Status Proyek</p><p className="mt-1 font-black text-emerald-200">{report.critical.length > 0 ? "PERLU AKSI" : "ON TRACK"}</p></div>
                  <div><p className="text-blue-100">Risiko</p><p className="mt-1 font-black text-amber-200">{report.critical.length > 0 ? "SEDANG" : "RENDAH"}</p></div>
                  {hasPermission("boq_update") && (
                    <button type="button" onClick={() => navigate(`/boq-weekly/create?edit=${selectedControl.id}`)} className="col-span-2 mt-1 inline-flex items-center justify-center gap-2 rounded-lg bg-white px-3 py-2 font-bold text-blue-700 hover:bg-blue-50">
                      <Pencil className="h-4 w-4" /> Edit Laporan
                    </button>
                  )}
                  <button type="button" onClick={() => showConfirm({ title: "Hapus BOQ Weekly", message: `Hapus "${selectedControl.title}" beserta item BOQ-nya?`, confirmText: "Hapus", isDestructive: true, onConfirm: () => deleteMutation.mutate(selectedControl.id) })} className="col-span-2 mt-1 inline-flex items-center justify-center gap-2 rounded-lg bg-rose-500 px-3 py-2 font-bold text-white hover:bg-rose-600">
                    <Trash2 className="h-4 w-4" /> Hapus Laporan
                  </button>
                </div>
              </div>
            </div>

            <div className="p-4 lg:p-5">
              <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-6">
                {[
                  { label: "Laporan Kemajuan", value: formatPct(report.claim), helper: formatRp(report.planValue), icon: Gauge },
                  { label: "Hasil Cek Fisik", value: formatPct(report.actual), helper: formatRp(report.realizationValue), icon: BarChart3 },
                  { label: "Selisih Kurang", value: formatPct(report.delta), helper: formatRp(report.realizationValue - report.planValue), icon: TrendingDown },
                  { label: "Claim Kontraktor", value: formatPct(report.claim), helper: "Versi laporan", icon: Target },
                  { label: "Total Nilai Lampiran", value: formatRp(report.totalContract), helper: "Jumlah harga laporan", icon: ClipboardCheck },
                  { label: "Sisa Kontrak", value: formatRp(report.remaining), helper: `${formatPct(report.totalContract ? (report.remaining / report.totalContract) * 100 : 0)}`, icon: PieChart },
                ].map((card) => (
                  <div key={card.label} className="min-h-[110px] rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs font-black uppercase text-blue-950">{card.label}</p>
                        <p className={`mt-2 truncate text-xl font-black ${card.label === "Selisih Bobot" && report.delta < 0 ? "text-rose-600" : "text-slate-950"}`}>{card.value}</p>
                        <p className="mt-1 truncate text-xs font-semibold text-slate-500">{card.helper}</p>
                      </div>
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700"><card.icon className="h-5 w-5" /></div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.55fr)_360px]">
                <div className="rounded-xl border border-slate-200 bg-white">
                  <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                    <h2 className="text-sm font-black text-blue-950">Pemantauan Progress Berbasis BOQ</h2>
                    <span className="text-xs font-bold text-slate-500">{report.rows.length} item pekerjaan</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-[1180px] w-full text-left text-xs">
                      <thead className="bg-slate-50 text-[10px] uppercase text-slate-600">
                        <tr>
                          <th rowSpan={2} className="border-b border-r border-slate-200 px-3 py-3">No</th>
                          <th rowSpan={2} className="border-b border-r border-slate-200 px-3 py-3">Uraian Pekerjaan</th>
                          <th rowSpan={2} className="border-b border-r border-slate-200 px-3 py-3">Sat</th>
                          <th rowSpan={2} className="border-b border-r border-slate-200 px-3 py-3 text-right">Bobot Kontrak</th>
                          <th colSpan={2} className="border-b border-r border-slate-200 bg-blue-600 px-3 py-2 text-center text-white">Laporan Kemajuan Pekerjaan</th>
                          <th colSpan={2} className="border-b border-r border-slate-200 bg-emerald-600 px-3 py-2 text-center text-white">Hasil Cek Fisik</th>
                          <th colSpan={2} className="border-b border-r border-slate-200 bg-rose-600 px-3 py-2 text-center text-white">Selisih Kurang</th>
                        </tr>
                        <tr>
                          <th className="border-b border-r border-slate-200 px-3 py-2 text-right">Bobot</th><th className="border-b border-r border-slate-200 px-3 py-2 text-right">Nilai</th>
                          <th className="border-b border-r border-slate-200 px-3 py-2 text-right">Bobot</th><th className="border-b border-r border-slate-200 px-3 py-2 text-right">Nilai</th>
                          <th className="border-b border-r border-slate-200 px-3 py-2 text-right">Bobot</th><th className="border-b border-r border-slate-200 px-3 py-2 text-right">Nilai</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {report.rows.map((item, index) => {
                          const planValue = num(item.contract_value);
                          const actualValue = num(item.actual_value) || (num(item.contract_value) * num(item.evidence_supported_pct)) / 100;
                          const diffValue = actualValue - planValue;
                          return (
                            <tr key={item.id} className="hover:bg-slate-50/70">
                              <td className="border-r border-slate-100 px-3 py-3 text-center font-bold">{index + 1}</td>
                              <td className="border-r border-slate-100 px-3 py-3"><p className="font-black text-slate-900">{item.item_name}</p><p className="mt-1 text-[11px] text-slate-500">{item.item_code} {item.notes ? `- ${item.notes}` : ""}</p></td>
                              <td className="border-r border-slate-100 px-3 py-3 text-center">{item.unit}</td>
                              <td className="border-r border-slate-100 px-3 py-3 text-right font-bold">{formatPct(item.weight_pct)}</td>
                              <td className="border-r border-slate-100 px-3 py-3 text-right">{formatPct(item.plan_pct)}</td>
                              <td className="border-r border-slate-100 px-3 py-3 text-right">{formatRp(planValue)}</td>
                              <td className="border-r border-slate-100 px-3 py-3 text-right font-bold text-emerald-700">{formatPct(item.evidence_supported_pct)}</td>
                              <td className="border-r border-slate-100 px-3 py-3 text-right">{formatRp(actualValue)}</td>
                              <td className={`border-r border-slate-100 px-3 py-3 text-right font-black ${item.deviation_pct < 0 ? "text-rose-600" : "text-emerald-700"}`}>{formatPct(item.deviation_pct)}</td>
                              <td className={`border-r border-slate-100 px-3 py-3 text-right font-bold ${diffValue < 0 ? "text-rose-600" : "text-emerald-700"}`}>{formatRp(diffValue)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="rounded-xl border border-slate-200 bg-white p-4">
                    <h3 className="text-sm font-black text-blue-950">Kurva S Bobot Kumulatif</h3>
                    <MiniCurve plan={report.claim} actual={report.actual} />
                    <div className="flex gap-4 text-xs font-bold text-slate-600"><span className="text-blue-600">Laporan {formatPct(report.claim)}</span><span className="text-emerald-600">Cek fisik {formatPct(report.actual)}</span></div>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white p-4">
                    <h3 className="mb-3 text-sm font-black text-blue-950">Top 5 Selisih Bobot Terbesar</h3>
                    <div className="space-y-2">
                      {topGaps.map((item, index) => (
                        <div key={item.id} className="grid grid-cols-[22px_1fr_auto] gap-2 text-xs"><span className="font-black text-slate-400">{index + 1}.</span><span className="truncate font-semibold text-slate-700">{item.item_name}</span><span className={item.deviation_pct < 0 ? "font-black text-rose-600" : "font-black text-emerald-700"}>{formatPct(item.deviation_pct)}</span></div>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white p-4">
                    <h3 className="mb-3 text-sm font-black text-blue-950">Status Issue / Temuan</h3>
                    <div className="space-y-2">
                      {(report.critical.length ? report.critical : report.partialEvidence.slice(0, 3)).map((item) => (
                        <div key={item.id} className="rounded-lg bg-slate-50 p-3 text-xs"><p className="font-black text-slate-900">{item.item_code} - {item.item_name}</p><p className="mt-1 text-slate-500">{item.notes || `Evidence ${evidenceLabel(item.evidence_status).toLowerCase()}, deviasi ${formatPct(item.deviation_pct)}.`}</p></div>
                      ))}
                      {report.critical.length === 0 && report.partialEvidence.length === 0 && <p className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs font-bold text-emerald-700">Tidak ada temuan kritis pada item BOQ.</p>}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 space-y-4">
                <ManualTablePreview title="Lampiran 2. Rincian Material Terpasang/Hasil Uji Material Tidak Sesuai Spesifikasi Teknis" table={manualTables.lampiran_2} groupedSpec />
                <ManualTablePreview title="Lampiran 3. Pekerjaan Terpasang Tidak Sesuai Perencanaan atau Terdapat Cacat" table={manualTables.lampiran_3} />
                <ManualTablePreview title="Lampiran 4. Rincian Rencana Pekerjaan Tambah Kurang" table={manualTables.lampiran_4} />
              </div>

              <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-4">
                <div className="rounded-xl border border-slate-200 bg-white p-4 xl:col-span-2">
                  <h3 className="mb-3 text-sm font-black text-blue-950">Dokumentasi Evidence</h3>
                  {evidencePreviews.length === 0 ? (
                    <div className="flex min-h-[150px] flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 text-center">
                      <FileSpreadsheet className="h-8 w-8 text-slate-300" />
                      <p className="mt-3 text-xs font-black text-slate-500">Belum ada gambar evidence yang diupload.</p>
                      <p className="mt-1 max-w-md text-[11px] leading-relaxed text-slate-400">Tambahkan gambar lewat Edit Laporan pada kolom upload di Lampiran 2 atau Lampiran 3. Area ini hanya menampilkan file yang benar-benar tersimpan.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                      {evidencePreviews.slice(0, 8).map((evidence) => (
                        <button
                          key={evidence.key}
                          type="button"
                          onClick={() => handlePreviewImage(evidence.image, evidence.lampiran)}
                          className="group overflow-hidden rounded-lg border border-slate-200 bg-slate-50 text-left transition-all hover:border-blue-300 hover:shadow-md"
                        >
                          <div className="relative aspect-[4/3] overflow-hidden">
                            <img src={getFileUrl(evidence.image.data_url)} alt={evidence.image.name} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                            <div className="absolute inset-0 flex items-center justify-center bg-blue-900/0 transition-all duration-200 group-hover:bg-blue-900/30">
                              <ZoomIn className="h-6 w-6 scale-0 text-white drop-shadow transition-transform duration-200 group-hover:scale-100" />
                            </div>
                          </div>
                          <div className="p-2">
                            <p className="truncate text-[11px] font-black text-slate-900">{evidence.title}</p>
                            <p className="mt-1 text-[10px] font-bold text-emerald-600">{evidence.lampiran}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-4">
                  <h3 className="mb-3 text-sm font-black text-blue-950">Rekomendasi & Tindak Lanjut</h3>
                  <ul className="space-y-3 text-xs">
                    {recommendations.map((item) => (
                      <li key={item.title} className={`rounded-lg border p-3 ${
                        item.tone === "danger" ? "border-rose-200 bg-rose-50 text-rose-800" :
                        item.tone === "warning" ? "border-amber-200 bg-amber-50 text-amber-800" :
                        item.tone === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-800" :
                        "border-blue-100 bg-blue-50 text-blue-800"
                      }`}>
                        <p className="font-black">{item.title}</p>
                        <p className="mt-1 leading-relaxed">{item.detail}</p>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-sm font-black text-blue-950">Checklist Itjen</h3>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                      itjenCheckedCount === itjenItems.length
                        ? "bg-emerald-100 text-emerald-700"
                        : itjenCheckedCount > 0
                        ? "bg-amber-100 text-amber-700"
                        : "bg-slate-100 text-slate-500"
                    }`}>{itjenCheckedCount}/{itjenItems.length}</span>
                  </div>
                  {itjenItems.map(({ key, label }) => {
                    const checked = itjenChecklist[key];
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setItjenChecklist((prev) => ({ ...prev, [key]: !prev[key] }))}
                        className="mb-2 flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs font-bold transition-colors hover:bg-slate-50"
                      >
                        {checked
                          ? <CheckSquare className="h-4 w-4 shrink-0 text-emerald-600" />
                          : <Square className="h-4 w-4 shrink-0 text-slate-300" />}
                        <span className={checked ? "text-emerald-700 line-through" : "text-slate-600"}>{label}</span>
                      </button>
                    );
                  })}
                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      onClick={() => exportBOQToPDF(selectedControl!, report, manualTables, recommendations)}
                      className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700 hover:bg-rose-100 transition-colors"
                    >
                      <FileText className="h-4 w-4" /> PDF
                    </button>
                    <button
                      type="button"
                      onClick={() => exportBOQToExcel(selectedControl!, report, manualTables, recommendations)}
                      className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700 hover:bg-emerald-100 transition-colors"
                    >
                      <Download className="h-4 w-4" /> Excel
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div><p className="text-xs font-black uppercase text-slate-500">Ringkasan Naratif</p><p className="mt-2 text-sm leading-relaxed text-slate-700">{selectedControl.summary || "Belum ada ringkasan naratif."}</p></div>
                  <div className="flex items-center gap-2">
                    {["open", "in_review", "closed"].map((status) => (
                      <button key={status} type="button" onClick={() => statusMutation.mutate({ id: selectedControl.id, status })} className={`rounded-lg border px-3 py-2 text-xs font-black ${selectedControl.status === status ? "border-blue-600 bg-blue-600 text-white" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-100"}`}>{statusLabel(status)}</button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}
      </div>

      {/* Image Lightbox */}
      {previewImage && (
        <div
          className="fixed inset-0 z-[999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200"
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="relative max-w-5xl w-full max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-white/10 backdrop-blur rounded-t-2xl">
              <div className="min-w-0">
                <p className="truncate text-sm font-black text-white">{previewImage.name}</p>
                <p className="text-[11px] font-bold text-emerald-400">{previewImage.lampiran}</p>
              </div>
              <button
                type="button"
                onClick={() => setPreviewImage(null)}
                className="ml-4 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            {/* Image */}
            <div className="bg-black/50 rounded-b-2xl overflow-hidden flex items-center justify-center">
              <img
                src={previewImage.src}
                alt={previewImage.name}
                className="max-h-[80vh] w-auto max-w-full object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
