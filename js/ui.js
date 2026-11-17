import { COLONY_CONFIG, RIPENESS } from "./colony.js";
import { BUILDING_CONFIG } from "./buildings.js";
import { UPGRADE_CONFIG } from "./upgrades.js";
import { game } from "./state.js";

import { formatAmount, formatTime, capitalize, asciiBar } from "./format.js";

import {
  getPurchaseQuote,
  getStage,
  getRipeThreshold,
  getDevelopmentStage,
  getHarvestMultiplier,
  getHarvestReward,
  getProductionRates,
  getGrowthReduction,
  getTimeUntilHarvestable,
  getTimeUntilRipe,
  getTimeBetweenGrowth,
  getHarvestRewardAt,
  getBuildingMultiplier,
  getSacrificeMultiplier,
  getSacrificeStep,
  canSacrifice,
  getPassiveProductionPerSecond,
  canFeed,
  canHarvest,
  getAutoHarvestTriggerGrowth,
  getAutoHarvestInterval,
  shouldAutoHarvest,
} from "./calculations.js";

const sporeEl = document.getElementById("spores");
const perSecondEl = document.getElementById("perSecond");

export const feedBtn = document.getElementById("feedBtn");
export const harvestBtn = document.getElementById("harvestBtn");
export const feedPowerBtn = document.getElementById("feedPowerBtn");
export const sacrificeBtn = document.getElementById("sacrificeBtn");
export const purchaseModeButtons = document.querySelectorAll(
  "[data-purchase-mode]",
);

let purchaseMode = 1;

export const setPurchaseMode = (mode) => {
  purchaseMode = mode;
};

export const getPurchaseMode = () => purchaseMode;

export const getElements = (selector, dataKey) => {
  const elements = {};
  document.querySelectorAll(selector).forEach((element) => {
    const id = element.dataset[dataKey];

    const ownedEl = element.querySelector("[data-owned]");
    const buyBtn = element.querySelector("[data-buy]");

    elements[id] = {
      container: element,
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
const harvestPreviewEl = document.getElementById("harvestPreview");

const growthStageEl = document.getElementById("growthStage");
const growthDescriptionEl = document.getElementById("growthDescription");
const specimenNumberEl = document.getElementById("specimenNumber");

const autoHarvestEl = document.getElementById("autoHarvest");
const sacrificeStatusEl = document.getElementById("sacrificeStatus");

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
  specimenNumberEl.textContent = `SPECIMEN ${String(game.colonies).padStart(3, "0")} // SYSTEM ONLINE`;

  // ASCII growth bar
  const percentage = game.colony.growth / COLONY_CONFIG.maxGrowth;
  const barLength = Math.max(
    10,
    Math.floor(growthBarEl.parentElement.clientWidth / 15),
  );
  growthBarEl.textContent = asciiBar(percentage, barLength);
  harvestableTimeEl.textContent = formatTime(getTimeUntilHarvestable());
  ripeTimeEl.textContent = `${formatTime(getTimeUntilRipe())}`;

  // Reward Previewer (I would honestly like this to be placed in a sub-menu or something)
  const matureReward = getHarvestRewardAt(COLONY_CONFIG.matureThreshold);
  const ripeReward = getHarvestRewardAt(getRipeThreshold());
  const extraReward = ripeReward - matureReward;
  const extraWait = getTimeBetweenGrowth(
    COLONY_CONFIG.matureThreshold,
    getRipeThreshold(),
  );
  harvestPreviewEl.textContent = `HARVEST ESTIMATE: MATURE ${formatAmount(matureReward)} SPORES // RIPE ${formatAmount(ripeReward)} SPORES // +${formatAmount(extraReward)} FOR +${formatTime(extraWait)}`;

  // Rot warning
  const stage = getStage();
  rotWarningEl.textContent =
    stage === RIPENESS.RIPE
      ? `[ WARNING: COLONY WILL ROT IN ${formatTime(game.colony.ripeTimeRemaining)} ]`
      : stage === RIPENESS.ROTTING
        ? "[ WARNING: COLONY IS ROTTING ]"
        : "";
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

    const quote = getPurchaseQuote(type, id, purchaseMode);
    const amount = purchaseMode === "max" ? quote.count : purchaseMode;
    const count = game.owned[id];

    const ownedName =
      type === "building" && count !== 1 ? config.plural : config.name;
    elements.ownedEl.textContent = `${count} ${ownedName}`;
    setButtonText(
      elements.buyBtn,
      `[ ${config.name} x${amount} // ${formatAmount(quote.cost)} Spores ${type === "building" ? `(${game.purchased[id]})` : ""} ]`,
    );
    elements.buyBtn.disabled = quote.count === 0 || game.spores < quote.cost;
  }
};

const renderSacrifice = () => {
  const step = getSacrificeStep();
  const config = BUILDING_CONFIG[step.building];
  const purchased = game.purchased[step.building];
  const multiplier =
    getBuildingMultiplier(step.building) *
    getSacrificeMultiplier(step.building);

  sacrificeStatusEl.textContent =
    `NEXT: ${config.name} ${purchased}/${step.required} // ` +
    `SACRIFICE ALL PROGRESS TO BOOST ${step.output.toUpperCase()} ` +
    `FROM x${multiplier} TO x${multiplier * 2}. ` +
    "MILESTONES ARE KEPT.";
  setButtonText(sacrificeBtn, "[ SACRIFICE ALL BUILDINGS ]");
  sacrificeBtn.disabled = !canSacrifice();
};

const renderPurchaseModes = () => {
  for (const button of purchaseModeButtons) {
    const mode =
      button.dataset.purchaseMode === "max"
        ? "max"
        : Number(button.dataset.purchaseMode);
    button.setAttribute("aria-pressed", String(mode === purchaseMode));
  }
};

const renderAutomation = () => {
  if (!game.milestones.autoHarvester) return;

  const remaining = getAutoHarvestInterval() - game.autoHarvest.timer;
  autoHarvestEl.textContent = shouldAutoHarvest()
    ? `[ AUTO HARVESTER: ARMED // HARVESTING IN ${formatTime(remaining)} ]`
    : `[ AUTO HARVESTER: WAITING FOR ${Math.round(getAutoHarvestTriggerGrowth())}% GROWTH ]`;
};
export const render = () => {
  renderProduction();
  renderColony();
  renderPurchasables("building", BUILDING_CONFIG, buildingElements);
  renderPurchasables("upgrade", UPGRADE_CONFIG, upgradeElements);
  renderSacrifice();
  renderPurchaseModes();
  renderAutomation();
};
