import { Avatar, AvatarBadge, Badge, Box, Flex, IconButton, Text, WrapItem } from '@chakra-ui/react'
import React from 'react'
import ShowAvatarGroup from '../AvatarGroup'
import { PiWarningCircleBold } from 'react-icons/pi'
import { CloseIcon } from '@chakra-ui/icons'

const MessageHeader = ({ onClose, setShowChatSettings, showChatSettings, selectedConversation, isOnline }) => {
    return (
        <Flex cursor={"pointer"} w={"full"} alignItems={"center"} gap={2} justifyContent={"space-between"}>
            <Flex >
                <WrapItem mr={2}>
                    {selectedConversation.isGroup ? (
                        <ShowAvatarGroup users={selectedConversation.participants} />
                    ) : (<Avatar
                        size={{
                            base: "xs",
                            sm: "sm",
                            md: "md",
                        }}
                        src={selectedConversation.userProfilePic}
                    >

                        {isOnline ? <AvatarBadge boxSize='1em' bg='green.500' /> : <AvatarBadge boxSize='1em' bg='red.500' />}
                    </Avatar>)}

                </WrapItem >
                <Box>
                    <Text ml={2} display={"flex"} alignItems={"center"} >
                        {selectedConversation.username || selectedConversation.groupName}
                    </Text>
                    {!selectedConversation.isGroup && (
                        <Badge ml={2} size={"xs"} colorScheme={isOnline ? "green" : "red"}>
                            {isOnline ? "Online" : "Offline"}
                        </Badge>
                    )}
                </Box>
            </Flex>


            <Flex>
                <IconButton
                    icon={<PiWarningCircleBold />}
                    aria-label="Close conversation"
                    onClick={() => setShowChatSettings(!showChatSettings)}
                    variant="ghost"
                    colorScheme="white"
                    mx={2}
                />
                <IconButton
                    icon={<CloseIcon />}
                    aria-label="Close conversation"
                    onClick={onClose}
                    variant="ghost"
                    colorScheme="red"
                />
            </Flex>

        </Flex>
    )
}

export default MessageHeader