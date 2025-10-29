// src/api/interceptors.js

import axios from "axios";
import api from "./axios";

let isRefreshing = false;
let refreshSubscribers = [];

const NON_AUTH_ENDPOINTS = [
  "/auth/login",
  "/auth/register",
  "/auth/refresh-token",
  // add more as needed
];

const onRefreshed = (newToken) => {
  refreshSubscribers.forEach((cb) => cb(newToken));
  refreshSubscribers = [];
};

const addSubscriber = (cb) => {
  refreshSubscribers.push(cb);
};

export const setupInterceptors = () => {
  // 🔸 Request Interceptor
  api.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem("accessToken");
      if (token) config.headers.Authorization = `Bearer ${token}`;
      return config;
    },
    (error) => Promise.reject(error)
  );

  // 🔸 Response Interceptor
  api.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;

      const isPublicEndpoint = NON_AUTH_ENDPOINTS.some((url) =>
        originalRequest.url?.includes(url)
      );

      if (
        error.response &&
        error.response.status === 401 &&
        !originalRequest._retry &&
        !isPublicEndpoint
      ) {
        originalRequest._retry = true;

        if (isRefreshing) {
          return new Promise((resolve) => {
            addSubscriber((newToken) => {
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
              resolve(api(originalRequest));
            });
          });
        }

        isRefreshing = true;

        try {
          const res = await axios.post(
            import.meta.env.VITE_SERVER_BASE_URI + "/api/v1/auth/refresh-token",
            {},
            { withCredentials: true }
          );

          const newAccessToken = res.data.accessToken;
          if (newAccessToken) {
            localStorage.setItem("accessToken", newAccessToken);
            api.defaults.headers.Authorization = `Bearer ${newAccessToken}`;
            onRefreshed(newAccessToken);
          }

          isRefreshing = false;
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return api(originalRequest);
        } catch (refreshErr) {
          console.error("Token refresh failed:", refreshErr);
          localStorage.removeItem("accessToken");
          isRefreshing = false;
          // window.location.href = "/login";
          return Promise.reject(refreshErr);
        }
      }

      return Promise.reject(error);
    }
  );
};
