import API from "./index";

export const adminLogin = (data) =>
  API.post("/api/admin/login", data);
