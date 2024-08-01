const socket = io();
const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');
const roomIdInput = document.getElementById('roomId');
const joinRoomButton = document.getElementById('joinRoom');
const videoOption = document.getElementById('videoOption');
const audioOption = document.getElementById('audioOption');

let localStream;
let peerConnection;
const servers = {
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
};

async function start(roomId, mediaType) {
    const constraints = mediaType === 'video' ? { video: true, audio: false } : { video: false, audio: true };
    localStream = await navigator.mediaDevices.getUserMedia(constraints);

    if (mediaType === 'video') {
        localVideo.srcObject = localStream;
    }

    peerConnection = new RTCPeerConnection(servers);

    localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));

    peerConnection.ontrack = (event) => {
        if (mediaType === 'video') {
            remoteVideo.srcObject = event.streams[0];
        } else {
            remoteVideo.srcObject = null;
        }
    };

    peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
            socket.emit('ice-candidate', { candidate: event.candidate, roomId });
        }
    };

    socket.on('offer', async (offer) => {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);
        socket.emit('answer', { answer, roomId });
    });

    socket.on('answer', async (answer) => {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
    });

    socket.on('ice-candidate', async (candidate) => {
        await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
    });

    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    socket.emit('offer', { offer, roomId });
}

joinRoomButton.addEventListener('click', () => {
    const roomId = roomIdInput.value;
    const mediaType = videoOption.checked ? 'video' : 'audio';

    if (roomId) {
        socket.emit('join-room', roomId);
        start(roomId, mediaType);
    } else {
        alert('Please enter a room ID');
    }
});
