import React from "react";
import { Button, Text, Avatar, Box, Flex, useColorModeValue } from "@chakra-ui/react";
import { Link } from "react-router-dom";
import useFollowUnfollow from "../hooks/useFollowUnfollow"; // Custom hook follow/unfollow
import numeral from "numeral";
const FollowItem = ({ user, activeTab, setFollowing }) => {
    console.log(user);
    const onSuccess = (isNowFollowing) => {
        // Xử lý khi follow/unfollow thành công
        // Nếu đang ở tab "following" và unfollow thì remove user khỏi list
        if (activeTab === "following" && !isNowFollowing) {
            setFollowing((prev) => prev.filter((u) => u._id !== user._id));
        }
    };

    const { handleFollowUnfollow, updating, following } = useFollowUnfollow(user, onSuccess);

    const bg = useColorModeValue("white", "gray.800");

    return (
        <Flex align="center" justify="space-between" p={3} bg={bg} borderBottom="1px solid" borderColor="gray.200">
            <Flex gap={3} align="center">
                <Link to={`/${user.username}`}>
                    <Avatar src={user.profilePic} name={user.name} size="md" />
                </Link>
                <Box>
                    <Link to={`/${user.username}`}>
                        <Text fontWeight="bold">{user.username}</Text>
                    </Link>
                    <Text fontSize="sm" color="gray.500">
                        {user.name}
                        <Text as="span" ml={1}>
                            {user.followers.length < 1000 ? user.followers.length : numeral(10).format('0.0a')} followers
                        </Text>
                    </Text>
                </Box>
            </Flex>
            <Button size="sm" onClick={handleFollowUnfollow} isLoading={updating} borderRadius="md">
                {following ? "Following" : "Follow"}
            </Button>
        </Flex>
    );
};

export default FollowItem;
