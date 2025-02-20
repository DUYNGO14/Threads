import { Avatar, AvatarBadge, Box, Flex, Image, Stack, Text, useColorMode, useColorModeValue, WrapItem } from "@chakra-ui/react"
import PropTypes from 'prop-types';
import { useRecoilState, useRecoilValue } from "recoil";
import userAtom from "../atoms/userAtom";
import { BsCheck2All, BsFillImageFill } from "react-icons/bs";
import { selectedConversationAtom } from "../atoms/messagesAtom";
const Conversation = ({ conversation, isOnline }) => {
    const user = conversation.participants[0];
    const currentUser = useRecoilValue(userAtom);
    const lastMessage = conversation.lastMessage;
    const [selectedConversation, setSelectedConversation] = useRecoilState(selectedConversationAtom);
    const colorMode = useColorMode();
    return (
        <Flex
            gap={4}
            alignItems={"center"}
            p={"1"}
            _hover={{
                cursor: "pointer",
                bg: useColorModeValue("gray.600", "gray.dark"),
                color: "white",
            }}
            onClick={() =>
                setSelectedConversation({
                    _id: conversation._id,
                    userId: user._id,
                    userProfilePic: user.profilePic,
                    username: user.username,
                    mock: conversation.mock,
                })
            }
            bg={
                selectedConversation?._id === conversation._id ? (colorMode === "light" ? "gray.400" : "gray.dark") : ""
            }
            borderRadius={"md"}
        >
            <WrapItem>
                <Avatar
                    size={{
                        base: "xs",
                        sm: "sm",
                        md: "md",
                    }}
                    src={user.profilePic}
                >
                    {isOnline ? (
                        <AvatarBadge boxSize='1em' bg='green.400' />
                    ) : (
                        <AvatarBadge boxSize='1em' bg='red.400' />
                    )}
                </Avatar>
            </WrapItem>

            <Stack direction={"column"} fontSize={"sm"}>
                <Text fontWeight='700' display={"flex"} alignItems={"center"}>
                    {user.username} <Image src='/verified.png' w={4} h={4} ml={1} />
                </Text>
                <Text fontSize={"xs"} display={"flex"} alignItems={"center"} gap={1}>
                    {currentUser._id === lastMessage.sender ? (
                        <Box color={lastMessage.seen ? "blue.400" : ""}>
                            <BsCheck2All size={16} />
                        </Box>
                    ) : (
                        ""
                    )}
                    {lastMessage.text.length > 18
                        ? lastMessage.text.substring(0, 18) + "..."
                        : lastMessage.text || <BsFillImageFill size={16} />}
                </Text>
            </Stack>
        </Flex>
    );
};

Conversation.propTypes = {
    conversation: PropTypes.shape({
        _id: PropTypes.string.isRequired,
        participants: PropTypes.arrayOf(
            PropTypes.shape({
                _id: PropTypes.string.isRequired,
                username: PropTypes.string.isRequired,
                profilePic: PropTypes.string,
                online: PropTypes.bool.isRequired,
            }),
        ).isRequired,
        lastMessage: PropTypes.shape({
            text: PropTypes.string.isRequired,
            sender: PropTypes.string.isRequired,
            seen: PropTypes.bool.isRequired,
        }).isRequired,
        mock: PropTypes.bool, // Add this line
    }).isRequired,
    isOnline: PropTypes.bool.isRequired,
};
export default Conversation