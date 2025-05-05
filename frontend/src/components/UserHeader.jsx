import { Avatar, Box, Flex, Link, Text, VStack, Menu, MenuButton, MenuItem, MenuList, useColorModeValue, useDisclosure } from "@chakra-ui/react";
import { Portal } from "@chakra-ui/portal";
import { Button } from "@chakra-ui/react";
import { BsInstagram, BsTwitter, BsFacebook, BsWhatsapp, BsThreads } from "react-icons/bs";
import { FaLink } from "react-icons/fa6";
import { CgMoreO } from "react-icons/cg";
import { useRecoilValue } from "recoil";
import userAtom from "../atoms/userAtom";
import { Link as RouterLink } from "react-router-dom";
import useFollowUnfollow from "@hooks/useFollowUnfollow";
import { PropTypes } from 'prop-types';
import useShowToast from "@hooks/useShowToast";
import { useState } from "react";
import FollowersFollowingModal from "./Modal/FollowersFollowingModal";

const SocialLinks = ({ socialLinks }) => {
    const platforms = [
        { icon: <BsInstagram size={24} />, name: "Instagram", url: socialLinks.instagram },
        { icon: <BsTwitter size={24} />, name: "Twitter", url: socialLinks.twitter },
        { icon: <BsFacebook size={24} />, name: "Facebook", url: socialLinks.facebook },
        { icon: <BsWhatsapp size={24} />, name: "WhatsApp", url: socialLinks.whatsapp },
        { icon: <BsThreads size={24} />, name: "Threads", url: socialLinks.threads },
        { icon: <FaLink size={24} />, name: "Other", url: socialLinks.other },
    ];

    return (
        <>
            {platforms.map((platform) =>
                platform.url ? (
                    <Box key={platform.name} className='icon-container' cursor={"pointer"} mr={1}>
                        <Link href={platform.url} isExternal>
                            {platform.icon}
                        </Link>
                    </Box>
                ) : null
            )}
        </>
    );
};

const UserHeader = ({ user, onTabChange }) => {
    const [feedType, setFeedType] = useState("threads");
    const showToast = useShowToast();
    const currentUser = useRecoilValue(userAtom); // logged in user
    const { handleFollowUnfollow, following, updating } = useFollowUnfollow(user);
    const { isOpen, onOpen, onClose } = useDisclosure();
    // Copy URL function with toast notification
    const copyURL = () => {
        const currentURL = window.location.href;
        navigator.clipboard.writeText(currentURL).then(() => {
            showToast("Success", "Profile link copied.", "success");
        });
    };

    const handleTabChangeInternal = (tab) => {
        setFeedType(tab);
        onTabChange(tab);
    };

    return (
        <>
            <Box position="relative" pt={"70px"}>
                <Box mt={4} maxW={"90%"} mx={"auto"}>
                    <VStack gap={4} alignItems={"start"}>
                        <Flex justifyContent={"space-between"} w={"full"}>
                            <Box>
                                <Text fontSize={"2xl"} fontWeight={"bold"}>
                                    {user.name}
                                </Text>
                                <Flex gap={2} alignItems={"center"}>
                                    <Text fontSize={"sm"}>{user.username}</Text>
                                    <Text fontSize={"xs"} bg={"gray.dark"} color={"gray.light"} p={1} borderRadius={"full"}>
                                        threads.net
                                    </Text>
                                </Flex>
                            </Box>
                            <Box>
                                <Avatar
                                    name={user.name}
                                    src={user.profilePic}
                                    size={{
                                        base: "md",
                                        md: "xl",
                                    }}
                                />
                            </Box>
                        </Flex>

                        <Text>{user.bio}</Text>

                        {currentUser?._id === user._id && (
                            <Link as={RouterLink} to='/update'>
                                <Button size={"sm"}>Update Profile</Button>
                            </Link>
                        )}
                        {currentUser?._id !== user._id && (
                            <Button size={"sm"} onClick={handleFollowUnfollow} isLoading={updating}>
                                {following ? "Unfollow" : "Follow"}
                            </Button>
                        )}
                        <Flex w={"full"} justifyContent={"space-between"}>
                            <Flex gap={2} alignItems={"center"}>
                                <Text onClick={() => onOpen()} _hover={{ borderBottom: "1px solid gray" }} cursor={"pointer"} color={"gray.light"}>{user.followers.length} followers</Text>
                            </Flex>
                            <Flex>
                                {/* Hiển thị các liên kết mạng xã hội */}
                                <SocialLinks socialLinks={user.socialLinks} />
                                {/* Menu More */}
                                <Box className='icon-container'>
                                    <Menu>
                                        <MenuButton>
                                            <CgMoreO size={24} cursor={"pointer"} />
                                        </MenuButton>
                                        <Portal>
                                            <MenuList bg={"gray.dark"}>
                                                {currentUser?._id !== user._id && (
                                                    <>
                                                        <MenuItem bg={"gray.dark"} onClick={() => { }}>
                                                            Report
                                                        </MenuItem>

                                                    </>
                                                )}
                                                <MenuItem bg={"gray.dark"} onClick={copyURL}>
                                                    Copy link
                                                </MenuItem>
                                            </MenuList>
                                        </Portal>
                                    </Menu>
                                </Box>
                            </Flex>
                        </Flex>
                    </VStack>
                </Box>

            </Box>
            <FollowersFollowingModal
                isOpen={isOpen}
                onClose={onClose}
                username={user.username}
            />
        </>
    );
};

UserHeader.propTypes = {
    user: PropTypes.object.isRequired,
    onTabChange: PropTypes.func.isRequired,
};

export default UserHeader;
