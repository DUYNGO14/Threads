import {
    Box,
    Text,
    useColorMode,
    Input,
    InputGroup,
    InputLeftElement,
    Icon,
    VStack,
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
    const { colorMode } = useColorMode();
    const showToast = useShowToast();

    const [suggestUsers, setSuggestUsers] = useRecoilState(suggestionsAtom);
    const [searchQuery, setSearchQuery] = useState("");
    const debouncedSearchQuery = useDebounce(searchQuery, 300);
    const [searchResult, setSearchResult] = useState([]);
    const [loading, setLoading] = useState(true);

    const usersToRender = searchQuery ? searchResult : suggestUsers;

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
                } else if (Array.isArray(data)) {
                    setSearchResult(data);
                } else {
                    setSearchResult([]);
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
                } else if (Array.isArray(data)) {
                    setSuggestUsers(data);
                } else {
                    setSuggestUsers([]);
                }
            } catch (error) {
                showToast("Error", error.message, "error");
            } finally {
                setLoading(false);
            }
        };

        getSuggestedUsers();
    }, [showToast, setSuggestUsers]);

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
                {/* Sticky Search Header */}
                <Box position="sticky" top="0" zIndex={10} pb={4} >
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

                {/* Scrollable Results */}
                <Box overflowY="auto" h="calc(100% - 150px)" pr={2}>
                    <Text fontWeight="medium" mb={2} fontSize="md">
                        Follow suggestions
                    </Text>

                    <VStack align="stretch" spacing={4}>
                        {!Array.isArray(usersToRender) ? (
                            <Text textAlign="center" color="gray.500">
                                Something went wrong.
                            </Text>
                        ) : usersToRender.length === 0 ? (
                            <Text textAlign="center" color="gray.500">
                                {searchQuery
                                    ? "No matching users found."
                                    : "No user suggestions available."}
                            </Text>
                        ) : (
                            usersToRender.map((user, idx) => (
                                <Box key={user._id || idx}>
                                    <UserItemSuggest user={user} />
                                    {idx < usersToRender.length - 1 && (
                                        <Divider borderColor="gray.700" mt={4} />
                                    )}
                                </Box>
                            ))
                        )}
                    </VStack>
                </Box>
            </Box>
        </Flex>
    );
};

export default SearchPage;
