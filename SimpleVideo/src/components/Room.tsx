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
      `https://rrturnserver.metered.live/api/v1/turn/credentials?apiKey=${process.env.REACT_APP_API_KEY}`
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

  return (
    <>
      <div className="navbar">
        <img src={logo} alt="" />
      </div>
      <div className="room">
        <div className="participants-section">
          <div className="participants-section-heading">
            <h2>PARTICIPANTS</h2>
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
    const a = document.querySelector(".show-chat");
    if (a instanceof HTMLElement) {
      a.style.display = "block";
    }
  };
  const handleshowparticipants = async () => {
    const partici = document.querySelector(".show-participants");
    partici?.classList.toggle("show");
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

      {/* FOR MOBILE USERS */}

      {/* <div className="show-participants">
        <div className="show-participants-border">
          <div className="show-participants-section-heading">
            <h2>PARTICIPANTS</h2>
          </div>
          <div className="show-participant-name">
            {participants.map((name, index) => (
              <p className="show-single-participant-name" key={index}>
                {name.name}
              </p>
            ))}
          </div>
        </div>
      </div> */}

      {/* <div className="show-chat">
        <div className="show-chat-border">
          <div className="show-chat-section-heading">
            <h2>CHAT SECTION</h2>
            <img src={cross} onClick={handleclosechat} />
          </div>
          <div className="show-actual-chat">
            {participants.map((name, index) => (
              <h4 key={index}>{name.name} joined the chat 🎉 🎉</h4>
            ))}
            <div className="show-actual-chat-2" ref={messageContainer}></div>
          </div>
          <div className="show-chat-section-input">
            <input
              className="show-merainput"
              value={messageinput}
              onChange={(e) => {
                setmessageinput(e.target.value);
              }}
              type="text"
              name=""
              placeholder="ENTER YOUR MESSAGE"
            />
            <button className="show-merabutton" onClick={handleSendMessage}>
              send
            </button>
          </div>
        </div>
      </div> */}
    </>
  );
}
