import React, { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, FileSpreadsheet, Plus, Save, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { SearchableSelect } from "../../../components/ui/SearchableSelect";
import { useAlert } from "../../../context/AlertContext";
import { fetchKnmpList } from "../../knmp/api";
import { createWeeklyBOQ } from "../api";
import type { WeeklyBOQCreateInput, WeeklyBOQItemInput } from "../types";

type BOQFormItem = Required<Omit<WeeklyBOQItemInput, "notes">> & { notes: string };
type MaterialMismatchRow = {
  no: string;
  section: string;
  pekerjaan: string;
  sat: string;
  volume: string;
  nilai: number;
  rab: string;
  spektek: string;
  terpasang: string;
  keterangan: string;
};
type DefectRow = { no: string; section: string; pekerjaan: string; keterangan: string };
type VariationRow = readonly [string, string, number, number, number, number, number];

const emptyBOQItem = (): BOQFormItem => ({
  item_code: "",
  item_name: "",
  unit: "",
  contract_volume: 0,
  contract_value: 0,
  weight_pct: 0,
  plan_pct: 0,
  last_week_actual_pct: 0,
  contractor_claim_pct: 0,
  supervisor_verified_pct: 0,
  evidence_supported_pct: 0,
  deviation_pct: 0,
  actual_value: 0,
  evidence_status: "partial",
  risk_level: "rendah",
  notes: "",
});

const boqTemplateItem = (item_code: string, item_name: string, plan_pct = 0, evidence_supported_pct = 0, notes = ""): BOQFormItem => ({
  ...emptyBOQItem(),
  item_code,
  item_name,
  weight_pct: plan_pct,
  plan_pct,
  contractor_claim_pct: plan_pct,
  supervisor_verified_pct: evidence_supported_pct,
  evidence_supported_pct,
  deviation_pct: evidence_supported_pct - plan_pct,
  notes,
});

const defaultItems: BOQFormItem[] = [
  boqTemplateItem("1.a", "Alat Pemadam Api Ringan (APAR) ; 10 kg", 0.01),
  boqTemplateItem("1.b", "Jalur Evakuasi (Escape Route)", 0.01),
  boqTemplateItem("1.c", "Stamper", 0.02, 0.01),
  boqTemplateItem("1.d", "Mesin las", 0.04, 0.02),
  boqTemplateItem("1.e", "Pekerjaan Kayu Bekesting Sloof", 0.15, 0.13),
  boqTemplateItem("1.f", "Pembesian Besi Beton D 13 - 150 mm", 0.23, 0.19),
  boqTemplateItem("1.g", "Pembesian Besi Beton D 10 - 100 mm", 0.08, 0.07),
  boqTemplateItem("1.h", "Pekerjaan beton semi mekanis setara fc = 20", 0.14, 0.12),
  boqTemplateItem("1.i", "Pekerjaan beton semi mekanis setara fc = 20", 0.03, 0.02),
  boqTemplateItem("2.a", "Pekerjaan Bouwplank dan Uitzet", 0.63, 0.62),
  boqTemplateItem("2.b", "Pekerjaan Galian Tanah sampai dengan 1 m", 0.03, 0.03),
  boqTemplateItem("2.c", "Pekerjaan Cerucuk Kayu Dolken diameter 6 - 8 cm", 0.22, 0.21),
  boqTemplateItem("2.d", "Pekerjaan Urugan Pasir", 0.01, 0.01),
  boqTemplateItem("2.e", "Pekerjaan Lantai Kerja", 0.08),
  boqTemplateItem("2.f", "Pekerjaan Kayu Bekesting Pondasi", 0.05, 0.05),
  boqTemplateItem("2.g", "Pekerjaan Pembesian Besi Beton D 13 mm - 150", 0.27, 0.26),
  boqTemplateItem("2.h", "Pekerjaan Pembesian Besi Beton D 10 mm - 150", 0.09, 0.08),
  boqTemplateItem("2.i", "Pekerjaan beton semi mekanis setara fc = 20", 0.27, 0.26),
  boqTemplateItem("2.j", "Pekerjaan Pemadatan Beton dengan Vibrator", 0.01, 0.01),
  boqTemplateItem("3.a", "Pekerjaan Bekesting Dinding 5 kali pakai (2 sisi)", 0.44, 0.42),
  boqTemplateItem("3.b", "Pek. Pembesian Besi Beton D 13 mm - 150 (Vertikal)", 0.33, 0.32),
  boqTemplateItem("3.c", "Pek. Pembesian Besi Beton D 10 mm - 200 (Horisontal)", 0.09, 0.08),
  boqTemplateItem("3.d", "Pekerjaan beton semi mekanis setara fc = 20", 0.32, 0.3),
  boqTemplateItem("3.e", "Pekerjaan Pemadatan Beton dengan Vibrator", 0.01, 0.01),
  boqTemplateItem("4", "Pekerjaan Cutting Laser ACP ornament motif lokal termasuk rangka hollow", 0.23, 0.22),
  boqTemplateItem("5", "Pekerjaan Lantai Keramik 40x40 cm Matte", 0.17, 0.07),
  boqTemplateItem("6", "Instalasi Saklar Double"),
  boqTemplateItem("7", "Stop Kontak"),
  boqTemplateItem("8", "Pekerjaan Panel Box 3 Phase 380V, 50 Hz", 0.04),
  boqTemplateItem("9", "Laser Cutting ACP Motif Lokal", 0.16, 0.16),
  boqTemplateItem("10", "Pekerjaan Lantai Keramik 40x40 cm Matte", 0.02, 0.01),
  boqTemplateItem("11", "Pekerjaan Lantai Keramik 40x40 cm Polished", 0.19, 0.18),
  boqTemplateItem("12", "Pekerjaan Pagar BRC Galvanis BRC P = 2,4, T = 120 cm, diameter 7 mm termasuk asesoris", 0.16, 0.16),
  boqTemplateItem("13", "Pasang Lampu TL RM TKI 2x LED 18 watt", 0.01),
  boqTemplateItem("14", "Pekerjaan Panel Box 3 Phase 380V, 50 Hz", 0.04),
  boqTemplateItem("15", "Plesteran", 0.22, 0.22),
  boqTemplateItem("16", "Acian Finish", 0.21, 0.21),
  boqTemplateItem("17.a", "Pekerjaan Kusen Aluminium 4 inch", 0.02, 0.02),
  boqTemplateItem("17.b", "Pekerjaan Kusen Aluminium 4 inch", 0.02, 0.02),
  boqTemplateItem("18", "Pekerjaan Pengadaan dan Pemasangan Tangki Toren Kap.600 liter ex.Penguin TD60", 0.03, 0, "Lampiran 2: periksa kapasitas terpasang terhadap RAB/Spektek."),
  boqTemplateItem("19", "Pekerjaan Instalasi TV"),
  boqTemplateItem("20.a", "Pekerjaan Kayu Bekesting Balok", 0.09, 0.08),
  boqTemplateItem("20.b", "Pekerjaan Pembesian Besi Beton diameter 8 - 100", 0.02, 0.02),
  boqTemplateItem("20.c", "Pekerjaan Beton Semi Mekanis setara fc = 20", 0.04, 0.04),
  boqTemplateItem("20.d", "Pekerjaan Pengecoran dengan Concrete Vibrator"),
  boqTemplateItem("21.a", "Pekerjaan Kayu Bekesting Balok", 0.07, 0.07),
  boqTemplateItem("21.b", "Pekerjaan Pembesian Besi Beton Ties D 10 - 200"),
  boqTemplateItem("21.c", "Pekerjaan Pembesian Besi Beton diameter 8 - 100", 0.01, 0.01),
  boqTemplateItem("21.d", "Pekerjaan Beton Semi Mekanis setara fc = 25", 0.03, 0.02),
  boqTemplateItem("21.e", "Pekerjaan Pengecoran dengan Concrete Vibrator"),
  boqTemplateItem("22.a", "Pekerjaan Kayu Bekesting Lantai", 0.12, 0.12),
  boqTemplateItem("22.b", "Pekerjaan Pembesian Besi Wiremesh M8-150, 2 lapis", 0.06, 0.06),
  boqTemplateItem("23", "Pekerjaan Tarik Kabel NYY 2 x 4 (Supreme)", 0.89, 0.32),
  boqTemplateItem("24", "Pekerjaan Sparing Pipa PVC Listrik 3/4 D", 0.41, 0.12),
  boqTemplateItem("25", "Pekerjaan Pengukuran Saluran", 0.01, 0.01),
  boqTemplateItem("26", "Pekerjaan Galian Tanah Saluran sampai dengan 1 m", 0.14, 0.13),
  boqTemplateItem("27", "Pek. Pemadatan Tanah Galian Saluran dengan Stamper", 0.07, 0.06),
  boqTemplateItem("28", "Pekerjaan Saluran Batu Belah 50/40", 0.17, 0.14),
  boqTemplateItem("29", "Pekerjaan Rabat Beton Lantai Saluran Kawasan t = 5 cm", 0.06, 0.06),
  boqTemplateItem("30.a", "Pekerjaan Kayu Bekesting Lantai", 0.22, 0.13),
  boqTemplateItem("30.b", "Pekerjaan Pembesian Besi Beton D 13 mm - 150", 0.57, 0.45),
  boqTemplateItem("30.c", "Pekerjaan Beton Semi Mekanis setara fc = 20", 0.2, 0.12),
  boqTemplateItem("30.d", "Pekerjaan Tutup Bak Kontrol (Steel Gratting) 120x120 cm", 0.15),
  boqTemplateItem("31", "Pekerjaan Pengukuran dan Pematokan Jalan", 0.01, 0.01),
  boqTemplateItem("32", "Pekerjaan Pemadatan Tanah Existing", 0.09, 0.08),
  boqTemplateItem("33", "Pekerjaan Urugan Makadam t = 20 cm", 1.08, 1.05),
  boqTemplateItem("34", "Pekerjaan Pemadatan Makdam", 0.09, 0.08),
  boqTemplateItem("35", "Pekerjaan Urugan Sirtu t = 10 cm", 0.27, 0.26),
  boqTemplateItem("36", "Pekerjaan Pemadatan Sirtu", 0.04, 0.04),
  boqTemplateItem("37.a", "Pekerjaan Kayu Bekesting Sloof", 0.21, 0.21),
  boqTemplateItem("37.b", "Pekerjaan Pembesian Wiremesh M8-150", 1.86, 1.81),
  boqTemplateItem("37.c", "Plastik cor", 0.15, 0.14),
  boqTemplateItem("37.d", "Pekerjaan Tul. Pokok Besi Beton 4 D 13 mm", 0.84, 0.81),
  boqTemplateItem("37.e", "Pekerjaan Dowel Besi Beton D 13 mm - 300", 0.31, 0.3),
  boqTemplateItem("37.f", "Pekerjaan Dowel Besi Beton D 25 mm - 300", 0.9, 0.88),
  boqTemplateItem("37.g", "Pekerjaan Pipa PVC AW diameter 1 Inch", 0.27, 0.26),
  boqTemplateItem("37.h", "Pekerjaan Beton Site Mix mutu f'c = 20 Mpa dengan Concrete Mixer Pump", 2.79, 2.71),
  boqTemplateItem("37.i", "Pekerjaan Pemadatan Beton dengan Vibrator", 0.07, 0.07),
  boqTemplateItem("38", "Pekerjaan Galian Tanah Kanstin", 0.01, 0.01),
  boqTemplateItem("39", "Pekerjaan Lantai Kerja t = 3 cm", 0.02, 0.02),
  boqTemplateItem("40", "Pekerjaan Kanstin 15x25x40 cm", 1.13, 1.09),
  boqTemplateItem("41", "Pekerjaan Urugan Tanah mendatangkan t = 12 cm", 0.25, 0.24),
  boqTemplateItem("42", "Pekerjaan Urugan Sirtu t = 10 cm", 0.11, 0.11),
  boqTemplateItem("43", "Pekerjaan Pemadatan Urugan Sirtu", 0.02, 0.02),
  boqTemplateItem("44", "Pekerjaan Paving Blok t = 6 cm", 0.97, 0.92),
  boqTemplateItem("45", "Pekerjaan Dinding Krawangan GRC Ornament Lokal", 0.07),
  boqTemplateItem("46.a", "Pekerjaan Urugan Tanah Urug t = 25 cm", 0.1, 0.09),
  boqTemplateItem("46.b", "Pekerjaan Urugan Pasir urug t = 5 cm", 0.01, 0.01),
  boqTemplateItem("46.c", "Pekerjaan Lantai Kerja t = 5 cm", 0.08, 0.05),
  boqTemplateItem("46.d", "Pekerjaan Pembesian Wiremesh M8-150", 0.16, 0.08),
  boqTemplateItem("46.e", "Pekerjaan Beton Site Mix setara fc = 20", 0.27, 0.23),
  boqTemplateItem("47", "Lantai kerja", 0.03, 0.02),
  boqTemplateItem("48", "Pekerjaan Cutting Laser ACP ornament motif lokal termasuk rangka hollow", 0.36, 0.15),
  boqTemplateItem("49", "Pekerjaan Floor Hardener", 0.12, 0.09),
  boqTemplateItem("50", "Instalasi Saklar Double"),
  boqTemplateItem("51", "Stop Kontak"),
  boqTemplateItem("52", "Pasang Downlight diameter 5 Inch + LED 9 watt", 0.04),
  boqTemplateItem("53", "Pekerjaan Panel Box 3 Phase 380V, 50 Hz", 0.04),
  boqTemplateItem("54", "Pekerjaan Pasangan Dinding Bata Merah 1 : 5", 0.02, 0.02),
  boqTemplateItem("55", "Pekerjaan Plesteran", 0.02, 0.02),
  boqTemplateItem("56", "Pekerjaan Acian", 0.04, 0.03),
  boqTemplateItem("57", "Pekerjaan Cutting Laser ACP ornament motif lokal termasuk rangka hollow", 0.21, 0.16),
  boqTemplateItem("58.a", "Pekerjaan Plesteran", 0.01),
  boqTemplateItem("58.b", "Pekerjaan Acian", 0.01),
  boqTemplateItem("58.c", "Pekerjaan Lantai Rabat Beton t = 5 cm", 0.12, 0.03),
  boqTemplateItem("59", "Pekerjaan Cat Dinding Luar (sealer+extreme Jotun)", 0.04, 0.04),
  boqTemplateItem("60", "Pekerjaan Cutting Laser ACP ornament motif lokal termasuk rangka hollow", 0.29, 0.18),
  boqTemplateItem("61", "Instalasi Saklar Double"),
  boqTemplateItem("62", "Stop Kontak"),
  boqTemplateItem("63", "Pekerjaan Panel Box 3 Phase 380V, 50 Hz", 0.04),
];

const materialMismatchRows: MaterialMismatchRow[] = [
  {
    no: "XI.31",
    section: "Pekerjaan Bangunan Kantor Pengelola",
    pekerjaan: "Pekerjaan Pengadaan dan Pemasangan Tangki Toren Kap.600 liter ex.Penguin TD60",
    sat: "unit",
    volume: "1.00",
    nilai: 0,
    rab: "Kapasitas 600 liter",
    spektek: "Kapasitas 600 liter",
    terpasang: "Kapasitas 520 liter",
    keterangan: "Terpasang dengan kapasitas di bawah RAB dan Spektek sehingga perlu dilakukan pergantian.",
  },
];

const defectRows: DefectRow[] = [
  { no: "XIX.5", section: "Pekerjaan Bangunan Docking Kapal", pekerjaan: "Pekerjaan Plafond GRC t = 6 mm, termasuk rangka besi hollow 40/40 modul 60x60 cm", keterangan: "Plafond di pinggir pasangan lampu downlight bolong, sehingga perlu dirapikan." },
  { no: "XIX.13", section: "Pekerjaan Bangunan Docking Kapal", pekerjaan: "Pekerjaan Huruf Timbul plate galvanis finish cat duco, DOCKING KAPAL uk. 20x35 cm", keterangan: "Sesuai RAB huruf timbul adalah DOCKING KAPAL, huruf terpasang tidak sesuai, sehingga perlu diganti hurufnya sesuai RAB." },
  { no: "XIX.7", section: "Pekerjaan Bangunan Docking Kapal", pekerjaan: "Pekerjaan Penutup Atap Spandek berpasir t = 0,30 mm", keterangan: "Pekerjaan atap spandek, nok atap, dan lisplank tidak rapi, sehingga perlu dilakukan perapihan kembali." },
  { no: "XIX.8", section: "Pekerjaan Bangunan Docking Kapal", pekerjaan: "Pekerjaan Nok Atap Metal Berpasir", keterangan: "Pekerjaan atap spandek, nok atap, dan lisplank tidak rapi, sehingga perlu dilakukan perapihan kembali." },
  { no: "XIX.9", section: "Pekerjaan Bangunan Docking Kapal", pekerjaan: "Pekerjaan Listplank GRC L = 30 cm, t = 8 mm", keterangan: "Pekerjaan atap spandek, nok atap, dan lisplank tidak rapi, sehingga perlu dilakukan perapihan kembali." },
  { no: "XI.11", section: "Pekerjaan Bangunan Kantor Pengelola", pekerjaan: "Pekerjaan Topi Jendela Beton t = 10 cm", keterangan: "Pekerjaan topi jendela miring dan tidak simetris, sehingga perlu dibongkar dan dibuat ulang." },
  { no: "XI.20", section: "Pekerjaan Bangunan Kantor Pengelola", pekerjaan: "Pekerjaan Huruf Timbul plate galvanis finish cat duco, KANTOR PENGELOLA uk. 20x25 cm", keterangan: "Pekerjaan tulisan huruf KANTOR miring, sehingga perlu dilepas dan pasang ulang dengan rapi." },
  { no: "IX.11", section: "Pekerjaan Bangunan Kios Perbekalan", pekerjaan: "Pekerjaan Topi Beton t = 10 cm", keterangan: "Pekerjaan topi jendela miring dan tidak simetris, sehingga perlu dibongkar dan dibuat ulang." },
  { no: "IX.20", section: "Pekerjaan Bangunan Kios Perbekalan", pekerjaan: "Pekerjaan Huruf Timbul plate galvanis finish cat duco, KIOS PERBEKALAN uk. 20x25 cm", keterangan: "Huruf terpasang KIOS PEMBEKALAN NELAYAN, sesuai RAB seharusnya KIOS PERBEKALAN, sehingga perlu dilepas dan diganti hurufnya sesuai RAB." },
  { no: "IX.14", section: "Pekerjaan Bangunan Kios Perbekalan", pekerjaan: "Pekerjaan Rangka Atap Baja Ringan t = 0,75 mm", keterangan: "Atap terpasang sudah berkarat, sehingga perlu dilakukan pengecatan ulang." },
];

const variationRows: VariationRow[] = [
  ["I", "Pekerjaan Persiapan", 0, 0, 0, 0, 0],
  ["II", "Pekerjaan Revetment", 0, 0, 0, 0, 0],
  ["III", "Pekerjaan Dinding Penahan Tanah", 0, 0, 0, 0, 0],
  ["III.1", "Pekerjaan Turap Beton", 0, 0, 0, 0, 0],
  ["IV", "Pekerjaan Bangunan Shelter Pendaratan Ikan", 0, 0, 0, 0, 0],
  ["IV.1", "Pekerjaan Struktural", 0, 0, 0, 0, 0],
  ["IV.2", "Pekerjaan Arsitektural", 0, 0, 0, 0, 0],
  ["VI", "Pekerjaan Pondasi Pabrik Es Portable", 0, 0, 0, 0, 0],
  ["VII", "Pekerjaan Area Parkir", 0, 0, 0, 0, 0],
  ["XI", "Pekerjaan Bangunan Kantor Pengelola", 0, 0, 0, 0, 0],
  ["XIII", "Pekerjaan Bangunan Tangki Air dan Sumur Bor", 0, 0, 0, 0, 0],
  ["XIV", "Pekerjaan Penerangan Kawasan", 0, 0, 0, 0, 0],
  ["XVI", "Pekerjaan Jalan Lingkungan dan Saluran", 0, 0, 0, 0, 0],
  ["XVIII", "Pekerjaan Levelling Lahan", 0, 0, 0, 0, 0],
  ["XIX", "Pekerjaan Bangunan Docking Kapal", 0, 0, 0, 0, 0],
  ["XX", "Pekerjaan Pagar Kawasan", 0, 0, 0, 0, 0],
  ["XXI", "Pekerjaan Bangunan Shelter Perbaikan Alat Tangkap", 0, 0, 0, 0, 0],
  ["XXII", "Pekerjaan Bangunan Balai Pertemuan Nelayan", 0, 0, 0, 0, 0],
  ["III. TOTAL I + II", "Total", 0, 0, 0, 0, 0],
];

const today = new Date();
const weekStart = new Date(today);
weekStart.setDate(today.getDate() - 6);
const toInputDate = (date: Date) => date.toISOString().slice(0, 10);
const numberValue = (value?: number) => Number(value || 0);
const parseRupiah = (value: string) => Number(value.replace(/[^\d-]/g, "")) || 0;
const formatRupiahInput = (value?: number) =>
  numberValue(value) === 0
    ? ""
    : new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0,
      }).format(numberValue(value));
const formatRupiah = (value?: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(numberValue(value));
const formatRupiahBlank = (value?: number) => (numberValue(value) === 0 ? "" : formatRupiah(value));
const inputNumberValue = (value?: number) => (numberValue(value) === 0 ? "" : String(value));

const splitBOQCode = (code: string) => {
  const [parent = "", child = ""] = code.trim().split(".");
  return { parent, child };
};

const formatBOQCode = (code: string, previousCode?: string) => {
  const { parent, child } = splitBOQCode(code);
  return child ? `${parent}.${child.toUpperCase()}` : parent;
};

export const WeeklyBOQInputPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showAlert } = useAlert();
  const { data: knmpOptions = [] } = useQuery({ queryKey: ["knmp-options-boq-input"], queryFn: () => fetchKnmpList() });
  const [form, setForm] = useState({
    knmp_id: "",
    week_start: toInputDate(weekStart),
    week_end: toInputDate(today),
    title: "",
    source_document: "",
    contractor_claim_pct: 0,
    supervisor_verified_pct: 0,
    evidence_supported_pct: 0,
    audit_exposure_value: 0,
    status: "open",
    summary: "",
  });
  const [items, setItems] = useState<BOQFormItem[]>(defaultItems);

  const totals = useMemo(() => {
    const totalContract = items.reduce((sum, item) => sum + numberValue(item.contract_value), 0);
    const realValue = items.reduce((sum, item) => sum + numberValue(item.actual_value), 0);
    const diffPct = items.reduce((sum, item) => sum + numberValue(item.evidence_supported_pct) - numberValue(item.plan_pct), 0);
    return { totalContract, realValue, diffValue: realValue - totalContract, diffPct };
  }, [items]);

  const createMutation = useMutation({
    mutationFn: createWeeklyBOQ,
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ["weekly-boq"] });
      queryClient.invalidateQueries({ queryKey: ["weekly-boq-stats"] });
      showAlert({ title: "BOQ Disimpan", message: "Input BOQ berhasil dibuat.", type: "success" });
      navigate(`/boq-weekly?selected=${created.id}`);
    },
    onError: (err: any) => showAlert({ title: "Gagal Menyimpan", message: err.message || "Gagal membuat input BOQ.", type: "error" }),
  });

  const updateItem = (index: number, patch: Partial<BOQFormItem>) => {
    setItems((prev) => prev.map((item, idx) => (idx === index ? { ...item, ...patch } : item)));
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const validItems = items.filter((item) => item.item_name.trim());
    if (!form.knmp_id) {
      showAlert({ title: "Titik Belum Dipilih", message: "Pilih titik KNMP terlebih dahulu.", type: "warning" });
      return;
    }
    const payload: WeeklyBOQCreateInput = {
      ...form,
      knmp_id: Number(form.knmp_id),
      items: validItems.map((item) => ({
        ...item,
        weight_pct: numberValue(item.plan_pct),
        contractor_claim_pct: numberValue(item.plan_pct),
        supervisor_verified_pct: numberValue(item.evidence_supported_pct),
        deviation_pct: numberValue(item.evidence_supported_pct) - numberValue(item.plan_pct),
        notes: item.notes || undefined,
      })),
    };
    createMutation.mutate(payload);
  };

  const addItem = () => {
    setItems((prev) => [...prev, emptyBOQItem()]);
  };

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="min-h-screen w-full bg-slate-50 pb-10 text-slate-900">
      <div className="border-b border-slate-200 bg-white px-4 py-3">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-3">
          <button type="button" onClick={() => navigate("/boq-weekly")} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100">
            <ArrowLeft className="h-4 w-4" /> Kembali
          </button>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-black uppercase tracking-wide text-blue-700">Input BOQ & Progress Control</p>
            <h1 className="truncate text-lg font-black text-blue-950">Input Laporan Pemantauan Progress Berbasis BOQ</h1>
          </div>
          <button type="submit" form="weekly-boq-input-form" disabled={createMutation.isPending} className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-blue-700 disabled:opacity-60">
            <Save className="h-4 w-4" /> {createMutation.isPending ? "Menyimpan..." : "Simpan Laporan BOQ"}
          </button>
        </div>
      </div>

      <form id="weekly-boq-input-form" onSubmit={handleSubmit} className="mx-auto mt-5 grid max-w-[1760px] grid-cols-1 gap-5 px-4 xl:grid-cols-[minmax(0,1600px)_150px]">
        <div className="space-y-5">
        <section id="boq-identitas" className="scroll-mt-4 rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="mb-4 flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-blue-700" />
            <h2 className="text-sm font-black text-blue-950">Identitas dan Ringkasan Laporan</h2>
          </div>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
            <label className="space-y-1 text-xs font-bold text-slate-600 lg:col-span-2">Titik KNMP
              <SearchableSelect value={form.knmp_id} onChange={(value) => setForm((prev) => ({ ...prev, knmp_id: value }))} options={knmpOptions.map((k) => ({ value: String(k.id), label: k.name }))} placeholder="Pilih titik KNMP" searchPlaceholder="Cari titik..." className="w-full" />
            </label>
            <label className="space-y-1 text-xs font-bold text-slate-600">Dari Tanggal<input type="date" value={form.week_start} onChange={(e) => setForm((prev) => ({ ...prev, week_start: e.target.value }))} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs outline-none focus:border-blue-500" /></label>
            <label className="space-y-1 text-xs font-bold text-slate-600">Sampai Tanggal<input type="date" value={form.week_end} onChange={(e) => setForm((prev) => ({ ...prev, week_end: e.target.value }))} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs outline-none focus:border-blue-500" /></label>
            <label className="space-y-1 text-xs font-bold text-slate-600 lg:col-span-2">Judul Laporan<input value={form.title} onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs outline-none focus:border-blue-500" /></label>
            <label className="space-y-1 text-xs font-bold text-slate-600 lg:col-span-2">Sumber Dokumen<input value={form.source_document} onChange={(e) => setForm((prev) => ({ ...prev, source_document: e.target.value }))} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs outline-none focus:border-blue-500" /></label>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-5">
            {[
              ["Claim Kontraktor (%)", "contractor_claim_pct"],
              ["Verified Pengawas (%)", "supervisor_verified_pct"],
              ["Evidence Supported (%)", "evidence_supported_pct"],
            ].map(([label, key]) => (
              <label key={key} className="space-y-1 text-xs font-bold text-slate-600">{label}
                <input type="number" value={inputNumberValue(Number(form[key as keyof typeof form] || 0))} onChange={(e) => setForm((prev) => ({ ...prev, [key]: Number(e.target.value) }))} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs outline-none focus:border-blue-500" />
              </label>
            ))}
            <label className="space-y-1 text-xs font-bold text-slate-600">Audit Exposure (Rp)
              <input type="text" inputMode="numeric" value={formatRupiahInput(form.audit_exposure_value)} onChange={(e) => setForm((prev) => ({ ...prev, audit_exposure_value: parseRupiah(e.target.value) }))} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs outline-none focus:border-blue-500" />
            </label>
            <label className="space-y-1 text-xs font-bold text-slate-600">Status<select value={form.status} onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value }))} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs outline-none focus:border-blue-500"><option value="open">Open</option><option value="in_review">Review</option><option value="closed">Selesai</option></select></label>
          </div>
          <label className="mt-4 block space-y-1 text-xs font-bold text-slate-600">Summary
            <textarea value={form.summary} onChange={(e) => setForm((prev) => ({ ...prev, summary: e.target.value }))} rows={4} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs leading-relaxed outline-none focus:border-blue-500" />
          </label>
        </section>

        <section className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {[
            ["Jumlah Harga Laporan", totals.totalContract],
            ["Jumlah Harga Cek Fisik", totals.realValue],
            ["Selisih Kurang", totals.diffValue],
          ].map(([label, value]) => (
            <div key={label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
              <p className="text-xs font-bold text-slate-500">{label}</p>
              <p className={`mt-2 text-lg font-black ${Number(value) < 0 ? "text-rose-600" : "text-slate-950"}`}>{formatRupiah(Number(value))}</p>
            </div>
          ))}
        </section>

        <section id="boq-lampiran-1" className="scroll-mt-4 rounded-xl border border-slate-200 bg-white shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
            <div>
              <h2 className="text-sm font-black text-blue-950">Lampiran 1: Rincian Perhitungan Volume Progres Pekerjaan</h2>
              <p className="text-xs text-slate-500">Isi item sesuai.</p>
            </div>
          </div>
          <div className="overflow-x-auto p-3">
            <table className="min-w-[1220px] w-full border-collapse text-left">
              <thead className="text-[10px] uppercase text-slate-600">
                <tr>
                  <th rowSpan={2} className="w-24 border border-slate-300 bg-slate-100 px-2 py-2 align-middle">No</th>
                  <th rowSpan={2} className="border border-slate-300 bg-slate-100 px-2 py-2 align-middle">Uraian Pekerjaan</th>
                  <th colSpan={2} className="border border-blue-200 bg-blue-50 px-2 py-2 text-center text-blue-800">Laporan Kemajuan Pekerjaan</th>
                  <th colSpan={2} className="border border-emerald-200 bg-emerald-50 px-2 py-2 text-center text-emerald-800">Hasil Cek Fisik</th>
                  <th colSpan={2} className="border border-rose-200 bg-rose-50 px-2 py-2 text-center text-rose-800">Selisih Kurang</th>
                  <th rowSpan={2} className="border border-slate-300 bg-slate-100 px-2 py-2 align-middle"></th>
                </tr>
                <tr>
                  <th className="border border-blue-200 bg-blue-50 px-2 py-2 text-center text-blue-800">Bobot (%)</th>
                  <th className="border border-blue-200 bg-blue-50 px-2 py-2 text-center text-blue-800">Jumlah Harga (Rp)</th>
                  <th className="border border-emerald-200 bg-emerald-50 px-2 py-2 text-center text-emerald-800">Bobot (%)</th>
                  <th className="border border-emerald-200 bg-emerald-50 px-2 py-2 text-center text-emerald-800">Jumlah Harga (Rp)</th>
                  <th className="border border-rose-200 bg-rose-50 px-2 py-2 text-center text-rose-800">Bobot (%)</th>
                  <th className="border border-rose-200 bg-rose-50 px-2 py-2 text-center text-rose-800">Jumlah Harga (Rp)</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => {
                  const code = formatBOQCode(item.item_code, items[index - 1]?.item_code);
                  return (
                  <tr key={`${item.item_code}-${index}`} className="align-top">
                    <td className="px-2 py-2">
                      {item.item_code ? (
                        <div className="flex min-h-10 w-20 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs font-black text-blue-950">
                          {code}
                        </div>
                      ) : (
                        <input value={item.item_code} onChange={(e) => updateItem(index, { item_code: e.target.value })} placeholder="No" className="w-20 rounded-lg border border-slate-200 px-2 py-2 text-center text-xs font-black text-blue-950 outline-none focus:border-blue-500" />
                      )}
                    </td>
                    <td className="min-w-[320px] px-2 py-2"><input value={item.item_name} onChange={(e) => updateItem(index, { item_name: e.target.value })} className="w-full rounded-lg border border-slate-200 px-2 py-2 text-xs outline-none focus:border-blue-500" /></td>
                    <td className="w-28 px-2 py-2"><input type="number" value={inputNumberValue(item.plan_pct)} onChange={(e) => updateItem(index, { plan_pct: Number(e.target.value), weight_pct: Number(e.target.value), contractor_claim_pct: Number(e.target.value) })} className="w-full rounded-lg border border-slate-200 px-2 py-2 text-xs outline-none focus:border-blue-500" /></td>
                    <td className="w-40 px-2 py-2"><input type="text" inputMode="numeric" value={formatRupiahInput(item.contract_value)} onChange={(e) => updateItem(index, { contract_value: parseRupiah(e.target.value) })} className="w-full rounded-lg border border-slate-200 px-2 py-2 text-xs outline-none focus:border-blue-500" /></td>
                    <td className="w-28 px-2 py-2"><input type="number" value={inputNumberValue(item.evidence_supported_pct)} onChange={(e) => updateItem(index, { evidence_supported_pct: Number(e.target.value), supervisor_verified_pct: Number(e.target.value) })} className="w-full rounded-lg border border-slate-200 px-2 py-2 text-xs outline-none focus:border-blue-500" /></td>
                    <td className="w-40 px-2 py-2"><input type="text" inputMode="numeric" value={formatRupiahInput(item.actual_value)} onChange={(e) => updateItem(index, { actual_value: parseRupiah(e.target.value) })} className="w-full rounded-lg border border-slate-200 px-2 py-2 text-xs outline-none focus:border-blue-500" /></td>
                    <td className="w-28 px-2 py-2"><div className="rounded-lg bg-slate-50 px-2 py-2 text-xs font-bold text-rose-700">{(numberValue(item.evidence_supported_pct) - numberValue(item.plan_pct)).toFixed(2)}</div></td>
                    <td className="w-40 px-2 py-2"><div className="rounded-lg bg-slate-50 px-2 py-2 text-xs font-bold text-rose-700">{formatRupiahBlank(numberValue(item.actual_value) - numberValue(item.contract_value))}</div></td>
                    <td className="px-2 py-2"><button type="button" onClick={() => setItems((prev) => prev.length > 1 ? prev.filter((_, idx) => idx !== index) : prev)} className="rounded-lg p-2 text-rose-600 hover:bg-rose-50" title="Hapus item"><Trash2 className="h-4 w-4" /></button></td>
                  </tr>
                  );
                })}
              </tbody>
              <tfoot className="text-xs font-black">
                <tr>
                  <td colSpan={6} className="border border-slate-400 bg-slate-200 px-3 py-2 text-right text-slate-950">JUMLAH</td>
                  <td className="border border-slate-400 bg-slate-200 px-2 py-2 text-right text-rose-700">{totals.diffPct.toFixed(2)}</td>
                  <td className="border border-slate-400 bg-slate-200 px-2 py-2 text-right text-rose-700">{formatRupiahBlank(totals.diffValue)}</td>
                  <td className="border border-slate-400 bg-slate-200 px-2 py-2"></td>
                </tr>
              </tfoot>
            </table>
          </div>
          <div className="flex justify-end border-t border-slate-100 px-4 py-3">
            <button type="button" onClick={addItem} className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700 hover:bg-blue-100">
              <Plus className="h-4 w-4" /> Tambah Item
            </button>
          </div>
        </section>

        <section id="boq-lampiran-2" className="scroll-mt-4 rounded-xl border border-slate-200 bg-white shadow-xs">
          <div className="border-b border-slate-100 px-4 py-3">
            <h2 className="text-sm font-black text-blue-950">Lampiran 2. Rincian Material Terpasang/Hasil Uji Material Tidak Sesuai Spesifikasi Teknis</h2>
          </div>
          <div className="overflow-x-auto p-3">
            <table className="min-w-[1100px] w-full text-left text-xs">
              <thead className="bg-slate-100 text-[10px] uppercase text-slate-600">
                <tr>
                  <th rowSpan={2} className="border border-slate-300 px-2 py-2">No</th>
                  <th rowSpan={2} className="border border-slate-300 px-2 py-2">Uraian Pekerjaan</th>
                  <th rowSpan={2} className="border border-slate-300 px-2 py-2">Sat</th>
                  <th rowSpan={2} className="border border-slate-300 px-2 py-2">Volume</th>
                  <th rowSpan={2} className="border border-slate-300 px-2 py-2">Nilai Total Kontrak</th>
                  <th colSpan={3} className="border border-slate-300 px-2 py-2 text-center">Spesifikasi Teknis</th>
                  <th rowSpan={2} className="border border-slate-300 px-2 py-2">Keterangan</th>
                </tr>
                <tr>
                  <th className="border border-slate-300 px-2 py-2">RAB</th>
                  <th className="border border-slate-300 px-2 py-2">Gambar/RKS/Spektek</th>
                  <th className="border border-slate-300 px-2 py-2">Terpasang</th>
                </tr>
              </thead>
              <tbody>
                {materialMismatchRows.map((row) => (
                  <tr key={row.no}>
                    <td className="border border-slate-200 px-2 py-2 font-bold">{row.no}</td>
                    <td className="border border-slate-200 px-2 py-2"><p className="font-black text-slate-900">{row.section}</p><p className="mt-1 text-slate-700">{row.pekerjaan}</p></td>
                    <td className="border border-slate-200 px-2 py-2">{row.sat}</td>
                    <td className="border border-slate-200 px-2 py-2 text-right">{row.volume}</td>
                    <td className="border border-slate-200 px-2 py-2 text-right">{formatRupiahBlank(row.nilai)}</td>
                    <td className="border border-slate-200 px-2 py-2">{row.rab}</td>
                    <td className="border border-slate-200 px-2 py-2">{row.spektek}</td>
                    <td className="border border-slate-200 px-2 py-2 font-bold text-rose-700">{row.terpasang}</td>
                    <td className="border border-slate-200 px-2 py-2">{row.keterangan}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section id="boq-lampiran-3" className="scroll-mt-4 rounded-xl border border-slate-200 bg-white shadow-xs">
          <div className="border-b border-slate-100 px-4 py-3">
            <h2 className="text-sm font-black text-blue-950">Lampiran 3. Pekerjaan Terpasang Tidak Sesuai Perencanaan atau Terdapat Cacat</h2>
          </div>
          <div className="overflow-x-auto p-3">
            <table className="min-w-[980px] w-full text-left text-xs">
              <thead className="bg-slate-100 text-[10px] uppercase text-slate-600">
                <tr>
                  <th className="border border-slate-300 px-2 py-2">No</th>
                  <th className="border border-slate-300 px-2 py-2">Uraian Pekerjaan</th>
                  <th className="border border-slate-300 px-2 py-2">Kondisi/Foto</th>
                  <th className="border border-slate-300 px-2 py-2">Keterangan</th>
                </tr>
              </thead>
              <tbody>
                {defectRows.map((row) => (
                  <tr key={`${row.no}-${row.pekerjaan}`}>
                    <td className="border border-slate-200 px-2 py-2 font-bold">{row.no}</td>
                    <td className="border border-slate-200 px-2 py-2"><p className="font-black text-slate-900">{row.section}</p><p className="mt-1 text-slate-700">{row.pekerjaan}</p></td>
                    <td className="border border-slate-200 px-2 py-2 text-slate-400">Evidence foto dari PDF asli / upload lapangan</td>
                    <td className="border border-slate-200 px-2 py-2">{row.keterangan}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section id="boq-lampiran-4" className="scroll-mt-4 rounded-xl border border-slate-200 bg-white shadow-xs">
          <div className="border-b border-slate-100 px-4 py-3">
            <h2 className="text-sm font-black text-blue-950">Lampiran 4. Rincian Rencana Pekerjaan Tambah Kurang</h2>
          </div>
          <div className="overflow-x-auto p-3">
            <table className="min-w-[1100px] w-full text-left text-xs">
              <thead className="bg-slate-100 text-[10px] uppercase text-slate-600">
                <tr>
                  {["No", "Uraian Pekerjaan", "Kontrak Awal (Rp)", "CCO3 (Rp)", "Rencana MC-100 (Rp)", "Pekerjaan Tambah (Rp)", "Pekerjaan Kurang (Rp)"].map((head) => (
                    <th key={head} className="border border-slate-300 px-2 py-2">{head}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {variationRows.map(([no, pekerjaan, awal, cco, mc100, tambah, kurang]) => (
                  <tr key={`${no}-${pekerjaan}`} className={`${`${no}`.includes(".") ? "bg-white" : "bg-amber-50"}`}>
                    <td className="border border-slate-200 px-2 py-2 font-bold">{no}</td>
                    <td className="border border-slate-200 px-2 py-2 font-bold">{pekerjaan}</td>
                    {[awal, cco, mc100, tambah, kurang].map((value, index) => (
                      <td key={`${no}-${index}`} className={`border border-slate-200 px-2 py-2 text-right ${Number(value) === 0 ? "text-slate-400" : "text-slate-800"}`}>
                        {formatRupiahBlank(Number(value))}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
        </div>
        <aside className="hidden xl:block">
          <div className="sticky top-4 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 bg-slate-50 px-3 py-2">
              <p className="text-[10px] font-black uppercase text-slate-500">Navigasi</p>
            </div>
            <div className="space-y-1 p-2">
            {[
              ["ID", "Identitas", "boq-identitas"],
              ["L1", "Lampiran 1", "boq-lampiran-1"],
              ["L2", "Lampiran 2", "boq-lampiran-2"],
              ["L3", "Lampiran 3", "boq-lampiran-3"],
              ["L4", "Lampiran 4", "boq-lampiran-4"],
            ].map(([code, label, id]) => (
              <button
                key={id}
                type="button"
                onClick={() => scrollToSection(id)}
                className="group flex w-full items-center gap-2 rounded-lg border border-transparent px-2 py-2 text-left text-xs font-bold text-slate-600 transition-colors hover:border-blue-100 hover:bg-blue-50 hover:text-blue-700"
              >
                <span className="flex h-6 w-7 shrink-0 items-center justify-center rounded-md bg-slate-100 text-[10px] font-black text-slate-500 group-hover:bg-blue-600 group-hover:text-white">
                  {code}
                </span>
                <span className="truncate">{label}</span>
                <span className="ml-auto h-1.5 w-1.5 rounded-full bg-slate-200 group-hover:bg-blue-500" />
              </button>
            ))}
            </div>
          </div>
        </aside>
      </form>
    </div>
  );
};
