import React, { useState, useRef, useEffect } from "react";
import { Box, Button, Flex } from "@chakra-ui/react";

const AudioPlayer = ({ url, onModalClick }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const audioRef = useRef(null);
    const containerRef = useRef(null);

    const waveformData = useRef(Array(50).fill(0).map(() => Math.random() * 0.7 + 0.3)).current;

    useEffect(() => {
        const observer = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (!entry.isIntersecting && audioRef.current) {
                    audioRef.current.pause();
                    setIsPlaying(false);
                }
            });
        }, { threshold: 0.5 });

        if (containerRef.current) observer.observe(containerRef.current);

        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const onLoaded = () => setDuration(audio.duration || 0);
        const onTimeUpdate = () => setCurrentTime(audio.currentTime);
        const onEnded = () => {
            setIsPlaying(false);
            setCurrentTime(0);
        };

        audio.addEventListener("loadedmetadata", onLoaded);
        audio.addEventListener("timeupdate", onTimeUpdate);
        audio.addEventListener("ended", onEnded);

        return () => {
            audio.pause();
            audio.removeEventListener("loadedmetadata", onLoaded);
            audio.removeEventListener("timeupdate", onTimeUpdate);
            audio.removeEventListener("ended", onEnded);
        };
    }, []);

    const togglePlayPause = (e) => {
        e.stopPropagation();
        if (audioRef.current) {
            if (isPlaying) {
                audioRef.current.pause();
            } else {
                audioRef.current.play();
            }
            setIsPlaying(prev => !prev);
        }
    };

    const handleWaveformClick = (e) => {
        e.stopPropagation();
        if (audioRef.current) {
            const bounds = e.currentTarget.getBoundingClientRect();
            const x = e.clientX - bounds.left;
            const time = (x / bounds.width) * duration;
            audioRef.current.currentTime = time;
        }
    };

    const handleModalClick = (e) => {
        if (isPlaying && audioRef.current) {
            audioRef.current.pause();
            setIsPlaying(false);
        }
        onModalClick?.(e);
    };

    const progress = duration ? (currentTime / duration) * 100 : 0;

    return (
        <Flex
            ref={containerRef}
            align="center"
            bg="blackAlpha.900"
            borderRadius="full"
            p={3}
            w="100%"
            maxW="500px"
            overflow="hidden"
            position="relative"
            onClick={handleModalClick}
            cursor="pointer"
        >
            <audio ref={audioRef} src={url} preload="auto" />
            <Button
                variant="unstyled"
                onClick={togglePlayPause}
                w="32px"
                h="32px"
                mr={3}
                display="flex"
                alignItems="center"
                justifyContent="center"
                aria-label={isPlaying ? "Pause" : "Play"}
            >
                {isPlaying ? (
                    <Box w="16px" h="16px" position="relative">
                        <Box pos="absolute" w="2px" h="16px" bg="white" left="4px" />
                        <Box pos="absolute" w="2px" h="16px" bg="white" right="4px" />
                    </Box>
                ) : (
                    <Box w="0" h="0" borderTop="8px solid transparent" borderBottom="8px solid transparent" borderLeft="12px solid white" />
                )}
            </Button>

            <Box flex="1" h="32px" ml={2} position="relative" onClick={handleWaveformClick}>
                <Flex align="center" h="100%">
                    {waveformData.map((height, i) => (
                        <Box
                            key={i}
                            w="2px"
                            mx="1px"
                            bg={i / waveformData.length * 100 <= progress ? "white" : "whiteAlpha.300"}
                            h={`${height * 32}px`}
                            transition="height 0.2s"
                        />
                    ))}
                </Flex>
            </Box>
        </Flex>
    );
};

export default AudioPlayer;
