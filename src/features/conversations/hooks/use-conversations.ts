import { useMutation, useQuery } from "convex/react";

import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { getSessionToken } from "@/lib/client-auth";

export const useConversation = (id: Id<"conversations"> | null) => {
  const token = getSessionToken();
  return useQuery(api.conversations.getById, id ? { id, token } : "skip");
};

export const useMessages = (conversationId: Id<"conversations"> | null) => {
  const token = getSessionToken();
  return useQuery(
    api.conversations.getMessages,
    conversationId ? { conversationId, token } : "skip"
  );
};

export const useConversations = (projectId: Id<"projects">) => {
  const token = getSessionToken();
  return useQuery(
    api.conversations.getByProject,
    token ? { projectId, token } : "skip"
  );
};

export const useCreateConversation = () => {
  const mutation = useMutation(api.conversations.create);
  return async (args: { projectId: Id<"projects">; title: string }) => {
    const token = getSessionToken();
    return mutation({ ...args, token });
  };
};
