import axios from "axios";

<<<<<<< HEAD
// In dev: use Vite proxy (/api)
// In prod: use VITE_API_URL from env
const baseURL = import.meta.env.DEV
  ? ""
  : import.meta.env.VITE_API_URL;

axios.defaults.baseURL = baseURL;
=======
// Use proxy in development (localhost), direct URL in production
// baseURL is disabled to ensure all requests use explicit API_BASE or helpers
>>>>>>> 4e37e52 (Initial commit: working RRnagar frontend)
axios.defaults.withCredentials = true;

export default axios;
