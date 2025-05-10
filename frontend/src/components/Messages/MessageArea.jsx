import { Flex, Text } from '@chakra-ui/react'
import React from 'react'
import MessageContainer from '../MessageContainer'
import { GiConversation } from 'react-icons/gi'
import { useRecoilValue } from 'recoil'
import { selectedConversationAtom } from '@atoms/messagesAtom'

const MessageArea = ({ isMobile, messageFlex, setShowChatSettings, showChatSettings, onlineUsers, handleClose }) => {
    const selectedConversation = useRecoilValue(selectedConversationAtom);
    return (
        <Flex
            display={(!isMobile || selectedConversation?._id) ? "flex" : "none"}
            flex={messageFlex}
            w="full"
            direction="column"
        >
            {selectedConversation?._id ? (
                <MessageContainer setShowChatSettings={setShowChatSettings} showChatSettings={showChatSettings} isOnline={onlineUsers.includes(selectedConversation.userId)} onClose={handleClose} />
            ) : (
                <Flex
                    borderRadius="md"
                    p={4}
                    w="full"
                    align="center"
                    justify="center"
                    direction="column"
                    minH="300px"
                    mx={"auto"}
                >
                    <GiConversation size={100} />
                    <Text fontSize={20} >Select a conversation to start messaging</Text>
                </Flex>
            )}
        </Flex>
    )
}

export default MessageArea