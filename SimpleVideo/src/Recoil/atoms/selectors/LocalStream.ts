import { selector } from "recoil";
import { localystream } from "../VideoIcons";

export const localstreamstate = selector({
  key: "charCountState",
  get: ({ get }) => {
    const local = get(localystream);

    return local;
  },
});
