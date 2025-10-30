// src/api.js
export const BASE = process.env.REACT_APP_API_BASE || "http://localhost:4000";

const getLocalToken = () => localStorage.getItem("accessToken") || null;

export async function apiFetch(path, opts = {}, retry = true) {
  const token = getLocalToken();
  const headers = opts.headers || {};
  if (token) headers["Authorization"] = `Bearer ${token}`;
  headers["Content-Type"] = headers["Content-Type"] || "application/json";

  const res = await fetch(`${BASE}${path}`, {
    ...opts,
    headers,
    credentials: "include",
  }); // include cookies for refresh
  if (res.status === 401 && retry) {
    // try refresh
    const refresh = await fetch(`${BASE}/api/auth/refresh`, {
      method: "GET",
      credentials: "include",
    });
    if (refresh.ok) {
      const data = await refresh.json();
      localStorage.setItem("accessToken", data.accessToken);
      localStorage.setItem("user", JSON.stringify(data.user));
      return apiFetch(path, opts, false); // retry once
    } else {
      // cannot refresh
      localStorage.removeItem("accessToken");
      localStorage.removeItem("user");
    }
  }
  return res;
}
