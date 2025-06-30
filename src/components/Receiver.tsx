import { useEffect, useRef } from "react";

export const Receiver = () => {
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        const socket = new WebSocket('https://video-websocketserver.onrender.com');
        socket.onopen = () => {
            socket.send(JSON.stringify({ type: 'receiver' }));
        };
        startReceiving(socket);
    }, []);

    function startReceiving(socket: WebSocket) {
        const pc = new RTCPeerConnection();

        pc.ontrack = (event) => {
            const stream = new MediaStream([event.track]);
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.muted = true;
                videoRef.current.onloadedmetadata = () => {
                    videoRef.current?.play().catch((err) => {
                        console.error("Video play failed", err);
                    });
                };
            }
        };

        socket.onmessage = (event) => {
            const message = JSON.parse(event.data);
            if (message.type === 'createOffer') {
                pc.setRemoteDescription(message.sdp).then(() => {
                    pc.createAnswer().then((answer) => {
                        pc.setLocalDescription(answer);
                        socket.send(JSON.stringify({
                            type: 'createAnswer',
                            sdp: answer
                        }));
                    });
                });
            } else if (message.type === 'iceCandidate') {
                pc.addIceCandidate(message.candidate);
                console.log(message.candidate)
            }
        };
    }

    return (
        <div>
            <h1>Receiver</h1>
            <video ref={videoRef} autoPlay playsInline muted width={400} />
        </div>
    );
};
