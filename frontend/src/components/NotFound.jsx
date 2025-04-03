import { Box, Text, VStack, Icon } from "@chakra-ui/react";
import { FaUserAltSlash } from "react-icons/fa";
import { MdPostAdd } from "react-icons/md";

const NotFound = ({ type = "user" }) => {
    const config = {
        user: {
            icon: FaUserAltSlash,
            title: "User Not Found",
            message: "The user you are looking for does not exist or may have been removed."
        },
        post: {
            icon: MdPostAdd,
            title: "Post Not Found",
            message: "The post you are looking for does not exist or may have been removed."
        }
    };

    const { icon, title, message } = config[type];

    return (
        <VStack spacing={4} py={10}>
            <Icon as={icon} boxSize={10} color="gray.500" />
            <Box textAlign="center">
                <Text fontSize="2xl" fontWeight="bold" color="gray.700">
                    {title}
                </Text>
                <Text color="gray.500" mt={2}>
                    {message}
                </Text>
            </Box>
        </VStack>
    );
};

export default NotFound; 