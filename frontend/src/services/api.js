import axios from "axios";

const API = axios.create({
  baseURL: "https://learnmate-o40t.onrender.com"
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
