import { Flex, Skeleton, SkeletonCircle, Text } from "@chakra-ui/react"
import Message from "./Message";

const ListMessages = ({ messages, loadingMessages, messageEndRef, currentUser }) => {
    return (
        <>
            {loadingMessages &&
                [...Array(5)].map((_, i) => (
                    <Flex
                        key={i}
                        gap={2}
                        alignItems={"center"}
                        p={1}
                        borderRadius={"md"}
                        alignSelf={i % 2 === 0 ? "flex-start" : "flex-end"}
                    >
                        {i % 2 === 0 && <SkeletonCircle size={7} />}
                        <Flex flexDir={"column"} gap={2}>
                            <Skeleton h='8px' w='250px' />
                            <Skeleton h='8px' w='250px' />
                            <Skeleton h='8px' w='250px' />
                        </Flex>
                        {i % 2 !== 0 && <SkeletonCircle size={7} />}
                    </Flex>
                ))}

            {!loadingMessages ? (
                messages && messages.length > 0 ? (
                    messages.map((message, index) =>
                        message.isSystem ? (
                            <Text
                                key={message._id}
                                fontSize="sm"
                                textAlign="center"
                                color="gray.500"
                                ref={messages.length - 1 === index ? messageEndRef : null}
                            >
                                {message.text}
                            </Text>
                        ) : (
                            <Message
                                key={message._id}
                                ref={messages.length - 1 === index ? messageEndRef : null}
                                message={message}
                                ownMessage={currentUser._id === message.sender._id}
                            />
                        )
                    )
                ) : (
                    <Flex h="full" alignItems="center" justifyContent="center" w="full">
                        No messages yet
                    </Flex>
                )
            ) : null}
        </>
    )
}

export default ListMessages