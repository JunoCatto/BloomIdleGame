// Auto Harvest
const NODES_REQUIRED = 5;
// 1st Spore Upgrade
const HARVESTS_REQUIRED = 10;

export const MILESTONE_CONFIG = {
  autoHarvester: {
    name: "Auto Harvester",
    description: `Purchase ${NODES_REQUIRED} Nodes`,
    requirement: (game) => game.purchased.node >= NODES_REQUIRED,
    interval: 10,
    trigger: 0.9,
  },
  abundantSpores: {
    name: "Abundant Spores",
    description: `Harvest ${HARVESTS_REQUIRED} times`,
    requirement: (game) => game.colonies >= HARVESTS_REQUIRED + 1,
    multiplier: 2,
  },
};

export const getSporePerGrowthMultiplier = (game) => {
  let multiplier = 1;

  if (game.milestones.abundantSpores) {
    multiplier *= MILESTONE_CONFIG.abundantSpores.multiplier;
  }

  return multiplier;
};
