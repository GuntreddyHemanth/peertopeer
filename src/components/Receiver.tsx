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

        navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((stream) => {
            stream.getTracks().forEach((track) => {
                pc?.addTrack(track, stream);
            });
        }).catch((err) => {
            console.error("Failed to get receiver's camera:", err);
        });

        const remoteStream = new MediaStream();

        pc.ontrack = (event) => {
            remoteStream.addTrack(event.track)
            if (videoRef.current) {
                videoRef.current.srcObject = remoteStream;
                videoRef.current.muted = true;
                videoRef.current.onloadedmetadata = () => {
                    videoRef.current?.play().catch((err) => {
                        console.error("Video play failed", err);
                    });
                };
            }
        };

        // pc.ontrack = (event) => {
        //     const [remoteStream] = event.streams;
        //     if (videoRef.current && remoteStream) {
        //         videoRef.current.srcObject = remoteStream;
        //         videoRef.current.muted = true;
        //         videoRef.current.onloadedmetadata = () => {
        //         videoRef.current?.play().catch((err) => {
        //             console.error("Video play failed", err);
        //         });
        //         };
        //     }
        // };

        const pendingCandidates: RTCIceCandidateInit[] = [];
        let remoteDescSet = false;

        socket.onmessage = async (event) => {
        const message = JSON.parse(event.data);

        if (message.type === 'createOffer') {
            console.log(message.sdp);
            await pc.setRemoteDescription(message.sdp);
            remoteDescSet = true;

            // Now safe to create and send answer
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            socket.send(JSON.stringify({
                type: 'createAnswer',
                sdp: answer
            }));

            // Flush any stored ICE candidates
            for (const candidate of pendingCandidates) {
            await pc.addIceCandidate(candidate);
            }
        }

        else if (message.type === 'iceCandidate') {
            if (remoteDescSet) {
            await pc.addIceCandidate(message.candidate);
            } else {
            pendingCandidates.push(message.candidate); // Save for later
            }
            console.log(message.candidate);
        }
    };

    }

    return (
        <div>
            <h1>Receiver</h1>
            <video ref={videoRef} width={400} />
        </div>
    );
};
