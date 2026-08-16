import axios from 'axios';
import { supabase } from '../context/AuthContext';

const LOCAL_API_URL = 'http://localhost:5000/api';
const PROD_API_URL = 'https://job-tracker-backend-uioe.onrender.com/api';

const getBaseURL = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (!envUrl) {
    // Keep local development unchanged; use Render backend elsewhere.
    if (typeof window !== 'undefined' && ['localhost', '127.0.0.1'].includes(window.location.hostname)) {
      return LOCAL_API_URL;
    }
    return PROD_API_URL;
  }
  const cleanUrl = envUrl.replace(/\/$/, '');
  return cleanUrl.endsWith('/api') ? cleanUrl : `${cleanUrl}/api`;
};

const apiClient = axios.create({
  baseURL: getBaseURL(),
  timeout: 45000,
});

let cachedToken: string | null = null;

// Keep token in memory for instant zero-delay request authorization
supabase.auth.onAuthStateChange((_event, session) => {
  cachedToken = session?.access_token || null;
});

// Auto-inject Supabase JWT into every request
apiClient.interceptors.request.use(async (config) => {
  if (!cachedToken) {
    const { data } = await supabase.auth.getSession();
    cachedToken = data.session?.access_token || null;
  }
  if (cachedToken) {
    config.headers.Authorization = `Bearer ${cachedToken}`;
  }
  return config;
});

export default apiClient;
