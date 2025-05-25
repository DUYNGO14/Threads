import {
    Box,
    Button,
    FormControl,
    FormLabel,
    Input,
    InputGroup,
    InputRightElement,
    Stack,
    Heading,
    Text,
    useColorModeValue,
    Alert,
    AlertIcon,
    AlertTitle,
    AlertDescription,
} from '@chakra-ui/react';
import { useState } from 'react';
import { ViewIcon, ViewOffIcon } from '@chakra-ui/icons';
import { useNavigate } from 'react-router-dom';
import useShowToast from '@hooks/useShowToast';
import { useRecoilValue } from 'recoil';
import userAtom from '../atoms/userAtom';
import useDebounceSubmit from '@hooks/useDebounceSubmit';
import api from "../services/api.js";

const ChangePassword = () => {
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [passwords, setPasswords] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });
    const navigate = useNavigate();
    const showToast = useShowToast();
    const user = useRecoilValue(userAtom);
    const bgColor = useColorModeValue('white', 'gray.dark');

    const isOAuthUser = user?.googleId || user?.facebookId;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setPasswords(prev => ({ ...prev, [name]: value }));
    };

    const submitPasswordChange = async () => {
        if (!passwords.currentPassword || !passwords.newPassword || !passwords.confirmPassword) {
            showToast("Error", "Please fill all the fields", "error");
            return;
        }

        if (passwords.newPassword !== passwords.confirmPassword) {
            showToast("Error", "New passwords do not match", "error");
            return;
        }

        try {
            const res = await api.put('/api/auth/change-password', {
                currentPassword: passwords.currentPassword,
                newPassword: passwords.newPassword,
            });
            showToast("Success", "Password changed successfully", "success");
            navigate('/settings');
        } catch (error) {
            const message = error.response?.data?.error || error.message;
            showToast("Error", message || "Something went wrong", "error");
        }
    };

    const { handleSubmit, isLoading } = useDebounceSubmit(submitPasswordChange);

    if (isOAuthUser) {
        return (
            <Box
                maxW="md"
                mx="auto"
                mt={8}
                p={6}
                rounded="lg"
                bg={bgColor}
                boxShadow="lg"
            >
                <Stack spacing={6}>
                    <Stack align="center">
                        <Heading fontSize="2xl">Change Password</Heading>
                        <Text fontSize="sm" color="gray.500">
                            Password Management
                        </Text>
                    </Stack>

                    <Alert
                        status="info"
                        variant="subtle"
                        flexDirection="column"
                        alignItems="center"
                        justifyContent="center"
                        textAlign="center"
                        height="200px"
                        rounded="md"
                    >
                        <AlertIcon boxSize="40px" mr={0} />
                        <AlertTitle mt={4} mb={1} fontSize="lg">
                            OAuth Account
                        </AlertTitle>
                        <AlertDescription maxWidth="sm">
                            You are currently logged in with {user.googleId ? 'Google' : 'Facebook'}.
                            Password changes are not available for OAuth accounts.
                            To change your password, please use the password management settings in your {user.googleId ? 'Google' : 'Facebook'} account.
                        </AlertDescription>
                    </Alert>

                    <Button
                        colorScheme="blue"
                        size="lg"
                        onClick={() => navigate('/settings')}
                    >
                        Back to Settings
                    </Button>
                </Stack>
            </Box>
        );
    }

    return (
        <Box
            maxW="md"
            mx="auto"
            mt={8}
            p={6}
            rounded="lg"
            bg={bgColor}
            boxShadow="lg"
        >
            <Stack spacing={6}>
                <Stack align="center">
                    <Heading fontSize="2xl">Change Password</Heading>
                    <Text fontSize="sm" color="gray.500">
                        Update your password to keep your account secure
                    </Text>
                </Stack>

                <FormControl isRequired>
                    <FormLabel>Current Password</FormLabel>
                    <InputGroup>
                        <Input
                            type={showCurrentPassword ? 'text' : 'password'}
                            name="currentPassword"
                            value={passwords.currentPassword}
                            onChange={handleChange}
                        />
                        <InputRightElement h="full">
                            <Button
                                variant="ghost"
                                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                            >
                                {showCurrentPassword ? <ViewIcon /> : <ViewOffIcon />}
                            </Button>
                        </InputRightElement>
                    </InputGroup>
                </FormControl>

                <FormControl isRequired>
                    <FormLabel>New Password</FormLabel>
                    <InputGroup>
                        <Input
                            type={showNewPassword ? 'text' : 'password'}
                            name="newPassword"
                            value={passwords.newPassword}
                            onChange={handleChange}
                        />
                        <InputRightElement h="full">
                            <Button
                                variant="ghost"
                                onClick={() => setShowNewPassword(!showNewPassword)}
                            >
                                {showNewPassword ? <ViewIcon /> : <ViewOffIcon />}
                            </Button>
                        </InputRightElement>
                    </InputGroup>
                </FormControl>

                <FormControl isRequired>
                    <FormLabel>Confirm New Password</FormLabel>
                    <InputGroup>
                        <Input
                            type={showConfirmPassword ? 'text' : 'password'}
                            name="confirmPassword"
                            value={passwords.confirmPassword}
                            onChange={handleChange}
                        />
                        <InputRightElement h="full">
                            <Button
                                variant="ghost"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            >
                                {showConfirmPassword ? <ViewIcon /> : <ViewOffIcon />}
                            </Button>
                        </InputRightElement>
                    </InputGroup>
                </FormControl>

                <Button
                    colorScheme="blue"
                    size="md"
                    onClick={handleSubmit}
                    isLoading={isLoading}
                >
                    Change Password
                </Button>
                <Button
                    colorScheme="green"
                    size="md"
                    onClick={() => navigate('/settings')}
                >
                    Back to Settings
                </Button>
            </Stack>
        </Box>
    );
};

export default ChangePassword;

