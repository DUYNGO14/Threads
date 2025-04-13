import { Avatar, Box, Flex, Image, Skeleton, Text, Tooltip } from "@chakra-ui/react";
import { selectedConversationAtom } from "../atoms/messagesAtom";
import { useRecoilValue } from "recoil";
import userAtom from "../atoms/userAtom";
import { TiTick } from "react-icons/ti";
import { useState } from "react";
import PropTypes from "prop-types";
import formatRelativeTime from "../../utils/formatRelativeTime";

const Message = ({ ownMessage, message }) => {
    const selectedConversation = useRecoilValue(selectedConversationAtom);
    const user = useRecoilValue(userAtom);
    const [loadedMedia, setLoadedMedia] = useState({});

    const handleMediaLoad = (url) => {
        setLoadedMedia((prev) => ({ ...prev, [url]: true }));
    };

    const renderMedia = (media) => {
        return media.map((item, idx) => {
            const { url, type } = item;

            if (type === "image") {
                return (
                    <Box key={idx} mt={2} w="200px">
                        {!loadedMedia[url] && (
                            <>
                                <Image src={url} hidden onLoad={() => handleMediaLoad(url)} />
                                <Skeleton w="200px" h="200px" />
                            </>
                        )}
                        {loadedMedia[url] && <Image src={url} borderRadius={4} alt="image" />}
                    </Box>
                );
            }

            if (type === "video") {
                return (
                    <Box key={idx} mt={2} w="200px">
                        <video
                            width="200"
                            height="auto"
                            controls
                            onLoadedData={() => handleMediaLoad(url)}
                            style={{ borderRadius: "4px", display: loadedMedia[url] ? "block" : "none" }}
                        >
                            <source src={url} type="video/mp4" />
                            Your browser does not support video.
                        </video>
                        {!loadedMedia[url] && <Skeleton w="200px" h="200px" />}
                    </Box>
                );
            }

            if (type === "audio") {
                return (
                    <Box key={idx} mt={2} w="200px">
                        <audio
                            controls
                            onLoadedData={() => handleMediaLoad(url)}
                            style={{ width: "100%", display: loadedMedia[url] ? "block" : "none" }}
                        >
                            <source src={url} type="audio/mpeg" />
                            Your browser does not support audio.
                        </audio>
                        {!loadedMedia[url] && <Skeleton w="200px" h="50px" />}
                    </Box>
                );
            }

            return null;
        });
    };

    const content = (
        <Tooltip
            label={formatRelativeTime(message.createdAt)}
            placement="top-start"
            hasArrow
        >
            <Flex direction="column" gap={1} maxW="350px">
                {message.text && (
                    <Text
                        bg={ownMessage ? "green.800" : "gray.400"}
                        p={2}
                        borderRadius="md"
                        color={ownMessage ? "white" : "black"}
                    >
                        {message.text}
                    </Text>

                )}
                {Array.isArray(message.media) && renderMedia(message.media)}
            </Flex>
        </Tooltip>
    );

    return ownMessage ? (
        <Flex gap={2} alignSelf="flex-end">
            {content}
            <Box
                alignSelf="flex-end"
                color={message.seen ? "blue.400" : ""}
                fontWeight="bold"
            >
                <TiTick size={10} />
            </Box>
            <Avatar src={user.profilePic} w="7" h={7} />
        </Flex>
    ) : (
        <Flex gap={2}>
            <Avatar src={selectedConversation.userProfilePic} w="7" h={7} />
            {content}
        </Flex>
    );
};

Message.propTypes = {
    ownMessage: PropTypes.bool.isRequired,
    message: PropTypes.object.isRequired,
};

export default Message;
