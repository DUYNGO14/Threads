// components/GiphyPicker.jsx
import { Box, Input, Image, Spinner, SimpleGrid } from "@chakra-ui/react";
import { useState } from "react";
import useGiphySearch from "../hooks/useGiphySearch";

const GiphyPicker = ({ onGifSelect }) => {
    const [query, setQuery] = useState("ALL");
    const { results, loading } = useGiphySearch(query);

    return (
        <Box bg="white" border={"1px solid"} color={"black"} p={3} borderRadius="md" boxShadow="md" width="300px" height="400px" overflowY="scroll">
            <Input placeholder="Search GIFs" value={query} onChange={(e) => setQuery(e.target.value)} mb={2} />
            {loading ? (
                <Spinner />
            ) : (
                <SimpleGrid columns={2} spacing={2}>
                    {results.map((gif) => (
                        <Image
                            key={gif.id}
                            src={gif.images.fixed_height.url}
                            alt={gif.title}
                            cursor="pointer"
                            onClick={() => onGifSelect(gif.images.fixed_height.url)}
                        />
                    ))}
                </SimpleGrid>
            )}
        </Box>
    );
};

export default GiphyPicker;
