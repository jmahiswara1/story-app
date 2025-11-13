import { Storage } from "../utils/storage.js";

const BASE_URL = "https://story-api.dicoding.dev/v1";

async function http(
  path,
  { method = "GET", headers = {}, body, auth = false } = {}
) {
  const finalHeaders = new Headers(headers);
  if (!(body instanceof FormData) && !finalHeaders.has("Content-Type")) {
    finalHeaders.set("Content-Type", "application/json");
  }
  if (auth) {
    const token = Storage.getToken();
    if (token) finalHeaders.set("Authorization", `Bearer ${token}`);
  }

  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers: finalHeaders,
      body,
    });
    const contentType = res.headers.get("content-type") || "";
    const isJson = contentType.includes("application/json");
    const data = isJson ? await res.json() : await res.text();

    if (!res.ok) {
      const message =
        data?.message || `Request failed with status ${res.status}`;
      const error = new Error(message);
      error.status = res.status;
      error.response = data;
      throw error;
    }

    if (data && data.error) {
      throw new Error(data?.message || "Request failed");
    }

    return data;
  } catch (err) {
    if (err instanceof TypeError) {
      throw new Error(`Network error: ${err.message}`);
    }
    throw err;
  }
}

export const StoryApi = {
  async register({ name, email, password }) {
    return http("/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password }),
    });
  },
  async login({ email, password }) {
    const data = await http("/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    const { loginResult } = data || {};
    if (loginResult?.token) {
      Storage.setToken(loginResult.token);
      if (loginResult?.name) Storage.setName(loginResult.name);
    }
    return data;
  },
  async getStories({ page = 1, size = 20, withLocation = 1 } = {}) {
    const qs = new URLSearchParams({ page, size, location: withLocation });
    return http(`/stories?${qs.toString()}`, { auth: true });
  },
  async getStory(id) {
    return http(`/stories/${id}`, { auth: true });
  },
  async addStory({ description, file, lat, lon, asGuest = false }) {
    const form = new FormData();
    form.append("description", description);
    if (typeof lat === "number") form.append("lat", String(lat));
    if (typeof lon === "number") form.append("lon", String(lon));
    form.append("photo", file);
    const path = asGuest ? "/stories/guest" : "/stories";
    return http(path, { method: "POST", body: form, auth: !asGuest });
  },
  async subscribePush({ endpoint, keys }) {
    return http("/notifications/subscribe", {
      method: "POST",
      auth: true,
      body: JSON.stringify({ endpoint, keys }),
    });
  },
  async unsubscribePush({ endpoint }) {
    return http("/notifications/subscribe", {
      method: "DELETE",
      auth: true,
      body: JSON.stringify({ endpoint }),
    });
  },
};
