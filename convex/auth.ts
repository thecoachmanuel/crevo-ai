import { convexAuth } from "@convex-dev/auth/server";
import { Password } from "@convex-dev/auth/providers/Password";
import GitHub from "@auth/core/providers/github";
import { MutationCtx, QueryCtx } from "./_generated/server";

export const { auth, signIn, signOut, store } = convexAuth({
  providers: [
    Password,
    GitHub({
      profile(profile, tokens) {
        return {
          id: profile.id.toString(),
          name: profile.name || profile.login,
          email: profile.email,
          image: profile.avatar_url,
          githubAccessToken: tokens.access_token,
        };
      },
    }),
  ],
});

export const verifyAuth = async (ctx: QueryCtx | MutationCtx) => {
  const identity = await ctx.auth.getUserIdentity();

  if (!identity) {
    throw new Error("Unauthorized");
  }

  return identity;
};
