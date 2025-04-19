import {
    Box,
    Grid,
    GridItem,
    Text,
    useColorMode,
    Input,
    InputGroup,
    InputLeftElement,
    Icon,
    VStack,
    HStack,
    Avatar,
    Button,
    Divider,
    Flex,
} from "@chakra-ui/react";
import { SearchIcon, SettingsIcon } from "@chakra-ui/icons";
import { suggestionsAtom } from "../atoms/suggesteAtoms";
import { useRecoilState } from "recoil";
import { useEffect, useState } from "react";
import useShowToast from "../hooks/useShowToast";
import UserItemSuggest from "../components/UserItemSuggest";
import useDebounce from "../hooks/useDebounce";
const SearchPage = () => {
    const [loading, setLoading] = useState(true);
    const showToast = useShowToast();
    const [suggestUsers, setSuggestUsers] = useRecoilState(suggestionsAtom);
    const [searchQuery, setSearchQuery] = useState("");
    const debouncedSearchQuery = useDebounce(searchQuery, 300);
    const [searchResult, setSearchResult] = useState([]);
    useEffect(() => {
        const fetchSearchResults = async () => {
            if (!debouncedSearchQuery.trim()) {
                setSearchResult([]);
                return;
            }

            try {
                const res = await fetch(`/api/users/search?q=${debouncedSearchQuery}`);
                const data = await res.json();
                if (data.message) {
                    showToast("Error", data.message, "error");
                } else {
                    setSearchResult(data);
                }
            } catch (error) {
                showToast("Error", error.message, "error");
            }
        };

        fetchSearchResults();
    }, [debouncedSearchQuery, showToast]);
    useEffect(() => {
        const getSuggestedUsers = async () => {
            setLoading(true);
            try {
                const res = await fetch("/api/users/suggested");
                const data = await res.json();
                if (data.error) {
                    showToast("Error", data.error, "error");
                    return;
                }
                setSuggestUsers(data);
            } catch (error) {
                showToast("Error", error.message, "error");
            } finally {
                setLoading(false);
            }
        };

        getSuggestedUsers();
    }, []);
    const { colorMode } = useColorMode();
    //const { handleFollowUnfollow, updating, following } = useFollowUnfollow(user, onSuccess);
    return (
        <Flex justify="center" h="100vh">
            <Box
                w="full"
                p={4}
                borderRadius="2xl"
                position="relative"
                h="full"
                overflow="hidden"
            >
                {/* Phần cố định */}
                <Box
                    position="sticky"
                    top="0"
                    zIndex={10}
                    pb={4}
                >
                    <Text fontWeight="bold" fontSize="lg" textAlign="center" mb={4}>
                        Search
                    </Text>

                    <InputGroup mb={4}>
                        <InputLeftElement pointerEvents="none">
                            <SearchIcon color="gray.400" />
                        </InputLeftElement>
                        <Input
                            placeholder="Search"
                            borderRadius="full"
                            bg={colorMode === "dark" ? "gray.800" : "white"}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <Box ml={2} mt={1}>
                            <Icon as={SettingsIcon} color="gray.400" />
                        </Box>
                    </InputGroup>


                </Box>

                {/* Danh sách cuộn */}
                <Box overflowY="auto" h="calc(100% - 150px)" pr={2}>
                    <Text fontWeight="medium" mb={2} fontSize="md">
                        Follow suggestions
                    </Text>
                    <VStack align="stretch" spacing={4}>
                        {(searchQuery ? searchResult : suggestUsers).map((user, idx, arr) => (
                            <Box key={user._id || idx}>
                                <UserItemSuggest user={user} />
                                {idx < arr.length - 1 && (
                                    <Divider borderColor="gray.700" mt={4} />
                                )}
                            </Box>
                        ))}
                    </VStack>
                </Box>
            </Box>
        </Flex>
    );
};


export default SearchPage;
