import "server-only";
// NextAuth v5 (GitHub OAuth, JWT sessions). On sign-in we upsert an app user
// row keyed by GitHub id and stash the app UUID in the JWT, exposed as
// session.user.id — that UUID is what every DB query is scoped to.
//
// Note: JWT strategy (no DB session round-trips) keeps this serverless-friendly.
// We deliberately do NOT run auth in middleware, so this node-only module
// (which pulls in pg) is never evaluated on the edge runtime.
import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import { upsertUserByGithub } from "./db";

export const { handlers, auth, signIn, signOut } = NextAuth({
  // Next.js `basePath` is "/dsaguardian", so the auth handler is publicly served
  // at "/dsaguardian/api/auth/*". Auth.js does NOT infer Next's basePath, so we
  // must tell it the full public prefix or it builds callback/redirect URLs at
  // "/api/auth/*" (missing "/dsaguardian") and the OAuth round-trip 404s.
  basePath: "/dsaguardian/api/auth",
  // Behind the portfolio's cross-domain rewrite the incoming Host is
  // dsa-guardian.vercel.app; trust it and rely on AUTH_URL for the public origin.
  trustHost: true,
  providers: [GitHub],
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, account, profile }) {
      // `account` + `profile` are only present on the initial sign-in.
      if (account && profile) {
        const user = await upsertUserByGithub({
          githubId: profile.id as unknown as number,
          username: (profile.login as string) ?? null,
          email: (profile.email as string) ?? null,
          name: (profile.name as string) ?? null,
          image: (profile.avatar_url as string) ?? null,
        });
        token.uid = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token.uid && session.user) {
        (session.user as { id?: string }).id = token.uid as string;
      }
      return session;
    },
  },
});
