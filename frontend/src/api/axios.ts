import axios from "axios";

// create axios instance
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
});

// Request interceptor - attach token to every request
api.interceptors.request.use((config) => {
  // Do something before request is sent
  // Checks localStorage for a "token".
  // If found, adds Authorization: Bearer <token> header.
  const token = localStorage.getItem("token");

  if (token) {
    // attach token to every request.
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Get Branch (City) - Default to 'agadir' if missing
  const branch = localStorage.getItem("branch") || "agadir";
  config.headers["x-branch"] = branch;

  return config;
});

api.interceptors.response.use(
  (response) => response, // If successful, just return response
  (error) => {
    // Only redirect on 401 if user was logged in
    // (Don't redirect on failed login/register attempts)
    if (error.response?.status === 401) {
      const token = localStorage.getItem("token");

      if (token) {
        console.log("Session expired, redirecting to login");
        localStorage.removeItem("token");
        window.location.href = "/login"; // Force redirect to login //
      }

      // If no token, it's just a failed login attempt - let component handle it
    }
    return Promise.reject(error);
  },
);
