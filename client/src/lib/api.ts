import axios from 'axios';

// Create an Axios instance with a base URL for our backend
export const apiClient = axios.create({
  baseURL: 'http://localhost:3000', // The URL of our NestJS server
});