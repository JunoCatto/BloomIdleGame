export const BUILDING_CONFIG = {
  node: {
    name: "Mycelial Node",
    plural: "Mycelial Nodes",
    cost: 30,
    growth: 0.1,
    costMultiplier: 5,
  },

  network: {
    name: "Hyphal Network",
    plural: "Hyphal Networks",
    cost: 500,
    costMultiplier: 20,
    makes: { node: 0.05 },
  },

  tendril: {
    name: "Rhizomorphic Tendril",
    plural: "Rhizomorphic Tendrils",
    cost: 1000,
    costMultiplier: 100,
    makes: { network: 0.01 },
  },
};

export const MILESTONE_PURCHASE = {
  every: 10, // purchases per doubling
  multiplier: 2, // output multiplier per milestone
};

export const SACRIFICE_STEPS = [
  { building: "node", required: 10, output: "colony growth" },
  { building: "network", required: 5, output: "node production" },
  { building: "tendril", required: 3, output: "network production" },
];
