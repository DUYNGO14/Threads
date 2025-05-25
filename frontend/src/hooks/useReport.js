import { useState, useEffect } from "react";
import api from "../services/api";

export default function useReport(initialState = []) {
  const [reports, setReports] = useState(initialState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchReports = async () => {
      setLoading(true);
      try {
        const res = await api.get("/reports");
        setReports(res.data);
      } catch (error) {
        const errorData = error.response?.data?.message || error.message;
        setError(errorData);
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, []);

  const createReport = async (data) => {
    try {
      const res = await api.post("/api/reports", data);
      setReports((prev) => [...prev, res.data]);
      return res.data;
    } catch (error) {
      const errorData = error.response?.data?.message || error.message;
      setError(errorData);
      throw new Error(errorData); // Ném lỗi ra ngoài
    }
  };

  const updateReport = async (id, data) => {
    try {
      const res = await api.put(`/reports/${id}`, data);
      setReports((prev) =>
        prev.map((report) => (report._id === id ? { ...res.data } : report))
      );
      return res.data;
    } catch (error) {
      const errorData = error.response?.data?.message || error.message;
      setError(errorData);
      throw new Error(errorData);
    }
  };

  const deleteReport = async (id) => {
    try {
      await api.delete(`/reports/${id}`);
      setReports((prev) => prev.filter((report) => report._id !== id));
    } catch (error) {
      const errorData = error.response?.data?.message || error.message;
      setError(errorData);
      throw new Error(errorData);
    }
  };

  return {
    reports,
    loading,
    error,
    createReport,
    updateReport,
    deleteReport,
  };
}
