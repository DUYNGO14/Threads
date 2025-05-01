import {
    Box,
    Button,
    Text,
    VStack,
    Heading,
    Divider,
    useColorModeValue,
    Card,
    CardBody,
    CardHeader,
    Icon,
    Alert,
    AlertIcon,
    AlertTitle,
    AlertDescription,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalFooter,
    ModalBody,
    ModalCloseButton,
    useDisclosure,
    Input,
    FormControl,
    FormLabel,
    FormErrorMessage,
} from "@chakra-ui/react";
import useShowToast from "../hooks/useShowToast";
import useLogout from "../hooks/useLogout";
import { useNavigate } from "react-router-dom";
import { MdLock, MdPassword, MdSettings, MdWarning, MdDelete } from "react-icons/md";
import useDebounceSubmit from "../hooks/useDebounceSubmit";
import { useState, useEffect } from "react";
import api from "../services/api.js";
export default function SettingsPage() {
    const showToast = useShowToast();
    const logout = useLogout();
    const navigate = useNavigate();
    const bgColor = useColorModeValue('white', 'gray.dark');
    const borderColor = useColorModeValue('gray.200', 'gray.700');
    const { isOpen: isFreezeModalOpen, onOpen: onFreezeModalOpen, onClose: onFreezeModalClose } = useDisclosure();
    const { isOpen: isDeleteModalOpen, onOpen: onDeleteModalOpen, onClose: onDeleteModalClose } = useDisclosure();
    const [password, setPassword] = useState("");
    const [passwordError, setPasswordError] = useState("");
    const [loginMethod, setLoginMethod] = useState(null);

    useEffect(() => {
        const fetchUserInfo = async () => {
            try {
                const res = await api.get("/api/users/profile/me");
                const data = await res.data;
                if (data.googleId) {
                    setLoginMethod('google');
                } else if (data.facebookId) {
                    setLoginMethod('facebook');
                }
            } catch (error) {
                console.error("Error fetching user info:", error);
            }
        };
        fetchUserInfo();
    }, []);

    const submitFreezeAccount = async () => {
        const res = await api.put("/api/users/freeze", {
            headers: { "Content-Type": "application/json" },
        });
        const data = await res.data;

        if (data.error) {
            return showToast("Error", data.error, "error");
        }
        if (data.success) {
            await logout();
            showToast("Success", "Your account has been frozen", "success");
        }
    };

    const submitDeleteAccount = async () => {
        try {
            // For social login accounts, no password needed
            if (loginMethod === 'google' || loginMethod === 'facebook') {
                const res = await api.post("/api/users/delete", {
                    isSocialLogin: true
                });
                const data = await res.data;

                if (data.error) {
                    return showToast("Error", data.error, "error");
                }
                if (data.success) {
                    await logout();
                    showToast("Success", "Your account has been deleted", "success");
                    navigate("/auth");
                }
                return;
            }

            // For regular accounts, password is required
            if (!password) {
                setPasswordError("Password is required");
                return;
            }

            const res = await api.post("/api/users/delete", {
                password,
                isSocialLogin: false
            });
            const data = await res.data;

            if (data.error) {
                setPasswordError(data.error);
                return;
            }
            if (data.success) {
                await logout();
                showToast("Success", "Your account has been deleted", "success");
                navigate("/auth");
            }
        } catch (error) {
            console.error("Error deleting account:", error);
            showToast("Error", "Failed to delete account", "error");
        }
    };

    const { handleSubmit: handleFreezeAccount, isLoading: isFreezing } = useDebounceSubmit(submitFreezeAccount);
    const { handleSubmit: handleDeleteAccount, isLoading: isDeleting } = useDebounceSubmit(submitDeleteAccount);

    const handleDeleteModalClose = () => {
        setPassword("");
        setPasswordError("");
        onDeleteModalClose();
    };

    const isSocialLogin = loginMethod === 'google' || loginMethod === 'facebook';

    return (
        <Box maxW="container.md" mx="auto" p={4}>
            <VStack spacing={8} align="stretch">
                <Card bg={bgColor} borderWidth="1px" borderColor={borderColor}>
                    <CardHeader textAlign="center" borderBottom="1px" borderColor={borderColor}>
                        <Heading size="md" display="flex" alignItems="center" justifyContent="center" gap={2}>
                            <Icon as={MdSettings} boxSize={6} />
                            Account Management
                        </Heading>
                    </CardHeader>
                    <CardBody>
                        <VStack spacing={6} align="stretch">
                            <Box>
                                <Heading size="sm" mb={2} display="flex" alignItems="center" gap={2}>
                                    <Icon as={MdPassword} />
                                    Password Settings
                                </Heading>
                                <Text color="gray.500" mb={4}>
                                    Change your account password to keep your account secure
                                </Text>
                                <Button
                                    leftIcon={<Icon as={MdLock} />}
                                    colorScheme="blue"
                                    onClick={() => navigate("/change-password")}
                                    isDisabled={isSocialLogin}
                                    title={isSocialLogin ? "Password change is not available for social login accounts" : ""}
                                >
                                    Change Password
                                </Button>
                            </Box>

                            <Divider />

                            <Box>
                                <Heading size="sm" mb={2} color="red.500">
                                    Danger Zone
                                </Heading>
                                <Alert status="warning" variant="subtle" mb={4}>
                                    <AlertIcon />
                                    <Box>
                                        <AlertTitle>Account Actions</AlertTitle>
                                        <AlertDescription>
                                            These actions will affect your account access. Please proceed with caution.
                                        </AlertDescription>
                                    </Box>
                                </Alert>
                                <VStack spacing={3} align="stretch">
                                    <Button
                                        colorScheme="red"
                                        onClick={onFreezeModalOpen}
                                        leftIcon={<Icon as={MdWarning} />}
                                    >
                                        Freeze Account
                                    </Button>
                                    <Button
                                        colorScheme="red"
                                        onClick={onDeleteModalOpen}
                                        leftIcon={<Icon as={MdDelete} />}
                                        variant="outline"
                                    >
                                        Delete Account
                                    </Button>
                                </VStack>
                            </Box>
                        </VStack>
                    </CardBody>
                </Card>
            </VStack>

            {/* Freeze Account Modal */}
            <Modal isOpen={isFreezeModalOpen} onClose={onFreezeModalClose} isCentered>
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader color="red.500">Confirm Account Freezing</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        <VStack spacing={4} align="stretch">
                            <Alert status="warning" variant="subtle">
                                <AlertIcon />
                                <Box>
                                    <AlertTitle>Warning!</AlertTitle>
                                    <AlertDescription>
                                        Are you sure you want to freeze your account? This action will temporarily disable your account, and you will not be able to access it until you unfreeze it by logging in.
                                    </AlertDescription>
                                </Box>
                            </Alert>
                            <Text>
                                This action cannot be undone immediately. You will need to log in again to unfreeze your account.
                            </Text>
                        </VStack>
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="ghost" mr={3} onClick={onFreezeModalClose}>
                            Cancel
                        </Button>
                        <Button
                            colorScheme="red"
                            onClick={() => {
                                handleFreezeAccount();
                                onFreezeModalClose();
                            }}
                            isLoading={isFreezing}
                        >
                            Freeze Account
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            {/* Delete Account Modal */}
            <Modal isOpen={isDeleteModalOpen} onClose={handleDeleteModalClose} isCentered>
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader color="red.500">Confirm Account Deletion</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        <VStack spacing={4} align="stretch">
                            <Alert status="error" variant="subtle">
                                <AlertIcon />
                                <Box>
                                    <AlertTitle>Danger!</AlertTitle>
                                    <AlertDescription>
                                        Are you sure you want to delete your account? This action is permanent and cannot be undone. All your data, posts, and information will be permanently deleted.
                                    </AlertDescription>
                                </Box>
                            </Alert>
                            <Text>
                                This action will permanently delete your account and all associated data. You will not be able to recover your account or data after deletion.
                            </Text>
                            {!isSocialLogin && (
                                <FormControl isInvalid={!!passwordError}>
                                    <FormLabel>Enter your password to confirm</FormLabel>
                                    <Input
                                        type="password"
                                        value={password}
                                        onChange={(e) => {
                                            setPassword(e.target.value);
                                            setPasswordError("");
                                        }}
                                        placeholder="Enter your password"
                                    />
                                    <FormErrorMessage>{passwordError}</FormErrorMessage>
                                </FormControl>
                            )}
                        </VStack>
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="ghost" mr={3} onClick={handleDeleteModalClose}>
                            Cancel
                        </Button>
                        <Button
                            colorScheme="red"
                            onClick={() => {
                                handleDeleteAccount();
                                handleDeleteModalClose();
                            }}
                            isLoading={isDeleting}
                            isDisabled={!isSocialLogin && !password}
                        >
                            Delete Account
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </Box>
    );
};
