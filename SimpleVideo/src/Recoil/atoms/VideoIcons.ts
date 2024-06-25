import { atom } from "recoil";

export const localystream = atom<MediaStream | null>({
  key: "localystream",
  default: null,
});
export const handleaudio1 = atom({
  key: "handlingaudio",
  default: true,
});

export const handlecamera1 = atom({
  key: "handlingcamera",
  default: true,
});
