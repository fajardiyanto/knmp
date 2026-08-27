import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchIssueList,
  fetchIssueDetail,
  createMobileIssue,
  verifyIssue,
  unverifyIssue,
} from "../api";

export function useIssueList(params?: { knmp_id?: number; tingkat?: string; status?: string }) {
  return useQuery({
    queryKey: ["issue", "list", params],
    queryFn: () => fetchIssueList(params),
  });
}

export function useIssueDetail(id?: number) {
  return useQuery({
    queryKey: ["issue", "detail", id],
    queryFn: () => fetchIssueDetail(id!),
    enabled: !!id,
  });
}

export function useIssueMutations() {
  const queryClient = useQueryClient();

  const create = useMutation({
    mutationFn: (formData: FormData) => createMobileIssue(formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["issue"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });

  const verify = useMutation({
    mutationFn: ({ id, status, note }: { id: number; status: "approved" | "rejected"; note: string }) =>
      verifyIssue(id, status, note),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["issue"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });

  const unverify = useMutation({
    mutationFn: ({ id, note }: { id: number; note: string }) => unverifyIssue(id, note),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["issue"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });

  return { create, verify, unverify };
}
