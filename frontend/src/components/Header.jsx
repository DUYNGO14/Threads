import {
    Flex, Image, IconButton, VStack, Show, Hide, useColorMode,
    Menu, MenuButton, MenuList, MenuItem, useColorModeValue, useDisclosure
} from "@chakra-ui/react";
import { useRecoilValue } from "recoil";
import userAtom from "../atoms/userAtom";
import { AiFillHome } from "react-icons/ai";
import { RxAvatar } from "react-icons/rx";
import { useLocation, useNavigate } from "react-router-dom";
import { FiLogIn, FiLogOut } from "react-icons/fi";
import useLogout from "../hooks/useLogout";
import {
    BsFillChatQuoteFill, BsSun, BsMoonStars, BsSearch, BsPlusSquare
} from "react-icons/bs";
import { MdOutlineSettings } from "react-icons/md";
import { HamburgerIcon } from "@chakra-ui/icons";
import CreatePostModal from "./CreatePostModal";
import { ChatIconWithBadge, NotificationIconWithBadge } from "./IconWithBadge";

const Header = () => {
    const { colorMode, toggleColorMode } = useColorMode();
    const user = useRecoilValue(userAtom);
    const logout = useLogout();
    const location = useLocation();
    const navigate = useNavigate();
    const { isOpen, onOpen, onClose } = useDisclosure();

    const menuBg = useColorModeValue("white", "gray.800");
    const menuBorder = useColorModeValue("gray.200", "gray.700");
    const menuHoverBg = useColorModeValue("gray.100", "whiteAlpha.200");

    const isActive = (path) => location.pathname === path;
    const getIconStyle = (path) => ({
        color: isActive(path) ? (colorMode === "dark" ? "white" : "black") : "gray.500",
        bg: isActive(path) ? (colorMode === "dark" ? "whiteAlpha.200" : "gray.100") : "transparent",
        _hover: { bg: colorMode === "dark" ? "whiteAlpha.200" : "gray.100", color: colorMode === "dark" ? "white" : "black" }
    });

    const handleNav = (path) => {
        const isSamePath = location.pathname === path;
        navigate(path, { replace: isSamePath, state: isSamePath ? { refresh: Date.now() } : {} });
    };

    const renderMenuItems = (isLoggedIn) => (
        <MenuList bg={menuBg} borderColor={menuBorder}>
            <MenuItem icon={colorMode === "dark" ? <BsSun size={20} /> : <BsMoonStars size={20} />} onClick={toggleColorMode} _hover={{ bg: menuHoverBg }}>
                {colorMode === "dark" ? "Light Mode" : "Dark Mode"}
            </MenuItem>
            {isLoggedIn ? (
                <>
                    <MenuItem icon={<MdOutlineSettings size={20} />} onClick={() => handleNav("/settings")} _hover={{ bg: menuHoverBg }}>Settings</MenuItem>
                    <MenuItem icon={<FiLogOut size={20} />} onClick={logout} _hover={{ bg: menuHoverBg }}>Logout</MenuItem>
                </>
            ) : (
                <MenuItem onClick={() => handleNav("/auth")} icon={<FiLogIn size={20} />} _hover={{ bg: menuHoverBg }}>Login</MenuItem>
            )}
        </MenuList>
    );

    const renderIcons = (isLoggedIn) => (
        <>
            <IconButton onClick={() => handleNav("/")} icon={<AiFillHome size={24} />} {...getIconStyle("/")} aria-label="Home" />
            {isLoggedIn ? (
                <>
                    <IconButton onClick={() => handleNav(`/${user.username}`)} icon={<RxAvatar size={24} />} {...getIconStyle(`/${user.username}`)} aria-label="Profile" />
                    <IconButton onClick={onOpen} icon={<BsPlusSquare size={30} />} aria-label="Create Post" />
                    <IconButton onClick={() => handleNav("/chat")} icon={<ChatIconWithBadge />} {...getIconStyle("/chat")} aria-label="Messages" />
                    <IconButton onClick={() => handleNav("/notifications")} icon={<NotificationIconWithBadge />} {...getIconStyle("/notifications")} aria-label="Notifications" />
                </>
            ) : (
                <IconButton onClick={() => handleNav("/auth")} icon={<FiLogIn size={20} />} {...getIconStyle("/auth")} aria-label="Login" />
            )}
            <IconButton onClick={() => handleNav("/search")} icon={<BsSearch size={24} />} {...getIconStyle("/search")} aria-label="Search" />
        </>
    );

    return (
        <>
            <Show above="md">
                <VStack
                    position="fixed" left={0} top={0} bottom={0} w="100px" py={8} px={4}
                    borderRight="1px" borderColor={useColorModeValue("gray.200", "whiteAlpha.300")}
                    bg={useColorModeValue("white", "black")} align="center" spacing={8} zIndex={2}
                    justify="space-between"
                >
                    <Image
                        cursor="pointer" alt="logo" w={8}
                        src={colorMode === "dark" ? "/light-logo.svg" : "/dark-logo.svg"}
                        onClick={() => handleNav("/")}
                    />
                    <VStack spacing={4} w="full" align="center">
                        {renderIcons(user)}
                    </VStack>
                    <Menu placement="right">
                        <MenuButton as={IconButton} icon={<HamburgerIcon />} variant="ghost" color="gray.500" _hover={{ bg: menuHoverBg }} />
                        {renderMenuItems(!!user)}
                    </Menu>
                </VStack>
            </Show>

            <Hide above="md">
                <Flex position="fixed" bottom={0} left={0} right={0} h="70px"
                    borderTop="1px" borderColor={useColorModeValue("gray.200", "whiteAlpha.300")}
                    bg={useColorModeValue("white", "black")} align="center" zIndex={2}
                >
                    <Flex w="full" px={2} justify={user ? "space-between" : "space-evenly"} align="center">
                        {renderIcons(user)}
                        <Menu placement="top">
                            <MenuButton as={IconButton} icon={<HamburgerIcon />} variant="ghost" color="gray.500" _hover={{ bg: menuHoverBg }} aria-label="Menu" />
                            {renderMenuItems(!!user)}
                        </Menu>
                    </Flex>
                </Flex>
            </Hide>

            <CreatePostModal isOpen={isOpen} onClose={onClose} />
        </>
    );
};

export default Header;
