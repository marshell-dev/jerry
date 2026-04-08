import jerry from "../src";

interface User {
  id: string;
  name: string;
}

const api = jerry.create({
  baseURL: "https://api.example.com",
  headers: {
    Accept: "application/json",
  },
});

api.interceptors.request.use((config) => {
  config.headers = {
    ...config.headers,
    Authorization: `Bearer ${window.localStorage.getItem("token") ?? ""}`,
  };

  return config;
});

export async function loadCurrentUser(): Promise<User> {
  return api.get<User>("/me", {
    responseMode: "data",
  });
}

