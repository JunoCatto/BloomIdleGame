import { gameTick, ticks_per_second } from "./loop.js";
import { buy, feed, harvest, sacrifice } from "./actions.js";
import {
  render,
  feedBtn,
  harvestBtn,
  sacrificeBtn,
  buildingElements,
  upgradeElements,
  purchaseModeButtons,
  setPurchaseMode,
  getPurchaseMode,
} from "./ui.js";
import { saveGame, loadGame } from "./save.js";

// loadGame();
// setInterval(saveGame, 100000);
// // window.addEventListener("pagehide", saveGame);

const bind = (element, action) =>
  element.addEventListener("click", () => {
    action();
    render();
  });

bind(feedBtn, feed);
bind(harvestBtn, harvest);
bind(sacrificeBtn, () => {
  if (window.confirm(
    "Sacrifice all buildings and reset colony growth? Spores, upgrades, and sacrifice boosts will be kept.",
  )) {
    sacrifice();
  }
});

const linkBuyButton = (elementObject, key) => {
  for (const id in elementObject) {
    bind(elementObject[id].buyBtn, () =>
      buy(key, id, getPurchaseMode()),
    );
  }
};

linkBuyButton(buildingElements, "building");
linkBuyButton(upgradeElements, "upgrade");

for (const button of purchaseModeButtons) {
  button.addEventListener("click", () => {
    const value = button.dataset.purchaseMode;
    setPurchaseMode(value === "max" ? "max" : Number(value));
    render();
  });
}

setInterval(gameTick, 1000 / ticks_per_second);
setInterval(render, 100);
render();

// Testing

import { game } from "./state.js";
window.game = game;
