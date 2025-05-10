import React, { useRef } from "react";
import { Button, Box, useColorModeValue, useBreakpointValue } from "@chakra-ui/react";
import { AddIcon } from "@chakra-ui/icons";
import Draggable from "react-draggable";
import { useDisclosure } from "@chakra-ui/react";
import CreatePostModal from "./CreatePostModal";
import { useRecoilValue } from "recoil";
import userAtom from "../atoms/userAtom";

const CreatePost = () => {
    const { isOpen, onOpen, onClose } = useDisclosure();
    const draggableRef = useRef(null);  // Ref for Draggable container
    const user = useRecoilValue(userAtom);
    return (
        <>
            <Draggable nodeRef={draggableRef}>
                <Box
                    ref={draggableRef}
                    display={{ base: "none", md: "block" }}
                    position="fixed"
                    bottom={10}
                    right={10}
                    zIndex={1000}
                    cursor="grab"
                    _active={{ cursor: "grabbing" }}
                >
                    <Button
                        bg={useColorModeValue("white", "gray.900")}
                        boxShadow={useColorModeValue("0 4px 6px rgba(0, 0, 0, 0.1)", "0 4px 6px rgba(255, 255, 255, 0.1)")}
                        color={useColorModeValue("gray.900", "white")}
                        border={"1px solid"}
                        borderRadius="md"
                        onClick={onOpen}
                        size="lg"
                        width="70px"
                        height="70px"
                        padding={0}
                        alignItems="center"
                        justifyContent="center"
                        _hover={{ transform: "scale(1.05)" }}
                        _active={{ transform: "scale(0.95)" }}
                    >
                        <AddIcon boxSize={4} />
                    </Button>
                </Box>
            </Draggable>
            <CreatePostModal isOpen={isOpen} onClose={onClose} />
        </>
    );
};

export default CreatePost;
