import React, { useState, useRef, useEffect, useCallback } from "react";
import { Box, Button, Flex, useColorModeValue } from "@chakra-ui/react";

const AudioPlayer = ({ url, onModalClick }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const audioRef = useRef(null);
    const containerRef = useRef(null);
    const animationFrameRef = useRef();

    const waveformData = useRef(
        Array(50)
            .fill(0)
            .map(() => Math.random() * 0.7 + 0.3)
    ).current;

    const bgColor = useColorModeValue("gray.100", "blackAlpha.900");
    const waveformActive = useColorModeValue("black", "white");
    const waveformInactive = useColorModeValue("blackAlpha.300", "whiteAlpha.300");
    const iconColor = useColorModeValue("black", "white");

    const updateTime = useCallback(() => {
        const audio = audioRef.current;
        if (audio && !audio.paused) {
            setCurrentTime(audio.currentTime);
            animationFrameRef.current = requestAnimationFrame(updateTime);
        }
    }, []);

    const handlePlay = useCallback(() => {
        const audio = audioRef.current;
        if (!audio) return;
        audio.play().then(() => {
            setIsPlaying(true);
            animationFrameRef.current = requestAnimationFrame(updateTime);
        }).catch(console.error);
    }, [updateTime]);

    const handlePause = useCallback(() => {
        const audio = audioRef.current;
        if (!audio) return;
        audio.pause();
        setIsPlaying(false);
        cancelAnimationFrame(animationFrameRef.current);
    }, []);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (!entry.isIntersecting && isPlaying) handlePause();
            },
            { threshold: 0.7 }
        );
        if (containerRef.current) observer.observe(containerRef.current);
        return () => observer.disconnect();
    }, [isPlaying, handlePause]);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const onLoaded = () => setDuration(audio.duration || 0);
        const onEnded = () => {
            setIsPlaying(false);
            setCurrentTime(0);
            cancelAnimationFrame(animationFrameRef.current);
        };
        const onError = () => {
            console.error("Audio error.");
            setIsPlaying(false);
        };

        audio.addEventListener("loadedmetadata", onLoaded);
        audio.addEventListener("ended", onEnded);
        audio.addEventListener("error", onError);

        return () => {
            audio.removeEventListener("loadedmetadata", onLoaded);
            audio.removeEventListener("ended", onEnded);
            audio.removeEventListener("error", onError);
            cancelAnimationFrame(animationFrameRef.current);
        };
    }, []);

    const togglePlayPause = useCallback((e) => {
        e.stopPropagation();
        isPlaying ? handlePause() : handlePlay();
    }, [isPlaying, handlePause, handlePlay]);

    const handleWaveformClick = useCallback((e) => {
        e.stopPropagation();
        if (!audioRef.current || !duration) return;
        const bounds = e.currentTarget.getBoundingClientRect();
        const percent = (e.clientX - bounds.left) / bounds.width;
        const time = percent * duration;
        audioRef.current.currentTime = time;
        setCurrentTime(time);
    }, [duration]);

    const handleModalClick = useCallback((e) => {
        if (isPlaying) handlePause();
        onModalClick?.(e);
    }, [isPlaying, handlePause, onModalClick]);

    const progress = duration ? (currentTime / duration) * 100 : 0;

    return (
        <Flex
            ref={containerRef}
            align="center"
            bg={bgColor}
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
                        <Box pos="absolute" w="2px" h="16px" bg={iconColor} left="4px" />
                        <Box pos="absolute" w="2px" h="16px" bg={iconColor} right="4px" />
                    </Box>
                ) : (
                    <Box
                        w="0"
                        h="0"
                        borderTop="8px solid transparent"
                        borderBottom="8px solid transparent"
                        borderLeft={`12px solid ${iconColor}`}
                    />
                )}
            </Button>

            <Box flex="1" h="32px" ml={2} position="relative" onClick={handleWaveformClick}>
                <Flex align="center" h="100%">
                    {waveformData.map((height, i) => (
                        <Box
                            key={i}
                            w="2px"
                            mx="1px"
                            bg={i / waveformData.length * 100 <= progress ? waveformActive : waveformInactive}
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
