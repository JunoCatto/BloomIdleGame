import { gameTick, ticks_per_second } from "./loop.js";
import { buy, feed, harvest } from "./actions.js";
import {
  render,
  feedBtn,
  feedPowerBtn,
  harvestBtn,
  buildingElements,
} from "./ui.js";

const bind = (element, action) =>
  element.addEventListener("click", () => {
    action();
    render();
  });

bind(feedBtn, feed);
bind(harvestBtn, harvest);
bind(feedPowerBtn, () => buy("upgrade", "feedPower"));

for (const id in buildingElements) {
  bind(buildingElements[id].buyBtn, () => buy("building", id));
}

setInterval(gameTick, 1000 / ticks_per_second);
setInterval(render, 100);
render();
