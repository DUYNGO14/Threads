import {
    Flex,
    Box,
    FormControl,
    FormLabel,
    Input,
    InputGroup,
    HStack,
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
import { authScreenAtom } from '../atoms/authAtom';
import useShowToast from '@hooks/useShowToast';

const SignupCard = () => {
    const [state, setState] = useState({
        showPassword: false,
        name: "",
        username: "",
        email: "",
        password: "",
        dob: "",
        isLoading: false,
        passwordStrength: null,
    });
    console.log(state);
    const setAuthScreen = useSetRecoilState(authScreenAtom);
    const showToast = useShowToast();

    const checkPasswordStrength = (password) => {
        const hasUpperCase = /[A-Z]/.test(password);
        const hasLowerCase = /[a-z]/.test(password);
        const hasNumbers = /\d/.test(password);
        const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
        const isLongEnough = password.length > 6;

        if (hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar && isLongEnough) {
            return 4; // Strong
        }
        return 0; // Weak
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setState((prev) => ({ ...prev, [name]: value }));

        if (name === "password") {
            const strength = checkPasswordStrength(value);
            setState((prev) => ({ ...prev, passwordStrength: strength }));
        }
    };

    const toggleShowPassword = () => {
        setState((prev) => ({ ...prev, showPassword: !prev.showPassword }));
    };

    const handleSignup = async () => {
        if (!state.name || !state.username || !state.email || !state.password) {
            console.log(state);
            return showToast("Error", "Please fill all the fields", "error");
        }
        if (state.passwordStrength < 4) {
            return showToast("Error", "Password is too weak. Please use a stronger password.", "error");
        }
        try {
            setState((prev) => ({ ...prev, isLoading: true }));
            const res = await fetch("/api/auth/signup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: state.name.trim(),
                    username: state.username.trim(),
                    email: state.email.trim(),
                    password: state.password.trim(),
                    dob: state.dob.trim(),
                }),
            });

            const data = await res.json();
            if (data.error) throw new Error(data.error);
            localStorage.setItem("email-for-verification", state.email.trim());
            showToast("Success", "Account created! Check your email for OTP.", "success");
            setAuthScreen("verifyOtp");
        } catch (error) {
            showToast("Error", error.message || "Something went wrong", "error");
        } finally {
            setState((prev) => ({ ...prev, isLoading: false }));
        }
    };

    const getPasswordStrengthColor = (score) => {
        return score === 4 ? "green.500" : "red.500";
    };

    return (
        <Flex align={'center'} justify={'center'}>
            <Stack spacing={8} mx={'auto'} maxW={'lg'} py={12} px={6}>
                <Stack align={'center'}>
                    <Heading fontSize={'4xl'}>Sign up</Heading>
                </Stack>
                <Box
                    rounded={'lg'}
                    bg={useColorModeValue('white', 'gray.dark')}
                    boxShadow={'lg'}
                    width={{ base: 'full', md: 'md' }}
                    p={8}
                >
                    <Stack spacing={4}>
                        <HStack>
                            <Box>
                                <FormControl isRequired>
                                    <FormLabel>Full Name</FormLabel>
                                    <Input
                                        type="text"
                                        name="name"
                                        value={state.name}
                                        onChange={handleChange}
                                    />
                                </FormControl>
                            </Box>
                            <Box>
                                <FormControl isRequired>
                                    <FormLabel>Username</FormLabel>
                                    <Input
                                        type="text"
                                        name="username"
                                        value={state.username}
                                        onChange={handleChange}
                                    />
                                </FormControl>
                            </Box>
                        </HStack>
                        <FormControl isRequired>
                            <FormLabel>Email address</FormLabel>
                            <Input
                                type="email"
                                name="email"
                                value={state.email}
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
                            {state.passwordStrength !== null && (
                                <Box mt={2}>
                                    <Text
                                        fontSize="sm"
                                        color={getPasswordStrengthColor(state.passwordStrength)}
                                    >
                                        Strength: {state.passwordStrength === 4 ? "Strong" : "Weak"}
                                    </Text>
                                </Box>
                            )}
                        </FormControl>
                        <FormControl>
                            <FormLabel>Date of Birth</FormLabel>
                            <Input
                                type="date"
                                name="dob"
                                value={state.dob}
                                onChange={handleChange}
                            />
                        </FormControl>
                        <Stack spacing={10} pt={2}>
                            <Button
                                isLoading={state.isLoading}
                                size="lg"
                                bg={useColorModeValue("gray.600", "gray.700")}
                                color={'white'}
                                _hover={{ bg: useColorModeValue("gray.700", "gray.800") }}
                                onClick={handleSignup}
                            >
                                Sign up
                            </Button>
                        </Stack>
                        <Stack pt={6}>
                            <Text align={'center'}>
                                Already a user?{' '}
                                <Link color={'blue.400'} onClick={() => setAuthScreen("login")}>
                                    Login
                                </Link>
                            </Text>
                        </Stack>
                    </Stack>
                </Box>
            </Stack>
        </Flex>
    );
};

export default SignupCard;

