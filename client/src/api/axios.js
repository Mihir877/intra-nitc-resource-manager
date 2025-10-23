// src/api/api.js

import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_SERVER_BASE_URI + "/api/v1",
  headers: { "Content-Type": "application/json" },
  withCredentials: true, // for sending cookies (refreshToken)
});

export default api;
