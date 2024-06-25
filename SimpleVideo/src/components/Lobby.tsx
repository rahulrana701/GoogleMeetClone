import { useState } from "react";
import { UseSocketContext } from "../context/SocketProvider";
import { useNavigate } from "react-router-dom";
import "../styles/Lobby.css";
import logo from "../images/logo2.png";

export default function Lobby() {
  const navigate = useNavigate();
  const socket = UseSocketContext();
  const [name, setname] = useState("");
  const [roomno, setroomno] = useState("");

  const handleSubmit = () => {
    socket?.emit("user-joined", { name, roomno });
    navigate(`/room/${roomno}`);
  };

  return (
    <>
      <div className="navbar">
        <img src={logo} alt="" />
      </div>
      <div className="main-lobby">
        <form>
          <div className="header">
            <h2>👋 Create or Join Room</h2>
          </div>

          <div className="main-lobby-body">
            <label>Your Name</label>
            <input
              type="text"
              name="name"
              value={name}
              onChange={(e) => {
                setname(e.target.value);
              }}
              required
              placeholder="Enter your display name..."
            />
            <label>Room Name</label>
            <input
              type="text"
              name="room"
              value={roomno}
              onChange={(e) => {
                setroomno(e.target.value);
              }}
              placeholder="Enter room name..."
            />
            <button onClick={handleSubmit}>Go to Room </button>
          </div>
        </form>
      </div>
    </>
  );
}
