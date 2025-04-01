import { Button } from "@chakra-ui/react"
import { useSetRecoilState } from "recoil";
import userAtom from "../atoms/userAtom";
import useShowToast from "../hooks/useShowToast";
import { FiLogOut } from "react-icons/fi";
const LogoutButton = () => {
    const setUser = useSetRecoilState(userAtom);
    const showToast = useShowToast();
    const handleLogout = async () => {
        try {
            const res = await fetch("/api/auth/logout", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
            })
            const data = await res.json();
            if (data.error) {
                return showToast("Error", data.error, "error");
            }
            localStorage.removeItem("user-threads");
            setUser(null);
            //showToast("Success", data.message, "success");
        } catch (error) {
            console.log(error);
        }
    }
    return (
        <Button
            position={"fixed"}
            top={"30px"}
            right={"30px"}
            size={"sm"}
            onClick={handleLogout}
        > Logout <FiLogOut color={"white"} style={{ marginLeft: "10px" }} /></Button>
    )
}

export default LogoutButton