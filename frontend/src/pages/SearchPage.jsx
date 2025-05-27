import {
    Box,
    Text,
    useColorMode,
    Input,
    InputGroup,
    InputLeftElement,
    VStack,
    Divider,
    Flex,
    SkeletonCircle,
    Skeleton,
} from "@chakra-ui/react";
import { SearchIcon } from "@chakra-ui/icons";
import { suggestionsAtom } from "../atoms/suggesteAtoms";
import { useRecoilState } from "recoil";
import { useEffect, useState, useCallback, useRef } from "react";
import useShowToast from "@hooks/useShowToast";
import UserItemSuggest from "@components/UserItemSuggest";
import useDebounce from "@hooks/useDebounce";
import api from "../services/api.js";

const SKELETON_COUNT = 5;

const SearchPage = () => {
    const { colorMode } = useColorMode();
    const showToast = useShowToast();

    const [suggestUsers, setSuggestUsers] = useRecoilState(suggestionsAtom);
    const [searchQuery, setSearchQuery] = useState("");
    const debouncedSearchQuery = useDebounce(searchQuery, 300);
    const [searchResults, setSearchResults] = useState([]);
    const [loadingSuggestions, setLoadingSuggestions] = useState(true);
    const [loadingSearch, setLoadingSearch] = useState(false);
    const inputRef = useRef(null);

    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.focus();
        }
    }, []);


    const fetchSuggestedUsers = useCallback(async () => {
        setLoadingSuggestions(true);
        try {
            const res = await api.get("/api/users/suggested");
            const data = await res.data;
            if (data.error) {
                showToast("Error", data.error, "error");
                setSuggestUsers([]);
            } else if (Array.isArray(data)) {
                setSuggestUsers(data);
            } else {
                setSuggestUsers([]);
            }
        } catch (error) {
            showToast("Error", error.message, "error");
            setSuggestUsers([]);
        } finally {
            setLoadingSuggestions(false);
        }
    }, [setSuggestUsers, showToast]);

    const fetchSearchResults = useCallback(async (query) => {
        if (!query.trim()) {
            setSearchResults([]);
            setLoadingSearch(false);
            return;
        }
        setLoadingSearch(true);
        try {
            const res = await api.get(`/api/users/search-suggested?q=${query}`);
            const data = await res.data;
            if (data.error) {
                showToast("Error", data.error, "error");
                setSearchResults([]);
            } else if (Array.isArray(data)) {
                setSearchResults(data);
            } else {
                setSearchResults([]);
            }
        } catch (error) {
            showToast("Error", "An error occurred while fetching the search results", "error");
            setSearchResults([]);
        } finally {
            setLoadingSearch(false);
        }
    }, [showToast]);

    useEffect(() => {
        fetchSuggestedUsers();
    }, [fetchSuggestedUsers]);

    useEffect(() => {
        fetchSearchResults(debouncedSearchQuery);
    }, [debouncedSearchQuery, fetchSearchResults]);

    const usersToRender = searchQuery.trim() ? searchResults : suggestUsers;
    const isLoading = searchQuery.trim() ? loadingSearch : loadingSuggestions;

    return (
        <Flex justify="center" h="100vh" px={{ base: 2, md: 4 }}>
            <Box
                w="full"
                maxW={{ base: "100%", md: "600px" }}
                p={{ base: 3, md: 4 }}
                borderRadius="2xl"
                position="relative"
                h="full"
                overflow="hidden"
            >
                <Box position="sticky" top="0" zIndex={10} pb={4} >
                    <Text fontWeight="bold" fontSize={{ base: "md", md: "lg" }} textAlign="center" mb={4}>
                        Search
                    </Text>

                    <InputGroup mb={4}>
                        <InputLeftElement pointerEvents="none">
                            <SearchIcon color="gray.400" />
                        </InputLeftElement>
                        <Input
                            ref={inputRef}
                            type="text"
                            placeholder="Search"
                            borderRadius="full"
                            bg={colorMode === "dark" ? "gray.800" : "white"}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            fontSize={{ base: "sm", md: "md" }}
                            py={{ base: 2, md: 3 }}
                            value={searchQuery}
                            autoComplete="off"
                        />
                    </InputGroup>
                </Box>

                <Box
                    overflowY="auto"
                    h="calc(100% - 150px)"
                    pr={{ base: 1, md: 2 }}
                    sx={{
                        "&::-webkit-scrollbar": { display: "none" },
                        "-ms-overflow-style": "none", // IE, Edge
                        "scrollbar-width": "none", // Firefox
                    }}
                >
                    <Text fontWeight="medium" mb={2} fontSize={{ base: "sm", md: "md" }}>
                        {searchQuery.trim() ? "Search results" : "Follow suggestions"}
                    </Text>

                    <VStack align="stretch" spacing={4}>
                        {isLoading ? (
                            Array.from({ length: SKELETON_COUNT }).map((_, idx) => (
                                <Box key={idx} padding="4" borderWidth="1px" borderRadius="lg">
                                    <Flex align="center">
                                        <SkeletonCircle size="10" mr={4} />
                                        <Box flex="1">
                                            <Skeleton height="12px" width="50%" mb={2} />
                                            <Skeleton height="10px" width="30%" />
                                        </Box>
                                    </Flex>
                                </Box>
                            ))
                        ) : !Array.isArray(usersToRender) ? (
                            <Text textAlign="center" color="gray.500">
                                Something went wrong.
                            </Text>
                        ) : usersToRender.length === 0 ? (
                            <Text textAlign="center" color="gray.500">
                                {searchQuery.trim() ? "No matching users found." : "No user suggestions available."}
                            </Text>
                        ) : (
                            usersToRender.map((user, idx) => (
                                <Box key={user._id ?? idx}>
                                    <UserItemSuggest user={user} />
                                    {idx < usersToRender.length - 1 && <Divider borderColor="gray.700" mt={{ base: 3, md: 4 }} />}
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
