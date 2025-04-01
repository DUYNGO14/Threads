import React, { useState, useRef, useEffect } from 'react';
import { Box, Button, Flex } from '@chakra-ui/react';

const AudioPlayer = ({ url, onModalClick }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const audioRef = useRef(null);
    const containerRef = useRef(null);

    // Generate sample waveform data - in a real app, this would come from audio analysis
    const waveformData = Array(50).fill().map(() => Math.random() * 0.7 + 0.3);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (!entry.isIntersecting && audioRef.current) {
                        audioRef.current.pause();
                        setIsPlaying(false);
                    }
                });
            },
            { threshold: 0.5 }
        );

        if (containerRef.current) {
            observer.observe(containerRef.current);
        }

        return () => {
            if (containerRef.current) {
                observer.unobserve(containerRef.current);
            }
        };
    }, []);

    const togglePlayPause = (e) => {
        e.stopPropagation(); // Prevent modal from opening when clicking play/pause
        if (audioRef.current) {
            if (isPlaying) {
                audioRef.current.pause();
            } else {
                audioRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    };

    const handleWaveformClick = (e) => {
        e.stopPropagation(); // Prevent modal from opening when clicking waveform
        if (audioRef.current) {
            const bounds = e.currentTarget.getBoundingClientRect();
            const x = e.clientX - bounds.left;
            const width = bounds.width;
            const percentage = (x / width) * 100;
            const time = (percentage / 100) * duration;
            audioRef.current.currentTime = time;
        }
    };

    const handleModalClick = (e) => {
        if (isPlaying && audioRef.current) {
            audioRef.current.pause();
            setIsPlaying(false);
        }
        onModalClick(e);
    };

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const setAudioData = () => {
            setDuration(audio.duration);
        };

        const setAudioTime = () => {
            setCurrentTime(audio.currentTime);
        };

        const onEnded = () => {
            setIsPlaying(false);
            setCurrentTime(0);
        };

        const onPause = () => {
            setIsPlaying(false);
        };

        // Add event listeners
        audio.addEventListener('loadeddata', setAudioData);
        audio.addEventListener('timeupdate', setAudioTime);
        audio.addEventListener('ended', onEnded);
        audio.addEventListener('pause', onPause);

        // Cleanup
        return () => {
            audio.pause();
            audio.removeEventListener('loadeddata', setAudioData);
            audio.removeEventListener('timeupdate', setAudioTime);
            audio.removeEventListener('ended', onEnded);
            audio.removeEventListener('pause', onPause);
        };
    }, []);

    // Calculate progress percentage
    const progressPercentage = duration ? (currentTime / duration) * 100 : 0;

    return (
        <Flex
            ref={containerRef}
            align="center"
            bg="blackAlpha.900"
            borderRadius="full"
            p={3}
            w="100%"
            maxW="500px"
            position="relative"
            overflow="hidden"
            onClick={handleModalClick}
            cursor="pointer"
        >
            {/* Audio element (hidden) */}
            <audio ref={audioRef} src={url} preload="metadata" />

            {/* Play/Pause Button */}
            <Button
                variant="unstyled"
                mr={4}
                w="32px"
                h="32px"
                display="flex"
                alignItems="center"
                justifyContent="center"
                onClick={togglePlayPause}
                aria-label={isPlaying ? "Pause" : "Play"}
                _focus={{ outline: 'none' }}
            >
                {isPlaying ? (
                    <Box position="relative" w="16px" h="16px">
                        <Box
                            position="absolute"
                            h="16px"
                            w="2px"
                            bg="white"
                            left="4px"
                        />
                        <Box
                            position="absolute"
                            h="16px"
                            w="2px"
                            bg="white"
                            right="4px"
                        />
                    </Box>
                ) : (
                    <Box
                        position="relative"
                        w="16px"
                        h="16px"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                    >
                        <Box
                            w="0"
                            h="0"
                            borderTop="8px solid transparent"
                            borderBottom="8px solid transparent"
                            borderLeft="12px solid white"
                            ml={1}
                        />
                    </Box>
                )}
            </Button>

            {/* Waveform visualization */}
            <Box
                position="relative"
                h="32px"
                flex="1"
                ml={2}
                onClick={handleWaveformClick}
            >
                <Flex align="center" h="100%" position="relative">
                    {waveformData.map((height, index) => (
                        <Box
                            key={index}
                            mx="1px"
                            w="2px"
                            transition="all 0.2s"
                            bg={index / waveformData.length * 100 <= progressPercentage
                                ? 'white'
                                : 'whiteAlpha.300'
                            }
                            height={`${height * 32}px`}
                        />
                    ))}
                </Flex>
            </Box>
        </Flex>
    );
};

export default AudioPlayer;