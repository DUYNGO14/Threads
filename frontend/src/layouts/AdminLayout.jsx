import { Box, Flex, HStack, useColorModeValue, useDisclosure } from "@chakra-ui/react";
import Sidebar from "@components-admin/Sidebar";
import TopNav from "@components-admin/TopNav";
import { Outlet } from "react-router-dom";

export default function AdminLayout({ children }) {
    const { getButtonProps, isOpen } = useDisclosure();
    const buttonProps = getButtonProps();
    return (
        <>
            <TopNav buttonProps={buttonProps} />
            <HStack align="start" spacing={0}>
                <Sidebar isOpen={isOpen} />
                <Flex
                    as="main"
                    w="full"
                    minH="100vh"
                    bg={useColorModeValue('gray.100', 'gray.800')}
                    color={useColorModeValue('gray.800', 'whiteAlpha.900')}
                    px={6}
                    py={4}
                >
                    <Outlet />
                </Flex>
            </HStack>
        </>
    );
}