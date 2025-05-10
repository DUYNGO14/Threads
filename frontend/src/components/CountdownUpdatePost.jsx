import { MenuItem } from "@chakra-ui/react";
import React, { useEffect, useState, useRef } from "react";

const CountdownUpdatePost = ({ post, handleOpenUpdatePost }) => {
    const createdAt = new Date(post.createdAt).getTime();
    const expireAt = createdAt + 10 * 60 * 1000;

    const [timeLeft, setTimeLeft] = useState(expireAt - Date.now());
    const timeoutRef = useRef(null);

    useEffect(() => {
        const updateCountdown = () => {
            const now = Date.now();
            const remaining = expireAt - now;
            if (remaining <= 0) {
                setTimeLeft(0);
                return;
            }

            setTimeLeft(remaining);
            timeoutRef.current = setTimeout(updateCountdown, 1000); // gọi lại sau 1 giây
        };

        updateCountdown();

        return () => clearTimeout(timeoutRef.current); // clear timeout khi unmount
    }, [expireAt]);

    const formatTime = (ms) => {
        const totalSeconds = Math.floor(ms / 1000);
        const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
        const seconds = String(totalSeconds % 60).padStart(2, "0");
        return `${minutes}:${seconds}`;
    };

    if (timeLeft <= 0) return null;

    return (
        <MenuItem onClick={() => handleOpenUpdatePost(post)}>
            Update Post ({formatTime(timeLeft)})
        </MenuItem>
    );
};

export default CountdownUpdatePost;
