/* eslint-disable react-hooks/purity */

import { useMutation, useQuery } from "convex/react";

import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { getSessionToken } from "@/lib/client-auth";

export const useProject = (projectId: Id<"projects">) => {
  const token = getSessionToken();
  return useQuery(
    api.projects.getById,
    token ? { id: projectId, token } : "skip"
  );
};

export const useProjects = () => {
  const token = getSessionToken();
  return useQuery(api.projects.get, token ? { token } : "skip");
};

export const useProjectsPartial = (limit: number) => {
  const token = getSessionToken();
  return useQuery(
    api.projects.getPartial,
    token ? { limit, token } : "skip"
  );
};

export const useCreateProject = () => {
  const mutation = useMutation(api.projects.create).withOptimisticUpdate(
    (localStore, args) => {
      const token = getSessionToken();
      const existingProjects = localStore.getQuery(api.projects.get, { token });

      if (existingProjects !== undefined) {
        const now = Date.now();
        const newProject = {
          _id: crypto.randomUUID() as Id<"projects">,
          _creationTime: now,
          name: args.name,
          ownerId: "anonymous",
          updatedAt: now,
        };

        if (token) {
          localStore.setQuery(api.projects.get, { token }, [
            newProject,
            ...existingProjects,
          ]);
        }
      }
    }
  );

  return async (args: { name: string }) => {
    const token = getSessionToken();
    return mutation({ ...args, token });
  };
};

export const useRenameProject = () => {
  const mutation = useMutation(api.projects.rename).withOptimisticUpdate(
    (localStore, args) => {
      const token = getSessionToken();
      const existingProject = localStore.getQuery(
        api.projects.getById,
        { id: args.id, token }
      );

      if (existingProject !== undefined && existingProject !== null && token) {
        localStore.setQuery(
          api.projects.getById,
          { id: args.id, token },
          {
            ...existingProject,
            name: args.name,
            updatedAt: Date.now(),
          }
        );
      }

      const existingProjects = localStore.getQuery(api.projects.get, { token });

      if (existingProjects !== undefined && token) {
        localStore.setQuery(
          api.projects.get,
          { token },
          existingProjects.map((project) => {
            return project._id === args.id
              ? { ...project, name: args.name, updatedAt: Date.now() }
              : project;
          })
        );
      }
    }
  );

  return async (args: { id: Id<"projects">; name: string }) => {
    const token = getSessionToken();
    return mutation({ ...args, token });
  };
};

export const useUpdateProjectSettings = () => {
  const mutation = useMutation(api.projects.updateSettings);
  return async (args: { id: Id<"projects">; settings: { installCommand?: string; devCommand?: string } }) => {
    const token = getSessionToken();
    return mutation({ ...args, token });
  };
};
