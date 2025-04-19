import { Avatar, Box, Button, Flex, Text, useColorModeValue } from "@chakra-ui/react";
import { Link } from "react-router-dom";
import useFollowUnfollow from "../hooks/useFollowUnfollow";
import PropTypes from "prop-types";
const SuggestedUser = ({ user }) => {
    const { handleFollowUnfollow, following, updating } = useFollowUnfollow(user);
    return (
        <Flex
            gap={3}
            justifyContent={"space-between"}
            alignItems={"center"}
            p={2} // Tăng padding để có khoảng cách tốt hơn
            borderRadius={"md"}
            w={"full"}
            _hover={{ bg: useColorModeValue("gray.100", "gray.700") }} // Chỉnh màu hover cho dark mode
        >
            {/* left side */}
            <Flex gap={2} as={Link} to={`/${user.username}`} flex={1} overflow="hidden">
                <Avatar src={user.profilePic} size="md" name={user.username} />
                <Box overflow="hidden">
                    <Text
                        fontSize="sm"
                        fontWeight="bold"
                        isTruncated
                        maxW="150px" // hoặc tùy chỉnh cho hợp với layout
                    >
                        {user.username}
                    </Text>
                    <Text fontSize="sm" color="gray.400" isTruncated maxW="150px">
                        {user.name}
                    </Text>
                </Box>
            </Flex>


            {/* right side */}
            <Button
                size="sm"
                color={following ? "black" : "white"}
                bg={following ? "white" : "blue.400"}
                onClick={handleFollowUnfollow}
                isLoading={updating}
                whiteSpace="nowrap"
                flexShrink={0}
            >
                {following ? "Unfollow" : "Follow"}
            </Button>

        </Flex>
    );
};
SuggestedUser.propTypes = {
    user: PropTypes.object.isRequired,
};
export default SuggestedUser;
