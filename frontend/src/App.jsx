import { Box } from "@chakra-ui/react";
import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { useRecoilValue } from "recoil";
import { useEffect } from "react";

import "./App.css";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import "react-datepicker/dist/react-datepicker.css";
import userAtom from "./atoms/userAtom";
import { setupInterceptors } from "./services/api";

import MainLayout from "@layouts/MainLayout";
import BaseLayout from "@layouts/BaseLayout";
import ChatLayout from "@layouts/ChatLayout";

import HomePage from "@pages/HomePage";
import AuthPage from "@pages/AuthPage";
import UserPage from "@pages/UserPage";
import PostPage from "@pages/PostPage";
import UpdateProfilePage from "@pages/UpdateProfilePage";
import NotificationPage from "@pages/NotificationPage";
import ChatPage from "@pages/ChatPage";
import SettingsPage from "@pages/SettingsPage";
import SearchPage from "@pages/SearchPage";
import PageNotFound from "@pages/PageNotFound";
import ServerErrorPage from "@pages/ServerErrorPage";

import OAuthSuccess from "@components/OAuthSuccess";
import OAuthFailure from "@components/OAuthFailure";
import ResetPasswordCard from "@components/ResetPasswordCard";
import ChangePassword from "@components/ChangePassword";
import ProtectedPage from "@components/ProtectedPage";
import AdminLayout from "@layouts/AdminLayout";
import AdminDashboard from "@pages/Admin/AdminDashboard";
import AdminProtectedPage from "@components-admin/AdminProtectedPage";
import AdminUserManagement from "@pages/Admin/AdminUserManagement";
import AdminReportManagement from "@pages/Admin/AdminReportManagement";
import ForbiddenPage from "@pages/ForbiddenPage";
import AdminPostManagement from "./pages/Admin/AdminPostManagement";

function App() {
  const user = useRecoilValue(userAtom);
  const { pathname } = useLocation();
  const navigate = useNavigate();
  useEffect(() => {
    setupInterceptors(navigate);
  }, [navigate]);

  const routeConfig = {
    authRoutes: ["/auth", "/oauth-success", "/oauth-failure", "/reset-password"],
    noLayoutRoutes: ["/404", "/forbidden", "/server-error"],
    chatRoutes: ["/chat"],
  };

  const getRouteType = () => {
    if (routeConfig.noLayoutRoutes.some(route => pathname.startsWith(route))) return "noLayout";
    if (routeConfig.authRoutes.some(route => pathname.startsWith(route))) return "auth";
    if (routeConfig.chatRoutes.some(route => pathname.startsWith(route))) return "chat";
    return "main";
  };

  const routeType = getRouteType();

  if (routeType === "noLayout") {
    return (
      <Routes>
        <Route path="*" element={<PageNotFound />} />
        <Route path="/server-error" element={<ServerErrorPage />} />
        <Route path="/forbidden" element={<ForbiddenPage />} />
      </Routes>
    );
  }

  if (routeType === "auth") {
    return (
      <BaseLayout showHeader={true}>
        <Box maxW="400px" mx="auto" pt={8}>
          <Routes>
            <Route path="/auth" element={!user ? <AuthPage /> : <Navigate to="/" />} />
            <Route path="/oauth-success" element={<OAuthSuccess />} />
            <Route path="/oauth-failure" element={<OAuthFailure />} />
            <Route path="/reset-password/:token" element={<ResetPasswordCard />} />
            <Route path="/server-error" element={<ServerErrorPage />} />
          </Routes>
        </Box>
      </BaseLayout>
    );
  }

  if (routeType === "chat") {
    return (
      <Routes>
        <Route path="/chat" element={<ChatLayout />}>
          <Route path="" element={<ProtectedPage><ChatPage /></ProtectedPage>} />
          <Route path=":username" element={<ProtectedPage><ChatPage /></ProtectedPage>} />
        </Route>
      </Routes>
    );
  }
  return (

    <Routes>
      {/* Route admin */}
      <Route path="/admin" element={<AdminLayout />}>
        <Route path="" element={<AdminProtectedPage><AdminDashboard /></AdminProtectedPage>} />
        <Route path="users" element={<AdminProtectedPage><AdminUserManagement /></AdminProtectedPage>} />
        <Route path="reports" element={<AdminProtectedPage><AdminReportManagement /></AdminProtectedPage>} />
        <Route path="posts" element={<AdminProtectedPage><AdminPostManagement /></AdminProtectedPage>} />
        <Route path="*" element={<Navigate to="/admin" />} />
      </Route>

      {/* Các route khác */}
      <Route path="/" element={<MainLayout />}>
        <Route index element={<HomePage />} />
        <Route path="home" element={<HomePage />} />
        <Route path="update" element={<ProtectedPage><UpdateProfilePage /></ProtectedPage>} />
        <Route path="settings" element={<ProtectedPage><SettingsPage /></ProtectedPage>} />
        <Route path="change-password" element={<ProtectedPage><ChangePassword /></ProtectedPage>} />
        <Route path="search" element={<SearchPage />} />
        <Route path="user/:username" element={<UserPage />} />
        <Route path=":username/post/:pid" element={<PostPage />} />
        <Route path="notifications" element={<ProtectedPage><NotificationPage /></ProtectedPage>} />
      </Route>
    </Routes>
  );
}

export default App;
