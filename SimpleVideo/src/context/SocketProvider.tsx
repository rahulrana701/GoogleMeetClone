import { ReactNode, createContext, useContext } from "react";
import { io, Socket } from "socket.io-client";

type SocketContextType = Socket | null;

const SocketContext = createContext<SocketContextType | null>(null);
export const UseSocketContext = () => useContext(SocketContext);

interface SocketProviderProps {
  children: ReactNode;
}

export default function SocketProvider({ children }: SocketProviderProps) {
  const socket = io("http://localhost:3000");
  return (
    <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>
  );
}
