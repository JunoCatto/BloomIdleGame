export const MILESTONE_CONFIG = {
  autoHarvester: {
    name: "Auto Harvester",
    description: "Purchase 10 Nodes",
    requirement: (game) => game.purchased.node >= 10,
    interval: 0,
  },
};
