import { getCost } from "./calculations.js";
import {
  getRipeThreshold,
  getHarvestReward,
  getFeedPower,
  canFeed,
  canHarvest,
} from "./calculations.js";
import { game, resetColony } from "./state.js";

export const buy = (type, id) => {
  const cost = getCost(type, id);
  if (game.spores >= cost) {
    game.spores -= cost;
    game.owned[id]++;
    game.purchased[id]++;
    return true;
  }
};
export const feed = () => {
  if (!canFeed()) return;
  game.colony.growth = Math.min(
    game.colony.growth + getFeedPower(),
    getRipeThreshold(),
  );
};

export const harvest = () => {
  if (!canHarvest()) return;
  const reward = getHarvestReward();
  game.spores += reward;
  resetColony();
};
