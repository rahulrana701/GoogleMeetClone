import { selector } from "recoil";
import { roomparticipants } from "../Participants";

export const allparticipants = selector({
  key: "participants",
  get: ({ get }) => {
    const participants = get(roomparticipants);

    return participants;
  },
});
