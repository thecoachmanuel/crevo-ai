import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { GithubIcon } from "lucide-react";

export const SignInForm = () => {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const isGithubAuthEnabled = process.env.NEXT_PUBLIC_GITHUB_AUTH_ENABLED === "true";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    
    try {
      const endpoint = isSignUp ? "/api/auth/register" : "/api/auth/login";
      const payload = isSignUp ? { email, password, name } : { email, password };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to authenticate");
      }

      router.refresh(); // Refresh layout to pick up the new session cookie
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to authenticate. Please check your credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setError("");
    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/demo", { method: "POST" });
      if (!response.ok) throw new Error("Failed to login as demo user");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to login as demo user");
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 mt-4 w-full">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full">
        {isSignUp && (
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">Name</Label>
            <Input 
              id="name" 
              type="text" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
            />
          </div>
        )}
        <div className="flex flex-col gap-2">
          <Label htmlFor="email">Email</Label>
          <Input 
            id="email" 
            type="email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            required 
            disabled={isLoading}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="password">Password</Label>
          <Input 
            id="password" 
            type="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required 
            disabled={isLoading}
          />
        </div>
        
        {error && <p className="text-red-500 text-sm font-medium">{error}</p>}
        
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isSignUp ? "Sign Up" : "Sign In"}
        </Button>
        
        <Button 
          type="button" 
          variant="ghost" 
          onClick={() => {
            setIsSignUp(!isSignUp);
            setError("");
          }}
          className="text-sm"
          disabled={isLoading}
        >
          {isSignUp ? "Already have an account? Sign In" : "Don't have an account? Sign Up"}
        </Button>
        
        <div className="relative my-2">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              Or
            </span>
          </div>
        </div>

        <Button 
          type="button" 
          variant="secondary" 
          onClick={handleDemoLogin}
          disabled={isLoading}
        >
          Quick Test (Login as Demo User)
        </Button>
      </form>

      {isGithubAuthEnabled && (
        <>
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-muted px-2 text-muted-foreground">
                Or continue with
              </span>
            </div>
          </div>
          <Button asChild className="w-full h-11" variant="outline" disabled={isLoading}>
            <Link href="/api/auth/github">
              <GithubIcon className="mr-2 h-5 w-5" />
              GitHub
            </Link>
          </Button>
        </>
      )}
    </div>
  );
};
