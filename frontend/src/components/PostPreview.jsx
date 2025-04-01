import { Avatar, Box, Divider, Flex, Image, Text, useColorModeValue } from "@chakra-ui/react";
import { BsFillCameraVideoFill, BsFillMicFill } from "react-icons/bs";

const PostPreview = ({ user, postText, mediaFiles }) => {
    const previewBgColor = useColorModeValue("gray.50", "gray.700");
    return (
        <Box
            bg={useColorModeValue("white", "gray.800")}
            borderRadius="lg"
            p={4}
            boxShadow="md"
            maxH="500px"
            overflowY="auto"
        >
            <Flex align="center" mb={4}>
                <Avatar
                    size="sm"
                    name={user.name}
                    src={user.profilePic}
                    mr={3}
                />
                <Box>
                    <Text fontWeight="bold">{user.name}</Text>
                    <Text fontSize="xs" color="gray.500">
                        {new Date().toLocaleDateString()}
                    </Text>
                </Box>
            </Flex>

            <Text mb={4} whiteSpace="pre-wrap">{postText}</Text>

            {mediaFiles.length > 0 && (
                <>
                    <Divider my={4} />
                    <Flex direction="column" gap={4}>
                        {mediaFiles.map((file, index) => (
                            <Box
                                key={index}
                                w="full"
                                borderRadius="lg"
                                overflow="hidden"
                                boxShadow="md"
                                bg={previewBgColor}
                                p={3}
                            >
                                {file.type === "image" ? (
                                    <Image
                                        src={file.preview}
                                        alt="Preview"
                                        w="full"
                                        maxH="400px"
                                        objectFit="contain"
                                        borderRadius="md"
                                    />
                                ) : file.type === "video" ? (
                                    <Box>
                                        <Flex align="center" mb={2}>
                                            <BsFillCameraVideoFill size={20} style={{ marginRight: "8px" }} />
                                            <Text fontSize="sm" fontWeight="medium">Video {index + 1}</Text>
                                        </Flex>
                                        <video
                                            src={file.preview}
                                            controls
                                            style={{
                                                width: "100%",
                                                maxHeight: "400px",
                                                borderRadius: "8px"
                                            }}
                                        />
                                    </Box>
                                ) : (
                                    <Box>
                                        <Flex align="center" mb={2}>
                                            <BsFillMicFill size={20} style={{ marginRight: "8px" }} />
                                            <Text fontSize="sm" fontWeight="medium">Audio {index + 1}</Text>
                                        </Flex>
                                        <audio
                                            src={file.preview}
                                            controls
                                            style={{
                                                width: "100%",
                                                height: "40px"
                                            }}
                                        />
                                    </Box>
                                )}
                            </Box>
                        ))}
                    </Flex>
                </>
            )}
        </Box>
    );
};

export default PostPreview;