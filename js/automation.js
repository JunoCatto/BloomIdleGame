import { isMilestoneMet } from "./calculations";
import { MILESTONE_CONFIG } from "./milestones";
import { game } from "./state";

const updateMilestones = () => {
  for (const id in MILESTONE_CONFIG) {
    if (!game.milestones[id] && isMilestoneMet(id)) {
      game.milestones[id] = true;
    }
  }
};

const updateAutoHarvest = (ticksPerSecond) => {
  if (!game.milestones.autoHarvester) return;

  const auto = game.autoHarvest;
  auto.timer += 1 / ticksPerSecond;
  if (auto.timer < getAutoHarvestInterval()) return;

  auto.timer = 0;
  if (shouldAutoHarvest()) harvest();
};
