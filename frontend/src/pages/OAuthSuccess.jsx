import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSetRecoilState } from "recoil";
import userAtom from "../atoms/userAtom";
import useShowToast from "../hooks/useShowToast";

const OAuthSuccess = () => {
    const navigate = useNavigate();
    const setUser = useSetRecoilState(userAtom);
    const showToast = useShowToast();

    useEffect(() => {
        const handleOAuthSuccess = async () => {
            try {
                const res = await fetch("/api/auth/me");
                const data = await res.json();

                if (data.error) {
                    showToast("Error", data.error, "error");
                    navigate("/");
                    return;
                }

                setUser(data);
                showToast("Success", "Logged in successfully", "success");
                navigate("/");
            } catch (error) {
                showToast("Error", error.message, "error");
                navigate("/");
            }
        };

        handleOAuthSuccess();
    }, [navigate, setUser, showToast]);

    return null;
};

export default OAuthSuccess; 