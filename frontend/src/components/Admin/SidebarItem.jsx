import { HStack, ListIcon, ListItem, Text, useColorModeValue } from "@chakra-ui/react";
import { NavLink } from "react-router-dom";

export default function SidebarItem({ icon, text, href, newTab = false }) {
    const activeBg = useColorModeValue("gray.200", "gray.700");
    const hoverBg = useColorModeValue("gray.50", "gray.600");

    const commonStyles = {
        textDecoration: "none",
        color: "inherit",
        display: "flex",
        alignItems: "center",
        height: "40px",
        paddingLeft: "10px",
        borderRadius: "6px",
    };

    return (
        <ListItem>
            {newTab ? (
                <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                        ...commonStyles,
                    }}
                >
                    <ListIcon boxSize={5} as={icon} />
                    {text && <Text ml="2">{text}</Text>}
                </a>
            ) : (
                <NavLink
                    to={href}
                    style={({ isActive }) => ({
                        ...commonStyles,
                        backgroundColor: isActive ? activeBg : "transparent",
                    })}
                >
                    <ListIcon boxSize={5} as={icon} />
                    {text && <Text ml="2">{text}</Text>}
                </NavLink>
            )}
        </ListItem>
    );
}
