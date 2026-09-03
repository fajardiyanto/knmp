import React, { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, FileSpreadsheet, ImagePlus, Plus, Save, Trash2, X } from "lucide-react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { SearchableSelect } from "../../../components/ui/SearchableSelect";
import { useAlert } from "../../../context/AlertContext";
import { fetchKnmpList } from "../../knmp/api";
import { createWeeklyBOQ, fetchWeeklyBOQDetail, updateWeeklyBOQ } from "../api";
import type { WeeklyBOQCreateInput, WeeklyBOQItem, WeeklyBOQItemInput } from "../types";

type BOQFormItem = Required<Omit<WeeklyBOQItemInput, "notes">> & { notes: string };
type ManualColumn = {
  id: string;
  label: string;
  kind?: "text" | "money";
  minWidth?: string;
};

type ManualImage = {
  name: string;
  data_url: string;
};

type ManualRow = {
  id: string;
  kind?: "section" | "item" | "total";
  cells: Record<string, string>;
  placeholders?: Record<string, string>;
  images?: ManualImage[];
};

type ManualTableState = {
  columns: ManualColumn[];
  rows: ManualRow[];
};

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

const createManualRow = (cells: Record<string, string> = {}, placeholders: Record<string, string> = {}, kind: "section" | "item" | "total" = "item"): ManualRow => ({
  id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
  kind,
  cells,
  placeholders,
  images: [],
});

const initialLampiran2: ManualTableState = {
  columns: [
    { id: "no", label: "No", minWidth: "90px" },
    { id: "uraian", label: "Uraian Pekerjaan", minWidth: "360px" },
    { id: "sat", label: "Sat", minWidth: "80px" },
    { id: "volume", label: "Volume", minWidth: "90px" },
    { id: "nilai_total", label: "Nilai Total Kontrak", kind: "money", minWidth: "160px" },
    { id: "rab", label: "RAB", minWidth: "150px" },
    { id: "spek", label: "Gambar/RKS/Spektek", minWidth: "180px" },
    { id: "terpasang", label: "Terpasang", minWidth: "150px" },
    { id: "keterangan", label: "Keterangan", minWidth: "420px" },
  ],
  rows: [
    createManualRow({ no: "XI", uraian: "PEKERJAAN BANGUNAN KANTOR PENGELOLA" }, {}, "section"),
    createManualRow({}, {
      no: "31",
      uraian: "Pekerjaan Pengadaan dan Pemasangan Tangki Toren Kap.600 liter ex.Penguin TD60",
      sat: "unit",
      volume: "1.00",
      nilai_total: "Rp 3.207.233,25",
      rab: "Kapasitas 600 liter",
      spek: "Kapasitas 600 liter",
      terpasang: "Kapasitas 520 liter",
      keterangan: "Terpasang dengan kapasitas di bawah RAB dan Spektek sehingga perlu dilakukan pergantian.",
    }),
  ],
};

const initialLampiran3: ManualTableState = {
  columns: [
    { id: "no", label: "No", minWidth: "90px" },
    { id: "uraian", label: "Uraian Pekerjaan", minWidth: "420px" },
    { id: "kondisi", label: "Kondisi/Foto", minWidth: "320px" },
    { id: "keterangan", label: "Keterangan", minWidth: "420px" },
  ],
  rows: [
    createManualRow({ no: "XIX", uraian: "PEKERJAAN BANGUNAN DOCKING KAPAL" }, {}, "section"),
    createManualRow({}, { no: "5", uraian: "Pekerjaan Plafond GRC t = 6 mm, termasuk rangka besi hollow 40/40 modul 60x60 cm", keterangan: "Plafond di pinggir pasangan lampu downlight bolong, sehingga perlu dirapikan." }),
    createManualRow({}, { no: "13", uraian: "Pekerjaan Huruf Timbul plate galvanis finish cat duco, DOCKING KAPAL uk. 20x35 cm", keterangan: "Sesuai RAB huruf timbul adalah DOCKING KAPAL, huruf terpasang tidak sesuai, sehingga perlu diganti hurufnya sesuai RAB." }),
    createManualRow({}, { no: "7", uraian: "Pekerjaan Penutup Atap Spandek berpasir t = 0,30 mm", keterangan: "Pekerjaan atap spandek, nok atap, dan lisplank tidak rapi, sehingga perlu dilakukan perapihan kembali." }),
    createManualRow({}, { no: "8", uraian: "Pekerjaan Nok Atap Metal Berpasir", keterangan: "Pekerjaan atap spandek, nok atap, dan lisplank tidak rapi, sehingga perlu dilakukan perapihan kembali." }),
    createManualRow({}, { no: "9", uraian: "Pekerjaan Listplank GRC L = 30 cm, t = 8 mm", keterangan: "Pekerjaan atap spandek, nok atap, dan lisplank tidak rapi, sehingga perlu dilakukan perapihan kembali." }),
    createManualRow({ no: "XI", uraian: "PEKERJAAN BANGUNAN KANTOR PENGELOLA" }, {}, "section"),
    createManualRow({}, { no: "11", uraian: "Pekerjaan Topi Jendela Beton t = 10 cm", keterangan: "Pekerjaan topi jendela miring dan tidak simetris, sehingga perlu dibongkar dan dibuat ulang." }),
    createManualRow({}, { no: "20", uraian: "Pekerjaan Huruf Timbul plate galvanis finish cat duco, KANTOR PENGELOLA uk. 20x25 cm", keterangan: "Pekerjaan tulisan huruf KANTOR miring, sehingga perlu dilepas dan pasang ulang dengan rapi." }),
    createManualRow({ no: "IX", uraian: "PEKERJAAN BANGUNAN KIOS PERBEKALAN" }, {}, "section"),
    createManualRow({}, { no: "11", uraian: "Pekerjaan Topi Beton t = 10 cm", keterangan: "Pekerjaan topi jendela miring dan tidak simetris, sehingga perlu dibongkar dan dibuat ulang." }),
    createManualRow({}, { no: "20", uraian: "Pekerjaan Huruf Timbul plate galvanis finish cat duco, KIOS PERBEKALAN uk. 20x25 cm", keterangan: "Huruf terpasang KIOS PEMBEKALAN NELAYAN, sesuai RAB seharusnya KIOS PERBEKALAN, sehingga perlu dilepas dan diganti hurufnya sesuai RAB." }),
    createManualRow({}, { no: "14", uraian: "Pekerjaan Rangka Atap Baja Ringan t = 0,75 mm", keterangan: "Atap terpasang sudah berkarat, sehingga perlu dilakukan pengecatan ulang." }),
  ],
};

const initialLampiran4: ManualTableState = {
  columns: [
    { id: "no", label: "No", minWidth: "90px" },
    { id: "uraian", label: "Uraian Pekerjaan", minWidth: "360px" },
    { id: "kontrak_awal", label: "Kontrak Awal (Rp)", kind: "money", minWidth: "160px" },
    { id: "cco3", label: "CCO3 (Rp)", kind: "money", minWidth: "160px" },
    { id: "rencana_mc100", label: "Rencana MC-100 (Rp)", kind: "money", minWidth: "170px" },
    { id: "pekerjaan_tambah", label: "Pekerjaan Tambah (Rp)", kind: "money", minWidth: "170px" },
    { id: "pekerjaan_kurang", label: "Pekerjaan Kurang (Rp)", kind: "money", minWidth: "170px" },
  ],
  rows: [
    "I|Pekerjaan Persiapan",
    "II|Pekerjaan Revetment",
    "III|Pekerjaan Dinding Penahan Tanah",
    "III.1|Pekerjaan Turap Beton",
    "IV|Pekerjaan Bangunan Shelter Pendaratan Ikan",
    "IV.1|Pekerjaan Struktural",
    "IV.2|Pekerjaan Arsitektural",
    "VI|Pekerjaan Pondasi Pabrik Es Portable",
    "VI.1|Pekerjaan Struktural Pondasi",
    "VII|Pekerjaan Area Parkir",
    "VIII|Pekerjaan Bangunan Shelter Cool Box",
    "VIII.1|Pekerjaan Struktural",
    "VIII.2|Pekerjaan Arsitektural",
    "IX|Pekerjaan Bangunan Kios Perbekalan",
    "IX.1|Pekerjaan Struktural",
    "IX.2|Pekerjaan Arsitektural",
    "XI|Pekerjaan Bangunan Kantor Pengelola",
    "XI.1|Pekerjaan Struktural",
    "XI.2|Pekerjaan Arsitektural Dan ME",
    "XIII|Pekerjaan Bangunan Tangki Air dan Sumur Bor",
    "XIII.1|Pekerjaan Struktural",
    "XIII.2|Pekerjaan Tangki FRP 12 m3 Dan Plumbing",
    "XIV|Pekerjaan Penerangan Kawasan",
    "XIV.2|Pekerjaan Elektrikal",
    "XVI|Pekerjaan Jalan Lingkungan dan Saluran",
    "XVI.1|Pekerjaan Saluran Batu Belah Kawasan",
    "XVI.2|Pekerjaan Jalan Beton Kawasan",
    "XVI.3|Pekerjaan Pedestrian Kawasan",
    "XVII|Pekerjaan Bangunan Gapura",
    "XVII.1|Pekerjaan Arsitektural",
    "XVIII|Pekerjaan Levelling Lahan",
    "XIX|Pekerjaan Bangunan Docking Kapal",
    "XIX.1|Pekerjaan Struktural",
    "XIX.2|Pekerjaan Arsitektural",
    "XX|Pekerjaan Pagar Kawasan",
    "XXI|Pekerjaan Bangunan Shelter Perbaikan Alat Tangkap",
    "XXI.2|Pekerjaan Arsitektural",
    "XXII|Pekerjaan Bangunan Balai Pertemuan Nelayan",
    "XXII.2|Pekerjaan Arsitektural",
  ].map((value) => {
    const [no, uraian] = value.split("|");
    return createManualRow({ no, uraian });
  }).concat([
    createManualRow({ uraian: "I. JUMLAH" }, {}, "total"),
    createManualRow({ uraian: "II. PPN 11 %" }, {}, "total"),
    createManualRow({ uraian: "III. TOTAL I + II" }, {}, "total"),
    createManualRow({ uraian: "IV. DIBULATKAN" }, {}, "total"),
  ]),
};

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
const maxManualImageSizeBytes = 2 * 1024 * 1024;

const splitBOQCode = (code: string) => {
  const [parent = "", child = ""] = code.trim().split(".");
  return { parent, child };
};

const formatBOQCode = (code: string, previousCode?: string) => {
  const { parent, child } = splitBOQCode(code);
  return child ? `${parent}.${child.toUpperCase()}` : parent;
};

const weeklyItemToForm = (item: WeeklyBOQItem): BOQFormItem => ({
  item_code: item.item_code || "",
  item_name: item.item_name || "",
  unit: item.unit || "",
  contract_volume: numberValue(item.contract_volume),
  contract_value: numberValue(item.contract_value),
  weight_pct: numberValue(item.weight_pct),
  plan_pct: numberValue(item.plan_pct),
  last_week_actual_pct: numberValue(item.last_week_actual_pct),
  contractor_claim_pct: numberValue(item.contractor_claim_pct),
  supervisor_verified_pct: numberValue(item.supervisor_verified_pct),
  evidence_supported_pct: numberValue(item.evidence_supported_pct),
  deviation_pct: numberValue(item.deviation_pct),
  actual_value: numberValue(item.actual_value),
  evidence_status: item.evidence_status || "partial",
  risk_level: item.risk_level || "rendah",
  notes: item.notes || "",
});

const mergeDefaultBOQItems = (savedItems: WeeklyBOQItem[] = []) => {
  const savedByCode = new Map(savedItems.map((item) => [item.item_code.trim().toLowerCase(), weeklyItemToForm(item)]));
  const merged = defaultItems.map((template) => {
    const saved = savedByCode.get(template.item_code.trim().toLowerCase());
    return saved ? { ...template, ...saved, item_code: template.item_code, item_name: saved.item_name || template.item_name } : template;
  });
  const defaultCodes = new Set(defaultItems.map((item) => item.item_code.trim().toLowerCase()));
  const extraSaved = savedItems
    .filter((item) => !defaultCodes.has(item.item_code.trim().toLowerCase()))
    .map(weeklyItemToForm);
  return [...merged, ...extraSaved];
};

const manualRowKey = (row: ManualRow) => {
  const no = row.cells.no?.trim().toLowerCase();
  const uraian = row.cells.uraian?.trim().toLowerCase();
  if (row.kind === "total") return `total:${uraian || row.id}`;
  if (no) return `no:${no}`;
  return `uraian:${uraian || row.id}`;
};

const mergeManualTableTemplate = (template: ManualTableState, saved?: ManualTableState): ManualTableState => {
  if (!saved?.rows?.length) return template;
  const savedRowsByKey = new Map(saved.rows.map((row) => [manualRowKey(row), row]));
  const mergedRows = template.rows.map((templateRow) => {
    const savedRow = savedRowsByKey.get(manualRowKey(templateRow));
    if (!savedRow) return templateRow;
    return {
      ...templateRow,
      ...savedRow,
      kind: templateRow.kind || savedRow.kind,
      cells: { ...templateRow.cells, ...savedRow.cells },
      placeholders: { ...templateRow.placeholders, ...savedRow.placeholders },
      images: savedRow.images || templateRow.images || [],
    };
  });
  const templateKeys = new Set(template.rows.map(manualRowKey));
  const extraRows = saved.rows.filter((row) => !templateKeys.has(manualRowKey(row)) && row.kind !== "total");
  const firstTotalIndex = mergedRows.findIndex((row) => row.kind === "total");
  return {
    columns: template.columns,
    rows: firstTotalIndex === -1
      ? [...mergedRows, ...extraRows]
      : [...mergedRows.slice(0, firstTotalIndex), ...extraRows, ...mergedRows.slice(firstTotalIndex)],
  };
};

const lampiran4MoneyColumns = ["kontrak_awal", "cco3", "rencana_mc100", "pekerjaan_tambah", "pekerjaan_kurang"];

const roundToThousands = (value: number) => Math.round(value / 1000) * 1000;

const getLampiran4TotalValue = (table: ManualTableState, row: ManualRow, columnID: string) => {
  if (!lampiran4MoneyColumns.includes(columnID)) return row.cells[columnID] || "";
  const jumlah = table.rows
    .filter((item) => item.kind !== "total")
    .reduce((sum, item) => sum + parseRupiah(item.cells[columnID] || ""), 0);
  if (row.cells.uraian === "I. JUMLAH") return jumlah;
  const ppn = jumlah * 0.11;
  if (row.cells.uraian === "II. PPN 11 %") return ppn;
  const total = jumlah + ppn;
  if (row.cells.uraian === "III. TOTAL I + II") return total;
  if (row.cells.uraian === "IV. DIBULATKAN") return roundToThousands(total);
  return row.cells[columnID] || "";
};

export const WeeklyBOQInputPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const routeEditID = id ? Number(id) : null;
  const queryEditID = searchParams.get("edit") ? Number(searchParams.get("edit")) : null;
  const editID = routeEditID || queryEditID;
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
  const [lampiran2, setLampiran2] = useState<ManualTableState>(initialLampiran2);
  const [lampiran3, setLampiran3] = useState<ManualTableState>(initialLampiran3);
  const [lampiran4, setLampiran4] = useState<ManualTableState>(initialLampiran4);

  const { data: editData } = useQuery({
    queryKey: ["weekly-boq-detail", editID],
    queryFn: () => fetchWeeklyBOQDetail(editID!),
    enabled: editID !== null && Number.isFinite(editID),
  });

  useEffect(() => {
    if (!editData) return;
    setForm({
      knmp_id: String(editData.knmp_id || ""),
      week_start: editData.week_start?.slice(0, 10) || toInputDate(weekStart),
      week_end: editData.week_end?.slice(0, 10) || toInputDate(today),
      title: editData.title || "",
      source_document: editData.source_document || "",
      contractor_claim_pct: numberValue(editData.contractor_claim_pct),
      supervisor_verified_pct: numberValue(editData.supervisor_verified_pct),
      evidence_supported_pct: numberValue(editData.evidence_supported_pct),
      audit_exposure_value: numberValue(editData.audit_exposure_value),
      status: editData.status || "open",
      summary: editData.summary || "",
    });
    setItems(mergeDefaultBOQItems(editData.items || []));
    const manualTables = editData.manual_tables as { lampiran_2?: ManualTableState; lampiran_3?: ManualTableState; lampiran_4?: ManualTableState } | undefined;
    setLampiran2(mergeManualTableTemplate(initialLampiran2, manualTables?.lampiran_2));
    setLampiran3(mergeManualTableTemplate(initialLampiran3, manualTables?.lampiran_3));
    setLampiran4(mergeManualTableTemplate(initialLampiran4, manualTables?.lampiran_4));
  }, [editData]);

  const totals = useMemo(() => {
    const totalContract = items.reduce((sum, item) => sum + numberValue(item.contract_value), 0);
    const realValue = items.reduce((sum, item) => sum + numberValue(item.actual_value), 0);
    const diffPct = items.reduce((sum, item) => sum + numberValue(item.evidence_supported_pct) - numberValue(item.plan_pct), 0);
    return { totalContract, realValue, diffValue: realValue - totalContract, diffPct };
  }, [items]);

  const createMutation = useMutation({
    mutationFn: (payload: WeeklyBOQCreateInput) => (editID ? updateWeeklyBOQ(editID, payload) : createWeeklyBOQ(payload)),
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ["weekly-boq"] });
      queryClient.invalidateQueries({ queryKey: ["weekly-boq-stats"] });
      queryClient.invalidateQueries({ queryKey: ["weekly-boq-detail"] });
      showAlert({ title: "BOQ Disimpan", message: editID ? "Perubahan BOQ berhasil disimpan." : "Input BOQ berhasil dibuat.", type: "success" });
      navigate(`/boq-weekly?selected=${created.id}`);
    },
    onError: (err: any) => showAlert({ title: "Gagal Menyimpan", message: err.message || "Gagal menyimpan input BOQ.", type: "error" }),
  });

  const updateItem = (index: number, patch: Partial<BOQFormItem>) => {
    setItems((prev) => prev.map((item, idx) => (idx === index ? { ...item, ...patch } : item)));
  };

  const updateManualCell = (
    setter: React.Dispatch<React.SetStateAction<ManualTableState>>,
    rowID: string,
    columnID: string,
    value: string,
  ) => {
    setter((prev) => ({
      ...prev,
      rows: prev.rows.map((row) => (row.id === rowID ? { ...row, cells: { ...row.cells, [columnID]: value } } : row)),
    }));
  };

  const addManualRow = (setter: React.Dispatch<React.SetStateAction<ManualTableState>>) => {
    setter((prev) => {
      const firstTotalIndex = prev.rows.findIndex((row) => row.kind === "total");
      if (firstTotalIndex === -1) {
        return { ...prev, rows: [...prev.rows, createManualRow()] };
      }
      return {
        ...prev,
        rows: [...prev.rows.slice(0, firstTotalIndex), createManualRow(), ...prev.rows.slice(firstTotalIndex)],
      };
    });
  };

  const removeManualRow = (setter: React.Dispatch<React.SetStateAction<ManualTableState>>, rowID: string) => {
    setter((prev) => ({ ...prev, rows: prev.rows.length > 1 ? prev.rows.filter((row) => row.id !== rowID) : prev.rows }));
  };

  const addManualImages = (
    setter: React.Dispatch<React.SetStateAction<ManualTableState>>,
    rowID: string,
    files: FileList | null,
  ) => {
    if (!files?.length) return;
    Array.from(files).forEach((file) => {
      if (file.size > maxManualImageSizeBytes) {
        showAlert({ title: "Gambar Terlalu Besar", message: `${file.name} melebihi batas 2 MB.`, type: "warning" });
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        const dataURL = typeof reader.result === "string" ? reader.result : "";
        if (!dataURL) return;
        setter((prev) => ({
          ...prev,
          rows: prev.rows.map((row) =>
            row.id === rowID
              ? { ...row, images: [...(row.images || []), { name: file.name, data_url: dataURL }] }
              : row,
          ),
        }));
      };
      reader.readAsDataURL(file);
    });
  };

  const removeManualImage = (setter: React.Dispatch<React.SetStateAction<ManualTableState>>, rowID: string, imageIndex: number) => {
    setter((prev) => ({
      ...prev,
      rows: prev.rows.map((row) =>
        row.id === rowID ? { ...row, images: (row.images || []).filter((_, idx) => idx !== imageIndex) } : row,
      ),
    }));
  };

  const lampiran4WithTotals = useMemo<ManualTableState>(() => ({
    ...lampiran4,
    rows: lampiran4.rows.map((row) => {
      if (row.kind !== "total") return row;
      const cells = { ...row.cells };
      lampiran4MoneyColumns.forEach((columnID) => {
        cells[columnID] = String(getLampiran4TotalValue(lampiran4, row, columnID) || "");
      });
      return { ...row, cells };
    }),
  }), [lampiran4]);

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
      manual_tables: {
        lampiran_2: lampiran2,
        lampiran_3: lampiran3,
        lampiran_4: lampiran4WithTotals,
      },
    };
    createMutation.mutate(payload);
  };

  const addItem = () => {
    setItems((prev) => [...prev, emptyBOQItem()]);
  };

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const renderManualCell = (
    tableID: string,
    setter: React.Dispatch<React.SetStateAction<ManualTableState>>,
    row: ManualRow,
    column: ManualColumn,
  ) => {
    const rawValue = row.cells[column.id] || "";
    const placeholder = row.placeholders?.[column.id] || "";
    const isLampiran3 = tableID === "boq-lampiran-3";
    const isLampiran4 = tableID === "boq-lampiran-4";
    const isImageOnlyCell = isLampiran3 && column.id === "kondisi";
    const isImageColumn = isImageOnlyCell || (!isLampiran3 && column.id === "keterangan");
    const totalValue = row.kind === "total" && isLampiran4 ? getLampiran4TotalValue(lampiran4, row, column.id) : undefined;
    const value = column.kind === "money" ? formatRupiahInput(Number(totalValue ?? parseRupiah(rawValue))) : String(totalValue ?? rawValue);
    const isLongText = ["uraian", "keterangan", "kondisi", "rab", "spek", "terpasang"].includes(column.id) && !(isLampiran4 && column.id === "uraian");
    return (
      <div className="space-y-2">
        {!isImageOnlyCell && (
          isLongText ? (
            <textarea
              value={value}
              placeholder={placeholder}
              readOnly={row.kind === "total"}
              onChange={(event) => updateManualCell(setter, row.id, column.id, column.kind === "money" ? String(parseRupiah(event.target.value)) : event.target.value)}
              rows={column.id === "uraian" || column.id === "keterangan" ? 3 : 2}
              className={`w-full resize-none overflow-hidden rounded-lg border border-slate-200 bg-white px-2 py-2 text-xs leading-relaxed text-slate-800 outline-none placeholder:text-slate-500 focus:border-blue-500 ${column.id === "terpasang" ? "font-bold text-rose-700 placeholder:text-rose-600" : ""}`}
            />
          ) : (
            <input
              value={value}
              placeholder={placeholder}
              readOnly={row.kind === "total"}
              onChange={(event) => updateManualCell(setter, row.id, column.id, column.kind === "money" ? String(parseRupiah(event.target.value)) : event.target.value)}
              className={`w-full rounded-lg border border-slate-200 px-2 py-2 text-xs text-slate-800 outline-none placeholder:text-slate-500 focus:border-blue-500 ${row.kind === "total" ? "bg-slate-50 font-black" : "bg-white"}`}
            />
          )
        )}
        {isImageColumn && (
          <>
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-blue-200 bg-blue-50 px-2.5 py-2 text-[11px] font-bold text-blue-700 hover:bg-blue-100">
              <ImagePlus className="h-4 w-4" />
              Upload Gambar
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(event) => {
                  addManualImages(setter, row.id, event.target.files);
                  event.currentTarget.value = "";
                }}
              />
            </label>
            {!!row.images?.length && (
              <div className="grid grid-cols-2 gap-2">
                {row.images.map((image, imageIndex) => (
                  <div key={`${image.name}-${imageIndex}`} className="group relative overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
                    <img src={image.data_url} alt={image.name} className="h-24 w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeManualImage(setter, row.id, imageIndex)}
                      className="absolute right-1 top-1 rounded-full bg-white/90 p-1 text-rose-600 shadow-sm hover:bg-rose-50"
                      title="Hapus gambar"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    );
  };

  const renderManualTable = (
    title: string,
    subtitle: string,
    table: ManualTableState,
    setter: React.Dispatch<React.SetStateAction<ManualTableState>>,
    groupedHeader = false,
  ) => {
    const defaultColumns = table.columns.filter((column) => !column.id.startsWith("custom_"));
    const columnWidth = (columnID: string) => {
      if (subtitle === "boq-lampiran-3") {
        const widths: Record<string, string> = {
          no: "12%",
          uraian: "30%",
          kondisi: "28%",
          keterangan: "28%",
        };
        return widths[columnID] || "12%";
      }
      if (!groupedHeader) {
        return columnID === "uraian" || columnID === "keterangan" ? "30%" : "12%";
      }
      const widths: Record<string, string> = {
        no: "6%",
        uraian: "24%",
        sat: "5%",
        volume: "6%",
        nilai_total: "10%",
        rab: "10%",
        spek: "12%",
        terpasang: "10%",
        keterangan: "17%",
      };
      return widths[columnID] || "12%";
    };
    return (
      <section id={subtitle} className="scroll-mt-4 rounded-xl border border-slate-200 bg-white shadow-xs">
        <div className="border-b border-slate-100 px-4 py-3">
          <h2 className="text-sm font-black text-blue-950">{title}</h2>
        </div>
        <div className="overflow-hidden p-3">
          <table className="w-full table-fixed border-collapse text-left text-xs">
            <colgroup>
              {table.columns.map((column) => (
                <col key={column.id} style={{ width: columnWidth(column.id) }} />
              ))}
              <col style={{ width: "32px" }} />
            </colgroup>
            <thead className="text-[10px] uppercase text-slate-700">
              {groupedHeader ? (
                <>
                  <tr>
                    {defaultColumns.slice(0, 5).map((column) => (
                      <th key={column.id} rowSpan={2} className="border border-slate-300 bg-slate-100 px-2 py-2 align-middle">
                        {column.label}
                      </th>
                    ))}
                    <th colSpan={3} className="border border-slate-300 bg-slate-100 px-2 py-2 text-center">Spesifikasi Teknis</th>
                    <th rowSpan={2} className="border border-slate-300 bg-slate-100 px-2 py-2 align-middle">
                      Keterangan
                    </th>
                    <th rowSpan={2} className="w-8 border border-slate-300 bg-slate-100 px-1 py-2"></th>
                  </tr>
                  <tr>
                    {defaultColumns.slice(5, 8).map((column) => (
                      <th key={column.id} className="border border-slate-300 bg-slate-100 px-2 py-2">{column.label}</th>
                    ))}
                  </tr>
                </>
              ) : (
                <tr>
                  {table.columns.map((column) => (
                    <th key={column.id} className="border border-slate-300 bg-slate-100 px-2 py-2">
                      <div className="flex items-center justify-between gap-2">
                        {column.label}
                      </div>
                    </th>
                  ))}
                  <th className="w-8 border border-slate-300 bg-slate-100 px-1 py-2"></th>
                </tr>
              )}
            </thead>
            <tbody>
              {table.rows.map((row) =>
                row.kind === "section" ? (
                  <tr key={row.id} className="bg-slate-100 align-top">
                    <td className="border border-slate-300 px-2 py-2 text-center text-xs font-black text-blue-950">{row.cells.no}</td>
                    <td colSpan={table.columns.length} className="border border-slate-300 px-3 py-2 text-xs font-black uppercase text-blue-950">
                      {row.cells.uraian}
                    </td>
                  </tr>
                ) : (
                  <tr key={row.id} className={`align-top ${row.kind === "total" ? "bg-slate-100 font-black" : ""}`}>
                    {table.columns.map((column) => (
                      <td key={column.id} className="border border-slate-200 p-2">
                        {renderManualCell(subtitle, setter, row, column)}
                      </td>
                    ))}
                    <td className="border border-slate-200 px-1 py-2 text-center">
                      {row.kind !== "total" && (
                        <button type="button" onClick={() => removeManualRow(setter, row.id)} className="rounded-md p-1 text-rose-600 hover:bg-rose-50" title="Hapus baris">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ),
              )}
            </tbody>
          </table>
        </div>
        <div className="flex flex-wrap justify-end gap-2 border-t border-slate-100 px-4 py-3">
          <button type="button" onClick={() => addManualRow(setter)} className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700 hover:bg-blue-100">
            <Plus className="h-4 w-4" /> Tambah Baris
          </button>
        </div>
      </section>
    );
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
            <h1 className="truncate text-lg font-black text-blue-950">{editID ? "Edit Laporan Pemantauan Progress Berbasis BOQ" : "Input Laporan Pemantauan Progress Berbasis BOQ"}</h1>
          </div>
          <button type="submit" form="weekly-boq-input-form" disabled={createMutation.isPending} className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-blue-700 disabled:opacity-60">
            <Save className="h-4 w-4" /> {createMutation.isPending ? "Menyimpan..." : editID ? "Simpan Perubahan BOQ" : "Simpan Laporan BOQ"}
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

        {renderManualTable(
          "Lampiran 2. Rincian Material Terpasang/Hasil Uji Material Tidak Sesuai Spesifikasi Teknis",
          "boq-lampiran-2",
          lampiran2,
          setLampiran2,
          true,
        )}

        {renderManualTable(
          "Lampiran 3. Pekerjaan Terpasang Tidak Sesuai Perencanaan atau Terdapat Cacat",
          "boq-lampiran-3",
          lampiran3,
          setLampiran3,
        )}

        {renderManualTable(
          "Lampiran 4. Rincian Rencana Pekerjaan Tambah Kurang",
          "boq-lampiran-4",
          lampiran4WithTotals,
          setLampiran4,
        )}
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
