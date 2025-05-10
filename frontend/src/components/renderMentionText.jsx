import { Link, Text } from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";

export const renderMentionText = (text) => {
    const parts = [];
    let lastIndex = 0;

    const regex = /@\[(.+?)\]\((.+?)\)/g;
    let match;

    while ((match = regex.exec(text)) !== null) {
        const [fullMatch, display, id] = match;

        if (match.index > lastIndex) {
            parts.push(text.slice(lastIndex, match.index));
        }

        parts.push(
            <Link
                key={id}
                as={RouterLink}
                to={`/user/${display}`}
                color="blue.400"
                fontWeight="bold"
                _hover={{ textDecoration: "underline" }}
            >
                @{display}
            </Link>
        );

        lastIndex = regex.lastIndex;
    }

    if (lastIndex < text.length) {
        parts.push(text.slice(lastIndex));
    }

    return parts;
};
