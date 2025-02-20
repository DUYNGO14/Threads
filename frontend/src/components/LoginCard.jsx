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
} from '@chakra-ui/react';
import { useState } from 'react';
import { ViewIcon, ViewOffIcon } from '@chakra-ui/icons';
import { useSetRecoilState } from 'recoil';
import { useDebouncedCallback } from 'use-debounce';
import authScreenAtom from '../atoms/authAtom';
import useShowToast from '../hooks/useShowToast';
import userAtom from '../atoms/userAtom';

const LoginCard = () => {
    const [state, setState] = useState({
        showPassword: false,
        username: "",
        password: "",
        isLoading: false,
    });

    const setAuthScreen = useSetRecoilState(authScreenAtom);
    const setUser = useSetRecoilState(userAtom);
    const showToast = useShowToast();

    // Debounce input để giảm số lần cập nhật state khi gõ phím
    const debouncedSetInputs = useDebouncedCallback((name, value) => {
        setState((prev) => ({ ...prev, [name]: value }));
    }, 300);

    const handleChange = (e) => {
        const { name, value } = e.target;
        debouncedSetInputs(name, value);
    };

    const toggleShowPassword = () => {
        setState((prev) => ({ ...prev, showPassword: !prev.showPassword }));
    };

    const handleLogin = async () => {
        if (!state.username || !state.password) {
            return showToast("Error", "Please enter username and password", "error");
        }

        try {
            setState((prev) => ({ ...prev, isLoading: true }));
            const res = await fetch("/api/users/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username: state.username.trim(), password: state.password.trim() }),
            });

            const data = await res.json();
            if (data.error) throw new Error(data.error);

            localStorage.setItem("user-threads", JSON.stringify(data));
            setUser(data);
        } catch (error) {
            showToast("Error", error.message || "Something went wrong", "error");
        } finally {
            setState((prev) => ({ ...prev, isLoading: false }));
        }
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
                            <FormLabel>Username</FormLabel>
                            <Input
                                type="text"
                                name="username"
                                defaultValue={state.username}
                                onChange={handleChange}
                            />
                        </FormControl>
                        <FormControl isRequired>
                            <FormLabel>Password</FormLabel>
                            <InputGroup>
                                <Input
                                    type={state.showPassword ? 'text' : 'password'}
                                    name="password"
                                    defaultValue={state.password}
                                    onChange={handleChange}
                                />
                                <InputRightElement h={'full'}>
                                    <Button variant={'ghost'} onClick={toggleShowPassword}>
                                        {state.showPassword ? <ViewIcon /> : <ViewOffIcon />}
                                    </Button>
                                </InputRightElement>
                            </InputGroup>
                        </FormControl>
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
