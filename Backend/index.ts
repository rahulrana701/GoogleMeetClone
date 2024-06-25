import express from "express";
import http from "http";
import { Server } from "socket.io";

type User = {
  id: string;
  name: string;
};

type Room = {
  users: User[];
};

type Rooms = {
  [key: string]: Room;
};

const rooms: Rooms = {};

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

io.on("connection", (socket) => {
  let roomnumber: string;
  console.log("socket is connected" + socket.id);

  socket.on("user-joined", (data) => {
    const { name, roomno } = data;
    roomnumber = roomno;
    if (!rooms[roomno]) {
      rooms[roomno] = { users: [] };
    }

    const userExists = rooms[roomno].users.includes({ id: socket.id, name });

    if (!userExists) {
      rooms[roomno].users.push({ id: socket.id, name });
      io.to(roomno).emit("new-user-joined", socket.id);
      socket.join(roomno);
      console.log(`User ${socket.id} joined room ${roomno}`);
      io.emit("partcipant-joined", rooms[roomno].users);
    } else {
      console.log(`User ${socket.id} already in room ${roomno}`);
    }
  });

  socket.on("offer", ({ to, offer }) => {
    io.to(to).emit("offer-reply", { Idto: to, from: socket.id, offer });
  });

  socket.on("answer", ({ to, answer }) => {
    io.to(to).emit("answer-reply", { from: socket.id, answer });
  });

  socket.on("new-ice-candidate", (candidate) => {
    socket.to(roomnumber).emit("reply-new-ice-candidate", candidate);
  });

  socket.on("send", ({ message }) => {
    console.log(message);
    const usersArray = rooms[roomnumber].users;
    let name;
    for (let index = 0; index < usersArray.length; index++) {
      if (socket.id === usersArray[index].id) {
        name = usersArray[index].name;
        break;
      }
      console.log("there is no user in the room");
    }
    socket.to(roomnumber).emit("send-reply", {
      messagereply: message,
      name,
    });
  });

  socket.on("disconnect", () => {
    let name2;
    let newleftuserarray;
    console.log("Socket disconnected: " + socket.id);
    const usersArray2 = rooms[roomnumber].users;
    for (let index = 0; index < usersArray2.length; index++) {
      if (socket.id == usersArray2[index].id) {
        name2 = usersArray2[index].name;
        newleftuserarray = rooms[roomnumber].users.filter(
          (user) => user.id != socket.id
        );
        break;
      }
      console.log("no user found");
    }

    socket.to(roomnumber).emit("user-left", { userId: socket.id, name2 });
    socket.to(roomnumber).emit("participant-left", newleftuserarray);
  });
});

const port = 3000;
server.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
