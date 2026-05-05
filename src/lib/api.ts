import axios, { AxiosError, type AxiosRequestConfig, type AxiosResponse } from "axios";

type ApiSuccess<T> = { success: true; data: T; message?: string };

const API_BASE_URL = import.meta.env.VITE_API_URL as string | undefined;

const ACCESS_TOKEN_KEYS = ["erp-access-token", "accessToken", "token", "jwt"];
const REFRESH_TOKEN_KEYS = ["erp-refresh-token", "refreshToken"];
const AUTH_EXPIRED_EVENT = "erp:auth-expired";

function getFirstNonEmpty(keys: string[]) {
  for (const k of keys) {
    const v = localStorage.getItem(k);
    if (v) return v;
  }
  return null;
}

function getAccessToken() {
  return getFirstNonEmpty(ACCESS_TOKEN_KEYS);
}

function getRefreshToken() {
  return getFirstNonEmpty(REFRESH_TOKEN_KEYS);
}

function setAuthTokens(accessToken: string, refreshToken: string) {
  localStorage.setItem("erp-access-token", accessToken);
  localStorage.setItem("erp-refresh-token", refreshToken);

  // Backward/compat shortcuts
  localStorage.setItem("accessToken", accessToken);
  localStorage.setItem("token", accessToken);
  localStorage.setItem("refreshToken", refreshToken);
}

function clearAuthTokens() {
  for (const k of [...ACCESS_TOKEN_KEYS, ...REFRESH_TOKEN_KEYS]) {
    localStorage.removeItem(k);
  }
  window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT));
}

const api = axios.create({
  baseURL: API_BASE_URL,
});

const refreshClient = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const accessToken = getAccessToken();
  if (accessToken) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

let refreshPromise: Promise<string> | null = null;

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const status = error.response?.status;
    if (status !== 401) throw error;

    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };
    if (!originalRequest) throw error;
    if (originalRequest._retry) throw error;
    originalRequest._retry = true;

    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      clearAuthTokens();
      throw error;
    }

    try {
      if (!refreshPromise) {
        refreshPromise = refreshClient
          .post<ApiSuccess<{ token: string; refreshToken: string }>>("/api/v1/auth/refresh", {
            refreshToken,
          })
          .then((res: AxiosResponse<ApiSuccess<{ token: string; refreshToken: string }>>) => {
            const data = res.data.data;
            if (!data?.token || !data?.refreshToken) throw new Error("Invalid refresh response");
            setAuthTokens(data.token, data.refreshToken);
            return data.token;
          })
          .finally(() => {
            refreshPromise = null;
          });
      }

      const newAccessToken = await refreshPromise;
      originalRequest.headers = originalRequest.headers ?? {};
      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

      return api.request(originalRequest);
    } catch (e) {
      clearAuthTokens();
      throw error;
    }
  }
);

export { api, setAuthTokens, clearAuthTokens, AUTH_EXPIRED_EVENT };

