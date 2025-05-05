import { useRecoilValue } from "recoil";
import { authScreenAtom } from "@atoms/authAtom";
import LoginCard from "@components/LoginCard";
import SignupCard from "@components/SignupCard";
import ForgotPasswordCard from "@components/ForgotPasswordCard";
import ResetPasswordCard from "@components/ResetPasswordCard";
import EnterOtpCard from "@components/EnterOtpCard";

const AuthPage = () => {
    const authScreenState = useRecoilValue(authScreenAtom);

    return (
        <>
            {authScreenState === "login" && <LoginCard />}
            {authScreenState === "signup" && <SignupCard />}
            {authScreenState === "forgot-password" && <ForgotPasswordCard />}
            {authScreenState === "verifyOtp" && <EnterOtpCard />}
            {authScreenState === "reset-password" && <ResetPasswordCard />}
        </>
    );
};

export default AuthPage;
