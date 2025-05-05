'use client'

import {
    Heading,
    Avatar,
    Box,
    Center,
    Image,
    Flex,
    Text,
    Stack,
    Button,
    useColorModeValue,
} from '@chakra-ui/react'
import { useNavigate } from 'react-router-dom'
export default function SocialProfileWithImage({ user }) {
    const navigate = useNavigate()
    return (
        <Center py={2}>
            <Box
                maxW={'full'}
                w={'full'}
                bg={useColorModeValue('white', 'gray.800')}
                boxShadow={'2xl'}
                rounded={'md'}
                overflow={'hidden'}>
                <Image
                    h={'120px'}
                    w={'full'}
                    src={
                        'https://images.unsplash.com/photo-1612865547334-09cb8cb455da?ixid=MXwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHw%3D&ixlib=rb-1.2.1&auto=format&fit=crop&w=634&q=80'
                    }
                    objectFit="cover"
                    alt="#"
                />
                <Flex justify={'center'} mt={-12}>
                    <Avatar
                        size={'xl'}
                        src={user.profilePic}
                        css={{
                            border: '2px solid white',
                        }}
                        name={user.name}
                    />
                </Flex>

                <Box p={6}>
                    <Stack spacing={0} align={'center'} mb={5}>
                        <Heading fontSize={'2xl'} fontWeight={500} fontFamily={'body'}>
                            {user.name}
                        </Heading>
                        <Text color={'gray.500'}>{user.bio}</Text>
                        <Text color={'gray.500'}>{user.email}</Text>
                    </Stack>

                    <Stack direction={'row'} justify={'center'} spacing={6}>
                        <Stack spacing={0} align={'center'}>
                            <Text fontWeight={600}>{user.followers.length}</Text>
                            <Text fontSize={'sm'} color={'gray.500'}>
                                Followers
                            </Text>
                        </Stack>
                        <Stack spacing={0} align={'center'}>
                            <Text fontWeight={600}>{user.following.length}</Text>
                            <Text fontSize={'sm'} color={'gray.500'}>
                                Following
                            </Text>
                        </Stack>
                    </Stack>

                    <Stack direction={'row'} justify={'center'} spacing={4} mt={4}>
                        {Object.entries(user.socialLinks).map(([platform, url], index) => (
                            <Button key={index} as="a" href={url} target="_blank" colorScheme="teal" size="sm">
                                {platform}
                            </Button>
                        ))}
                    </Stack>
                    <Button
                        w={'full'}
                        mt={2}
                        bg={useColorModeValue('#151f21', 'gray.900')}
                        color={'white'}
                        rounded={'md'}
                        _hover={{
                            transform: 'translateY(-2px)',
                            boxShadow: 'lg',
                        }}
                        onClick={() => navigate(`/user/${user.username}`)}>
                        View user page
                    </Button>
                </Box>
            </Box>
        </Center>
    )
}

