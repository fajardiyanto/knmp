import { apiFetch } from "../../lib/api-client";
import type { AuthResponse, User, Role } from "./types";

export function loginApi(email: string, password: string): Promise<AuthResponse> {
  return apiFetch<AuthResponse>("/api/v1/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function fetchUserProfile(): Promise<User> {
  return apiFetch<User>("/api/v1/user");
}

export function logoutApi(): Promise<{ message: string }> {
  return apiFetch<{ message: string }>("/api/v1/auth/logout", {
    method: "DELETE",
  });
}

export function fetchRoles(): Promise<Role[]> {
  return apiFetch<Role[]>("/api/v1/roles");
}
