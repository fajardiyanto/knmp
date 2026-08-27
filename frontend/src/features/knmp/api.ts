import { apiFetch } from "../../lib/api-client";
import type { Knmp, Regional, Province, Regency, District, SubDistrict, JenisBangunan } from "./types";

export function fetchKnmpList(params?: { search?: string; regional_id?: number; jenis_knmp?: string }): Promise<Knmp[]> {
  const query = new URLSearchParams();
  if (params?.search) query.append("search", params.search);
  if (params?.regional_id) query.append("regional_id", params.regional_id.toString());
  if (params?.jenis_knmp) query.append("jenis_knmp", params.jenis_knmp);
  const qStr = query.toString() ? `?${query.toString()}` : "";
  return apiFetch<Knmp[]>(`/api/v1/knmp${qStr}`);
}

export function fetchKnmpDetail(id: number): Promise<Knmp> {
  return apiFetch<Knmp>(`/api/v1/knmp/${id}`);
}

export function createKnmp(data: Partial<Knmp>): Promise<Knmp> {
  return apiFetch<Knmp>("/api/v1/knmp", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateKnmp(id: number, data: Partial<Knmp>): Promise<Knmp> {
  return apiFetch<Knmp>(`/api/v1/knmp/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function deleteKnmp(id: number): Promise<{ message: string }> {
  return apiFetch<{ message: string }>(`/api/v1/knmp/${id}`, {
    method: "DELETE",
  });
}

// Geo Lookups
export function fetchRegionals(): Promise<Regional[]> {
  return apiFetch<Regional[]>("/api/v1/geo/regionals");
}

export function fetchProvinces(regionalId: number): Promise<Province[]> {
  return apiFetch<Province[]>(`/api/v1/geo/regionals/${regionalId}/provinces`);
}

export function fetchRegencies(provinceId: number): Promise<Regency[]> {
  return apiFetch<Regency[]>(`/api/v1/geo/provinces/${provinceId}/regencies`);
}

export function fetchDistricts(regencyId: number): Promise<District[]> {
  return apiFetch<District[]>(`/api/v1/geo/regencies/${regencyId}/districts`);
}

export function fetchSubDistricts(districtId: number): Promise<SubDistrict[]> {
  return apiFetch<SubDistrict[]>(`/api/v1/geo/districts/${districtId}/sub-districts`);
}

export function fetchJenisBangunans(): Promise<JenisBangunan[]> {
  return apiFetch<JenisBangunan[]>("/api/v1/jenis-bangunan?is_active=1");
}
