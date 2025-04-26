import { Box } from "@chakra-ui/react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { useRecoilValue } from "recoil";
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
import ChatLayout from "./layouts/ChatLayout"; // 👉 Thêm ChatLayout

import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

const ProtectedRoute = ({ children }) => {
  const user = useRecoilValue(userAtom);
  return user ? children : <Navigate to="/auth" />;
};

function App() {
  const user = useRecoilValue(userAtom);
  const { pathname } = useLocation();

  const authRoutes = ["/auth", "/oauth-success", "/oauth-failure", "/reset-password"];
  const noLayoutRoutes = ["/404"];

  const isAuthRoute = authRoutes.some(route => pathname.startsWith(route));
  const isNoLayoutRoute = noLayoutRoutes.some(route => pathname.startsWith(route));
  const isChatRoute = pathname.startsWith("/chat"); // 👉 Kiểm tra nếu là trang chat

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
            element={<ProtectedRoute><ChatPage /></ProtectedRoute>}
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
        <Route path="/update" element={<ProtectedRoute><UpdateProfilePage /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
        <Route path="/change-password" element={<ProtectedRoute><ChangePassword /></ProtectedRoute>} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/:username" element={<UserPage />} />
        <Route path="/:username/post/:pid" element={<PostPage />} />
        <Route path="/notifications" element={<ProtectedRoute><NotificationPage /></ProtectedRoute>} />
      </Routes>
    </MainLayout>
  );
}

export default App;
