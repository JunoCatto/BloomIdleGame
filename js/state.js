import { COLONY_CONFIG } from "./colony.js";
import { BUILDING_CONFIG } from "./buildings.js";
import { UPGRADE_CONFIG } from "./upgrades.js";
import { MILESTONE_CONFIG } from "./milestones.js";

export const game = {
  spores: 0,
  colonies: 0,

  colony: {
    growth: 0,
    isRotting: false,
    ripeTimeRemaining: COLONY_CONFIG.ripeDurationSeconds,
  },

  owned: {
    ...Object.fromEntries(Object.keys(BUILDING_CONFIG).map((id) => [id, 0])),
    ...Object.fromEntries(Object.keys(UPGRADE_CONFIG).map((id) => [id, 0])),
  },

  purchased: {
    ...Object.fromEntries(Object.keys(BUILDING_CONFIG).map((id) => [id, 0])),
    ...Object.fromEntries(Object.keys(UPGRADE_CONFIG).map((id) => [id, 0])),
  },

  fractions: {},

  milestones: Object.fromEntries(
    Object.keys(MILESTONE_CONFIG).map((id) => [id, false]),
  ),
  autoHarvest: { timer: 0, trigger: MILESTONE_CONFIG.autoHarvester },
};

export const resetColony = () => {
  game.colony.growth = 0;
  game.colony.isRotting = false;
  game.colony.ripeTimeRemaining = COLONY_CONFIG.ripeDurationSeconds;
};
