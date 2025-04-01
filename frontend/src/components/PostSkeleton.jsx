import { Box, Flex, Skeleton, SkeletonCircle } from "@chakra-ui/react";

const PostSkeleton = () => {
    return (
        <Box padding="4">
            <Flex gap={2} alignItems="center" w={"full"}>
                <SkeletonCircle size="10" />
                <Flex gap={2} w={"full"}>
                    <Skeleton height="10px" w={"150px"} />
                    <Skeleton height="10px" w={"100px"} />
                </Flex>
            </Flex>

            <Skeleton height="15px" w={"full"} mt={4} />
            <Skeleton height="15px" w={"90%"} mt={2} />
            <Skeleton height="15px" w={"95%"} mt={2} />

            <Skeleton height="400px" w={"full"} mt={4} borderRadius="md" />

            <Flex gap={3} my={3}>
                <Skeleton height="30px" w={"80px"} />
                <Skeleton height="30px" w={"80px"} />
                <Skeleton height="30px" w={"80px"} />
            </Flex>
        </Box>
    );
};

export default PostSkeleton; 