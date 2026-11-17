export const RIPENESS = {
  UNRIPE: "Unripe",
  RIPE: "Ripe",
  ROTTING: "Rotting",
};
// Curve configs
// Higher than 1 = back loaded curve
// Lower than 1 = front loaded curve

export const COLONY_CONFIG = {
  maxGrowth: 100,

  feedPower: 2,
  passiveGrowthRate: 2,

  // How far the growth can be reduced by.
  growthMaxReduction: 0.85,
  growthCurvePower: 0.8,

  sporesPerGrowth: 0.3,
  matureThreshold: 75,

  harvestCurvePower: 0.3,

  ripeThreshold: 100,
  unripeMultiplier: 0.5,
  ripeBonus: 2.0,
  rotPenalty: 0.25,
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
      name: "Established",
      min: 50,
      description:
        "The mycelial network has taken hold throughout the substrate.",
    },
    {
      name: "Mature",
      min: 75,
      description: "The colony is developing a dense biological network.",
    },
    {
      name: "Sporulation",
      min: 100,
      description: "The colony is ready to release its spores.",
    },
  ],
};
