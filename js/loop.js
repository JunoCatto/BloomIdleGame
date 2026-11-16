import {
  getRipeThreshold,
  getPassiveGrowthPerSecond,
  getMakeRates,
  getPassiveProductionPerSecond,
  getGrowthSlowDown,
} from "./calculations.js";
import { game, resetColony } from "./state.js";
import { COLONY_CONFIG } from "./colony.js";
import { updateAutomation } from "./automation.js";

//Scaling growth by how full colony is?
const updateColonyGrowth = (ticksPerSecond) => {
  if (game.colony.isRotting) return;

  if (game.colony.growth >= getRipeThreshold()) {
    game.colony.ripeTimeRemaining = Math.max(
      0,
      game.colony.ripeTimeRemaining - 1 / ticksPerSecond,
    );

    if (game.colony.ripeTimeRemaining <= 0) {
      game.colony.isRotting = true;
    }

    return;
  }
  // Growth Slowdown
  const growthGain =
    (getPassiveGrowthPerSecond() * getGrowthSlowDown()) / ticksPerSecond;

  game.colony.growth = Math.min(
    game.colony.growth + growthGain,
    getRipeThreshold(),
  );
};

// Allows buildings to create other buildings
const updateBuildingProduction = (ticksPerSecond) => {
  const rates = getMakeRates();
  for (const target in rates) {
    game.fractions[target] =
      (game.fractions[target] ?? 0) + rates[target] / ticksPerSecond;
    const whole = Math.floor(game.fractions[target]);
    if (whole > 0) {
      game.owned[target] += whole;
      game.fractions[target] -= whole;
    }
  }
};
const updateSporeProduction = (ticksPerSecond) => {
  game.spores += getPassiveProductionPerSecond() / ticksPerSecond;
};
const updateRotting = (ticksPerSecond) => {
  if (!game.colony.isRotting) return;

  game.colony.growth = Math.max(
    0,
    game.colony.growth - COLONY_CONFIG.rotRate / ticksPerSecond,
  );

  if (game.colony.growth === 0) {
    resetColony();
  }
};

export const ticks_per_second = 50;

export const gameTick = () => {
  updateColonyGrowth(ticks_per_second);
  updateRotting(ticks_per_second);
  updateSporeProduction(ticks_per_second);
  updateBuildingProduction(ticks_per_second);
  updateAutomation(ticks_per_second);
};
