import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "https://learnmate-o40t.onrender.com/api"
});

// Intercept all requests to cleanly append the Bearer Token if logged in
API.interceptors.request.use((req) => {
  const token = localStorage.getItem("token");
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});

export default API;
