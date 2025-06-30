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
        const pc = new RTCPeerConnection({
            iceServers: [
                {
                urls: "stun:stun.l.google.com:19302",
                },
                {
                urls: "turns:global.relay.metered.ca:443?transport=tcp",
                username: "0ed99389a67a32c6399ce71b",
                credential: "61K2iL2Bg2Dc/I+U",
                }
            ]
        });


        // pc.ontrack = (event) => {
        //     const stream = new MediaStream([event.track]);
        //     if (videoRef.current) {
        //         videoRef.current.srcObject = stream;
        //         videoRef.current.muted = true;
        //         videoRef.current.onloadedmetadata = () => {
        //             videoRef.current?.play().catch((err) => {
        //                 console.error("Video play failed", err);
        //             });
        //         };
        //     }
        // };

        pc.ontrack = (event) => {
            const [remoteStream] = event.streams;
            if (videoRef.current && remoteStream) {
                videoRef.current.srcObject = remoteStream;
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
                console.log(message.sdp)
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
