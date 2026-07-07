const AUTH_COOKIE = "auth_token";

export function setAuthCookie(token: string) {
  document.cookie = `${AUTH_COOKIE}=${token}; path=/; SameSite=Lax`;
}

export function clearAuthCookie() {
  document.cookie = `${AUTH_COOKIE}=; path=/; max-age=0; SameSite=Lax`;
}
