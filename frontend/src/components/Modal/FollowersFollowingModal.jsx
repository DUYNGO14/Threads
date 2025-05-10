import React, { useEffect, useState } from "react";
import {
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalCloseButton,
    Tab,
    Tabs,
    TabList,
    Text,
    Spinner,
    Flex,
    useColorModeValue,
} from "@chakra-ui/react";
import { useRecoilState } from "recoil";
import { followersAtom, followingAtom } from "../../atoms/followAtoms";
import FollowItem from "../FollowItem";
import api from "../../services/api";
import { useNavigate } from "react-router-dom";

const FollowersFollowingModal = ({ isOpen, onClose, username }) => {
    const [followers, setFollowers] = useRecoilState(followersAtom);
    const [following, setFollowing] = useRecoilState(followingAtom);
    const [activeTab, setActiveTab] = useState("followers");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate(); // thêm dòng này
    const bg = useColorModeValue('gray.100', 'gray.dark')

    useEffect(() => {
        if (!isOpen) setActiveTab("followers");
    }, [isOpen]);

    useEffect(() => {
        if (!username || !isOpen) return;

        const fetchData = async () => {
            setLoading(true);
            try {
                const [resFollowers, resFollowing] = await Promise.all([
                    api.get(`/api/users/${username}/followed`),
                    api.get(`/api/users/${username}/following`),
                ]);

                const dataFollowers = resFollowers.data;
                const dataFollowing = resFollowing.data;

                setFollowers(dataFollowers);
                setFollowing(dataFollowing);
            } catch (error) {
                console.error("Error fetching follow data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [username, isOpen, setFollowers, setFollowing]);

    const dataToRender = activeTab === "followers" ? followers : following;
    const handleNavigate = (url) => {
        onClose();
        navigate(url);
    };
    return (
        <Modal isOpen={isOpen} onClose={onClose} size="md" isCentered>
            <ModalOverlay />
            <ModalContent bg={bg} maxH="80vh" overflow="hidden" borderRadius="md" mx={4}>
                <ModalHeader px={4} pt={4}>
                    <Tabs isFitted variant="enclosed" colorScheme="white">
                        <TabList>
                            <Tab onClick={() => setActiveTab("followers")}>Followers {followers.length}</Tab>
                            <Tab onClick={() => setActiveTab("following")}>Following {following.length}</Tab>
                        </TabList>
                    </Tabs>
                </ModalHeader>
                <ModalBody px={0} pb={4} overflowY="auto">
                    {loading ? (
                        <Flex justify="center" py={10}>
                            <Spinner />
                        </Flex>
                    ) : dataToRender.length === 0 ? (
                        <Text textAlign="center" mt={5}>
                            No {activeTab}
                        </Text>
                    ) : (
                        dataToRender.map((user) => (
                            <FollowItem key={user._id} user={user} activeTab={activeTab} setFollowing={setFollowing} handleNavigate={handleNavigate} />
                        ))
                    )}
                </ModalBody>
            </ModalContent>
        </Modal>
    );
};

export default FollowersFollowingModal;
