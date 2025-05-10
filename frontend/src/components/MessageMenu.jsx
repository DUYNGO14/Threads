import {
    Menu,
    MenuButton,
    MenuList,
    MenuItem,
    IconButton
} from "@chakra-ui/react";
import { BsThreeDotsVertical } from "react-icons/bs";
import { EditIcon, CopyIcon, RepeatClockIcon } from "@chakra-ui/icons";
import { useState } from "react";
import ModalDeleteMessage from "./Messages/ModalDeleteMessage";
import ModalUpdateMessage from "./Messages/ModalUpdateMessage";

const MessageMenu = ({ message, ownMessage }) => {
    const [isOpenEdit, setIsOpenEdit] = useState(false);
    const [isOpenUnsend, setIsOpenUnsend] = useState(false);
    const handleCopy = () => {
        if (message.text) {
            navigator.clipboard.writeText(message.text);
            console.log("Copied to clipboard:", message.text);
        }
    };

    return (
        <>
            <Menu placement="bottom-end" isLazy>
                <MenuButton
                    as={IconButton}
                    icon={<BsThreeDotsVertical />}
                    size="sm"
                    variant="ghost"
                    aria-label="Options"
                />
                <MenuList>
                    {ownMessage && (
                        <>
                            {
                                !message.seen && message.text && (<MenuItem icon={<RepeatClockIcon boxSize={3} />} onClick={() => setIsOpenEdit(true)}>
                                    Update
                                </MenuItem>)
                            }

                            <MenuItem icon={<RepeatClockIcon boxSize={3} />} onClick={() => setIsOpenUnsend(true)} color="red.500">
                                Unsend
                            </MenuItem>
                        </>
                    )}
                    {
                        message.text && <MenuItem icon={<CopyIcon boxSize={3} />} onClick={handleCopy}>
                            Copy
                        </MenuItem>}
                </MenuList>
            </Menu>
            {isOpenEdit && <ModalUpdateMessage isOpen={isOpenEdit} onClose={() => setIsOpenEdit(false)} message={message} />}
            {isOpenUnsend && <ModalDeleteMessage isOpen={isOpenUnsend} onClose={() => setIsOpenUnsend(false)} message={message} />}
        </>
    );
};

export default MessageMenu;