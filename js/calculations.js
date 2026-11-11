import { BUILDING_CONFIG, MILESTONE } from "./buildings.js";
import { UPGRADE_CONFIG } from "./upgrades.js";
import { game } from "./state.js";
import { COLONY_CONFIG, RIPENESS } from "./colony.js";

// =======================
// Costs
// =======================
export const getCost = (type, id) => {
  const config =
    type === "building"
      ? BUILDING_CONFIG[id]
      : type === "upgrade"
        ? UPGRADE_CONFIG[id]
        : null;
  if (
    !config ||
    game.owned[id] === undefined ||
    game.purchased[id] === undefined
  ) {
    return Infinity;
  }
  return Math.ceil(
    config.cost * Math.pow(config.costMultiplier, game.purchased[id]),
  );
};

// =======================
// Ripeness
// =======================
export const getStage = () => {
  if (game.colony.isRotting) {
    return RIPENESS.ROTTING;
  }
  if (game.colony.growth < getRipeThreshold()) {
    return RIPENESS.UNRIPE;
  }
  return RIPENESS.RIPE;
};

export const getRipeThreshold = () =>
  Math.min(COLONY_CONFIG.ripeThreshold, COLONY_CONFIG.maxGrowth);

export const getDevelopmentStage = () => {
  const percentage = (game.colony.growth / COLONY_CONFIG.maxGrowth) * 100;

  return COLONY_CONFIG.growthStages.reduce(
    (current, stage) => (percentage >= stage.min ? stage : current),
    COLONY_CONFIG.growthStages[0],
  );
};
export const getTimeUntilRipe = () => {
  if (game.colony.isRotting) return 0;
  const remainingGrowth = getRipeThreshold() - game.colony.growth;
  const growthRate = getPassiveGrowthPerSecond();

  if (remainingGrowth <= 0) return 0;
  if (growthRate <= 0) return Infinity;

  return remainingGrowth / growthRate;
};
// =======================
// Harvest
// =======================
export const getHarvestMultiplier = (stage) => {
  if (stage === RIPENESS.RIPE) return COLONY_CONFIG.ripeBonus;
  if (stage === RIPENESS.ROTTING) return COLONY_CONFIG.rotPenalty;
  return COLONY_CONFIG.unripeMultiplier;
};

export const getHarvestReward = () => {
  return (
    game.colony.growth *
    COLONY_CONFIG.sporesPerGrowth *
    getHarvestMultiplier(getStage())
  );
};

export const getFeedPower = () => {
  return (
    COLONY_CONFIG.feedPower +
    UPGRADE_CONFIG.feedPower.power * game.owned.feedPower
  );
};
// =======================
// Production
// =======================

// Gets the rates for buildings that produce other buildings
export const getMakeRates = () => {
  const rates = {};
  for (const id in BUILDING_CONFIG) {
    const makes = BUILDING_CONFIG[id].makes;
    if (!makes) continue;
    for (const target in makes) {
      rates[target] =
        (rates[target] ?? 0) +
        makes[target] * (game.owned[id] ?? 0) * getBuildingMultiplier(id);
    }
  }
  return rates;
};

export const getBuildingGrowthPerSecond = () => {
  let totalGrowth = 0;

  for (const id in BUILDING_CONFIG) {
    const growth = BUILDING_CONFIG[id].growth ?? 0;
    const owned = game.owned[id] ?? 0;

    totalGrowth += growth * owned;
  }

  return totalGrowth;
};

export const getPassiveGrowthPerSecond = () => {
  return COLONY_CONFIG.passiveGrowthRate + getBuildingGrowthPerSecond();
};

// Combines building rates + growth rates for viewing
export const getProductionRates = () => ({
  spores: getPassiveProductionPerSecond(),
  growth: getPassiveGrowthPerSecond(),
  ...getMakeRates(),
});

// Passive Spore Generation via Buildings
export const getPassiveProductionPerSecond = () => {
  let passiveProduction = 0;

  for (const id in BUILDING_CONFIG) {
    const spores = BUILDING_CONFIG[id].spores ?? 0;
    const owned = game.owned[id] ?? 0;

    passiveProduction += spores * owned * getBuildingMultiplier(id);
  }

  return passiveProduction;
};

//Milestones for buildings purchased
export const getMilestoneCount = (id) => {
  const every = BUILDING_CONFIG[id].milestoneEvery ?? MILESTONE.every;
  return Math.floor(game.purchased[id] / every);
};

export const getBuildingMultiplier = (id) =>
  Math.pow(MILESTONE.multiplier, getMilestoneCount(id));

export const getPurchasesToMilestone = (id) => {
  const every = BUILDING_CONFIG[id].milestoneEvery ?? MILESTONE.every;
  return every - (game.purchased[id] % every);
};
// =======================
// Rules
// =======================

export const canFeed = () => getStage() === RIPENESS.UNRIPE;

export const canHarvest = () => {
  const { growth, isRotting } = game.colony;
  if (growth <= 0) return false;
  return isRotting || growth > COLONY_CONFIG.minimumHarvestThreshold;
};
