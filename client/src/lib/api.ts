import axios from 'axios';
import { tabSession } from './tab-session';

export const apiClient = axios.create({
  baseURL: 'http://localhost:3000',
});

// Add a request interceptor to include the token
apiClient.interceptors.request.use(
  (config) => {
    const token = tabSession.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);
