import { Avatar, Box, Flex, Image, Skeleton, Text, useDisclosure } from "@chakra-ui/react";
import { TiTick } from "react-icons/ti";
import { forwardRef, useState } from "react";
import { useRecoilValue } from "recoil";
import { selectedConversationAtom } from "@atoms/messagesAtom";
import userAtom from "@atoms/userAtom";
import PropTypes from "prop-types";
import { RenderLinkUrl } from "../RenderLinkUrl";
import MessageMenu from "../MessageMenu";
import { useMessageActions } from "@hooks/useMessageActions";

const Message = forwardRef(({ ownMessage, message }, ref) => {
    const selectedConversation = useRecoilValue(selectedConversationAtom);
    const user = useRecoilValue(userAtom);
    const [loadedMedia, setLoadedMedia] = useState({});
    const { isOpen, onOpen, onClose } = useDisclosure();
    const { deleteMessage, updateMessage } = useMessageActions();
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
        <Box position="relative">
            <Flex
                alignItems="flex-start"
                gap={2}
                justifyContent={ownMessage ? "flex-end" : "flex-start"}
            >
                {ownMessage && (
                    <Box
                        mt={1}
                        onMouseEnter={onOpen}
                        onMouseLeave={onClose}
                    >
                        <MessageMenu
                            message={message}
                            ownMessage={ownMessage}
                        />
                    </Box>
                )}

                <Flex direction="column" gap={1} maxW="400px">
                    {message.text && (
                        <Text
                            bg={ownMessage ? "green.800" : "gray.400"}
                            p={2}
                            borderRadius="md"
                            color={ownMessage ? "white" : "black"}
                            fontSize="sm"
                        >
                            <RenderLinkUrl text={message.text} />
                        </Text>
                    )}
                    {Array.isArray(message.media) && renderMedia(message.media)}
                </Flex>

                {!ownMessage && (
                    <Box
                        mt={1}
                        onMouseEnter={onOpen}
                        onMouseLeave={onClose}
                    >
                        <MessageMenu
                            message={message}
                            ownMessage={ownMessage}
                        />
                    </Box>
                )}
            </Flex>

        </Box>
    );

    return ownMessage ? (
        <Flex gap={2} alignSelf="flex-end" ref={ref}>
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
        <Flex gap={2} ref={ref}>

            <Avatar src={message.sender.profilePic || selectedConversation.userProfilePic} w="7" h={7} />
            {content}
        </Flex>
    );
});
Message.displayName = "Message";

Message.propTypes = {
    ownMessage: PropTypes.bool.isRequired,
    message: PropTypes.object.isRequired,
};

export default Message;

