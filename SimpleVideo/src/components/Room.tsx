import { Socket } from "socket.io-client";
import { UseSocketContext } from "../context/SocketProvider";
import { useEffect, useRef, useState } from "react";
import logo from "../images/logo2.png";
import micoff from "../images/micoff.png";
import micoon from "../images/micon.png";
import cameraoff from "../images/cameraoff.png";
import cameraon from "../images/cameraon.png";
import screenshare from "../images/screenshare.png";
import { remoteSocketId } from "../Recoil/atoms/SocketId";
import { useRecoilState, useRecoilValue, useSetRecoilState } from "recoil";
import {
  handleaudio1,
  handlecamera1,
  localystream,
} from "../Recoil/atoms/VideoIcons";
import { localstreamstate } from "../Recoil/atoms/selectors/LocalStream";
import chat from "../images/chat.png";
import cross from "../images/cross.png";
import { roomparticipants } from "../Recoil/atoms/Participants";
import { allparticipants } from "../Recoil/atoms/selectors/ParticipantSelector";
import participantimg from "../images/participants.png";

type participant = {
  id: string;
  name: string;
};

interface Configuration {
  iceServers?: any;
}

const configuration: Configuration = {};
let peerConnection: RTCPeerConnection;
(async () => {
  try {
    const response = await fetch(
      `https://rrturnserver.metered.live/api/v1/turn/credentials?apiKey=${
        import.meta.env.VITE_API_KEY
      }`
    );
    if (!response.ok) {
      throw new Error(
        `Failed to fetch TURN server credentials. Status: ${response.status}`
      );
    }
    const iceServers = await response.json();
    configuration.iceServers = iceServers;
    peerConnection = new RTCPeerConnection(configuration);
  } catch (error) {
    console.error("Error fetching TURN server credentials:", error);
  }
})();

// DEVELOPMENT
// const configuration = {
//   iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
// };
// const peerConnection = new RTCPeerConnection(configuration);

export default function Room() {
  const socket = UseSocketContext();

  const setothersocketId = useSetRecoilState(remoteSocketId);
  const [participants, setparticipants] = useRecoilState(roomparticipants);
  const [localStream, setLocalStream] = useRecoilState(localystream);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);

  const getMediaDevices = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });
    stream.getTracks().forEach((track) => {
      peerConnection.addTrack(track, stream);
    });
    setLocalStream(stream);
  };

  const handleFullScreen = (videoElement: HTMLVideoElement | null) => {
    console.log(videoElement);
    if (videoElement) {
      const anyVideoElement = videoElement as any;
      if (videoElement.requestFullscreen) {
        videoElement.requestFullscreen();
      } else if (anyVideoElement.mozRequestFullScreen) {
        anyVideoElement.mozRequestFullScreen();
      } else if (anyVideoElement.webkitRequestFullscreen) {
        anyVideoElement.webkitRequestFullscreen();
      } else if (anyVideoElement.msRequestFullscreen) {
        anyVideoElement.msRequestFullscreen();
      } else {
        console.log("Fullscreen API is not supported.");
      }
    }
  };

  useEffect(() => {
    getMediaDevices();

    socket?.on("new-user-joined", async (socketId) => {
      console.log(socketId + " joined the room");
      setothersocketId(socketId);
      createOffer(socketId);
    });

    const createOffer = async (socketId: Socket) => {
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);
      socket?.emit("offer", { to: socketId, offer });
    };

    socket?.on("partcipant-joined", (name: participant[]) => {
      setparticipants(name);
    });

    socket?.on("offer-reply", async ({ Idto, from, offer }) => {
      setothersocketId(Idto);
      await peerConnection.setRemoteDescription(
        new RTCSessionDescription(offer)
      );

      const otherpeerstream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      otherpeerstream.getTracks().forEach((track) => {
        peerConnection.addTrack(track, otherpeerstream);
      });
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);
      socket?.emit("answer", { to: from, answer });
    });

    socket?.on("answer-reply", async ({ answer }) => {
      await peerConnection.setRemoteDescription(
        new RTCSessionDescription(answer)
      );
    });

    peerConnection.addEventListener("icecandidate", (event) => {
      if (event.candidate) {
        socket?.emit("new-ice-candidate", event.candidate);
      }
    });

    socket?.on("reply-new-ice-candidate", async (candidate) => {
      try {
        await peerConnection.addIceCandidate(candidate);
      } catch (e) {
        console.error("Error adding received ice candidate", e);
      }
    });

    peerConnection.addEventListener("track", (event) => {
      const [remoteStream] = event.streams;
      setRemoteStream(remoteStream);
    });
  }, []);

  useEffect(() => {
    socket?.on("participant-left", (newleftuserarray: participant[]) => {
      console.log(newleftuserarray);
      setparticipants(newleftuserarray);
    });
  }, [socket]);

  const handlecloseparticipants = async () => {
    console.log("clicking");
    const closeparticipants = document.querySelector(
      ".show-participants"
    ) as HTMLElement | null;
    if (closeparticipants) {
      closeparticipants.style.display = "none";
    }
  };

  return (
    <>
      <div className="navbar">
        <img src={logo} alt="" />
      </div>
      <div className="room">
        <div className="participants-section">
          <div className="participants-section-heading">
            <h2>PARTICIPANTS</h2>
            <img
              style={{ right: "-213px" }}
              className="crossimg"
              src={cross}
              onClick={handlecloseparticipants}
            />
          </div>
          <div className="participant-name">
            {participants &&
              participants.map((name, index) => (
                <p className="single-participant-name" key={index}>
                  {name.name}
                </p>
              ))}
          </div>
        </div>
        <div className="video-section">
          <div className="video-section-1">
            {localStream && (
              <video
                id="localvideo"
                autoPlay
                muted
                onClick={() =>
                  handleFullScreen(
                    document.getElementById("localvideo") as HTMLVideoElement
                  )
                }
                playsInline
                ref={(video) => {
                  if (video) video.srcObject = localStream;
                }}
              ></video>
            )}
            {remoteStream && (
              <video
                id="remotevideo"
                autoPlay
                playsInline
                onClick={() =>
                  handleFullScreen(
                    document.getElementById("remotevideo") as HTMLVideoElement
                  )
                }
                ref={(video) => {
                  if (video) video.srcObject = remoteStream;
                }}
              ></video>
            )}
          </div>
          <div className="video-section-2">
            <VideoIcons />
          </div>
        </div>

        <Chatcontainer />
      </div>
    </>
  );
}

function VideoIcons() {
  const [handlingaudio, sethandlingaudio] = useRecoilState(handleaudio1);
  const [handlingcamera, sethandlingcamera] = useRecoilState(handlecamera1);
  const socket = UseSocketContext();
  const localStreamy = useRecoilValue(localstreamstate);

  const handleScreenShare = async () => {
    navigator.mediaDevices
      .getDisplayMedia({ video: { cursor: "always" } as any })
      .then((screenStream) => {
        const screenTrack = screenStream.getTracks()[0];

        const videoSenders = peerConnection
          .getSenders()
          .filter((sender) => sender.track && sender.track.kind === "video");
        if (videoSenders.length > 0) {
          videoSenders[0].replaceTrack(screenTrack);
        }

        screenTrack.onended = async () => {
          if (
            videoSenders.length > 0 &&
            localStreamy &&
            localStreamy.getVideoTracks().length > 0
          ) {
            await videoSenders[0].replaceTrack(
              localStreamy.getVideoTracks()[0]
            );
          }
        };
      });
  };

  const handleaudio = async () => {
    const audioTracks = localStreamy?.getAudioTracks();
    if (audioTracks) {
      audioTracks.forEach((track) => {
        track.enabled = !track.enabled;
        sethandlingaudio(track.enabled);
      });
    }
  };
  const handlecamera = async () => {
    const videoTracks = localStreamy?.getVideoTracks();
    if (videoTracks) {
      videoTracks.forEach((track) => {
        track.enabled = !track.enabled;
        sethandlingcamera(track.enabled);
      });
    }
  };
  const handleshowchat = async () => {
    console.log("clicking");
    const bultra = document.querySelector(".show-chat");
    if (bultra instanceof HTMLElement) {
      if (bultra.style.display == "none") {
        bultra.style.display = "block";
      }
    }

    const b = document.querySelector(".chat-section");
    if (b instanceof HTMLElement) {
      if (b.classList.contains("chat-section")) {
        b.classList.remove("chat-section");
        b.classList.add("show-chat");
      } else {
        b.classList.remove("show-chat");
        b.classList.add("chat-section");
      }
    }

    const b1 = document.querySelector(".chat-section-heading");
    if (b1 instanceof HTMLElement) {
      if (b1?.classList.contains("chat-section-heading")) {
        b1.classList.remove("chat-section-heading");
        b1.classList.add("show-chat-section-heading");
      } else {
        b1.classList.remove("show-chat-section-heading");
        b1.classList.add("chat-section-heading");
      }
    }

    const b2 = document.querySelector(".actual-chat");
    if (b2 instanceof HTMLElement) {
      if (b2?.classList.contains("actual-chat")) {
        b2.classList.remove("actual-chat");
        b2.classList.add("show-actual-chat");
      } else {
        b2.classList.remove("show-actual-chat");
        b2.classList.add("actual-chat");
      }
    }

    const b3 = document.querySelector(".actual-chat-2");
    if (b3 instanceof HTMLElement) {
      if (b3?.classList.contains("actual-chat-2")) {
        b3.classList.remove("actual-chat-2");
        b3.classList.add("show-actual-chat-2");
      } else {
        b3.classList.remove("show-actual-chat-2");
        b3.classList.add("actual-chat-2");
      }
    }

    const b4 = document.querySelector(".chat-section-input");
    if (b4 instanceof HTMLElement) {
      if (b4?.classList.contains("chat-section-input")) {
        b4.classList.remove("chat-section-input");
        b4.classList.add("show-chat-section-input");
      } else {
        b4.classList.remove("show-chat-section-input");
        b4.classList.add("chat-section-input");
      }
    }

    const b5 = document.querySelector(".merainput");
    if (b5 instanceof HTMLElement) {
      if (b5?.classList.contains("merainput")) {
        b5.classList.remove("merainput");
        b5.classList.add("show-merainput");
      } else {
        b5.classList.remove("show-merainput");
        b5.classList.add("merainput");
      }
    }

    const b6 = document.querySelector(".merabutton");
    if (b6 instanceof HTMLElement) {
      if (b6?.classList.contains("merabutton")) {
        b6.classList.remove("merabutton");
        b6.classList.add("show-merabutton");
      } else {
        b6.classList.remove("show-merabutton");
        b6.classList.add("merabutton");
      }
    }
  };

  const handleshowparticipants = async () => {
    const bultra = document.querySelector(".show-participants");
    if (bultra instanceof HTMLElement) {
      if (bultra.style.display == "none") {
        bultra.style.display = "block";
      }
    }

    const a = document.querySelector(".participants-section");
    if (a instanceof HTMLElement) {
      if (a?.classList.contains("participants-section")) {
        a.classList.remove("participants-section");
        a.classList.add("show-participants");
      } else {
        a.classList.remove("show-participants");
        a.classList.add("participants-section");
      }
    }

    const a1 = document.querySelector(".participants-section-heading");
    if (a1 instanceof HTMLElement) {
      if (a1?.classList.contains("participants-section-heading")) {
        a1.classList.remove("participants-section-heading");
        a1.classList.add("show-participants-section-heading");
      } else {
        a1.classList.remove("show-participants-section-heading");
        a1.classList.add("participants-section-heading");
      }
    }

    const a2 = document.querySelector(".participant-name");
    if (a2 instanceof HTMLElement) {
      if (a2?.classList.contains("participant-name")) {
        a2.classList.remove("participant-name");
        a2.classList.add("show-participant-name");
      } else {
        a2.classList.remove("show-participant-name");
        a2.classList.add("participant-name");
      }
    }

    const a3 = document.querySelector(".single-participant-name");
    if (a3 instanceof HTMLElement) {
      if (a3?.classList.contains("single-participant-name")) {
        a3.classList.remove("single-participant-name");
        a3.classList.add("show-single-participant-name");
      } else {
        a3.classList.remove("show-single-participant-name");
        a3.classList.add("single-participant-name");
      }
    }
  };

  return (
    <>
      <img src={handlingaudio ? micoon : micoff} onClick={handleaudio} />
      <img src={handlingcamera ? cameraon : cameraoff} onClick={handlecamera} />
      <img src={screenshare} onClick={handleScreenShare} />
      <img
        src={chat}
        onClick={handleshowchat}
        className="video-section-2-img"
      />
      <img
        src={participantimg}
        onClick={handleshowparticipants}
        className="video-section-2-img"
      />
    </>
  );
}

function Chatcontainer() {
  const messageContainer = useRef<HTMLDivElement>(null);
  const [messageinput, setmessageinput] = useState("");
  const participants = useRecoilValue(allparticipants);
  const socket = UseSocketContext();
  // const setparticipants = useSetRecoilState(roomparticipants);
  const [remoteId, setremotesocketId] = useRecoilState(remoteSocketId);

  const handleSendMessage = () => {
    const message = messageinput;
    appendMessage(`you: ${message}`, "right");
    socket?.emit("send", { message });
    setmessageinput("");
  };

  const appendMessage = (message: string, position: string) => {
    const messageElement = document.createElement("div");
    messageElement.innerText = message;
    messageElement.classList.add("message");
    messageElement.classList.add(position);
    messageContainer?.current?.appendChild(messageElement);
  };
  useEffect(() => {
    socket?.on("send-reply", ({ messagereply, name }) => {
      console.log(messagereply);
      appendMessage(`${name}:${messagereply}`, "left");
    });
  }, [socket]);

  useEffect(() => {
    socket?.on("user-left", ({ userId, name2 }) => {
      appendMessage(`${name2} left the chat`, "left");
      if (remoteId == userId) {
        setremotesocketId(null);
        return;
      }

      const senders = peerConnection.getSenders();
      senders.forEach((sender) => {
        if (sender.track && sender.track.id.includes(userId)) {
          peerConnection.removeTrack(sender);
        }
      });
    });
  }, [socket]);

  const handleclosechat = async () => {
    const closechat = document.querySelector(
      ".show-chat"
    ) as HTMLElement | null;
    if (closechat) {
      closechat.style.display = "none";
    }
  };
  return (
    <>
      <div className="chat-section">
        <div className="chat-section-heading">
          <h2>CHAT SECTION</h2>
          <img className="crossimg" src={cross} onClick={handleclosechat} />
        </div>
        <div className="actual-chat">
          {participants &&
            participants.map((name, index) => (
              <h4 key={index}>{name.name} joined the chat 🎉 🎉</h4>
            ))}
          <div className="actual-chat-2" ref={messageContainer}></div>
        </div>
        <div className="chat-section-input">
          <input
            className="merainput"
            value={messageinput}
            onChange={(e) => {
              setmessageinput(e.target.value);
            }}
            type="text"
            name=""
            placeholder="ENTER YOUR MESSAGE"
          />
          <button className="merabutton" onClick={handleSendMessage}>
            send
          </button>
        </div>
      </div>
    </>
  );
}
