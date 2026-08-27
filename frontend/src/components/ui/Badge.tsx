import React from "react";
import { cn } from "../../lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "success" | "warning" | "danger" | "info" | "neutral" | "primary";
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = "neutral", className }) => {
  const styles = {
    success: "bg-emerald-50 text-emerald-700 border-emerald-200",
    warning: "bg-amber-50 text-amber-700 border-amber-200",
    danger: "bg-rose-50 text-rose-700 border-rose-200",
    info: "bg-sky-50 text-sky-700 border-sky-200",
    neutral: "bg-slate-100 text-slate-700 border-slate-200",
    primary: "bg-blue-50 text-[#004B87] border-blue-200",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border",
        styles[variant],
        className
      )}
    >
      {children}
    </span>
  );
};

export const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const normalize = status?.toLowerCase() || "";
  let variant: "success" | "warning" | "danger" | "info" | "neutral" = "neutral";
  let label = status;

  switch (normalize) {
    case "terverifikasi":
    case "selesai":
    case "aktif":
      variant = "success";
      label = "Terverifikasi";
      break;
    case "menunggu_pengawas":
      variant = "warning";
      label = "Menunggu Pengawas";
      break;
    case "menunggu_wakil_ppk":
      variant = "info";
      label = "Menunggu Wakil PPK";
      break;
    case "ditolak_pengawas":
      variant = "danger";
      label = "Ditolak Pengawas";
      break;
    case "ditolak_wakil_ppk":
      variant = "danger";
      label = "Ditolak Wakil PPK";
      break;
    case "kritis":
      variant = "danger";
      label = "Kritis";
      break;
    case "sedang":
      variant = "warning";
      label = "Sedang";
      break;
    case "ringan":
      variant = "info";
      label = "Ringan";
      break;
    default:
      label = status ? status.replace(/_/g, " ") : "Draft";
  }

  return <Badge variant={variant}>{label}</Badge>;
};
