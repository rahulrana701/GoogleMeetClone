import { selector } from "recoil";
import { remoteSocketId } from "../SocketId";

export const anotherUserId = selector({
  key: "Ids",
  get: ({ get }) => {
    const remoteSocketIds = get(remoteSocketId);

    return remoteSocketIds;
  },
});
