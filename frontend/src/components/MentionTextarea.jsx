import React from "react";
import { Box, Avatar, Text, useColorModeValue, useToken } from "@chakra-ui/react";
import { MentionsInput, Mention } from "react-mentions";

const MentionTextarea = ({
  value,
  onChange,
  mentionUsers = [],
  placeholder = "What’s on your mind?",
}) => {
  const bgColor = useColorModeValue("white", "gray.800");
  const textColor = useColorModeValue("black", "white");
  const suggestionBg = useColorModeValue("#EDF2F7", "#1A202C"); // light: gray.100, dark: gray.900
  const suggestionFocusBg = useColorModeValue("#E2E8F0", "#2D3748"); // gray.200 / gray.800
  const mentionBg = useColorModeValue("#E3F3FF", "#2A4365");
  const mentionColor = useColorModeValue("#0074cc", "#90cdf4");

  const mentionData = mentionUsers
    .filter((user) => user.id && user.display)
    .map((user) => ({
      id: user.id,
      display: user.display,
      avatar: user.avatar,
      fullName: user.fullName,
    }));

  const mentionStyle = {
    control: {
      backgroundColor: bgColor,
      border: "none",
      outline: "none",
      boxShadow: "none",
      fontSize: 16,
      fontWeight: "normal",
      padding: "10px",
      minHeight: "60px",
      borderRadius: "8px",
      color: textColor,
    },
    highlighter: {
      overflow: "hidden",
    },
    input: {
      margin: 0,
      outline: "none",
      border: "none",
      color: textColor,
    },
    suggestions: {
      list: {
        backgroundColor: suggestionBg,
        fontSize: 14,
        borderRadius: "10px",
        maxHeight: "250px",
        overflow: "hidden",
        border: "1px solid",
        borderColor: useColorModeValue("#CBD5E0", "#4A5568"), // gray.300 / gray.600
        padding: "4px 0",
      },
      item: {
        padding: "8px 12px",
        backgroundColor: "transparent",
        cursor: "pointer",
      },
    },
    mention: {
      backgroundColor: mentionBg,
      color: mentionColor,
      fontWeight: "bold",
    },
  };

  return (
    <MentionsInput
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      style={mentionStyle}
      allowSuggestionsAboveCursor
      className="mentions__input"
    >
      <Mention
        trigger="@"
        data={mentionData}
        displayTransform={(id, display) => `@${display}`}
        renderSuggestion={(entry, focused) => (
          <Box
            bg={focused ? suggestionFocusBg : "transparent"}
            px={3}
            py={2}
            display="flex"
            alignItems="center"
            gap={3}
            borderRadius="md"
            transition="background 0.2s"
          >
            <Avatar size="sm" name={entry.fullName} src={entry.avatar} />
            <Box>
              <Text fontWeight="bold" fontSize="sm" color={textColor}>
                {entry.display}
              </Text>
              <Text fontSize="xs" color="gray.400">
                {entry.fullName}
              </Text>
            </Box>
          </Box>
        )}
      />
    </MentionsInput>
  );
};

export default MentionTextarea;
