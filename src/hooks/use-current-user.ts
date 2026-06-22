import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useEffect, useState } from "react";

export function useCurrentUser() {
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    // Read the non-httpOnly cookie set by our auth callback
    const match = document.cookie.match(new RegExp("(^| )polaris_session=([^;]+)"));
    if (match) {
      setToken(match[2]);
    } else {
      setToken(null);
    }
  }, []);

  // Pass the token to our custom Convex query.
  // We use `skip` if we haven't found a token yet, but we actually want to query with an undefined token if it's really missing, so it returns null.
  const user = useQuery(api.users.current, token !== null ? { token } : "skip");

  // If token is null, we definitively know there is no user logged in.
  if (token === null) {
    return { user: null, isLoading: false };
  }

  return { 
    user, 
    isLoading: user === undefined 
  };
}
