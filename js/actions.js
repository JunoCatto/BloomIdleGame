import { getPurchaseQuote } from "./calculations.js";
import {
  getRipeThreshold,
  getHarvestReward,
  getFeedPower,
  canFeed,
  canHarvest,
  canSacrifice,
  getSacrificeStep,
} from "./calculations.js";
import { BUILDING_CONFIG } from "./buildings.js";
import { game, resetColony } from "./state.js";

export const buy = (type, id, quantity = 1) => {
  const { count, cost } = getPurchaseQuote(type, id, quantity);
  if (count === 0 || game.spores < cost) return false;

  game.spores -= cost;
  game.owned[id] += count;
  game.purchased[id] += count;
  return true;
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
  game.colonies++;
  resetColony();
};

export const setAutoHarvestTrigger = (growth) => {
  const ripe = getRipeThreshold();
  const clamped = Math.min(
    Math.max(growth, COLONY_CONFIG.matureThreshold),
    ripe,
  );
  game.autoHarvest.trigger = clamped / ripe;
};

export const sacrifice = () => {
  if (!canSacrifice()) return false;

  const step = getSacrificeStep();
  game.sacrifices[step.building] = (game.sacrifices[step.building] ?? 0) + 1;
  game.sacrificeCount = (game.sacrificeCount ?? 0) + 1;

  for (const id of Object.keys(BUILDING_CONFIG)) {
    game.owned[id] = 0;
    game.purchased[id] = 0;
  }
  game.spores = 0;
  game.colonies = 0;
  game.colony.growth = 0;
  game.fractions = {};
  game.autoHarvest.timer = 0;
  resetColony();
  return true;
};
