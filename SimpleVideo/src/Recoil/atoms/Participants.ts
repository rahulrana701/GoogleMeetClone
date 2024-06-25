import { atom } from "recoil";

type participant = {
  id: string;
  name: string;
};

export const roomparticipants = atom<participant[]>({
  key: "roomparticipants",
  default: [],
});
