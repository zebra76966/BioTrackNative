import axios from "axios";
import * as SecureStore from "expo-secure-store";

// 💡 TIP: Change this IP whenever your computer's local IP changes
const BASE_URL = "https://api.forge.ngo";

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

// 🔥 AUTH INTERCEPTOR
// This automatically grabs the token from SecureStore and adds it to headers
// so you don't have to manually add it in every useEffect.
api.interceptors.request.use(
  async (config) => {
    const token = await SecureStore.getItemAsync("jwt");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

export default api;
