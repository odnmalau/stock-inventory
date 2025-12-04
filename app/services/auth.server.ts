import { redirect } from "react-router";
import { query } from "~/db.server";
import { getSession, commitSession, destroySession } from "~/sessions";
import crypto from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(crypto.scrypt);
const randomBytes = promisify(crypto.randomBytes);

async function hashPassword(password: string): Promise<string> {
  const salt = await randomBytes(16);
  const derivedKey = (await scrypt(password, salt, 64)) as Buffer;
  return `${salt.toString("hex")}:${derivedKey.toString("hex")}`;
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const [salt, key] = hash.split(":");
  const keyBuffer = Buffer.from(key, "hex");
  const derivedKey = (await scrypt(password, Buffer.from(salt, "hex"), 64)) as Buffer;
  return crypto.timingSafeEqual(keyBuffer, derivedKey);
}

export async function login({ email, password }: { email: string; password: string }) {
  try {
    const users = await query("SELECT * FROM users WHERE email = ?", [email]);
    if (users.length === 0) return null;

    const user = users[0];
    const isValid = await verifyPassword(password, user.password);

    if (!isValid) return null;

    return user;
  } catch (error) {
    console.error("Login error:", error);
    return null;
  }
}

export async function createUserSession(userId: string, redirectTo: string) {
  const session = await getSession();
  session.set("userId", userId);
  return redirect(redirectTo, {
    headers: {
      "Set-Cookie": await commitSession(session),
    },
  });
}

export async function logout(request: Request) {
  const session = await getSession(request.headers.get("Cookie"));
  return redirect("/login", {
    headers: {
      "Set-Cookie": await destroySession(session),
    },
  });
}

export async function getUserId(request: Request) {
  const session = await getSession(request.headers.get("Cookie"));
  const userId = session.get("userId");
  if (!userId) return null;
  return userId;
}

export async function requireUserId(request: Request) {
  const userId = await getUserId(request);
  if (!userId) {
    throw redirect("/login");
  }
  return userId;
}

export async function getUser(request: Request) {
  const userId = await getUserId(request);
  if (!userId) return null;

  const users = await query("SELECT id, nama, email, role FROM users WHERE id = ?", [userId]);
  if (users.length === 0) {
    throw await logout(request);
  }
  return users[0];
}

// Helper to create a user (for seeding/testing)
export async function register({ nama, email, password, role }: any) {
  const hashedPassword = await hashPassword(password);
  await query(
    "INSERT INTO users (nama, email, password, role) VALUES (?, ?, ?, ?)",
    [nama, email, hashedPassword, role]
  );
}
