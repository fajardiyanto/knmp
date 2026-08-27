import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchKnmpList,
  fetchKnmpDetail,
  createKnmp,
  updateKnmp,
  deleteKnmp,
  fetchRegionals,
  fetchProvinces,
  fetchRegencies,
  fetchDistricts,
  fetchSubDistricts,
  fetchJenisBangunans,
} from "../api";
import type { Knmp } from "../types";

export function useKnmpList(params?: { search?: string; regional_id?: number; jenis_knmp?: string }) {
  return useQuery({
    queryKey: ["knmp", "list", params],
    queryFn: () => fetchKnmpList(params),
  });
}

export function useKnmpDetail(id?: number) {
  return useQuery({
    queryKey: ["knmp", "detail", id],
    queryFn: () => fetchKnmpDetail(id!),
    enabled: !!id,
  });
}

export function useKnmpMutations() {
  const queryClient = useQueryClient();

  const create = useMutation({
    mutationFn: (data: Partial<Knmp>) => createKnmp(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["knmp"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });

  const update = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Knmp> }) => updateKnmp(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["knmp"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });

  const remove = useMutation({
    mutationFn: (id: number) => deleteKnmp(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["knmp"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });

  return { create, update, remove };
}

// Geo Hooks
export function useRegionals() {
  return useQuery({
    queryKey: ["geo", "regionals"],
    queryFn: fetchRegionals,
  });
}

export function useProvinces(regionalId?: number) {
  return useQuery({
    queryKey: ["geo", "provinces", regionalId],
    queryFn: () => fetchProvinces(regionalId!),
    enabled: !!regionalId,
  });
}

export function useRegencies(provinceId?: number) {
  return useQuery({
    queryKey: ["geo", "regencies", provinceId],
    queryFn: () => fetchRegencies(provinceId!),
    enabled: !!provinceId,
  });
}

export function useDistricts(regencyId?: number) {
  return useQuery({
    queryKey: ["geo", "districts", regencyId],
    queryFn: () => fetchDistricts(regencyId!),
    enabled: !!regencyId,
  });
}

export function useSubDistricts(districtId?: number) {
  return useQuery({
    queryKey: ["geo", "sub-districts", districtId],
    queryFn: () => fetchSubDistricts(districtId!),
    enabled: !!districtId,
  });
}

export function useJenisBangunans() {
  return useQuery({
    queryKey: ["master", "jenis-bangunan"],
    queryFn: fetchJenisBangunans,
  });
}
