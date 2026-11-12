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
    cost: 1000,
    costMultiplier: 100,
    makes: { node: 0.02 },
  },

  tendril: {
    name: "Rhizomorphic Tendril",
    plural: "Rhizomorphic Tendrils",
    cost: 200000,
    costMultiplier: 1000,
    makes: { network: 0.004 },
  },
};

export const MILESTONE = {
  every: 10, // purchases per doubling
  multiplier: 2, // output multiplier per milestone
};
