import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useEffect, useState } from "react";

export function useCurrentUser() {
  // undefined = "haven't checked yet" | string = "found a token" | null = "no token found"
  const [token, setToken] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    // Read the non-httpOnly cookie set by our auth callback
    const match = document.cookie.match(new RegExp("(^| )polaris_session=([^;]+)"));
    if (match) {
      setToken(match[2]);
    } else {
      setToken(null); // definitively no token
    }
  }, []);

  // Skip the Convex query until we've actually read the cookie
  const user = useQuery(
    api.users.current,
    token !== undefined && token !== null ? { token } : "skip"
  );

  // Still checking the cookie — show loading
  if (token === undefined) {
    return { user: undefined, isLoading: true };
  }

  // Cookie was checked, no token found — definitely logged out
  if (token === null) {
    return { user: null, isLoading: false };
  }

  // Token found, waiting for Convex to validate it
  return { 
    user, 
    isLoading: user === undefined 
  };
}
