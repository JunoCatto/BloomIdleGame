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
  getGrowthReduction,
  getTimeUntilHarvestable,
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

export const getElements = (selector, dataKey) => {
  const elements = {};
  document.querySelectorAll(selector).forEach((element) => {
    const id = element.dataset[dataKey];

    const ownedEl = element.querySelector("[data-owned]");
    const buyBtn = element.querySelector("[data-buy]");

    elements[id] = {
      ownedEl,
      buyBtn,
    };
  });
  return elements;
};

export const upgradeElements = getElements("[data-upgrade]", "upgrade");
export const buildingElements = getElements("[data-building]", "building");

const growthEl = document.getElementById("growth");
const growthBarEl = document.getElementById("growthBar");
const harvestableTimeEl = document.getElementById("harvestableTime");
const ripeTimeEl = document.getElementById("ripeTime");

const growthStageEl = document.getElementById("growthStage");
const growthDescriptionEl = document.getElementById("growthDescription");
const specimenNumber = document.getElementById("specimenNumber");

const rotWarningEl = document.getElementById("rotWarning");

const productionStatsEl = document.getElementById("productionStats");
const productionElements = {};

// Makes sure that button text isn't including in re-rendering
const setButtonText = (button, text) => {
  if (button.textContent !== text) {
    button.textContent = text;
  }
};

const createProductionElements = () => {
  productionStatsEl.innerHTML = "";

  const rates = getProductionRates();
  const resourceNames = Object.keys(rates);

  for (const resource of resourceNames) {
    const element = document.createElement("p");
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
    if (resource === "growth") {
      element.textContent = `Growth: ${production.growth.toFixed(2)}/s (-${(getGrowthReduction() * 100).toFixed(1)}%)`;
      continue;
    }
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

  // Specimen Numbering
  specimenNumber.textContent = `SPECIMEN ${String(game.colonies).padStart(3, "0")} // SYSTEM ONLINE`;

  // ASCII growth bar
  const percentage = game.colony.growth / COLONY_CONFIG.maxGrowth;
  const barLength = Math.max(
    10,
    Math.floor(growthBarEl.parentElement.clientWidth / 15),
  );
  growthBarEl.textContent = asciiBar(percentage, barLength);
  harvestableTimeEl.textContent = formatTime(getTimeUntilHarvestable());
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
  setButtonText(
    harvestBtn,
    `[ Harvest ${formatAmount(getHarvestReward())} spores ] (x${multiplier.toFixed(2)})`,
  );

  // Button Disabling
  harvestBtn.disabled = !canHarvest();
  feedBtn.disabled = !canFeed();
};

export const renderPurchasables = (type, configObject, elementsObject) => {
  for (const [id, config] of Object.entries(configObject)) {
    const elements = elementsObject[id];
    if (!elements) continue;

    const cost = getCost(type, id);
    const count = game.owned[id];

    const ownedName =
      type === "building" && count !== 1 ? config.plural : config.name;
    elements.ownedEl.textContent = `${count} ${ownedName}`;
    setButtonText(
      elements.buyBtn,
      `[ ${config.name} // ${cost} Spores ${type === "building" ? `(${game.purchased[id]})` : ""}  ]`,
    );
    elements.buyBtn.disabled = game.spores < cost;
  }
};
export const render = () => {
  renderProduction();
  renderColony();
  renderPurchasables("building", BUILDING_CONFIG, buildingElements);
  renderPurchasables("upgrade", UPGRADE_CONFIG, upgradeElements);
};
