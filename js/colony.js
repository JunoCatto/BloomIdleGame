export const RIPENESS = {
  UNRIPE: "Unripe",
  RIPE: "Ripe",
  ROTTING: "Rotting",
};

export const COLONY_CONFIG = {
  maxGrowth: 100,
  ripeThreshold: 100,
  feedPower: 2,
  passiveGrowthRate: 0.2,
  sporesPerGrowth: 0.05,

  unripeMultiplier: 0.5,
  ripeBonus: 2.0,
  rotPenalty: 0.25,

  minimumHarvestThreshold: 50,
  ripeDurationSeconds: 15,
  rotRate: 2,
  growthStages: [
    {
      name: "Dormant",
      min: 0,
      description: "The organism is establishing itself.",
    },
    {
      name: "Developing",
      min: 25,
      description: "Mycelium begins spreading through the substrate.",
    },
    {
      name: "Mature",
      min: 50,
      description: "The colony is developing a dense biological network.",
    },
    {
      name: "Sporulation",
      min: 100,
      description: "The colony is ready to release its spores.",
    },
  ],
};
