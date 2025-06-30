import { useEffect, useState } from "react"

export const Sender = () => {
    const [socket, setSocket] = useState<WebSocket | null>(null);
    // const [pc, setPC] = useState<RTCPeerConnection | null>(null);

    useEffect(() => {
        const socket = new WebSocket('https://video-websocketserver.onrender.com');
        setSocket(socket);
        socket.onopen = () => {
            socket.send(JSON.stringify({
                type: 'sender'
            }));
        }
    }, []);

    const initiateConn = async () => {

        if (!socket) {
            alert("Socket not found");
            return;
        }

        socket.onmessage = async (event) => {
            const message = JSON.parse(event.data);
            if (message.type === 'createAnswer') {
                await pc.setRemoteDescription(message.sdp);
            } else if (message.type === 'iceCandidate') {
                pc.addIceCandidate(message.candidate);
            }
        }

        const pc = new RTCPeerConnection({
            iceServers : [
                {
                    urls: "stun:stun.l.google.com:19302", // Free STUN from Google
                },
                {
                    urls: "turns:global.relay.metered.ca:443?transport=tcp", // Secure TURN (TLS)
                    username: "0ed99389a67a32c6399ce71b",
                    credential: "61K2iL2Bg2Dc/I+U",
                },
            ]
        });

        // setPC(pc);
        pc.onicecandidate = (event) => {
            if (event.candidate) {
                socket?.send(JSON.stringify({
                    type: 'iceCandidate',
                    candidate: event.candidate
                }));
            }
        }

        pc.onnegotiationneeded = async () => {
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            socket?.send(JSON.stringify({
                type: 'createOffer',
                sdp: pc.localDescription
            }));
        }
            
        getCameraStreamAndSend(pc);
    }

    const getCameraStreamAndSend = (pc: RTCPeerConnection) => {
        navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((stream) => {
            const video = document.createElement('video');
            video.srcObject = stream;
            video.muted = false
            video.play().catch(err => console.error("play error",  err));
            // this is wrong, should propogate via a component
            document.body.appendChild(video);
            stream.getTracks().forEach((track) => {
                pc?.addTrack(track);
            });
        });
    }

    return <div>
        Sender
        <button onClick={initiateConn}> Send data </button>
    </div>
}