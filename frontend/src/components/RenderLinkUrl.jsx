import { Link } from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";

export const RenderLinkUrl = ({ text }) => {
    const parts = [];
    let lastIndex = 0;

    const regex = /(https?:\/\/[^\s]+)/g;
    let match;

    while ((match = regex.exec(text)) !== null) {
        const [fullMatch] = match;
        const id = fullMatch;
        const url = fullMatch;

        if (match.index > lastIndex) {
            parts.push(text.slice(lastIndex, match.index));
        }

        parts.push(
            <Link
                key={id}
                as={RouterLink}
                to={url}
                color="white"
                fontWeight="semibold"
                fontSize="sm"
                _hover={{ textDecoration: "underline" }}
                target="_blank"
                rel="noopener noreferrer"
            >
                {url}
            </Link>
        );

        lastIndex = regex.lastIndex;
    }

    if (lastIndex < text.length) {
        parts.push(text.slice(lastIndex));
    }

    return parts;
};

