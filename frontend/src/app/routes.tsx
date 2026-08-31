import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { AppLayout } from "../components/layout/AppLayout";
import { LoginForm } from "../features/auth/components/LoginForm";
import { DashboardPage } from "../features/dashboard/components/DashboardPage";
import { KnmpPage } from "../features/knmp/components/KnmpPage";
import { PeriodePage } from "../features/knmp/components/PeriodePage";
import { JenisBangunanPage } from "../features/knmp/components/JenisBangunanPage";
import { PersiapanKontrakPage } from "../features/persiapan/components/PersiapanKontrakPage";
import { UploadDokumenKontrakPage } from "../features/persiapan/components/UploadDokumenKontrakPage";
import { PCMPage } from "../features/persiapan/components/PCMPage";
import { UploadDokumenPCMPage } from "../features/persiapan/components/UploadDokumenPCMPage";
import { MobilizationPage } from "../features/persiapan/components/MobilizationPage";
import { UploadDokumenLapanganPage } from "../features/persiapan/components/UploadDokumenLapanganPage";
import { PelaksanaanPage } from "../features/pelaksanaan/components/PelaksanaanPage";
import { UploadDokumenPelaksanaanPage } from "../features/pelaksanaan/components/UploadDokumenPelaksanaanPage";
import { LaporanPage } from "../features/laporan/components/LaporanPage";
import { UploadDokumenLaporanPage } from "../features/laporan/components/UploadDokumenLaporanPage";
import { TotalAnggaranPage } from "../features/pembayaran/components/TotalAnggaranPage";
import { UploadDokumenAnggaranPage } from "../features/pembayaran/components/UploadDokumenAnggaranPage";
import { TerminPembayaranPage } from "../features/pembayaran/components/TerminPembayaranPage";
import { AbsensiPage } from "../features/absensi/components/AbsensiPage";
import { UploadDokumenAbsensiPage } from "../features/absensi/components/UploadDokumenAbsensiPage";
import { IssuePage } from "../features/issue/components/IssuePage";
import { UploadDokumenIssuePage } from "../features/issue/components/UploadDokumenIssuePage";
import { UsersPage } from "../features/users/components/UsersPage";
import { PerusahaanPage } from "../features/perusahaan/components/PerusahaanPage";
import {
  PerencanaanPage,
  PHOPage,
  PemeliharaanPage,
  FHOPage,
} from "../features/fase/FasePages";
import { ChatPage } from "../features/chat/components/ChatPage";
import { NotulenListPage } from "../features/notulen/components/NotulenListPage";
import { useAuth } from "../features/auth/hooks/useAuth";

const RootRedirect: React.FC = () => {
  const { user } = useAuth();
  const isManagement = user?.roles?.some((r) => {
    const lower = r.toLowerCase();
    return (
      lower.includes("super") ||
      lower.includes("admin") ||
      lower.includes("ppk") ||
      lower.includes("pengawas")
    );
  });
  return <Navigate to={isManagement ? "/dashboard" : "/pelaksanaan"} replace />;
};

const ProtectedRoute: React.FC<{
  children: React.ReactNode;
  requiredPermission?: string;
  requiredRoles?: string[];
}> = ({ children, requiredPermission, requiredRoles }) => {
  const { user, isLoading, hasPermission, hasRole } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white text-sm font-semibold">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
          <span>Memuat sesi KNMP V2...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRoles && requiredRoles.length > 0) {
    const isAllowed = requiredRoles.some((r) => hasRole(r));
    if (!isAllowed) {
      return (
        <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm max-w-lg mx-auto my-12 shadow-sm space-y-3">
          <div className="font-bold text-base">Akses Ditolak (403 Forbidden)</div>
          <p className="text-slate-600 dark:text-slate-400 text-xs">
            Halaman Dashboard Eksekutif hanya dapat diakses oleh Manajemen, PPK, dan Pengawas.
          </p>
          <div className="pt-2">
            <a
              href="/pelaksanaan"
              className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 transition-all inline-block"
            >
              Buka Menu Pelaksanaan
            </a>
          </div>
        </div>
      );
    }
  }

  if (requiredPermission && !hasPermission(requiredPermission)) {
    return (
      <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-xl border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm max-w-lg mx-auto my-12">
        Akses Ditolak: Anda tidak memiliki izin untuk mengakses halaman ini.
      </div>
    );
  }

  return <>{children}</>;
};

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginForm />} />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<RootRedirect />} />

        {/* Dashboard */}
        <Route
          path="dashboard"
          element={
            <ProtectedRoute requiredRoles={["superadmin", "super admin", "admin_ppk", "admin", "pengawas", "wakil_ppk", "wakil ppk", "ppk"]}>
              <DashboardPage />
            </ProtectedRoute>
          }
        />

        {/* Chat & Messaging */}
        <Route path="chat" element={<ChatPage />} />

        {/* Master */}
        <Route
          path="knmp"
          element={
            <ProtectedRoute requiredPermission="knmp_read">
              <KnmpPage />
            </ProtectedRoute>
          }
        />

        {/* Fase Proyek */}
        <Route path="perencanaan" element={<PerencanaanPage />} />
        <Route
          path="persiapan_kontrak"
          element={
            <ProtectedRoute requiredPermission="kontrak_read">
              <PersiapanKontrakPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="persiapan_kontrak/:id/documents"
          element={
            <ProtectedRoute requiredPermission="kontrak_read">
              <UploadDokumenKontrakPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="persiapan"
          element={
            <ProtectedRoute requiredPermission="kontrak_read">
              <PersiapanKontrakPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="persiapan/:id/documents"
          element={
            <ProtectedRoute requiredPermission="kontrak_read">
              <UploadDokumenKontrakPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="pcm"
          element={
            <ProtectedRoute requiredPermission="kontrak_read">
              <PCMPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="pcm/:id/documents"
          element={
            <ProtectedRoute requiredPermission="kontrak_read">
              <UploadDokumenPCMPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="persiapan_lapangan"
          element={
            <ProtectedRoute requiredPermission="lapangan_read">
              <MobilizationPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="persiapan_lapangan/:id/documents"
          element={
            <ProtectedRoute requiredPermission="lapangan_read">
              <UploadDokumenLapanganPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="pelaksanaan"
          element={
            <ProtectedRoute requiredPermission="pelaksanaan_read">
              <PelaksanaanPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="pelaksanaan/:id/documents"
          element={
            <ProtectedRoute requiredPermission="pelaksanaan_read">
              <UploadDokumenPelaksanaanPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="laporan"
          element={
            <ProtectedRoute requiredPermission="laporan_read">
              <LaporanPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="laporan/:id/documents"
          element={
            <ProtectedRoute requiredPermission="laporan_read">
              <UploadDokumenLaporanPage />
            </ProtectedRoute>
          }
        />
        <Route path="pho" element={<PHOPage />} />
        <Route path="pemeliharaan" element={<PemeliharaanPage />} />
        <Route path="fho" element={<FHOPage />} />

        {/* Keuangan */}
        <Route path="pembayaran" element={<TotalAnggaranPage />} />
        <Route path="pembayaran/:id/documents" element={<UploadDokumenAnggaranPage />} />
        <Route path="pembayaran/summary" element={<TotalAnggaranPage />} />
        <Route path="pembayaran/summary/:id/documents" element={<UploadDokumenAnggaranPage />} />
        <Route path="pembayaran/termin" element={<TerminPembayaranPage />} />

        {/* Module */}
        <Route
          path="absensi"
          element={
            <ProtectedRoute requiredPermission="absensi_read">
              <AbsensiPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="absensi/:id/documents"
          element={
            <ProtectedRoute requiredPermission="absensi_read">
              <UploadDokumenAbsensiPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="issue"
          element={
            <ProtectedRoute requiredPermission="issue_read">
              <IssuePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="issue/:id/documents"
          element={
            <ProtectedRoute requiredPermission="issue_read">
              <UploadDokumenIssuePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="issues"
          element={
            <ProtectedRoute requiredPermission="issue_read">
              <IssuePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="issues/:id/documents"
          element={
            <ProtectedRoute requiredPermission="issue_read">
              <UploadDokumenIssuePage />
            </ProtectedRoute>
          }
        />

        {/* Notulen Rapat (Meeting Minutes) */}
        <Route
          path="notulen"
          element={
            <ProtectedRoute>
              <NotulenListPage />
            </ProtectedRoute>
          }
        />

        {/* User & Master Data */}
        <Route
          path="user"
          element={
            <ProtectedRoute requiredPermission="user_read">
              <UsersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="users"
          element={
            <ProtectedRoute requiredPermission="user_read">
              <UsersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="perusahaan"
          element={
            <ProtectedRoute requiredPermission="user_read">
              <PerusahaanPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="periode"
          element={
            <ProtectedRoute>
              <PeriodePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="jenis-bangunan"
          element={
            <ProtectedRoute>
              <JenisBangunanPage />
            </ProtectedRoute>
          }
        />
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};
