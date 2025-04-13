import {
    Flex, Image, IconButton, VStack, Show, Hide, useColorMode,
    Menu, MenuButton, MenuList, MenuItem, useColorModeValue, useDisclosure
} from "@chakra-ui/react";
import { useRecoilValue } from "recoil";
import userAtom from "../atoms/userAtom";
import { AiFillHome } from "react-icons/ai";
import { RxAvatar } from "react-icons/rx";
import { Link as RouterLink, useLocation, useNavigate } from "react-router-dom";
import { FiLogIn, FiLogOut } from "react-icons/fi";
import useLogout from "../hooks/useLogout";
import { BsFillChatQuoteFill, BsSun, BsMoonStars, BsSearch, BsPlusSquare } from "react-icons/bs";
import { MdOutlineSettings } from "react-icons/md";
import { HamburgerIcon } from "@chakra-ui/icons";
import CreatePostModal from "./CreatePostModal";
import { unreadConversationsCountAtom } from "../atoms/messagesAtom";
import ChatIconWithBadge from "./ChatIconWithBadge";
import { IoMdNotificationsOutline } from "react-icons/io";
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
    const unreadCount = useRecoilValue(unreadConversationsCountAtom);
    const getIconStyle = (path) => ({
        color: isActive(path) ? (colorMode === "dark" ? "white" : "black") : "gray.500",
        bg: isActive(path) ? (colorMode === "dark" ? "whiteAlpha.200" : "gray.100") : "transparent",
        _hover: { bg: colorMode === "dark" ? "whiteAlpha.200" : "gray.100", color: colorMode === "dark" ? "white" : "black" }
    });

    return (
        <>
            {/* Desktop Sidebar */}
            <Show above="md">
                <VStack
                    position="fixed" left={0} top={0} bottom={0} w="100px" py={8} px={4}
                    borderRight="1px" borderColor={useColorModeValue("gray.200", "whiteAlpha.300")}
                    bg={useColorModeValue("white", "black")} align="center" spacing={8} zIndex={2}
                    justify="space-between"
                >
                    {/* Logo */}
                    <Image
                        cursor="pointer" alt="logo" w={8}
                        src={colorMode === "dark" ? "/light-logo.svg" : "/dark-logo.svg"}
                        onClick={() => navigate("/")}
                    />

                    {/* Main Icons */}
                    <VStack spacing={4} w="full" align="center">
                        <IconButton as={RouterLink} to="/" icon={<AiFillHome size={24} />} {...getIconStyle("/")} aria-label="Home" />
                        {user && (
                            <>
                                <IconButton as={RouterLink} to={`/${user.username}`} icon={<RxAvatar size={24} />} {...getIconStyle(`/${user.username}`)} aria-label="Profile" />
                                <IconButton onClick={onOpen} icon={<BsPlusSquare size={30} />} {...getIconStyle("/create-post")} aria-label="Create Post" />
                                <IconButton as={RouterLink} to="/chat" icon={<ChatIconWithBadge />} {...getIconStyle("/chat")} aria-label="Messages" />
                                <IconButton as={RouterLink} to="/notifications" icon={<IoMdNotificationsOutline size={24} />} {...getIconStyle("/notifications")} aria-label="Notifications" />
                            </>
                        )}
                        <IconButton as={RouterLink} to="/search" icon={<BsSearch size={24} />} {...getIconStyle("/search")} aria-label="Search" />
                    </VStack>

                    {/* Hamburger Menu (Bottom) */}
                    <Menu placement="right">
                        <MenuButton as={IconButton} icon={<HamburgerIcon />} variant="ghost" color="gray.500" _hover={{ bg: menuHoverBg }} />
                        <MenuList bg={menuBg} borderColor={menuBorder}>
                            <MenuItem icon={colorMode === "dark" ? <BsSun size={20} /> : <BsMoonStars size={20} />} onClick={toggleColorMode} _hover={{ bg: menuHoverBg }}>
                                {colorMode === "dark" ? "Light Mode" : "Dark Mode"}
                            </MenuItem>
                            {user ? (
                                <>
                                    <MenuItem icon={<MdOutlineSettings size={20} />} onClick={() => navigate("/settings")} _hover={{ bg: menuHoverBg }}>Settings</MenuItem>
                                    <MenuItem icon={<FiLogOut size={20} />} onClick={logout} _hover={{ bg: menuHoverBg }}>Logout</MenuItem>
                                </>
                            ) : (
                                <MenuItem as={RouterLink} to="/auth" icon={<FiLogIn size={20} />} _hover={{ bg: menuHoverBg }}>Login</MenuItem>
                            )}
                        </MenuList>
                    </Menu>
                </VStack>
            </Show>

            {/* Mobile Header */}
            <Hide above="md">
                <Flex position="fixed" bottom={0} left={0} right={0} h="70px"
                    borderTop="1px" borderColor={useColorModeValue("gray.200", "whiteAlpha.300")}
                    bg={useColorModeValue("white", "black")} align="center" zIndex={2}
                >
                    {/* Fixed width grid layout */}
                    <Flex w="full" px={2}>
                        {user ? (
                            // When user is logged in - 5 equally spaced icons
                            <Flex w="full" justify="space-between" align="center">
                                <IconButton as={RouterLink} to="/" icon={<AiFillHome size={24} />} {...getIconStyle("/")} aria-label="Home" />
                                <IconButton as={RouterLink} to={`/${user.username}`} icon={<RxAvatar size={24} />} {...getIconStyle(`/${user.username}`)} aria-label="Profile" />
                                <IconButton onClick={onOpen} icon={<BsPlusSquare size={30} />} {...getIconStyle("/create-post")} aria-label="Create Post" />
                                <IconButton as={RouterLink} to="/chat" icon={<ChatIconWithBadge />} {...getIconStyle("/chat")} aria-label="Messages" />
                                <IconButton as={RouterLink} to="/search" icon={<BsSearch size={24} />} {...getIconStyle("/search")} aria-label="Search" />
                                <IconButton as={RouterLink} to="/notifications" icon={<IoMdNotificationsOutline size={24} />} {...getIconStyle("/notifications")} aria-label="Notifications" />
                                <Menu placement="top">
                                    <MenuButton as={IconButton} icon={<HamburgerIcon />} variant="ghost" color="gray.500" _hover={{ bg: menuHoverBg }} aria-label="Menu" />
                                    <MenuList bg={menuBg} borderColor={menuBorder}>
                                        <MenuItem icon={colorMode === "dark" ? <BsSun size={20} /> : <BsMoonStars size={20} />} onClick={toggleColorMode} _hover={{ bg: menuHoverBg }}>
                                            {colorMode === "dark" ? "Light Mode" : "Dark Mode"}
                                        </MenuItem>
                                        <MenuItem icon={<MdOutlineSettings size={20} />} onClick={() => navigate("/settings")} _hover={{ bg: menuHoverBg }}>Settings</MenuItem>
                                        <MenuItem icon={<FiLogOut size={20} />} onClick={logout} _hover={{ bg: menuHoverBg }}>Logout</MenuItem>
                                    </MenuList>
                                </Menu>
                            </Flex>
                        ) : (
                            // When user is logged out - 3 evenly spaced icons
                            <Flex w="full" justify="space-evenly" align="center">
                                <IconButton as={RouterLink} to="/" icon={<AiFillHome size={24} />} {...getIconStyle("/")} aria-label="Home" />
                                <IconButton as={RouterLink} to="/auth" icon={<FiLogIn size={20} />} {...getIconStyle("/auth")} aria-label="Login" />
                                <IconButton as={RouterLink} to="/search" icon={<BsSearch size={24} />} {...getIconStyle("/search")} aria-label="Search" />
                                <Menu placement="top">
                                    <MenuButton as={IconButton} icon={<HamburgerIcon />} variant="ghost" color="gray.500" _hover={{ bg: menuHoverBg }} aria-label="Menu" />
                                    <MenuList bg={menuBg} borderColor={menuBorder}>
                                        <MenuItem icon={colorMode === "dark" ? <BsSun size={20} /> : <BsMoonStars size={20} />} onClick={toggleColorMode} _hover={{ bg: menuHoverBg }}>
                                            {colorMode === "dark" ? "Light Mode" : "Dark Mode"}
                                        </MenuItem>
                                        <MenuItem as={RouterLink} to="/auth" icon={<FiLogIn size={20} />} _hover={{ bg: menuHoverBg }}>Login</MenuItem>
                                    </MenuList>
                                </Menu>
                            </Flex>
                        )}
                    </Flex>
                </Flex>
            </Hide>

            <CreatePostModal isOpen={isOpen} onClose={onClose} />
        </>
    );
};

export default Header;