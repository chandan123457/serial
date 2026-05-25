const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000/api";

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json"
    },
    ...options
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Request failed" }));
    throw new Error(error.message || "Request failed");
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

export function fetchAdminBootstrap() {
  return request("/admin/bootstrap");
}

export function createAdminUser(payload) {
  return request("/admin/users", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function updateAdminUser(id, payload) {
  return request(`/admin/users/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload)
  });
}

export function deleteAdminUser(id) {
  return request(`/admin/users/${id}`, {
    method: "DELETE"
  });
}

export function createModelNumber(payload) {
  return request("/admin/model-numbers", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function deleteModelNumber(id) {
  return request(`/admin/model-numbers/${id}`, {
    method: "DELETE"
  });
}
