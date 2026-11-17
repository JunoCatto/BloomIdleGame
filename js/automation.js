import {
  isMilestoneMet,
  getAutoHarvestInterval,
  shouldAutoHarvest,
} from "./calculations.js";
import { MILESTONE_CONFIG } from "./milestones.js";
import { game } from "./state.js";
import { harvest } from "./actions.js";

const updateMilestones = () => {
  for (const id in MILESTONE_CONFIG) {
    if (!game.milestones[id] && isMilestoneMet(id)) {
      console.log(`${id} activated!`);
      game.milestones[id] = true;
    }
  }
};

const updateAutoHarvest = (ticksPerSecond) => {
  if (!game.milestones.autoHarvester) return;

  const auto = game.autoHarvest;
  // console.log(auto.timer);

  // Timer begins past harvest threshold
  if (game.colony.isRotting || !shouldAutoHarvest()) {
    auto.timer = 0;
    return;
  }
  auto.timer += 1 / ticksPerSecond;
  if (auto.timer < getAutoHarvestInterval()) return;

  auto.timer = 0;
  if (shouldAutoHarvest()) harvest();
};

export const updateAutomation = (ticksPerSecond) => {
  updateMilestones();
  updateAutoHarvest(ticksPerSecond);
};
