import {
    Popover,
    PopoverTrigger,
    PopoverContent,
    PopoverArrow,
    PopoverCloseButton,
    PopoverBody,
    Button,
    VStack,
    Box,
    useColorModeValue,
    useDisclosure
} from "@chakra-ui/react";
import { CgMoreO } from "react-icons/cg";
import ModalCreateGroupChat from "../Messages/ModalCreateGroupChat";
const PopoverSettingChat = () => {
    const { isOpen, onOpen, onClose } = useDisclosure();
    return (
        <>
            <Popover placement="right">
                <PopoverTrigger>
                    <Button size="sm" variant="outline">
                        <CgMoreO />
                    </Button>
                </PopoverTrigger>
                <PopoverContent width="200px" bg={useColorModeValue('gray.100', 'gray.dark')}>
                    <PopoverArrow />
                    <PopoverCloseButton size="sm" />
                    <PopoverBody>
                        <VStack align="flex-start" spacing={2} w={"full"} mt={2}>
                            <Button
                                variant="ghost"
                                size="sm"
                                w={"full"}
                                justifyContent="flex-start"
                                onClick={onOpen}
                            >
                                <Box mr={2}>Create group</Box>

                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                w={"full"}
                                justifyContent="flex-start"
                            >
                                <Box mr={2}>....</Box>

                            </Button>
                        </VStack>
                    </PopoverBody>
                </PopoverContent>
            </Popover>
            {isOpen && <ModalCreateGroupChat isOpen={isOpen} onClose={onClose} />}
        </>
    );
};

export default PopoverSettingChat;
