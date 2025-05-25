import { useState, useEffect } from "react";
import api from "@services/api";

export default function useAdminDashboardData(
  monthUser,
  yearUser,
  monthPost,
  yearPost
) {
  const [registeredData, setRegisteredData] = useState([]);
  const [postsData, setPostsData] = useState([]);
  const [postStatusData, setPostStatusData] = useState([]);
  const [growthStats, setGrowthStats] = useState([]);
  const [reportsData, setReportsData] = useState([]);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [usersRes, postsRes, postStatus, growthRes, reportsRes] =
          await Promise.all([
            api.get(
              `/api/admin/statistics/users/registered?month=${monthUser}&year=${yearUser}`
            ),
            api.get(
              `/api/admin/statistics/posts/created?month=${monthPost}&year=${yearPost}`
            ),
            api.get("/api/admin/statistics/posts/status"),
            api.get("/api/admin/growth"),
            api.get("/api/admin/report/statistics"), // Gọi API báo cáo
          ]);

        setRegisteredData(usersRes.data.data);
        setPostsData(postsRes.data.data);
        setPostStatusData(postStatus.data.data);
        setGrowthStats(growthRes.data.data);
        setReportsData(reportsRes.data.data);
      } catch (error) {
        console.error("Error fetching data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [monthUser, yearUser, monthPost, yearPost]);

  return {
    registeredData,
    postsData,
    postStatusData,
    growthStats,
    reportsData,
    loading,
  };
}
