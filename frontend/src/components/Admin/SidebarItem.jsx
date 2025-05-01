// components/sidebar/SidebarItem.jsx
import { HStack, ListIcon, ListItem, Text, useColorModeValue } from "@chakra-ui/react";
import { NavLink } from "react-router-dom";

export default function SidebarItem({ icon, text, href }) {
    const activeBg = useColorModeValue("gray.200", "gray.700");
    const hoverBg = useColorModeValue("gray.50", "gray.600");

    return (
        <ListItem>
            <NavLink
                to={href}
                style={({ isActive }) => ({
                    textDecoration: "none",
                    color: "inherit",
                    display: "flex",
                    alignItems: "center",
                    height: "40px",
                    paddingLeft: "10px",
                    borderRadius: "6px",
                    backgroundColor: isActive ? activeBg : "transparent",
                })}
            >
                <ListIcon boxSize={5} as={icon} />
                {text && <Text ml="2">{text}</Text>}
            </NavLink>
        </ListItem>
    );
}
