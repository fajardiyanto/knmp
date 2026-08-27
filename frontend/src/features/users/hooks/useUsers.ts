import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchUserList, createUser, updateUser, deleteUser } from "../api";
import { fetchRoles } from "../../auth/api";

export function useUserList(search?: string) {
  return useQuery({
    queryKey: ["users", "list", search],
    queryFn: () => fetchUserList(search),
  });
}

export function useRoles() {
  return useQuery({
    queryKey: ["roles"],
    queryFn: fetchRoles,
  });
}

export function useUserMutations() {
  const queryClient = useQueryClient();

  const create = useMutation({
    mutationFn: (data: any) => createUser(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });

  const update = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => updateUser(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });

  const remove = useMutation({
    mutationFn: (id: number) => deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });

  return { create, update, remove };
}
