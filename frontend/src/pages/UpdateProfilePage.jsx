import {
    Button,
    Flex,
    FormControl,
    FormLabel,
    Heading,
    Input,
    Stack,
    useColorModeValue,
    Avatar,
    Center,
    Divider,
} from "@chakra-ui/react";
import { useRef, useState, useEffect } from "react";
import { useRecoilState } from "recoil";
import userAtom from "../atoms/userAtom";
import usePreviewImg from "@hooks/usePreviewImg";
import useShowToast from "@hooks/useShowToast";
import { useNavigate } from "react-router-dom";
import SocialLinksInput from "@components/SocialLinksInput";
import api from "../services/api.js";
import isEqual from "lodash/isEqual";

export default function UpdateProfilePage() {
    const [user, setUser] = useRecoilState(userAtom);
    const [inputs, setInputs] = useState({
        name: user.name,
        username: user.username,
        email: user.email,
        bio: user.bio,
        socialLinks: user.socialLinks || {},
        password: "",
    });

    const navigate = useNavigate();
    const fileRef = useRef(null);
    const [updating, setUpdating] = useState(false);
    const showToast = useShowToast();
    const { handleImageChange, setImgUrl, imgUrl } = usePreviewImg();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (updating) return;

        const updatedUser = {
            ...inputs,
            socialLinks: inputs.socialLinks,
        };
        if (imgUrl) {
            updatedUser.profilePic = imgUrl;
        }

        const originalUser = {
            name: user.name,
            username: user.username,
            email: user.email,
            bio: user.bio,
            socialLinks: user.socialLinks || {},
            password: "",
        };

        const hasChanged = Object.entries(updatedUser).some(
            ([key, value]) => !isEqual(originalUser[key], value)
        );

        if (!hasChanged && !imgUrl) {
            showToast("Nothing changed", "No changes detected", "info");
            return;
        }

        setUpdating(true);
        try {
            const res = await api.put(`/api/users/update/${user._id}`, updatedUser);
            const data = await res.data;
            showToast("Success", "Profile updated successfully", "success");
            setUser(data);
            setInputs({
                name: data.name,
                username: data.username,
                email: data.email,
                bio: data.bio,
                socialLinks: data.socialLinks || {},
                password: "",
            });

            // ✅ Clear ảnh đã chọn
            setImgUrl(null);
        } catch (error) {
            showToast("Error", error.response?.data?.error || error.message || "Something went wrong", "error");
        } finally {
            setUpdating(false);
        }
    };

    useEffect(() => {
        setInputs({
            name: user.name,
            username: user.username,
            email: user.email,
            bio: user.bio,
            socialLinks: user.socialLinks || {},
            password: "",
        });
    }, [user]);

    return (
        <form onSubmit={handleSubmit}>
            <Flex align={"center"} justify={"center"} my={6} >
                <Stack
                    spacing={4}
                    w={"full"}
                    maxW={"md"}
                    bg={useColorModeValue("white", "gray.dark")}
                    rounded={"xl"}
                    boxShadow={"lg"}
                    p={6}
                >
                    <Heading lineHeight={1.1} fontSize={{ base: "2xl", sm: "3xl" }} textAlign={"center"}>
                        User Profile Edit
                    </Heading>
                    <Divider />
                    <FormControl>
                        <Stack direction={["column", "row"]} spacing={6}>
                            <Center>
                                <Avatar size="xl" boxShadow={"md"} src={imgUrl || user.profilePic} />
                            </Center>
                            <Center w="full">
                                <Button w="full" onClick={() => fileRef.current.click()}>
                                    Change Avatar
                                </Button>
                                <Input type="file" hidden ref={fileRef} onChange={handleImageChange} />
                            </Center>
                        </Stack>
                    </FormControl>
                    <FormControl>
                        <FormLabel>Full name</FormLabel>
                        <Input
                            placeholder="John Doe"
                            value={inputs.name}
                            onChange={(e) => setInputs({ ...inputs, name: e.target.value })}
                            _placeholder={{ color: "gray.500" }}
                            type="text"
                        />
                    </FormControl>
                    <FormControl>
                        <FormLabel>User name</FormLabel>
                        <Input
                            placeholder="johndoe"
                            value={inputs.username}
                            onChange={(e) => setInputs({ ...inputs, username: e.target.value })}
                            _placeholder={{ color: "gray.500" }}
                            type="text"
                        />
                    </FormControl>
                    <FormControl>
                        <FormLabel>Email address</FormLabel>
                        <Input
                            placeholder="your-email@example.com"
                            value={inputs.email}
                            _placeholder={{ color: "gray.500" }}
                            type="email"
                            disabled
                        />
                    </FormControl>
                    <FormControl>
                        <FormLabel>Bio</FormLabel>
                        <Input
                            placeholder="Your bio."
                            value={inputs.bio}
                            onChange={(e) => setInputs({ ...inputs, bio: e.target.value })}
                            _placeholder={{ color: "gray.500" }}
                            type="text"
                        />
                    </FormControl>

                    <SocialLinksInput
                        value={Object.entries(inputs.socialLinks || {}).map(([platform, url]) => ({
                            platform,
                            url,
                        }))}
                        onChange={(map) => setInputs({ ...inputs, socialLinks: map })}
                    />

                    <Stack spacing={6} direction={["column", "row"]}>
                        <Button
                            bg={"red.400"}
                            color={"white"}
                            w="full"
                            _hover={{ bg: "red.500" }}
                            onClick={() => navigate(`/user/${user.username}`)}
                        >
                            Cancel
                        </Button>
                        <Button
                            bg={"green.400"}
                            color={"white"}
                            w="full"
                            _hover={{ bg: "green.500" }}
                            type="submit"
                            isLoading={updating}
                        >
                            Submit
                        </Button>
                    </Stack>
                </Stack>
            </Flex>
        </form>
    );
}
