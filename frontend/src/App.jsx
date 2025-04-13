import { Box } from "@chakra-ui/react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { useRecoilValue } from "recoil";
import userAtom from "./atoms/userAtom";
import HomePage from "./pages/HomePage";
import AuthPage from "./pages/AuthPage";
import UserPage from "./pages/UserPage";
import PostPage from "./pages/PostPage";
import UpdateProfilePage from "./pages/UpdateProfilePage";
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

// Component bảo vệ route cần đăng nhập
const ProtectedRoute = ({ children }) => {
  const user = useRecoilValue(userAtom);
  return user ? children : <Navigate to="/auth" />;
};

function App() {
  const user = useRecoilValue(userAtom);
  const { pathname } = useLocation();
  // Auth routes that use BaseLayout
  const authRoutes = ['/auth', '/oauth-success', '/oauth-failure', '/reset-password'];
  const isAuthRoute = authRoutes.some(route => pathname.startsWith(route));

  // Routes that don't need any layout
  const noLayoutRoutes = ['/404'];
  const needsNoLayout = noLayoutRoutes.some(route => pathname.startsWith(route));

  if (needsNoLayout) {
    return (
      <Routes>
        <Route path="*" element={<PageNotFound />} />
      </Routes>
    );
  }

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

  return (
    <MainLayout>
      {user && <CreatePost />}
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/update" element={<ProtectedRoute><UpdateProfilePage /></ProtectedRoute>} />
        <Route path="/chat" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
        <Route path="/change-password" element={<ProtectedRoute><ChangePassword /></ProtectedRoute>} />
        <Route path="/search" element={<SearchPage />} />
        {/* Profile & Post routes */}

        <Route path="/:username" element={user ? <>
          <UserPage />
        </> : <UserPage />}
        />
        <Route path="/:username/post/:pid" element={<PostPage />} />
      </Routes>
    </MainLayout>
  );
}

export default App;
