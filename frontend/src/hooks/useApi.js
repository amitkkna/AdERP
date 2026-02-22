import { useState, useCallback } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';

const useApi = () => {
  const [loading, setLoading] = useState(false);

  const request = useCallback(async (method, url, data = null, options = {}) => {
    setLoading(true);
    try {
      const config = { method, url, ...options };
      if (data) {
        if (data instanceof FormData) {
          config.data = data;
          config.headers = { 'Content-Type': 'multipart/form-data' };
        } else {
          config.data = data;
        }
      }
      const response = await api(config);
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || 'Something went wrong.';
      toast.error(message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const get = useCallback((url, params) => request('get', url, null, { params }), [request]);
  const post = useCallback((url, data, options) => request('post', url, data, options), [request]);
  const put = useCallback((url, data) => request('put', url, data), [request]);
  const del = useCallback((url) => request('delete', url), [request]);

  return { loading, get, post, put, del };
};

export default useApi;
