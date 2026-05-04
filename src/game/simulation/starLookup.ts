import { Star } from "../types/MapData";

export interface StarLookup {
  getStar(starId: number): Star | undefined;
}
