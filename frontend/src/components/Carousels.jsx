import { Box, Grid, Image } from '@chakra-ui/react'

const Carousels = ({ medias }) => {
    return (
        <Grid templateColumns="repeat(auto-fit, minmax(150px, 1fr))" gap={2}>
            {medias.map((media, index) => (
                <Box key={index} borderRadius={6} overflow="hidden">
                    {media.type === "image" ? (
                        <Image
                            src={media.url}
                            objectFit="cover"
                            w="100%"
                            h="full"
                            loading="lazy"
                            borderRadius={6}
                        />
                    ) : (
                        <video
                            width="100%"
                            height="auto"
                            autoPlay={index === 0}
                            muted={index === 0}
                            loop
                            playsInline
                            controls
                            preload="metadata"
                            poster={media.thumbnailUrl || undefined}
                            style={{ borderRadius: "6px" }}
                        >
                            <source src={media.url} type="video/mp4" />
                            Your browser does not support the video tag.
                        </video>
                    )}
                </Box>
            ))}
        </Grid>
    )
}

export default Carousels