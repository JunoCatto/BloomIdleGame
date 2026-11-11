export const formatAmount = (amount) =>
  Number.isInteger(amount) ? amount.toString() : amount.toFixed(1);

export const formatTime = (seconds) => {
  if (!Number.isFinite(seconds)) return "Never";

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);

  if (minutes > 0) {
    return `${minutes}m ${remainingSeconds}s`;
  }
  return `${remainingSeconds}s`;
};

export const capitalize = (resource) => {
  return resource && resource.charAt(0).toUpperCase() + resource.slice(1);
};

export const asciiBar = (fraction, length) => {
  const clamped = Math.min(Math.max(fraction, 0), 1);
  const filled = Math.floor(clamped * length);
  return `[${"#".repeat(filled)}${".".repeat(length - filled)}]`;
};
