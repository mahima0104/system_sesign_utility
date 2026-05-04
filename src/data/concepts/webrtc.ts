import type { ConceptDeepDive } from '../../types';

export const webrtc: ConceptDeepDive = {
  moduleId: 'webrtc',
  tagline: 'Browser-to-browser video, audio, and data — with no server in the middle',

  introduction: {
    layman:
      'Every time you make a Zoom call or a Google Meet video chat, your video and audio travel from your browser directly to the other person\'s browser — not through a central server. This is WebRTC (Web Real-Time Communication). It\'s the technology that lets two browsers establish a direct peer-to-peer connection for video, audio, and arbitrary data. The magic is that it works even when both parties are behind home routers with private IP addresses that can\'t be directly reached from the internet.',
    analogy:
      'Imagine two people in different buildings who want to throw a ball directly to each other. They can\'t throw through walls. They need to go outside first, find out their building addresses, coordinate a meeting point, and then throw directly. WebRTC uses "signaling servers" and "STUN servers" like that coordination step — just enough server involvement to figure out where each browser is and how to reach it. Once they know, the ball (video/data) travels directly between them.',
    whyMatters:
      'WebRTC powers video conferencing, voice calls, live streaming, real-time collaboration, and peer-to-peer file sharing. It\'s built into every modern browser with no plugins. Interviews at companies building communication products (Zoom, Teams, Discord, Clubhouse) heavily test WebRTC concepts. Even backend engineers need to understand signaling architecture, TURN server scaling, and media server design when building these systems.',
  },

  subTopics: [
    {
      title: 'The Three Server Types — Signaling, STUN, and TURN',
      icon: '🖧',
      layman:
        'WebRTC needs three different helper services to set up a direct connection. Signaling: lets the two parties exchange connection information ("here\'s how to reach me"). STUN: helps each party discover their public internet address. TURN: a relay server for when a direct connection is impossible (both parties behind strict firewalls).',
      technical:
        'Signaling server: any bidirectional channel (WebSocket, HTTP) — WebRTC doesn\'t specify the protocol. Used to exchange SDP (Session Description Protocol) offers/answers and ICE candidates. Not in the media path; can be a simple WebSocket relay. STUN (Session Traversal Utilities for NAT): a lightweight server (Google operates public STUN servers at stun.l.google.com:19302) that tells a peer its public IP:port by having it make an outbound UDP request. TURN (Traversal Using Relays around NAT): a relay server that forwards media when peer-to-peer fails (~10–15% of connections, typically symmetric NAT or strict corporate firewalls). TURN traffic can be heavy — video data for 100 users simultaneously might be 500 Mbps.',
      example:
        'Zoom: signaling happens via Zoom\'s WebSocket servers (they control this). STUN happens via standard servers to discover public addresses. For corporate users behind strict firewalls, Zoom falls back to their TURN servers — which is why "Zoom over VPN" can be slow; media is relayed.',
    },
    {
      title: 'The WebRTC Connection Lifecycle — Offer, Answer, ICE',
      icon: '🤝',
      layman:
        'Establishing a WebRTC connection has several steps that happen automatically in the background. One peer makes an "offer" (I want to connect, here\'s what I support). The other responds with an "answer." Meanwhile, both gather "ICE candidates" — possible network paths they can be reached on. They exchange these through the signaling server, and the browsers try each candidate to find the best direct path.',
      technical:
        'Step 1 — Offer/Answer (SDP exchange): Caller creates RTCPeerConnection, calls `createOffer()` → gets SDP blob (codec list, media description, connection params). Sends via signaling to callee. Callee calls `setRemoteDescription(offer)`, `createAnswer()`, sends back via signaling. Both call `setLocalDescription()`. Step 2 — ICE candidate gathering: each peer gathers candidates — local IP, STUN-discovered public IP, TURN relay address. Sends each candidate via signaling as they\'re discovered (trickle ICE). Step 3 — Connectivity checks: both sides do STUN binding requests to each candidate pair to find which paths work. Best working path (lowest latency direct path) is selected. Entire process: typically 1–3 seconds.',
      example:
        'Google Meet connection setup in DevTools: you can see the WebSocket messages containing SDP blobs (~5 KB of codec negotiation text) and ICE candidates like `candidate:udp 1 203.0.113.45 54321 typ srflx` (a STUN-discovered public address). Meet finds the best path and you\'re on a direct UDP connection.',
    },
    {
      title: 'Media — Video, Audio, and Codecs',
      icon: '🎥',
      layman:
        'Once connected, WebRTC sends real-time video and audio. Video is captured from your camera, compressed (encoded) into a codec like VP8 or H.264, packetized into small UDP packets, and sent. The receiving side reassembles the packets and decompresses (decodes) them. This all happens 30 times per second for video.',
      technical:
        'Capture: `navigator.mediaDevices.getUserMedia({video: true, audio: true})` → MediaStream. Encoding: VP8/VP9 (Google codecs, royalty-free), H.264 (hardware-accelerated on most devices, licensed), AV1 (next-gen, better compression). Transport: SRTP (Secure RTP) over UDP — unreliable transport is intentional; a dropped video frame is better than waiting for retransmission. Congestion control: RMCAT/GCC — adjusts bitrate dynamically based on packet loss and round-trip time. Simulcast: send 3 quality tiers simultaneously (low/medium/high); the receiver or SFU (media server) picks the appropriate one. For 1080p at 30fps, typical bandwidth: 2–4 Mbps per stream.',
      example:
        'Discord video calls: when your connection quality drops (packet loss rises), WebRTC\'s congestion control automatically reduces video bitrate from 1080p to 720p to 480p to maintain fluidity over frame quality. This is why Discord video pixelates before it freezes — it\'s doing the right thing.',
    },
    {
      title: 'Data Channels — Peer-to-Peer Arbitrary Data',
      icon: '📦',
      layman:
        'WebRTC isn\'t just for video. Once a peer connection is established, you can open a "data channel" and send arbitrary data — JSON, files, game state, anything — directly between browsers with very low latency, no server involved.',
      technical:
        'RTCDataChannel: built on SCTP (Stream Control Transmission Protocol) over DTLS. Can be configured as ordered/reliable (like TCP) or unordered/unreliable (like UDP). `pc.createDataChannel("chat", {ordered: false, maxRetransmits: 0})` creates an unreliable channel for real-time game state where freshness matters more than reliability. Ordered reliable mode is good for file transfer. Unordered unreliable is ideal for game positions (send current state 30× /second; old state is irrelevant). Max message size: browser-dependent, but generally chunk large transfers to 16 KB.',
      example:
        'Figma\'s multiplayer feature uses WebRTC data channels for cursor sharing between collaborators — your cursor position is sent ~30 times/second with unordered-unreliable delivery since old positions are irrelevant. Vector shape edits use ordered-reliable channels. Combining both modes in one application is a WebRTC data channel superpower.',
      whenToUse:
        'Use data channels when you need peer-to-peer data transfer with lower latency than going through a server, for gaming (game state), collaborative cursors, or file transfers between two users.',
    },
    {
      title: 'Scaling WebRTC — SFUs and MCUs',
      icon: '📈',
      layman:
        'A 1-on-1 WebRTC call is purely peer-to-peer. But a 50-person video conference can\'t be fully peer-to-peer — each participant would need to upload 49 video streams simultaneously. At 2 Mbps each, that\'s 98 Mbps just for video — beyond most home connections. Group calls need a media server.',
      technical:
        'Mesh (pure P2P): each participant connects to every other. N*(N-1)/2 connections. 5 participants = 10 connections, each uploading 4 streams. Works for ≤4 people. SFU (Selective Forwarding Unit): each participant uploads once to the SFU; SFU decides who to forward to whom. No transcoding — just routing. Supports simulcast (receive low-quality for background tiles, high-quality for the active speaker). Bandwidth: upload once, SFU does the fanout. Used by: Zoom, Google Meet, Discord. MCU (Multipoint Control Unit): SFU + mixing — combines all video streams into one composite image on the server side. Receivers download one stream regardless of participant count. Lower bandwidth for receiver; very high server CPU (compositing video is expensive). Used in: some legacy conferencing systems.',
      example:
        'Zoom uses SFU architecture. Your browser uploads one video stream to Zoom\'s SFU servers. The SFU forwards your stream to all other participants. When someone is speaking, the SFU routes their high-quality stream; background participants get lower-quality streams. This is why Zoom can handle 1,000-person webinars — participants\' upstream bandwidth stays constant regardless of audience size.',
    },
  ],

  comparison: {
    caption: 'WebRTC group call architectures',
    columns: ['Architecture', 'Mesh (P2P)', 'SFU', 'MCU'],
    rows: [
      ['How it works', 'Every peer connects to every peer', 'All connect to one server, server forwards', 'All connect to server, server mixes video'],
      ['Max participants', '4–6 before bandwidth issues', '50–1000+', '50–200 (CPU bound)'],
      ['Client upload bandwidth', 'High (upload to N-1 peers)', 'Low (upload once)', 'Low (upload once)'],
      ['Client download bandwidth', 'High (N-1 streams)', 'Medium (per subscription)', 'Low (one composite stream)'],
      ['Server CPU', 'None', 'Low (routing only)', 'Very high (video compositing)'],
      ['Used by', 'Local demos, 1:1 calls', 'Zoom, Meet, Discord', 'Legacy enterprise conferencing'],
    ],
  },

  realWorldExamples: [
    {
      company: 'Zoom',
      icon: '📹',
      description:
        'Zoom uses WebRTC for browser-based meetings and their native client uses similar real-time media transport. Their SFU architecture lets millions of simultaneous meetings run, with each participant uploading once to Zoom\'s media servers. Their infrastructure handles adaptive bitrate, simulcast, and automatic quality adjustment based on each participant\'s network conditions.',
    },
    {
      company: 'Discord',
      icon: '🎮',
      description:
        'Discord\'s voice and video chat is built on WebRTC. Their "Selective Forwarding Unit" servers are geographically distributed — when you join a voice channel, you connect to the closest Discord region server. Data channels handle metadata (who\'s speaking, mute status). WebRTC\'s opus audio codec provides the low-latency, high-quality voice Discord is known for.',
    },
    {
      company: 'Google Meet',
      icon: '🟢',
      description:
        'Google Meet uses WebRTC with their own SFU infrastructure. Being Google, they contributed significantly to WebRTC\'s development and use VP8/VP9 codecs they helped design. Meet automatically adjusts video quality based on network conditions and selectively sends high-quality video only for the active speaker, saving bandwidth in large meetings.',
    },
    {
      company: 'Clubhouse / Twitter Spaces',
      icon: '🎙️',
      description:
        'Audio-only social platforms use WebRTC for real-time audio with very low latency. Speakers and listeners connect via SFU servers. Audio-only means much less bandwidth than video — the Opus codec achieves high-quality voice at 32 Kbps. With thousands of listeners per "room," the SFU architecture is essential — speakers upload once, the SFU fans out to all listeners.',
    },
  ],

  interviewQuestions: [
    {
      question: 'Explain how two browsers establish a WebRTC connection. What is ICE?',
      answer:
        'Connection setup has three phases: (1) Signaling — Peer A creates an SDP "offer" (describing supported codecs and connection parameters) and sends it to Peer B via a signaling server (WebSocket or HTTP). Peer B creates an "answer" and sends back. (2) ICE candidate gathering — each peer discovers all the network paths it can be reached on: local IPs, STUN-discovered public IPs, and TURN relay addresses. These "ICE candidates" are sent through the signaling server. (3) Connectivity checks — both peers systematically test each candidate pair to find which paths work. ICE (Interactive Connectivity Establishment) is the standard that governs this candidate gathering and checking process. The best working path is selected — typically direct UDP if both peers are reachable, falling back to TURN relay if not.',
    },
    {
      question: 'What is the difference between STUN and TURN servers? When does each get used?',
      answer:
        'STUN (Session Traversal Utilities for NAT): a lightweight server that tells a peer its public-facing IP and port by reflecting back what it sees when the peer makes an outbound UDP request. Analogy: asking someone "what does my return address look like from where you are?" Used in ~85–90% of connections to discover public IPs for direct peer-to-peer. Very low bandwidth (one UDP round-trip per peer). TURN (Traversal Using Relays around NAT): a relay server that forwards media when peer-to-peer fails — when both peers are behind strict symmetric NAT or corporate firewalls that block incoming UDP. Used in ~10–15% of connections. High bandwidth (all video/audio relayed through it). Running TURN servers is the main cost of WebRTC infrastructure at scale. Both STUN and TURN server addresses are configured in `RTCConfiguration.iceServers`.',
    },
    {
      question: 'How would you design the architecture for a 1000-person video conference?',
      answer:
        'A mesh P2P approach is impossible — each participant would upload 999 streams (petabytes of bandwidth). Solution: SFU (Selective Forwarding Unit) architecture. (1) Each participant connects to a nearby SFU server (geographically distributed fleet) and uploads one video stream (simulcast: 3 quality levels). (2) The SFU forwards streams selectively — active speaker gets high quality, grid tiles get thumbnail quality. (3) For 1000 people, use a "cascade" topology: regional SFUs connect to a central SFU mesh, so participants in different regions only traverse one inter-region link. (4) Participant management: coordinator service tracks who\'s connected, who\'s speaking, who\'s muted. (5) Recording: SFU sends all streams to a media recorder service. Key trade-offs: SFU scales better than MCU (no video compositing CPU cost), but each receiver must decode N streams (vs MCU\'s one); mitigated by only rendering tiles visible on screen.',
    },
    {
      question: 'WebRTC uses UDP instead of TCP for media. Why? Isn\'t UDP unreliable?',
      answer:
        'UDP\'s "unreliability" is a feature for real-time media. TCP guarantees delivery by retransmitting lost packets — but retransmission takes time. For video/audio, a 200ms-delayed video frame is worse than a missing frame: delayed frames cause jitter and lip-sync issues. A missing frame just causes a brief visual artifact. With UDP, WebRTC implements its own selective retransmission (NACK for important packets) and forward error correction (FEC — sending redundant data so some packet loss doesn\'t require retransmission). Congestion control (RMCAT/GCC) detects network congestion and dynamically reduces bitrate rather than queuing up packets like TCP would. The result: smooth video even with 5–10% packet loss, which TCP\'s buffering would turn into a stuttering mess.',
    },
  ],

  commonMistakes: [
    'Not deploying TURN servers — ~10% of users behind strict firewalls will fail to connect without a TURN relay, appearing as "connection issues" in prod.',
    'Mesh topology for group calls — works fine for demos with 3 people, catastrophically fails at 6+ participants due to upload bandwidth explosion.',
    'Not handling ICE connection state changes — connections can fail mid-call; the app must detect `failed` state and attempt reconnection.',
    'Forgetting to close peer connections on hangup — WebRTC connections hold camera/mic access open; not calling `pc.close()` leaves the browser camera light on.',
    'Not using simulcast for group calls — sending a single high-quality stream means all participants receive full HD even when showing as a tiny thumbnail, wasting bandwidth.',
    'Putting business logic in the signaling server — the signaling server should only relay messages; room state, permissions, and recording decisions belong in separate services.',
  ],

  metrics: [
    { name: 'Typical video bitrate (720p 30fps)', value: '1.5–2.5 Mbps', notes: 'VP8/H.264; adaptive based on conditions' },
    { name: 'Typical audio bitrate (Opus)', value: '32–64 Kbps', notes: 'High quality voice; 32 Kbps is near-transparent' },
    { name: 'ICE connection setup time', value: '0.5–3 seconds', notes: 'Direct path; TURN relay adds 0.5–1s' },
    { name: 'TURN relay usage', value: '10–15%', notes: 'Symmetric NAT, corporate firewalls' },
    { name: 'Audio latency target', value: '< 150 ms', notes: 'Above 300ms feels like satellite delay' },
    { name: 'SFU connections per server (8-core)', value: '500–2000', notes: 'Depends on video resolution and bitrate' },
  ],
};
