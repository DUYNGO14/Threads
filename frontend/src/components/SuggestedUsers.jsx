import { Box, Flex, Skeleton, SkeletonCircle, Text } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import SuggestedUser from "./SuggestedUser";
import useShowToast from "@hooks/useShowToast";
import api from "../services/api.js";
const SuggestedUsers = () => {
    const [loading, setLoading] = useState(true);
    const [suggestedUsers, setSuggestedUsers] = useState([]);
    const showToast = useShowToast();

    useEffect(() => {
        const getSuggestedUsers = async () => {
            setLoading(true);
            try {
                const res = await api.get("/api/users/suggested");
                const data = await res.data;
                if (data.error) {
                    showToast("Error", data.error, "error");
                    return;
                }
                setSuggestedUsers(data);
            } catch (error) {
                showToast("Error", error.message, "error");
            } finally {
                setLoading(false);
            }
        };

        getSuggestedUsers();
    }, [showToast]);

    return (
        <Flex direction={"column"} gap={2} w="100%"  >
            <Text my={4} fontWeight={"bold"}>
                Suggested Users
            </Text>
            <Flex direction={"column"} gap={2} w="100%">
                <Box>
                    {!loading &&
                        suggestedUsers.slice(0, 5).map((user) => (
                            <SuggestedUser key={user._id} user={user} />
                        ))}

                    {loading &&
                        [0, 1, 2, 3, 4].map((_, idx) => (
                            <Flex key={idx} gap={2} alignItems={"center"} p={"1"} borderRadius={"md"}>
                                {/* avatar skeleton */}
                                <Box>
                                    <SkeletonCircle size={"10"} />
                                </Box>
                                {/* username and fullname skeleton */}
                                <Flex w={"full"} flexDirection={"column"} gap={2}>
                                    <Skeleton h={"8px"} w={"80px"} />
                                    <Skeleton h={"8px"} w={"90px"} />
                                </Flex>
                                {/* follow button skeleton */}
                                <Flex>
                                    <Skeleton h={"20px"} w={"60px"} />
                                </Flex>
                            </Flex>
                        ))}
                </Box>
            </Flex>
        </Flex>
    );
};

export default SuggestedUsers;

