import { COLONY_CONFIG, RIPENESS } from "./colony.js";
import { BUILDING_CONFIG } from "./buildings.js";
import { UPGRADE_CONFIG } from "./upgrades.js";
import { game } from "./state.js";

import { formatAmount, formatTime, capitalize, asciiBar } from "./format.js";

import {
  getCost,
  getStage,
  getDevelopmentStage,
  getHarvestMultiplier,
  getHarvestReward,
  getProductionRates,
  getTimeUntilRipe,
  getPassiveProductionPerSecond,
  canFeed,
  canHarvest,
} from "./calculations.js";

const sporeEl = document.getElementById("spores");
const perSecondEl = document.getElementById("perSecond");

export const feedBtn = document.getElementById("feedBtn");
export const harvestBtn = document.getElementById("harvestBtn");
export const feedPowerBtn = document.getElementById("feedPowerBtn");

export const buildingElements = {};

document.querySelectorAll("[data-building]").forEach((element) => {
  const id = element.dataset.building;

  const ownedEl = element.querySelector("[data-owned]");
  const buyBtn = element.querySelector("[data-buy]");

  buildingElements[id] = {
    ownedEl,
    buyBtn,
  };
});

const growthEl = document.getElementById("growth");
const growthBarEl = document.getElementById("growthBar");
const ripeTimeEl = document.getElementById("ripeTime");

const growthStageEl = document.getElementById("growthStage");
const growthDescriptionEl = document.getElementById("growthDescription");

const rotWarningEl = document.getElementById("rotWarning");

const productionStatsEl = document.getElementById("productionStats");
const productionElements = {};

const createProductionElements = () => {
  productionStatsEl.innerHTML = "";

  const rates = getProductionRates();
  const resourceNames = Object.keys(rates);

  for (const resource of resourceNames) {
    const element = document.createElement("p");
    element.textContent = `${resource}: 0.00/s`;

    productionStatsEl.appendChild(element);
    productionElements[resource] = element;
  }
};

createProductionElements();

export const renderProduction = () => {
  sporeEl.textContent = Math.floor(game.spores);
  const production = getProductionRates();

  // Automatically updating resource monitor
  for (const [resource, element] of Object.entries(productionElements)) {
    element.textContent = `${capitalize(resource)}: ${(production[resource] ?? 0).toFixed(2)}/s`;
  }
  // Building Spore Production
  const pps = getPassiveProductionPerSecond();
  if (perSecondEl) {
    if (!isNaN(pps) && pps !== null) {
      perSecondEl.textContent = pps % 1 === 0 ? pps.toFixed(0) : pps.toFixed(1); // Display 1 decimal place if not an integer
    } else {
      perSecondEl.textContent = "0";
    }
  }
};

export const renderColony = () => {
  growthEl.textContent = game.colony.growth.toFixed(1);
  // Development Text
  const growthStage = getDevelopmentStage();
  growthStageEl.textContent = growthStage.name;
  growthDescriptionEl.textContent = growthStage.description;

  // ASCII growth bar
  const percentage = game.colony.growth / COLONY_CONFIG.maxGrowth;
  const barLength = Math.max(
    10,
    Math.floor(growthBarEl.parentElement.clientWidth / 15),
  );
  growthBarEl.textContent = asciiBar(percentage, barLength);
  // Time until Ripe
  ripeTimeEl.textContent = `${formatTime(getTimeUntilRipe())}`;
  const stage = getStage();
  rotWarningEl.textContent =
    stage === RIPENESS.RIPE
      ? `[ WARNING: COLONY WILL ROT IN ${formatTime(game.colony.ripeTimeRemaining)} ]`
      : stage === RIPENESS.ROTTING
        ? "[ WARNING: COLONY IS ROTTING ]"
        : "";
  // Rot warning
  rotWarningEl.className =
    stage === RIPENESS.ROTTING ? "warning-danger" : "warning-caution";

  // Button Text
  const multiplier = getHarvestMultiplier(stage);
  harvestBtn.textContent = `[ Harvest ${formatAmount(getHarvestReward())} spores ] (x${multiplier.toFixed(1)})`;

  // Button Disabling
  harvestBtn.disabled = !canHarvest();
  feedBtn.disabled = !canFeed();
};

export const renderUpgrades = () => {
  const cost = getCost("upgrade", "feedPower");
  feedPowerBtn.textContent =
    `Upgrade Feeding (+${UPGRADE_CONFIG.feedPower.power}) ` + `(Cost: ${cost})`;

  feedPowerBtn.disabled = game.spores < cost;
};

export const renderBuildings = () => {
  // Adds elements for each building type.
  for (const [id, config] of Object.entries(BUILDING_CONFIG)) {
    const elements = buildingElements[id];
    if (!elements) continue;
    const cost = getCost("building", id);
    const count = game.owned[id];
    elements.ownedEl.textContent = `${count} ${count === 1 ? config.name : config.plural}`;
    elements.buyBtn.textContent = `[ ${config.name} // ${cost} Spores ]`;
    elements.buyBtn.disabled = game.spores < cost;
  }
};

export const render = () => {
  renderProduction();
  renderColony();
  renderUpgrades();
  renderBuildings();
};
