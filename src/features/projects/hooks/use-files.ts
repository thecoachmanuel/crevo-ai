import { useMutation, useQuery } from "convex/react";
import { Id } from "../../../../convex/_generated/dataModel";
import { api } from "../../../../convex/_generated/api";
import { getSessionToken } from "@/lib/client-auth";

// Sort: folders first, then files, alphabetically within each group
const sortFiles = <T extends { type: "file" | "folder"; name: string }>(
  files: T[]
): T[] => {
  return [...files].sort((a, b) => {
    if (a.type === "folder" && b.type === "file") return -1;
    if (a.type === "file" && b.type === "folder") return 1;
    return a.name.localeCompare(b.name);
  });
};

export const useFiles = (projectId: Id<"projects"> | null) => {
  const token = getSessionToken();
  return useQuery(api.files.getFiles, projectId ? { projectId, token } : "skip");
};

export const useFile = (fileId: Id<"files"> | null) => {
  const token = getSessionToken();
  return useQuery(api.files.getFile, fileId ? { id: fileId, token } : "skip");
};

export const useFilePath = (fileId: Id<"files"> | null) => {
  const token = getSessionToken();
  return useQuery(api.files.getFilePath, fileId ? { id: fileId, token } : "skip");
};

export const useUpdateFile = () => {
  const mutation = useMutation(api.files.updateFile);
  return async (args: { id: Id<"files">; content: string }) => {
    const token = getSessionToken();
    return mutation({ ...args, token });
  };
};
 
export const useCreateFile = () => {
  const mutation = useMutation(api.files.createFile).withOptimisticUpdate(
    (localStore, args) => {
      const token = getSessionToken();
      const existingFiles = localStore.getQuery(api.files.getFolderContents, {
        projectId: args.projectId,
        parentId: args.parentId,
        token,
      });

      if (existingFiles !== undefined) {
        // eslint-disable-next-line react-hooks/purity -- optimistic update callback runs on mutation, not render
        const now = Date.now();
        const newFile = {
          _id: crypto.randomUUID() as Id<"files">,
          _creationTime: now,
          projectId: args.projectId,
          parentId: args.parentId,
          name: args.name,
          content: args.content,
          type: "file" as const,
          updatedAt: now,
        };

        localStore.setQuery(
          api.files.getFolderContents,
          { projectId: args.projectId, parentId: args.parentId, token },
          sortFiles([...existingFiles, newFile])
        );
      }
    }
  );

  return async (args: { projectId: Id<"projects">; parentId?: Id<"files">; name: string; content: string }) => {
    const token = getSessionToken();
    return mutation({ ...args, token });
  };
};

export const useCreateFolder = () => {
  const mutation = useMutation(api.files.createFolder).withOptimisticUpdate(
    (localStore, args) => {
      const token = getSessionToken();
      const existingFiles = localStore.getQuery(api.files.getFolderContents, {
        projectId: args.projectId,
        parentId: args.parentId,
        token,
      });

      if (existingFiles !== undefined) {
        // eslint-disable-next-line react-hooks/purity -- optimistic update callback runs on mutation, not render
        const now = Date.now();
        const newFolder = {
          _id: crypto.randomUUID() as Id<"files">,
          _creationTime: now,
          projectId: args.projectId,
          parentId: args.parentId,
          name: args.name,
          type: "folder" as const,
          updatedAt: now,
        };

        localStore.setQuery(
          api.files.getFolderContents,
          { projectId: args.projectId, parentId: args.parentId, token },
          sortFiles([...existingFiles, newFolder])
        );
      }
    }
  );

  return async (args: { projectId: Id<"projects">; parentId?: Id<"files">; name: string }) => {
    const token = getSessionToken();
    return mutation({ ...args, token });
  };
};

export const useRenameFile = ({
  projectId,
  parentId,
}: {
  projectId: Id<"projects">;
  parentId?: Id<"files">;
}) => {
  const mutation = useMutation(api.files.renameFile).withOptimisticUpdate(
    (localStore, args) => {
      const token = getSessionToken();
      const existingFiles = localStore.getQuery(api.files.getFolderContents, {
        projectId,
        parentId,
        token,
      });

      if (existingFiles !== undefined) {
        const updatedFiles = existingFiles.map((file) =>
          file._id === args.id ? { ...file, name: args.newName } : file
        );

        localStore.setQuery(
          api.files.getFolderContents,
          { projectId, parentId, token },
          sortFiles(updatedFiles)
        );
      }
    }
  );

  return async (args: { id: Id<"files">; newName: string }) => {
    const token = getSessionToken();
    return mutation({ ...args, token });
  };
};

export const useDeleteFile = ({
  projectId,
  parentId,
}: {
  projectId: Id<"projects">;
  parentId?: Id<"files">;
}) => {
  const mutation = useMutation(api.files.deleteFile).withOptimisticUpdate(
    (localStore, args) => {
      const token = getSessionToken();
      const existingFiles = localStore.getQuery(api.files.getFolderContents, {
        projectId,
        parentId,
        token,
      });

      if (existingFiles !== undefined) {
        localStore.setQuery(
          api.files.getFolderContents,
          { projectId, parentId, token },
          existingFiles.filter((file) => file._id !== args.id)
        );
      }
    }
  );

  return async (args: { id: Id<"files"> }) => {
    const token = getSessionToken();
    return mutation({ ...args, token });
  };
};

export const useFolderContents = ({
  projectId,
  parentId,
  enabled = true,
}: {
  projectId: Id<"projects">;
  parentId?: Id<"files">;
  enabled?: boolean;
}) => {
  const token = getSessionToken();
  return useQuery(
    api.files.getFolderContents,
    enabled ? { projectId, parentId, token } : "skip",
  );
};
