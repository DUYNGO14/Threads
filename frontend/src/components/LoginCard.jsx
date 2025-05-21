import {
    Flex,
    Box,
    FormControl,
    FormLabel,
    Input,
    InputGroup,
    InputRightElement,
    Stack,
    Button,
    Heading,
    Text,
    useColorModeValue,
    Link,
    Divider,
} from '@chakra-ui/react';
import { FcGoogle } from "react-icons/fc";
import { FaSquareFacebook } from "react-icons/fa6";
import { useState } from 'react';
import { ViewIcon, ViewOffIcon } from '@chakra-ui/icons';
import { useSetRecoilState } from 'recoil';
import { useDebouncedCallback } from 'use-debounce';
import { authScreenAtom } from '../atoms/authAtom';
import useShowToast from '@hooks/useShowToast';
import userAtom from '../atoms/userAtom';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';
const LoginCard = () => {
    const navigate = useNavigate();
    const [state, setState] = useState({
        showPassword: false,
        emailOrUsername: "",
        password: "",
        isLoading: false,
    });

    const setAuthScreen = useSetRecoilState(authScreenAtom);
    const setUser = useSetRecoilState(userAtom);
    const showToast = useShowToast();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setState((prev) => ({ ...prev, [name]: value }));
    };

    const toggleShowPassword = () => {
        setState((prev) => ({ ...prev, showPassword: !prev.showPassword }));
    };

    const handleLogin = async () => {
        if (!state.emailOrUsername || !state.password) {
            showToast("Error", "Please enter email and password", "error");
            return;
        }

        try {
            setState((prev) => ({ ...prev, isLoading: true }));
            const res = await api.post("/api/auth/login", {
                emailOrUsername: state.emailOrUsername.trim(),
                password: state.password.trim(),
            });
            const data = await res.data;
            localStorage.setItem("access-token", data.accessToken);
            setUser(data.user);
            await Promise.resolve();
            if (data.user.role === "admin") {
                navigate("/admin");
            } else {
                navigate("/");
            }
        } catch (error) {
            const errorMessage =
                error.response?.data?.error || // Lấy thông báo từ phản hồi API
                error.message || // Lấy thông báo mặc định từ Axios
                "An unexpected error occurred"; // Thông báo mặc định nếu không có thông tin
            showToast("Error", errorMessage || "Something went wrong", "error");
        } finally {
            setState((prev) => ({ ...prev, isLoading: false }));
        }
    };
    const handleOAuthLogin = (type) => {
        window.open(`/api/auth/${type}`, "_self");
    }
    return (
        <Flex align={'center'} justify={'center'}>
            <Stack spacing={8} mx={'auto'} maxW={'lg'} py={12} px={6}>
                <Stack align={'center'}>
                    <Heading fontSize={'4xl'}>Login</Heading>
                </Stack>
                <Box
                    w={{ base: "full", sm: "400px" }}
                    rounded={'lg'}
                    bg={useColorModeValue('white', 'gray.dark')}
                    boxShadow={'lg'}
                    p={8}
                >
                    <Stack spacing={4}>
                        <FormControl isRequired>
                            <FormLabel>Username or Email</FormLabel>
                            <Input
                                type="text"
                                name="emailOrUsername"
                                value={state.emailOrUsername}
                                onChange={handleChange}
                            />
                        </FormControl>
                        <FormControl isRequired>
                            <FormLabel>Password</FormLabel>
                            <InputGroup>
                                <Input
                                    type={state.showPassword ? 'text' : 'password'}
                                    name="password"
                                    value={state.password}
                                    onChange={handleChange}
                                />
                                <InputRightElement h={'full'}>
                                    <Button variant={'ghost'} onClick={toggleShowPassword}>
                                        {state.showPassword ? <ViewIcon /> : <ViewOffIcon />}
                                    </Button>
                                </InputRightElement>
                            </InputGroup>
                        </FormControl>
                        <Text fontSize="sm" color="blue.500" textAlign="right" cursor="pointer" onClick={() => setAuthScreen("forgot-password")}>
                            Forgot Password?
                        </Text>
                        <Stack spacing={10} pt={2}>
                            <Button
                                isLoading={state.isLoading}
                                size="lg"
                                bg={useColorModeValue("gray.600", "gray.700")}
                                color={'white'}
                                _hover={{ bg: useColorModeValue("gray.700", "gray.800") }}
                                onClick={handleLogin}
                            >
                                Login
                            </Button>
                        </Stack>
                        <Box position='relative' my={4}>
                            <Divider />
                            <Box position="absolute" top="50%" left="50%" transform="translate(-50%, -50%)">
                                OR
                            </Box>
                        </Box>
                        <Stack spacing={4}>
                            <Button
                                leftIcon={<FcGoogle />}
                                onClick={() => handleOAuthLogin("google")}
                                variant="outline"
                                w="full"
                            >
                                Login with Google
                            </Button>
                            <Button
                                leftIcon={<FaSquareFacebook />}
                                onClick={() => handleOAuthLogin("facebook")}
                                variant="outline"
                                w="full"
                            >
                                Login with Facebook
                            </Button>
                        </Stack>
                        <Stack pt={6}>
                            <Text align={'center'}>
                                Don&apos;t have an account?{' '}
                                <Link color={'blue.400'} onClick={() => setAuthScreen("signup")}>
                                    Sign Up
                                </Link>
                            </Text>
                        </Stack>

                    </Stack>
                </Box>
            </Stack >
        </Flex >
    );
};

export default LoginCard;