export interface User {
  id: number;
  name: string;
  email: string;
  roles: string[];
  permissions: string[];
  knmp_ids?: number[];
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface Role {
  id: number;
  name: string;
  guard_name: string;
}
