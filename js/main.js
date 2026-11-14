import { gameTick, ticks_per_second } from "./loop.js";
import { buy, feed, harvest } from "./actions.js";
import {
  render,
  feedBtn,
  harvestBtn,
  buildingElements,
  upgradeElements,
} from "./ui.js";

const bind = (element, action) =>
  element.addEventListener("click", () => {
    action();
    render();
  });

bind(feedBtn, feed);
bind(harvestBtn, harvest);

const linkBuyButton = (elementObject, key) => {
  for (const id in elementObject) {
    bind(elementObject[id].buyBtn, () => buy(key, id));
  }
};

linkBuyButton(buildingElements, "building");
linkBuyButton(upgradeElements, "upgrade");

setInterval(gameTick, 1000 / ticks_per_second);
setInterval(render, 100);
render();

// Testing

import { game } from "./state.js";
window.game = game;
