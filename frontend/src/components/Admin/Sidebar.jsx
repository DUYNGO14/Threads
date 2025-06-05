import { Box, List, useColorModeValue } from "@chakra-ui/react";


import { IoHomeOutline } from "react-icons/io5";
import { GoReport } from "react-icons/go";
import { FaRegUser } from "react-icons/fa";
import { MdPostAdd } from "react-icons/md";
import { HiMiniQueueList } from "react-icons/hi2";
import SidebarItem from "./SidebarItem";

const listItems = [
    { text: "Home", icon: IoHomeOutline, href: "/admin" },
    { text: "Users", icon: FaRegUser, href: "/admin/users" },
    { text: "Posts", icon: MdPostAdd, href: "/admin/posts" },
    { text: "Reports", icon: GoReport, href: "/admin/reports" },
    { text: "Queue", icon: HiMiniQueueList, href: "/admin/queues", newTab: true },
];


export default function Sidebar({ isOpen }) {
    return (
        <Box
            as="aside"
            minH="100vh"
            w={isOpen ? 72 : 12}
            borderRight="2px"
            borderColor={useColorModeValue("gray.200", "gray.900")}
            bg={useColorModeValue('gray.100', 'gray.900')}
            color={useColorModeValue("gray.900", "gray.50")}
            transition="width 0.25s ease"
        >
            <List spacing={0} p="0.5">
                {listItems.map((item, index) => (
                    <SidebarItem
                        key={index}
                        icon={item.icon}
                        text={isOpen ? item.text : ""}
                        href={item.href}
                        newTab={item.newTab}
                    />
                ))}
            </List>
        </Box>
    );
}

