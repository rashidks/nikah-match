export const API = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

const tok = () => localStorage.getItem("access");
export const setToken = (t) => (t ? localStorage.setItem("access", t) : localStorage.removeItem("access"));
export const loggedIn = () => !!tok();

export async function api(path, { method = "GET", body, form } = {}) {
  const headers = {};
  if (tok()) headers.Authorization = `Bearer ${tok()}`;
  if (body) headers["Content-Type"] = "application/json";
  const res = await fetch(`${API}/api${path}`, {
    method, headers, body: form || (body ? JSON.stringify(body) : undefined),
  });
  const data = res.status === 204 ? null : await res.json().catch(() => null);
  if (res.status === 401 && tok()) { setToken(null); window.location.href = "/login"; }
  if (!res.ok) {
    const msg = data && typeof data === "object"
      ? Object.values(data).flat().join(" ") : "Something went wrong.";
    throw new Error(msg);
  }
  return data;
}

export const photoUrl = (p) => (p ? (p.startsWith("http") ? p : API + p) : null);
