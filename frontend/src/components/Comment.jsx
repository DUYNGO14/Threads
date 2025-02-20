import { Avatar, Box, Divider, Flex, Menu, MenuButton, MenuItem, MenuList, Portal, Text } from "@chakra-ui/react";
import { PropTypes } from 'prop-types';
import { CgMoreO } from "react-icons/cg";
import { Link } from "react-router-dom";
const Comment = ({ reply, lastReply }) => {
    return (
        <>
            <Flex gap={4} py={2} my={2} w={"full"}>
                <Avatar src={reply.userProfilePic} size={"sm"} />
                <Flex gap={1} w={"full"} flexDirection={"column"}>
                    <Flex w={"full"} justifyContent={"space-between"} alignItems={"center"}>
                        <Link to={`/${reply.username}`}>
                            <Text fontSize='sm' fontWeight='bold'>{reply.username}</Text>
                        </Link>
                    </Flex>
                    <Text>{reply.text}</Text>
                </Flex>
                <Flex>

                    <Box className='icon-container'>
                        <Menu>
                            <MenuButton>
                                <CgMoreO size={24} cursor={"pointer"} />
                            </MenuButton>
                            <Portal>
                                <MenuList bg={"gray.dark"}>
                                    <MenuItem bg={"gray.dark"} onClick={() => { }}>
                                        Delete
                                    </MenuItem>
                                    <MenuItem bg={"gray.dark"} onClick={() => { }}>
                                        Edit
                                    </MenuItem>
                                </MenuList>
                            </Portal>
                        </Menu>
                    </Box>
                </Flex>
            </Flex>
            {!lastReply ? <Divider /> : null}
        </>
    );
};
Comment.propTypes = {
    reply: PropTypes.object.isRequired,
    lastReply: PropTypes.bool,
}
export default Comment;