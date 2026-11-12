export const BUILDING_CONFIG = {
  node: {
    name: "Mycelial Node",
    plural: "Mycelial Nodes",
    cost: 30,
    growth: 0.1,
    costMultiplier: 10,
  },

  network: {
    name: "Hyphal Network",
    plural: "Hyphal Networks",
    cost: 500,
    costMultiplier: 100,
    makes: { node: 0.05 },
  },

  tendril: {
    name: "Rhizomorphic Tendril",
    plural: "Rhizomorphic Tendrils",
    cost: 100000,
    costMultiplier: 1000,
    makes: { network: 0.01 },
  },
};

export const MILESTONE_PURCHASE = {
  every: 10, // purchases per doubling
  multiplier: 2, // output multiplier per milestone
};
