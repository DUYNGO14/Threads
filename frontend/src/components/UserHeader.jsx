import { Avatar, Box, Flex, Link, Text, VStack, Menu, MenuButton, MenuItem, MenuList } from "@chakra-ui/react";
import { Portal } from "@chakra-ui/portal";
import { Button } from "@chakra-ui/react";
import { BsInstagram } from "react-icons/bs";
import { CgMoreO } from "react-icons/cg";
import { useRecoilValue } from "recoil";
import userAtom from "../atoms/userAtom";
import { Link as RouterLink } from "react-router-dom";
import useFollowUnfollow from "../hooks/useFollowUnfollow";
import { PropTypes } from 'prop-types';
import useShowToast from "../hooks/useShowToast";
import Tabs from "./Tabs";
import { useState } from "react";

const UserHeader = ({ user, onTabChange }) => {
    const [feedType, setFeedType] = useState("threads");
    const showToast = useShowToast();
    const currentUser = useRecoilValue(userAtom); // logged in user
    const { handleFollowUnfollow, following, updating } = useFollowUnfollow(user);

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

    const myTabs = [
        { value: "threads", label: "Threads" },
        { value: "reposts", label: "Reposts" },
    ];

    return (
        <>
            <Box position="relative">
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
                            {user.profilePic && (
                                <Avatar
                                    name={user.name}
                                    src={user.profilePic}
                                    size={{
                                        base: "md",
                                        md: "xl",
                                    }}
                                />
                            )}
                            {!user.profilePic && (
                                <Avatar
                                    name={user.name}
                                    src='https://bit.ly/broken-link'
                                    size={{
                                        base: "md",
                                        md: "xl",
                                    }}
                                />
                            )}
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
                            <Text color={"gray.light"}>{user.followers.length} followers</Text>
                            <Box w='1' h='1' bg={"gray.light"} borderRadius={"full"}></Box>
                            <Link color={"gray.light"}>instagram.com</Link>
                        </Flex>
                        <Flex>
                            <Box className='icon-container'>
                                <BsInstagram size={24} cursor={"pointer"} />
                            </Box>
                            <Box className='icon-container'>
                                <Menu>
                                    <MenuButton>
                                        <CgMoreO size={24} cursor={"pointer"} />
                                    </MenuButton>
                                    <Portal>
                                        <MenuList bg={"gray.dark"}>
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
            <Box position="sticky" top={0} zIndex={10} bg="inherit">
                <Tabs tabs={myTabs} onTabChange={handleTabChangeInternal} initialTab={feedType} />
            </Box>
        </>
    );
};

UserHeader.propTypes = {
    user: PropTypes.object.isRequired,
    onTabChange: PropTypes.func.isRequired,
};

export default UserHeader;