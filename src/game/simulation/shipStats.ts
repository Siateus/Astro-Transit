import { Ship } from "../types/AstroTransit";
import { GameConfig } from "../utils/GameConfig";

export function getEffectiveShipSpeed(ship: Ship) {
  const warpBonus = hasEquipment(ship, "warp_mk2") ? GameConfig.WARP_MK2_SPEED_BONUS : 0;
  return Math.max(1, ship.speed * (1 + warpBonus) * (ship.integrity / 100));
}

export function getPirateDamageMultiplier(ship: Ship) {
  return hasEquipment(ship, "reinforced_shields")
    ? 1 - GameConfig.REINFORCED_SHIELDS_DAMAGE_REDUCTION
    : 1;
}

export function getWarpFailureReduction(ship: Ship) {
  return Math.min(
    GameConfig.CREW_MAX_WARP_FAILURE_REDUCTION,
    Math.max(0, ship.flightExperience) / 500
  );
}

function hasEquipment(ship: Ship, equipmentId: string) {
  return ship.equipmentSlots.some((module) => module.id === equipmentId);
}
