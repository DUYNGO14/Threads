// src/App.jsx
import { Box } from "@chakra-ui/react";
import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { useRecoilValue } from "recoil";
import "./App.css";
import userAtom from "./atoms/userAtom";
import HomePage from "./pages/HomePage";
import AuthPage from "./pages/AuthPage";
import UserPage from "./pages/UserPage";
import PostPage from "./pages/PostPage";
import UpdateProfilePage from "./pages/UpdateProfilePage";
import NotificationPage from "./pages/NotificationPage";
import ChatPage from "./pages/ChatPage";
import { SettingsPage } from "./pages/SettingsPage";
import OAuthSuccess from "./components/OAuthSuccess";
import OAuthFailure from "./components/OAuthFailure";
import ResetPasswordCard from "./components/ResetPasswordCard";
import ChangePassword from "./components/ChangePassword";
import PageNotFound from "./pages/PageNotFound";
import CreatePost from "./components/CreatePost";
import MainLayout from "./layouts/MainLayout";
import BaseLayout from "./layouts/BaseLayout";
import SearchPage from "./pages/SearchPage";
import ChatLayout from "./layouts/ChatLayout";
import ProtectedPage from "./components/ProtectedPage";
import ServerErrorPage from "./pages/ServerErrorPage";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { useEffect } from "react";
import { setupInterceptors } from "./services/api";

function App() {
  const user = useRecoilValue(userAtom);
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const authRoutes = ["/auth", "/oauth-success", "/oauth-failure", "/reset-password"];
  const noLayoutRoutes = ["/404"];

  const isAuthRoute = authRoutes.some(route => pathname.startsWith(route));
  const isNoLayoutRoute = noLayoutRoutes.some(route => pathname.startsWith(route));
  const isChatRoute = pathname.startsWith("/chat"); // 👉 Kiểm tra nếu là trang chat
  useEffect(() => {
    setupInterceptors(navigate); // 👈 gọi interceptor đúng cách
  }, [navigate]);
  // 👇 Trang không có layout
  if (isNoLayoutRoute) {
    return (
      <Routes>
        <Route path="*" element={<PageNotFound />} />
      </Routes>
    );
  }

  // 👇 Trang auth layout riêng
  if (isAuthRoute) {
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

  // 👇 Trang Chat dùng layout riêng
  if (isChatRoute) {
    return (
      <ChatLayout>
        <Routes>
          <Route
            path="/chat"
            element={<ProtectedPage><ChatPage /></ProtectedPage>}
          />
          <Route
            path="/chat/:chatId"
            element={<ProtectedPage><ChatPage /></ProtectedPage>}
          />
        </Routes>
      </ChatLayout>
    );
  }

  // 👇 Các trang khác dùng MainLayout
  return (
    <MainLayout>
      {user && <CreatePost />}
      <Routes key={pathname}>
        <Route path="/" element={<HomePage />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/update" element={<ProtectedPage><UpdateProfilePage /></ProtectedPage>} />
        <Route path="/settings" element={<ProtectedPage><SettingsPage /></ProtectedPage>} />
        <Route path="/change-password" element={<ProtectedPage><ChangePassword /></ProtectedPage>} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/:username" element={<UserPage />} />
        <Route path="/:username/post/:pid" element={<PostPage />} />
        <Route path="/notifications" element={<ProtectedPage><NotificationPage /></ProtectedPage>} />
      </Routes>
    </MainLayout>
  );
}

export default App;
