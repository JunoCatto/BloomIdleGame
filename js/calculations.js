import { BUILDING_CONFIG, MILESTONE } from "./buildings.js";
import { UPGRADE_CONFIG } from "./upgrades.js";
import { game } from "./state.js";
import { COLONY_CONFIG, RIPENESS } from "./colony.js";
import { harvest } from "./actions.js";

const clamp = (val, min, max) => {
  return Math.max(min, Math.min(val, max));
};

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

  const costIncrease = Math.floor(game.purchased[id] / 10);
  return Math.ceil(config.cost * Math.pow(config.costMultiplier, costIncrease));
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

// Slowdown colony growth as it reaches ripe

export const getGrowthSlowDown = () => {
  const f = clamp(game.colony.growth / getRipeThreshold(), 0, 1);
  const slowDown =
    COLONY_CONFIG.growthFloor +
    (1 - COLONY_CONFIG.growthFloor) * (1 - f) ** COLONY_CONFIG.growthCurvePower;
  return slowDown;
};

// Wrong for now as colony growth scales
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

// scaling multipler with growth

export const getHarvestMultiplier = (stage) => {
  if (stage === RIPENESS.ROTTING) return COLONY_CONFIG.rotPenalty;
  const minHarvest = 0; // Starts scaling from 0
  const ripe = getRipeThreshold();

  if (ripe <= minHarvest) return COLONY_CONFIG.ripeBonus;

  const t = (game.colony.growth - minHarvest) / (ripe - minHarvest);

  const multiplier =
    COLONY_CONFIG.unripeMultiplier +
    (COLONY_CONFIG.ripeBonus - COLONY_CONFIG.unripeMultiplier) *
      clamp(t, 0, 1) ** COLONY_CONFIG.harvestCurvePower;
  return multiplier;
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
const isGrowing = () => {
  let growth;
  if (!game.colony.isRotting) {
    growth = getPassiveGrowthPerSecond() * getGrowthSlowDown();
  } else {
    growth = 0;
  }
  return growth;
};
export const getProductionRates = () => ({
  spores: getPassiveProductionPerSecond(),
  growth: isGrowing(),
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
  return isRotting || growth > COLONY_CONFIG.matureThreshold;
};

export const autoHarvest = () => {
  if (!game.owned["autoHarvest"]) return;

  setInterval(UPGRADE_CONFIG.autoHarvester.interval);
  if (canHarvest) {
    harvest;
  }
};
