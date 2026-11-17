import { game } from "./state.js";

const SAVE_KEY = "bloomSave";
const SAVE_VERSION = 1; // Use when game is actually in a decent state

export const saveGame = () => {
  try {
    const saveData = {
      game: game,
    };
    localStorage.setItem(SAVE_KEY, JSON.stringify(saveData));
  } catch (error) {
    console.log("Failed to save game", error);
    return false;
  }
};

export const loadGame = () => {
  try {
    const data = localStorage.getItem(SAVE_KEY);
    if (!data) return;
    const saveData = JSON.parse(data);
    Object.assign(game, saveData.game);
  } catch (error) {
    console.log("Failed to load game", error);
    return false;
  }
};
