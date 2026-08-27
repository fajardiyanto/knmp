import React from "react";
import { Compass, CheckCircle2, Wrench, ShieldCheck } from "lucide-react";
import { Card } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";

export const PerencanaanPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-800">Fase Perencanaan</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Studi kelayakan, DED (Detail Engineering Design), dan Rencana Anggaran Biaya (RAB)
        </p>
      </div>

      <Card>
        <div className="text-center py-12 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#004B87] flex items-center justify-center mx-auto">
            <Compass className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800">Fase Perencanaan & Kajian Teknis</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Kajian dokumen kelayakan dan kesiapan lahan telah tervalidasi pada tahap awal perencanaan program KNMP.
          </p>
          <div className="pt-2">
            <Badge variant="success">Status: Selesai & Terverifikasi PPK</Badge>
          </div>
        </div>
      </Card>
    </div>
  );
};

export const PHOPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-800">Provisional Hand Over (PHO)</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Serah Terima Pertama Pekerjaan fisik selesai 100% dari kontraktor kepada PPK
        </p>
      </div>

      <Card>
        <div className="text-center py-12 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800">Serah Terima Pertama (PHO 100%)</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Pemeriksaan fisik oleh Tim Panitia Penerima Hasil Pekerjaan untuk penerbitan Berita Acara PHO.
          </p>
          <div className="pt-2">
            <Badge variant="info">Status: Menunggu Kemajuan Fisik 100%</Badge>
          </div>
        </div>
      </Card>
    </div>
  );
};

export const PemeliharaanPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-800">Masa Pemeliharaan</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Masa garansi dan perbaikan cacat mutu pekerjaan selama 180 hari kalender
        </p>
      </div>

      <Card>
        <div className="text-center py-12 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
            <Wrench className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800">Masa Pemeliharaan Konstruksi</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Monitoring kondisi fasilitas pasca-serah terima pertama sebelum penyerahan final.
          </p>
          <div className="pt-2">
            <Badge variant="warning">Status: Berjalan Pasca-PHO</Badge>
          </div>
        </div>
      </Card>
    </div>
  );
};

export const FHOPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-800">Final Hand Over (FHO)</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Serah Terima Akhir Pekerjaan setelah masa pemeliharaan selesai dan tervalidasi
        </p>
      </div>

      <Card>
        <div className="text-center py-12 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800">Serah Terima Akhir (FHO)</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Penyerahan seluruh aset bangunan kepada pengelola kampung nelayan dan penutupan masa kontrak.
          </p>
          <div className="pt-2">
            <Badge variant="neutral">Status: Tahap Akhir Program</Badge>
          </div>
        </div>
      </Card>
    </div>
  );
};
