import { Avatar, Box, Button, HStack, Text } from "@chakra-ui/react";
import useFollowUnfollow from "../hooks/useFollowUnfollow";
import { useColorMode } from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
const UserItemSuggest = ({ user }) => {
    const { handleFollowUnfollow, following, updating } = useFollowUnfollow(user);
    const { colorMode } = useColorMode();
    const navigate = useNavigate();
    return (
        <HStack justify="space-between" align="flex-start">
            <HStack spacing={3} onClick={() => { navigate(`/${user.username}`) }} cursor="pointer">
                <Avatar size="md" src={user.profilePic} />
                <Box >
                    <Text fontWeight="bold" color={colorMode === "dark" ? "white" : "gray.800"}>
                        {user.name}
                    </Text>
                    <Text fontSize="sm" color={colorMode === "dark" ? "gray.400" : "gray.600"}>
                        {user.username}
                    </Text>

                    {user.bio && (
                        <Text
                            fontSize="sm"
                            color={colorMode === "dark" ? "gray.300" : "gray.700"}
                            whiteSpace="pre-line"
                            mt={1}
                        >
                            {user.bio}
                        </Text>
                    )}
                    {user.followers && (
                        <Text fontSize="xs" color={colorMode === "dark" ? "gray.500" : "gray.600"} mt={1} >
                            {user.followers}
                        </Text>
                    )}

                </Box>
            </HStack>
            <Button
                size="sm"
                color={following ? "black" : "white"}
                bg={following ? "white" : "blue.400"}
                borderRadius="lg"
                onClick={handleFollowUnfollow}
                isLoading={updating}
                _hover={{ bg: colorMode === "dark" ? "gray.500" : "gray.700" }}
            >
                {following ? "Unfollow" : "Follow"}
            </Button>
        </HStack>

    )
}

export default UserItemSuggest