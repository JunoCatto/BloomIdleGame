import {
  BUILDING_CONFIG,
  MILESTONE_PURCHASE,
  SACRIFICE_STEPS,
} from "./buildings.js";
import { UPGRADE_CONFIG } from "./upgrades.js";
import { game } from "./state.js";
import { COLONY_CONFIG, RIPENESS } from "./colony.js";
import { getSporePerGrowthMultiplier, MILESTONE_CONFIG } from "./milestones.js";

const clamp = (val, min, max) => {
  return Math.max(min, Math.min(val, max));
};

// =======================
// Costs
// =======================
const getConfig = (type, id) =>
  type === "building"
    ? BUILDING_CONFIG[id]
    : type === "upgrade"
      ? UPGRADE_CONFIG[id]
      : null;

const getCostAtPurchase = (config, purchased) => {
  const step = config.costStep ?? 10;
  const costIncrease = Math.floor(purchased / step);
  return Math.ceil(config.cost * Math.pow(config.costMultiplier, costIncrease));
};

export const getCost = (type, id) => {
  const config = getConfig(type, id);
  if (
    !config ||
    game.owned[id] === undefined ||
    game.purchased[id] === undefined
  ) {
    return Infinity;
  }
  return getCostAtPurchase(config, game.purchased[id]);
};

export const getPurchaseQuote = (type, id, quantity) => {
  const config = getConfig(type, id);
  if (
    !config ||
    game.owned[id] === undefined ||
    game.purchased[id] === undefined ||
    (quantity !== "max" && (!Number.isInteger(quantity) || quantity < 1))
  ) {
    return { count: 0, cost: Infinity };
  }

  if (quantity !== "max") {
    let cost = 0;
    for (let count = 0; count < quantity; count++) {
      const nextCost = getCostAtPurchase(config, game.purchased[id] + count);
      if (!Number.isFinite(nextCost) || nextCost <= 0) {
        return { count: quantity, cost: Infinity };
      }
      cost += nextCost;
    }
    return { count: quantity, cost };
  }

  let count = 0;
  let cost = 0;
  while (true) {
    const nextCost = getCostAtPurchase(config, game.purchased[id] + count);
    if (
      !Number.isFinite(nextCost) ||
      nextCost <= 0 ||
      nextCost > game.spores - cost
    ) {
      break;
    }
    cost += nextCost;
    count++;
  }

  return { count, cost };
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

const getReduction = (f) => {
  const reduction =
    COLONY_CONFIG.growthMaxReduction *
    (1 - (1 - f) ** COLONY_CONFIG.growthCurvePower);
  return reduction;
};

export const getGrowthReduction = () => {
  const f = clamp(game.colony.growth / getRipeThreshold(), 0, 1);
  return getReduction(f);
};

export const getGrowthSlowDown = () => 1 - getGrowthReduction();

export const getTimeBetweenGrowth = (startingGrowth, targetGrowth) => {
  if (startingGrowth >= targetGrowth) return 0;

  const passiveGrowth = getPassiveGrowthPerSecond();
  if (passiveGrowth <= 0) return Infinity;

  const segments = 256;
  const growthPerSegment = (targetGrowth - startingGrowth) / segments;
  let elapsed = 0;

  for (let i = 0; i < segments; i++) {
    const growth = startingGrowth + (i + 0.5) * growthPerSegment;
    const fraction = clamp(growth / getRipeThreshold(), 0, 1);
    const slowdown = 1 - getReduction(fraction);

    if (slowdown <= 0) return Infinity;
    elapsed += growthPerSegment / (passiveGrowth * slowdown);
  }

  return elapsed;
};

const getTimeUntilGrowth = (targetGrowth) => {
  if (game.colony.isRotting) return Infinity;
  return getTimeBetweenGrowth(game.colony.growth, targetGrowth);
};

export const getTimeUntilRipe = () => getTimeUntilGrowth(getRipeThreshold());

export const getTimeUntilHarvestable = () => {
  if (canHarvest()) return 0;
  return getTimeUntilGrowth(COLONY_CONFIG.matureThreshold);
};

// =======================
// Harvest
// =======================

// scaling multipler with growth
export const getHarvestMultiplierAt = (growth) => {
  if (growth >= getRipeThreshold()) {
    return COLONY_CONFIG.ripeBonus;
  }

  const minHarvest = COLONY_CONFIG.matureThreshold;
  const ripe = getRipeThreshold();

  if (ripe <= minHarvest) return COLONY_CONFIG.ripeBonus;

  const t = clamp((growth - minHarvest) / (ripe - minHarvest), 0, 1);

  return (
    COLONY_CONFIG.unripeMultiplier +
    (COLONY_CONFIG.ripeBonus - COLONY_CONFIG.unripeMultiplier) *
      t ** COLONY_CONFIG.harvestCurvePower
  );
};

export const getHarvestMultiplier = (stage) => {
  if (stage === RIPENESS.ROTTING) {
    return COLONY_CONFIG.rotPenalty;
  }

  return getHarvestMultiplierAt(game.colony.growth);
};

export const getHarvestReward = () => {
  return (
    game.colony.growth *
    COLONY_CONFIG.sporesPerGrowth *
    getSporePerGrowthMultiplier(game) *
    getHarvestMultiplier(getStage())
  );
};

export const getHarvestRewardAt = (growth) =>
  growth *
  COLONY_CONFIG.sporesPerGrowth *
  getSporePerGrowthMultiplier(game) *
  getHarvestMultiplierAt(growth);

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
        ((rates[target] ?? 0) +
          makes[target] *
            (game.owned[id] ?? 0) *
            getBuildingMultiplier(id) *
            getSacrificeMultiplier(id)) *
        getTempoMultiplier();
    }
  }
  return rates;
};

export const getBuildingGrowthPerSecond = () => {
  let totalGrowth = 0;

  for (const id in BUILDING_CONFIG) {
    const growth = BUILDING_CONFIG[id].growth ?? 0;
    const owned = game.owned[id] ?? 0;

    totalGrowth +=
      growth * owned * getBuildingMultiplier(id) * getSacrificeMultiplier(id);
  }

  return totalGrowth;
};

export const getPassiveGrowthPerSecond = () => {
  return (
    (COLONY_CONFIG.passiveGrowthRate + getBuildingGrowthPerSecond()) *
    getTempoMultiplier()
  );
};

const getGrowthRates = () => {
  if (game.colony.isRotting) {
    return { growth: 0 };
  }
  return {
    growth: getPassiveGrowthPerSecond() * getGrowthSlowDown(),
  };
};

// Combines building rates + growth rates for viewing
export const getProductionRates = () => ({
  // spores: getPassiveProductionPerSecond(),
  ...getGrowthRates(),
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
  const every = BUILDING_CONFIG[id].milestoneEvery ?? MILESTONE_PURCHASE.every;
  return Math.floor(game.purchased[id] / every);
};

export const getBuildingMultiplier = (id) =>
  Math.pow(MILESTONE_PURCHASE.multiplier, getMilestoneCount(id));

// Sacrifices progress (soft reset)

export const getSacrificeMultiplier = (id) =>
  Math.pow(2, game.sacrifices?.[id] ?? 0);

export const getSacrificeStep = () =>
  SACRIFICE_STEPS[
    Math.min(game.sacrificeCount ?? 0, SACRIFICE_STEPS.length - 1)
  ];

export const canSacrifice = () => {
  const step = getSacrificeStep();
  return game.purchased[step.building] >= step.required;
};

export const getPurchasesToMilestone = (id) => {
  const every = BUILDING_CONFIG[id].milestoneEvery ?? MILESTONE_PURCHASE.every;
  return every - (game.purchased[id] % every);
};
// =======================
// Rules
// =======================

export const canFeed = () => getStage() === RIPENESS.UNRIPE;

export const canHarvest = () => {
  const { growth, isRotting } = game.colony;
  if (growth <= 0) return false;
  return isRotting || growth >= COLONY_CONFIG.matureThreshold;
};
// =======================
// Auto Harvester
// =======================

export const isMilestoneMet = (id) => MILESTONE_CONFIG[id].requirement(game);

export const getAutoHarvestInterval = () =>
  MILESTONE_CONFIG.autoHarvester.interval;

export const getAutoHarvestTriggerGrowth = () => {
  return Math.max(
    game.autoHarvest.trigger * getRipeThreshold(),
    COLONY_CONFIG.matureThreshold,
  );
};

export const shouldAutoHarvest = () => {
  return game.colony.growth >= getAutoHarvestTriggerGrowth();
};

// Tempo

export const getTempoMultiplier = () => getTempoBase() ** game.owned.tempo;

const getTempoBase = () => UPGRADE_CONFIG.tempo.speedPerLevel;
