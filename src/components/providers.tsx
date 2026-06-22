"use client";

import { ConvexProvider, ConvexReactClient } from "convex/react";
import { UnauthenticatedView } from "@/features/auth/components/unauthenticated-view";
import { AuthLoadingView } from "@/features/auth/components/auth-loading-view";
import { ThemeProvider } from "./theme-provider";
import { useCurrentUser } from "@/hooks/use-current-user";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

const AuthWrapper = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading } = useCurrentUser();

  if (isLoading) {
    return <AuthLoadingView />;
  }

  if (!user) {
    return <UnauthenticatedView />;
  }

  return <>{children}</>;
};

export const Providers = ({ children }: { children: React.ReactNode }) => {
  return (
    <ConvexProvider client={convex}>
      <ThemeProvider
        attribute="class"
        defaultTheme="dark"
        enableSystem
        disableTransitionOnChange
      >
        <AuthWrapper>
          {children}
        </AuthWrapper>
      </ThemeProvider>
    </ConvexProvider>
  );
};
