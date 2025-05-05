import {
    Flex,
    HStack,
    Heading,
    IconButton,
    useColorMode,
    useColorModeValue,
    Menu,
    MenuButton,
    MenuList,
    MenuItem,
} from "@chakra-ui/react";
import { MdMenu } from "react-icons/md";
import { IoPersonOutline as User } from "react-icons/io5";
import { FaMoon, FaSun } from "react-icons/fa"; // Import icon mặt trời và mặt trăng
import useLogout from "@hooks/useLogout"; // Import hook để đăng xuất
export default function TopNav({ buttonProps }) {
    const { colorMode, toggleColorMode } = useColorMode(); // Hook để chuyển đổi chế độ sáng/tối

    const handleLogout = useLogout();

    return (
        <Flex
            as="header"
            alignItems="center"
            justifyContent="space-between"
            h="16"
            py="2.5"
            pr="2.5"
            bg={useColorModeValue('gray.100', 'gray.900')}
            color={useColorModeValue("gray.900", "gray.50")}
        >
            <HStack spacing={2}>
                <IconButton
                    {...buttonProps}
                    _active="none"
                    _focus="none"
                    _hover="none"
                    fontSize="18px"
                    variant="ghost"
                    icon={<MdMenu size="20" />}
                    aria-label="open menu"
                />
                <Heading as="h1" size="md">
                    Admin
                </Heading>
            </HStack>
            <HStack spacing="1">
                {/* Menu cho user */}
                <Menu>
                    <MenuButton
                        as={IconButton}
                        isRound
                        size="md"
                        aria-label="user menu"
                        icon={<User size="20" />}
                    />
                    <MenuList>
                        <MenuItem onClick={() => console.log("Profile clicked")}>
                            Profile
                        </MenuItem>
                        <MenuItem onClick={handleLogout}>Logout</MenuItem>
                    </MenuList>
                </Menu>
                {/* Nút chuyển đổi giao diện sáng/tối */}
                <IconButton
                    isRound
                    size="md"
                    aria-label="toggle color mode"
                    icon={colorMode === "light" ? <FaMoon size="20" /> : <FaSun size="20" />}
                    onClick={toggleColorMode}
                />
            </HStack>
        </Flex>
    );
}