import { apiFetch } from "../../lib/api-client";
import type { User, Role } from "../auth/types";

export function fetchUserList(search?: string): Promise<User[]> {
  const query = search ? `?search=${search}` : "";
  return apiFetch<User[]>(`/api/v1/users${query}`);
}

export function createUser(data: any): Promise<User> {
  return apiFetch<User>("/api/v1/users", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateUser(id: number, data: any): Promise<User> {
  return apiFetch<User>(`/api/v1/users/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function deleteUser(id: number): Promise<{ message: string }> {
  return apiFetch<{ message: string }>(`/api/v1/users/${id}`, {
    method: "DELETE",
  });
}
