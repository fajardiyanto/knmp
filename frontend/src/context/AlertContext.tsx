import React, { createContext, useContext, useState, ReactNode } from "react";
import { CheckCircle2, AlertTriangle, XCircle, Info, HelpCircle } from "lucide-react";

export type AlertType = "success" | "error" | "warning" | "info";

export interface AlertOptions {
  title?: string;
  message: string;
  type?: AlertType;
  confirmText?: string;
  onConfirm?: () => void;
}

export interface ConfirmOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  onConfirm: () => void | Promise<void>;
  onCancel?: () => void;
}

interface AlertContextType {
  showAlert: (options: AlertOptions | string) => void;
  showConfirm: (options: ConfirmOptions) => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export const AlertProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Alert State
  const [alertState, setAlertState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: AlertType;
    confirmText: string;
    onConfirm?: () => void;
  }>({
    isOpen: false,
    title: "",
    message: "",
    type: "info",
    confirmText: "OK",
  });

  // Confirm State
  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText: string;
    cancelText: string;
    isDestructive: boolean;
    isLoading: boolean;
    onConfirm: () => void | Promise<void>;
    onCancel?: () => void;
  }>({
    isOpen: false,
    title: "",
    message: "",
    confirmText: "Ya, Lanjutkan",
    cancelText: "Batal",
    isDestructive: false,
    isLoading: false,
    onConfirm: () => {},
  });

  const showAlert = (options: AlertOptions | string) => {
    if (typeof options === "string") {
      setAlertState({
        isOpen: true,
        title: "Pemberitahuan",
        message: options,
        type: "info",
        confirmText: "OK",
      });
      return;
    }

    const defaultTitle =
      options.type === "success"
        ? "Berhasil"
        : options.type === "error"
        ? "Terjadi Kesalahan"
        : options.type === "warning"
        ? "Peringatan"
        : "Informasi";

    setAlertState({
      isOpen: true,
      title: options.title || defaultTitle,
      message: options.message,
      type: options.type || "info",
      confirmText: options.confirmText || "OK",
      onConfirm: options.onConfirm,
    });
  };

  const showConfirm = (options: ConfirmOptions) => {
    setConfirmState({
      isOpen: true,
      title: options.title || "Konfirmasi Tindakan",
      message: options.message,
      confirmText: options.confirmText || "Ya, Lanjutkan",
      cancelText: options.cancelText || "Batal",
      isDestructive: options.isDestructive ?? false,
      isLoading: false,
      onConfirm: options.onConfirm,
      onCancel: options.onCancel,
    });
  };

  const handleCloseAlert = () => {
    if (alertState.onConfirm) {
      alertState.onConfirm();
    }
    setAlertState((prev) => ({ ...prev, isOpen: false }));
  };

  const handleConfirmAction = async () => {
    try {
      setConfirmState((prev) => ({ ...prev, isLoading: true }));
      await confirmState.onConfirm();
      setConfirmState((prev) => ({ ...prev, isOpen: false, isLoading: false }));
    } catch (err) {
      setConfirmState((prev) => ({ ...prev, isLoading: false }));
    }
  };

  const handleCancelConfirm = () => {
    if (confirmState.onCancel) {
      confirmState.onCancel();
    }
    setConfirmState((prev) => ({ ...prev, isOpen: false }));
  };

  // Helper icons and styles
  const getAlertIcon = (type: AlertType) => {
    switch (type) {
      case "success":
        return <CheckCircle2 className="w-8 h-8 text-emerald-500 shrink-0" />;
      case "error":
        return <XCircle className="w-8 h-8 text-rose-500 shrink-0" />;
      case "warning":
        return <AlertTriangle className="w-8 h-8 text-amber-500 shrink-0" />;
      case "info":
      default:
        return <Info className="w-8 h-8 text-blue-500 shrink-0" />;
    }
  };

  const getAlertButtonColor = (type: AlertType) => {
    switch (type) {
      case "success":
        return "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20";
      case "error":
        return "bg-rose-600 hover:bg-rose-700 text-white shadow-rose-500/20";
      case "warning":
        return "bg-amber-600 hover:bg-amber-700 text-white shadow-amber-500/20";
      case "info":
      default:
        return "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20";
    }
  };

  return (
    <AlertContext.Provider value={{ showAlert, showConfirm }}>
      {children}

      {/* 1. Modal Alert */}
      {alertState.isOpen && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 dark:border-slate-800 transform animate-in zoom-in-95 duration-200">
            <div className="flex items-start gap-4">
              <div className="p-2 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shrink-0">
                {getAlertIcon(alertState.type)}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 leading-tight">
                  {alertState.title}
                </h3>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 font-normal leading-relaxed whitespace-pre-line">
                  {alertState.message}
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={handleCloseAlert}
                className={`px-5 py-2.5 rounded-xl text-sm font-semibold shadow-md transition-all active:scale-98 cursor-pointer ${getAlertButtonColor(
                  alertState.type
                )}`}
              >
                {alertState.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Modal Confirmation */}
      {confirmState.isOpen && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 dark:border-slate-800 transform animate-in zoom-in-95 duration-200">
            <div className="flex items-start gap-4">
              <div
                className={`p-2 rounded-2xl border shrink-0 ${
                  confirmState.isDestructive
                    ? "bg-rose-50 dark:bg-rose-950/40 border-rose-100 dark:border-rose-900/60"
                    : "bg-blue-50 dark:bg-blue-950/40 border-blue-100 dark:border-blue-900/60"
                }`}
              >
                {confirmState.isDestructive ? (
                  <AlertTriangle className="w-8 h-8 text-rose-600 dark:text-rose-400 shrink-0" />
                ) : (
                  <HelpCircle className="w-8 h-8 text-blue-600 dark:text-blue-400 shrink-0" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 leading-tight">
                  {confirmState.title}
                </h3>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 font-normal leading-relaxed whitespace-pre-line">
                  {confirmState.message}
                </p>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                disabled={confirmState.isLoading}
                onClick={handleCancelConfirm}
                className="px-4 py-2.5 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer disabled:opacity-50"
              >
                {confirmState.cancelText}
              </button>
              <button
                type="button"
                disabled={confirmState.isLoading}
                onClick={handleConfirmAction}
                className={`px-5 py-2.5 rounded-xl text-sm font-semibold shadow-md transition-all active:scale-98 cursor-pointer flex items-center gap-2 ${
                  confirmState.isDestructive
                    ? "bg-rose-600 hover:bg-rose-700 text-white shadow-rose-500/20"
                    : "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20"
                } disabled:opacity-50`}
              >
                {confirmState.isLoading && (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                )}
                {confirmState.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </AlertContext.Provider>
  );
};

export const useAlert = () => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error("useAlert must be used within an AlertProvider");
  }
  return context;
};
