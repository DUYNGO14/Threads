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
import { useState, useEffect, useRef } from 'react';
import { ViewIcon, ViewOffIcon } from '@chakra-ui/icons';
import { useSetRecoilState } from 'recoil';
import { authScreenAtom } from '../atoms/authAtom';
import useShowToast from '@hooks/useShowToast';
import userAtom from '../atoms/userAtom';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';

const RATE_LIMIT_SECONDS = 60; // thời gian chặn sau khi rate limit

const LoginCard = () => {
    const navigate = useNavigate();
    const [state, setState] = useState({
        showPassword: false,
        emailOrUsername: "",
        password: "",
        isLoading: false,
        isRateLimited: false,
        countdown: RATE_LIMIT_SECONDS,
    });

    const countdownRef = useRef(null);

    const setAuthScreen = useSetRecoilState(authScreenAtom);
    const setUser = useSetRecoilState(userAtom);
    const showToast = useShowToast();

    useEffect(() => {
        if (state.isRateLimited) {
            // Bắt đầu đếm ngược
            countdownRef.current = setInterval(() => {
                setState(prev => {
                    if (prev.countdown <= 1) {
                        clearInterval(countdownRef.current);
                        return { ...prev, isRateLimited: false, countdown: RATE_LIMIT_SECONDS };
                    }
                    return { ...prev, countdown: prev.countdown - 1 };
                });
            }, 1000);
        }
        return () => clearInterval(countdownRef.current);
    }, [state.isRateLimited]);

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
            setState((prev) => ({ ...prev, isLoading: true, isRateLimited: false }));
            const res = await api.post("/api/auth/login", {
                emailOrUsername: state.emailOrUsername.trim(),
                password: state.password.trim(),
            });
            const data = await res.data;
            localStorage.setItem("access-token", data.accessToken);
            setUser(data.user);
            if (data.user.role === "admin") {
                navigate("/admin");
            } else {
                navigate("/");
            }
        } catch (error) {
            if (error.response?.status === 429) {
                showToast(
                    "Error",
                    error.response.data.message || "Too many login attempts. Please wait.",
                    "error"
                );
                setState((prev) => ({ ...prev, isRateLimited: true, countdown: RATE_LIMIT_SECONDS }));
            } else {
                const errorMessage =
                    error.response?.data?.error ||
                    error.message ||
                    "An unexpected error occurred";
                showToast("Error", errorMessage || "Something went wrong", "error");
            }
        } finally {
            setState((prev) => ({ ...prev, isLoading: false }));
        }
    };

    const handleOAuthLogin = (type) => {
        window.open(`/api/auth/${type}`, "_self");
    };

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
                                disabled={state.isRateLimited}
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
                                    disabled={state.isRateLimited}
                                />
                                <InputRightElement h={'full'}>
                                    <Button variant={'ghost'} onClick={toggleShowPassword} disabled={state.isRateLimited}>
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
                                disabled={state.isLoading || state.isRateLimited}
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
                                disabled={state.isRateLimited}
                            >
                                Login with Google
                            </Button>
                            <Button
                                leftIcon={<FaSquareFacebook />}
                                onClick={() => handleOAuthLogin("facebook")}
                                variant="outline"
                                w="full"
                                disabled={state.isRateLimited}
                            >
                                Login with Facebook
                            </Button>
                        </Stack>
                        {state.isRateLimited && (
                            <Text color="red.500" fontWeight="bold" textAlign="center" fontSize={"xs"}>
                                Too many login attempts. Please wait {state.countdown}s before trying again.
                            </Text>
                        )}
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
            </Stack>
        </Flex>
    );
};

export default LoginCard;
