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
import useShowToast from "@hooks/useShowToast";
import UserItemSuggest from "@components/UserItemSuggest";
import useDebounce from "@hooks/useDebounce";
import api from "../services/api.js";
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
                setSearchResult([]); // Nếu không có truy vấn, trả về mảng rỗng
                return;
            }

            try {
                const res = await api.get(`/api/users/search-suggested?q=${debouncedSearchQuery}`);
                const data = await res.data;

                // Kiểm tra nếu có lỗi từ backend
                if (data.error) {
                    showToast("Error", data.error, "error");
                    setSearchResult([]); // Trả về mảng rỗng nếu có lỗi
                } else if (Array.isArray(data)) {
                    setSearchResult(data); // Gán kết quả tìm kiếm nếu trả về mảng người dùng
                } else {
                    setSearchResult([]); // Trả về mảng rỗng nếu dữ liệu không đúng định dạng
                }
            } catch (error) {
                console.error("Error fetching search results:", error);
                showToast("Error", "An error occurred while fetching the search results", "error");
                setSearchResult([]); // Nếu có lỗi API, trả về mảng rỗng
            }
        };

        fetchSearchResults();
    }, [debouncedSearchQuery, showToast]);


    useEffect(() => {
        const getSuggestedUsers = async () => {
            setLoading(true);
            try {
                const res = await api.get("/api/users/suggested");
                const data = await res.data;
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
                <Box position="sticky" top="0" zIndex={10} pb={4}>
                    <Text fontWeight="bold" fontSize={{ base: "md", md: "lg" }} textAlign="center" mb={4}>
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
                            fontSize={{ base: "sm", md: "md" }}
                            py={{ base: 2, md: 3 }}
                        />
                        <Box ml={2} mt={1}>
                            <Icon as={SettingsIcon} color="gray.400" />
                        </Box>
                    </InputGroup>
                </Box>

                <Box overflowY="auto" h="calc(100% - 150px)" pr={{ base: 1, md: 2 }} sx={{
                    '&::-webkit-scrollbar': { display: 'none' },
                    '-ms-overflow-style': 'none',  // IE, Edge
                    'scrollbar-width': 'none',     // Firefox
                }}>
                    <Text fontWeight="medium" mb={2} fontSize={{ base: "sm", md: "md" }}>
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
                                        <Divider borderColor="gray.700" mt={{ base: 3, md: 4 }} />
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
