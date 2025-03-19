import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSetRecoilState } from "recoil";
import userAtom from "../atoms/userAtom";
import { Spinner, VStack } from "@chakra-ui/react"

const OAuthSuccess = () => {
    const navigate = useNavigate();
    const setUser = useSetRecoilState(userAtom);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const res = await fetch("/api/auth/me", { credentials: "include" });

                const data = await res.json();

                if (data._id) {
                    localStorage.setItem("user-threads", JSON.stringify(data));
                    setUser(data);
                    navigate("/");
                } else {
                    navigate("/login");
                }
            } catch (error) {
                navigate("/login");
                throw error;
            }
        };

        fetchUser();
    }, [navigate, setUser]);

    return <>
        <VStack colorPalette="teal">
            <Spinner color="colorPalette.600" />
        </VStack>
    </>
};

export default OAuthSuccess;
