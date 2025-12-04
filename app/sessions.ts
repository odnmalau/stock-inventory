import { createCookieSessionStorage } from "react-router";

type SessionData = {
  userId: string;
};

type SessionFlashData = {
  error: string;
};

const { getSession, commitSession, destroySession } =
  createCookieSessionStorage<SessionData, SessionFlashData>({
    // a Cookie from `createCookie` or the CookieOptions to create one
    cookie: {
      name: "__session",

      // all of these are optional
      // domain: "react-router.com",
      // Expires can also be set (although maxAge is often easier to reason about)
      // expires: new Date(Date.now() + 60_000),
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
      sameSite: "lax",
      secrets: [process.env.SESSION_SECRET || "s3cr3t"],
      secure: process.env.NODE_ENV === "production",
    },
  });

export { getSession, commitSession, destroySession };
