import React, { useState, useRef, useEffect } from "react";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
} from "lucide-react";

interface ModernDateRangePickerProps {
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  onChange: (start: string, end: string) => void;
  className?: string;
}

const MONTH_NAMES = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

const DAY_NAMES = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

export const ModernDateRangePicker: React.FC<ModernDateRangePickerProps> = ({
  startDate,
  endDate,
  onChange,
  className = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const startD = startDate ? new Date(startDate + "T00:00:00") : new Date();
  const [viewYear, setViewYear] = useState(
    isNaN(startD.getFullYear()) ? 2026 : startD.getFullYear()
  );
  const [viewMonth, setViewMonth] = useState(
    isNaN(startD.getMonth()) ? 7 : startD.getMonth()
  );

  const [pickingStep, setPickingStep] = useState<"start" | "end">("start");
  const [tempStart, setTempStart] = useState<string>(startDate);
  const [tempEnd, setTempEnd] = useState<string>(endDate);

  useEffect(() => {
    setTempStart(startDate);
    setTempEnd(endDate);
  }, [startDate, endDate]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const formatDisplay = (dStr: string) => {
    if (!dStr) return "-";
    const d = new Date(dStr + "T00:00:00");
    if (isNaN(d.getTime())) return dStr;
    const day = String(d.getDate()).padStart(2, "0");
    const month = MONTH_NAMES[d.getMonth()].slice(0, 3);
    const year = d.getFullYear();
    return `${day} ${month} ${year}`;
  };

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((prev) => prev - 1);
    } else {
      setViewMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((prev) => prev + 1);
    } else {
      setViewMonth((prev) => prev + 1);
    }
  };

  const handleSelectDay = (day: number) => {
    const mm = String(viewMonth + 1).padStart(2, "0");
    const dd = String(day).padStart(2, "0");
    const selected = `${viewYear}-${mm}-${dd}`;

    if (pickingStep === "start") {
      setTempStart(selected);
      setTempEnd("");
      setPickingStep("end");
    } else {
      // If selected is before tempStart, swap
      if (selected < tempStart) {
        setTempStart(selected);
        setTempEnd(tempStart);
        onChange(selected, tempStart);
      } else {
        setTempEnd(selected);
        onChange(tempStart, selected);
      }
      setPickingStep("start");
      setIsOpen(false);
    }
  };

  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

  const prevMonthDays: number[] = [];
  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    prevMonthDays.push(daysInPrevMonth - i);
  }

  const currentMonthDays: number[] = [];
  for (let i = 1; i <= daysInMonth; i++) {
    currentMonthDays.push(i);
  }

  const totalCells = prevMonthDays.length + currentMonthDays.length;
  const nextMonthDaysCount = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
  const nextMonthDays: number[] = [];
  for (let i = 1; i <= nextMonthDaysCount; i++) {
    nextMonthDays.push(i);
  }

  const isInRange = (day: number) => {
    const mm = String(viewMonth + 1).padStart(2, "0");
    const dd = String(day).padStart(2, "0");
    const cur = `${viewYear}-${mm}-${dd}`;
    if (!tempStart || !tempEnd) return false;
    return cur >= tempStart && cur <= tempEnd;
  };

  const isEndpoint = (day: number) => {
    const mm = String(viewMonth + 1).padStart(2, "0");
    const dd = String(day).padStart(2, "0");
    const cur = `${viewYear}-${mm}-${dd}`;
    return cur === tempStart || cur === tempEnd;
  };

  return (
    <div ref={containerRef} className={`relative inline-block ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => {
          setIsOpen(!isOpen);
          setPickingStep("start");
        }}
        className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-100 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 rounded-xl text-xs font-semibold shadow-2xs dark:shadow-xs transition-all cursor-pointer select-none group"
      >
        <CalendarIcon className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 group-hover:text-blue-500 transition-colors" />
        <span className="font-mono text-slate-900 dark:text-white font-bold">
          {formatDisplay(startDate)}
        </span>
        <ArrowRight className="w-3 h-3 text-slate-400 dark:text-slate-500" />
        <span className="font-mono text-slate-900 dark:text-white font-bold">
          {formatDisplay(endDate)}
        </span>
      </button>

      {/* Calendar Dropdown Modal */}
      {isOpen && (
        <div className="absolute right-0 mt-2 z-[100] w-80 max-w-[calc(100vw-32px)] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/90 rounded-2xl shadow-2xl p-4 text-slate-800 dark:text-slate-200 animate-in fade-in zoom-in-95 duration-150 backdrop-blur-md">
          {/* Header Month / Year Control */}
          <div className="flex items-center justify-between mb-3 px-1">
            <div className="flex items-center gap-1.5 font-bold text-xs text-slate-900 dark:text-white">
              <span className="text-blue-600 dark:text-blue-400">{MONTH_NAMES[viewMonth]}</span>
              <span className="text-slate-500 dark:text-slate-400 font-mono">{viewYear}</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleNextMonth}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="mb-2 px-2.5 py-1 bg-slate-100 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 rounded-lg text-[10.5px] text-slate-600 dark:text-slate-400 flex items-center justify-between">
            <span>
              {pickingStep === "start"
                ? "Pilih Tanggal Mulai"
                : "Pilih Tanggal Selesai"}
            </span>
            <span className="text-blue-600 dark:text-blue-400 font-mono font-bold">
              {pickingStep === "start" ? "Langkah 1/2" : "Langkah 2/2"}
            </span>
          </div>

          {/* Day of Week Headers */}
          <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-slate-400 dark:text-slate-500 mb-1.5">
            {DAY_NAMES.map((d, i) => (
              <span key={i} className={i === 0 ? "text-rose-500 dark:text-rose-400" : ""}>
                {d}
              </span>
            ))}
          </div>

          {/* Day Cells Grid */}
          <div className="grid grid-cols-7 gap-1 text-center text-xs">
            {/* Prev month fill */}
            {prevMonthDays.map((d, idx) => (
              <span
                key={`prev-${idx}`}
                className="p-1.5 text-[11px] text-slate-300 dark:text-slate-600 select-none font-mono"
              >
                {d}
              </span>
            ))}

            {/* Current month days */}
            {currentMonthDays.map((day) => {
              const endpoint = isEndpoint(day);
              const inRange = isInRange(day);

              return (
                <button
                  key={`cur-${day}`}
                  type="button"
                  onClick={() => handleSelectDay(day)}
                  className={`p-1.5 text-xs font-mono font-medium transition-all cursor-pointer ${
                    endpoint
                      ? "bg-blue-600 text-white font-bold rounded-lg shadow-xs scale-105 z-10"
                      : inRange
                      ? "bg-blue-100 dark:bg-blue-950/70 text-blue-800 dark:text-blue-200 rounded-none hover:bg-blue-200 dark:hover:bg-blue-900/80"
                      : "rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
                  }`}
                >
                  {day}
                </button>
              );
            })}

            {/* Next month fill */}
            {nextMonthDays.map((d, idx) => (
              <span
                key={`next-${idx}`}
                className="p-1.5 text-[11px] text-slate-300 dark:text-slate-600 select-none font-mono"
              >
                {d}
              </span>
            ))}
          </div>

          {/* Presets Footer */}
          <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-1 text-[10.5px]">
            <button
              type="button"
              onClick={() => {
                onChange("2026-08-01", "2026-08-30");
                setIsOpen(false);
              }}
              className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-semibold cursor-pointer"
            >
              Bulan Agustus 2026
            </button>
            <button
              type="button"
              onClick={() => {
                const today = new Date().toISOString().split("T")[0];
                const weekAgo = new Date(Date.now() - 7 * 86400000)
                  .toISOString()
                  .split("T")[0];
                onChange(weekAgo, today);
                setIsOpen(false);
              }}
              className="text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 cursor-pointer"
            >
              7 Hari Terakhir
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
