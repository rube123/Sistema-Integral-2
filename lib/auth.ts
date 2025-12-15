// lib/auth.ts
import { useRouter } from "next/navigation";

const TOKEN_KEY = "auth_token";

export function setToken(token: string) {
  if (typeof window !== "undefined") {
    localStorage.setItem(TOKEN_KEY, token);
  }
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function clearToken() {
  if (typeof window !== "undefined") {
    localStorage.removeItem(TOKEN_KEY);
  }
}

// opcional, si lo usas:
export function handleAuthError(router: ReturnType<typeof useRouter>) {
  clearToken();
  router.push("/login");
}
