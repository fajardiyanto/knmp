import { useQuery } from "@tanstack/react-query";
import { fetchDashboardWidget, fetchDashboardMap } from "../api";

export function useDashboardWidget() {
  return useQuery({
    queryKey: ["dashboard", "widget"],
    queryFn: fetchDashboardWidget,
    refetchInterval: 30000,
  });
}

export function useDashboardMap() {
  return useQuery({
    queryKey: ["dashboard", "map"],
    queryFn: fetchDashboardMap,
  });
}
