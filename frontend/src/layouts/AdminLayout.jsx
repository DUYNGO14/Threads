import { Box, Flex, HStack, useDisclosure } from "@chakra-ui/react";
import Sidebar from "../components/Admin/Sidebar";
import TopNav from "../components/Admin/TopNav";
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
                    bg="white"
                    color="gray.900"
                    _dark={{ bg: "gray.900", color: "gray.50" }}
                    px={6}
                    py={4}
                >
                    {children}
                </Flex>
            </HStack>
            <Outlet />
        </>
    );
}
