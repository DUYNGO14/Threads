// components/layout/admin/Sidebar.jsx
import { Box, List, useColorModeValue } from "@chakra-ui/react";


import { IoHomeOutline, IoSettingsOutline } from "react-icons/io5";
import { FaRegUser } from "react-icons/fa";
import { FaRegNewspaper, FaRegFolder, FaRegClipboard } from "react-icons/fa6";
import SidebarItem from "./SidebarItem";

const listItems = [
    { text: "Home", icon: IoHomeOutline, href: "/admin" },
    { text: "Settings", icon: IoSettingsOutline, href: "/admin/settings" },
    { text: "Users", icon: FaRegUser, href: "/admin/users" },
    { text: "Tasks", icon: FaRegNewspaper, href: "/admin/posts" },
    { text: "Folder", icon: FaRegFolder, href: "/admin/folder" },
    { text: "Reports", icon: FaRegClipboard, href: "/admin/reports" },
];


export default function Sidebar({ isOpen }) {
    return (
        <Box
            as="aside"
            minH="100vh"
            w={isOpen ? 72 : 12}
            borderRight="2px"
            borderColor={useColorModeValue("gray.200", "gray.900")}
            transition="width 0.25s ease"
        >
            <List spacing={0} p="0.5">
                {listItems.map((item, index) => (
                    <SidebarItem
                        key={index}
                        icon={item.icon}
                        text={isOpen ? item.text : ""}
                        href={item.href}
                    />
                ))}
            </List>
        </Box>
    );
}
