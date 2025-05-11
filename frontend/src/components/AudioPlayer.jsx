import React, { useState, useRef, useEffect, useCallback } from "react";
import { Box, Button, Flex } from "@chakra-ui/react";

const AudioPlayer = ({ url, onModalClick }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const audioRef = useRef(null);
    const containerRef = useRef(null);

    // Giả lập dữ liệu waveform
    const waveformData = useRef(Array(50).fill(0).map(() => Math.random() * 0.7 + 0.3)).current;

    // Hàm dừng audio khi không còn hiển thị
    const pauseAudioWhenNotInView = useCallback(() => {
        const observer = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (!entry.isIntersecting && audioRef.current) {
                    audioRef.current.pause();
                    setIsPlaying(false);
                }
            });
        }, { threshold: 0.7 });

        if (containerRef.current) observer.observe(containerRef.current);
        return observer;
    }, []);

    useEffect(() => {
        const observer = pauseAudioWhenNotInView();
        return () => observer.disconnect();
    }, [pauseAudioWhenNotInView]);

    // Quản lý sự kiện audio
    const setupAudioEvents = useCallback(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const onLoaded = () => setDuration(audio.duration || 0);
        const onTimeUpdate = () => setCurrentTime(audio.currentTime);
        const onEnded = () => {
            setIsPlaying(false);
            setCurrentTime(0);
        };
        const onError = () => {
            console.error("Failed to load audio.");
            setIsPlaying(false);
        };

        audio.addEventListener("loadedmetadata", onLoaded);
        audio.addEventListener("timeupdate", onTimeUpdate);
        audio.addEventListener("ended", onEnded);
        audio.addEventListener("error", onError);

        return () => {
            audio.removeEventListener("loadedmetadata", onLoaded);
            audio.removeEventListener("timeupdate", onTimeUpdate);
            audio.removeEventListener("ended", onEnded);
            audio.removeEventListener("error", onError);
        };
    }, []);

    useEffect(() => {
        const cleanupAudio = setupAudioEvents();
        return cleanupAudio;
    }, [setupAudioEvents]);

    // Xử lý play/pause
    const togglePlayPause = useCallback((e) => {
        e.stopPropagation();
        if (audioRef.current) {
            if (isPlaying) {
                audioRef.current.pause();
            } else {
                audioRef.current.play().catch((error) => {
                    console.error("Error playing audio:", error);
                });
            }
            setIsPlaying(prev => !prev);
        }
    }, [isPlaying]);

    // Xử lý nhấn vào waveform để chuyển thời gian phát
    const handleWaveformClick = useCallback((e) => {
        e.stopPropagation();
        if (audioRef.current) {
            const bounds = e.currentTarget.getBoundingClientRect();
            const x = e.clientX - bounds.left;
            const time = (x / bounds.width) * duration;
            audioRef.current.currentTime = time;
        }
    }, [duration]);

    // Xử lý sự kiện khi nhấn vào modal
    const handleModalClick = useCallback((e) => {
        if (isPlaying && audioRef.current) {
            audioRef.current.pause();
            setIsPlaying(false);
        }
        onModalClick?.(e);
    }, [isPlaying, onModalClick]);

    // Tính tiến trình phát
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
