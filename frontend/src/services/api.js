// src/services/api.js
// MOCK mode  (VITE_USE_MOCK_AUTH=true) : Pure client-side responses, zero network.
// PROD mode                            : Axios + Firebase Bearer token → /api

import * as mock from "./mockData.js";

const USE_MOCK = import.meta.env.VITE_USE_MOCK_AUTH === "true";

// ── Mock user helper ─────────────────────────────────────────────────────────
function getMockUser() {
  try {
    const s = sessionStorage.getItem("karios_mock_user");
    return s ? JSON.parse(s) : null;
  } catch { return null; }
}

// ── Simulate network delay ───────────────────────────────────────────────────
const delay = (ms = 200) => new Promise((r) => setTimeout(r, ms));

// ── Parse query string from a URL-like string (e.g. "?date=2026-09-28") ──────
function parseParams(paramsObj) {
  return paramsObj || {};
}

// ── Mock "axios-like" client ──────────────────────────────────────────────────
const mockClient = {
  async get(url, config = {}) {
    await delay();
    const user   = getMockUser();
    const params = parseParams(config.params);
    return routeMock("get", url, {}, params, user);
  },
  async post(url, data = {}, config = {}) {
    await delay();
    const user = getMockUser();
    return routeMock("post", url, data, {}, user);
  },
  async patch(url, data = {}, config = {}) {
    await delay();
    const user = getMockUser();
    return routeMock("patch", url, data, {}, user);
  },
  async delete(url, config = {}) {
    await delay();
    const user = getMockUser();
    return routeMock("delete", url, {}, {}, user);
  },
};

function routeMock(method, url, data, params, user) {
  const path = url.replace(/\/$/, "");

  const reportsIdMatch  = path.match(/^\/reports\/([^/]+)$/);
  const reviewMatch     = path.match(/^\/reports\/([^/]+)\/review$/);
  const notifReadMatch  = path.match(/^\/notifications\/([^/]+)\/read$/);

  try {
    // GET /me
    if (path === "/me" && method === "get")
      return { data: user, status: 200 };

    // GET /dashboard/overview
    if (path === "/dashboard/overview" && method === "get")
      return { data: mock.mockGetOverview(params.date), status: 200 };

    // GET /reports/today  (must come BEFORE /reports/:id)
    if (path === "/reports/today" && method === "get")
      return { data: mock.mockGetToday(user), status: 200 };

    // POST /reports
    if (path === "/reports" && method === "post") {
      const r = mock.mockSubmitReport(user, data);
      return { data: { message: "Report submitted", report: r }, status: 201 };
    }

    // GET /reports
    if (path === "/reports" && method === "get") {
      const list = mock.mockListReports(user, params);
      return { data: list, status: 200 };
    }

    // POST /reports/:id/review
    if (reviewMatch && method === "post") {
      const r = mock.mockReviewReport(reviewMatch[1], user, data);
      return { data: { message: `Report ${r.status.toLowerCase()} successfully`, report: r }, status: 200 };
    }

    // PATCH /reports/:id
    if (reportsIdMatch && method === "patch") {
      const r = mock.mockUpdateReport(reportsIdMatch[1], user, data);
      return { data: { message: "Report updated", report: r }, status: 200 };
    }

    // GET /reports/:id
    if (reportsIdMatch && method === "get") {
      const r = mock.mockGetReport(reportsIdMatch[1]);
      if (!r) throw { status: 404, message: "Report not found" };
      return { data: r, status: 200 };
    }

    // GET /notifications
    if (path === "/notifications" && method === "get")
      return { data: mock.mockGetNotifications(user), status: 200 };

    // PATCH /notifications/:id/read
    if (notifReadMatch && method === "patch") {
      mock.mockMarkNotifRead(notifReadMatch[1], user);
      return { data: { ok: true }, status: 200 };
    }

    return { data: {}, status: 200 };

  } catch (err) {
    const error = new Error(err.message || "Mock error");
    error.response = { status: err.status || 400, data: { error: { message: err.message || "Mock error" } } };
    throw error;
  }
}

// ── Production axios client ───────────────────────────────────────────────────
let prodClient;
async function getProdClient() {
  if (prodClient) return prodClient;
  const axios = (await import("axios")).default;
  prodClient  = axios.create({ baseURL: "/api" });
  prodClient.interceptors.request.use(async (config) => {
    try {
      const { getAuth } = await import("firebase/auth");
      const user = getAuth().currentUser;
      if (user) {
        const token = await user.getIdToken();
        config.headers.Authorization = `Bearer ${token}`;
        return config;
      }
    } catch {
      // Firebase auth not initialized or unavailable
    }
    // Dev session fallback
    const s = sessionStorage.getItem("karios_mock_user");
    if (s) {
      try {
        const u = JSON.parse(s);
        if (u.role === "CEO") {
          config.headers.Authorization = "Bearer dev-ceo";
        } else {
          config.headers.Authorization = `Bearer dev-${(u.department || u.role || "user").toLowerCase()}`;
        }
      } catch { /* ignore */ }
    }
    return config;
  });
  return prodClient;
}

// ── Unified export ────────────────────────────────────────────────────────────
// Mimics axios interface so all pages work identically in both modes.
const api = USE_MOCK
  ? mockClient
  : {
      get:    async (...args) => (await getProdClient()).get(...args),
      post:   async (...args) => (await getProdClient()).post(...args),
      patch:  async (...args) => (await getProdClient()).patch(...args),
      delete: async (...args) => (await getProdClient()).delete(...args),
    };

export default api;