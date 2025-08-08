import { atom } from "jotai";

interface LocationData {
  coords: {
    latitude: number;
    longitude: number;
  };
  name: string;
}

// Create the atom to store selected location data
export const selectedLocationAtom = atom<LocationData | null>(null);
export const userIdAtom = atom<number>(-1);
export const apiKeyAtom = atom<string>("");
