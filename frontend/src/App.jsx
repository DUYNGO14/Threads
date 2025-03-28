import { Box, Container } from "@chakra-ui/react"
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import UserPage from "./pages/UserPage"
import PostPage from "./pages/PostPage"
import Header from "./components/Header"
import HomePage from "./pages/HomePage"
import AuthPage from "./pages/AuthPage"
import userAtom from "./atoms/userAtom"
import { useRecoilValue } from "recoil"
import UpdateProfilePage from "./pages/UpdateProfilePage"
import CreatePost from "./components/CreatePost"
import ChatPage from "./pages/ChatPage"
import { SettingsPage } from "./pages/SettingsPage"
import OAuthSuccess from "./components/OAuthSuccess"
import OAuthFailure from "./components/OAuthFailure"
import ResetPasswordCard from "./components/ResetPasswordCard"
import ChangePassword from "./components/ChangePassword"

function App() {
  const user = useRecoilValue(userAtom);
  const { pathname } = useLocation();
  return (
    <Box position={"relative"} w={"full"}>
      <Container maxW={pathname === "/" ? { base: "620px", md: "900px" } : "620px"}>
        <Header />

        <Routes>
          <Route path='/' element={<HomePage />} />
          <Route path="/auth" element={!user ? <AuthPage /> : <Navigate to="/" />} />
          <Route path="/update" element={user ? <UpdateProfilePage /> : <Navigate to="/auth" />} />
          <Route path='/:username' element={user ? (
            <>
              <UserPage />
              <CreatePost />
            </>
          ) : (
            <UserPage />
          )} />
          <Route path='/:username/post/:pid' element={<PostPage />} />
          <Route path='/chat' element={user ? <ChatPage /> : <Navigate to={"/auth"} />} />
          <Route path='/settings' element={user ? <SettingsPage /> : <Navigate to={"/auth"} />} />
          <Route path="/oauth-success" element={<OAuthSuccess />} />
          <Route path="/oauth-failure" element={<OAuthFailure />} />
          <Route path="/reset-password/:token" element={<ResetPasswordCard />} />
          <Route path="/change-password" element={user ? <ChangePassword /> : <Navigate to={"/auth"} />} />
        </Routes>
      </Container>
    </Box>
  )
}

export default App