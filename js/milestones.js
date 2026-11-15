const NODES_REQUIRED = 10;
export const MILESTONE_CONFIG = {
  autoHarvester: {
    name: "Auto Harvester",
    description: `Purchase ${NODES_REQUIRED} Nodes`,
    requirement: (game) => game.purchased.node >= NODES_REQUIRED,
    interval: 20,
    trigger: 0.9,
  },
};
