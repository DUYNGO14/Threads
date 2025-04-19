// components/SocialLinksInput.jsx
import {
    Box,
    Button,
    Flex,
    FormControl,
    FormLabel,
    HStack,
    Icon,
    Input,
    Select,
    Stack,
    Text,
} from "@chakra-ui/react";
import { useState } from "react";
import { FaFacebook, FaTwitter, FaInstagram, FaTiktok, FaLink } from "react-icons/fa";
import { FaThreads } from "react-icons/fa6";
const platforms = [
    { label: "Facebook", value: "facebook", icon: FaFacebook },
    { label: "Twitter", value: "twitter", icon: FaTwitter },
    { label: "Instagram", value: "instagram", icon: FaInstagram },
    { label: "TikTok", value: "tiktok", icon: FaTiktok },
    { label: "Threads", value: "threads", icon: FaThreads },
    { label: "Other", value: "other", icon: FaLink },
];

const detectPlatform = (url) => {
    if (url.includes("facebook.com")) return "facebook";
    if (url.includes("twitter.com")) return "twitter";
    if (url.includes("instagram.com")) return "instagram";
    if (url.includes("tiktok.com")) return "tiktok";
    if (url.includes("threads.net")) return "threads";
    return "other";
};

const isValidUrl = (url) => {
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
};

const MAX_LINKS = 5;

export default function SocialLinksInput({ value, onChange }) {
    const [links, setLinks] = useState(
        value?.length ? value : [{ platform: "facebook", url: "" }]
    );

    const updateLinks = (updated) => {
        setLinks(updated);
        const validMap = {};
        updated.forEach((item) => {
            if (item.url.trim()) {
                validMap[item.platform] = item.url.trim();
            }
        });
        onChange(validMap); // Trả về dạng Map
    };

    const handleAdd = () => {
        if (links.length >= MAX_LINKS) return;
        updateLinks([...links, { platform: "other", url: "" }]);
    };

    const handleRemove = (index) => {
        const updated = [...links];
        updated.splice(index, 1);
        updateLinks(updated);
    };

    const handleChange = (index, field, value) => {
        const updated = [...links];
        if (field === "url") {
            updated[index].url = value;
            updated[index].platform = detectPlatform(value);
        } else {
            updated[index][field] = value;
        }
        updateLinks(updated);
    };

    return (
        <Box>
            <FormLabel>Liên kết mạng xã hội</FormLabel>
            <Stack spacing={3}>
                {links.map((item, index) => {
                    const platformMeta = platforms.find((p) => p.value === item.platform) || platforms[0];
                    const valid = isValidUrl(item.url);
                    return (
                        <HStack key={index} align="flex-end">
                            <FormControl w="40%">
                                <Select
                                    value={item.platform}
                                    onChange={(e) => handleChange(index, "platform", e.target.value)}
                                >
                                    {platforms.map((p) => (
                                        <option key={p.value} value={p.value}>
                                            {p.label}
                                        </option>
                                    ))}
                                </Select>
                            </FormControl>
                            <FormControl isInvalid={item.url && !valid}>
                                <Input
                                    placeholder="https://..."
                                    value={item.url}
                                    onChange={(e) => handleChange(index, "url", e.target.value)}
                                />
                            </FormControl>
                            <Icon alignSelf={"center"} as={platformMeta.icon} boxSize={6} color="gray.500" />
                            <Button alignSelf={"center"} onClick={() => handleRemove(index)} colorScheme="red" size="sm">
                                Xoá
                            </Button>
                        </HStack>
                    );
                })}
                {links.length < MAX_LINKS && (
                    <Button onClick={handleAdd} colorScheme="blue" size="sm" mt={2}>
                        + Thêm liên kết
                    </Button>
                )}
                <Text fontSize="sm" color="gray.500">
                    Tối đa {MAX_LINKS} liên kết.
                </Text>
            </Stack>
        </Box>
    );
}
