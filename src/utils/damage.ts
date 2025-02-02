import {
  getTypeMultiplier,
  getWeatherBoostedType,
  PokemonType,
  WeatherType,
} from "@/utils/gamemaster";

export type MaxMove = "D1" | "D2" | "D3" | "G1" | "G2" | "G3";

// https://www.reddit.com/r/TheSilphRoad/comments/1gfjczs/more_indepth_analysis_details_of_max_battles_raids/
const maxMovePower = new Map<MaxMove, number>([
  ["D1", 250],
  ["D2", 300],
  ["D3", 350],
  ["G1", 350],
  ["G2", 400],
  ["G3", 450],
]);

export function getDamange(
  types: PokemonType[],
  attackType: PokemonType,
  attack: number,
  power: number,
  weather: WeatherType,
  enemy_def: number,
  enemy_types: PokemonType[],
) {
  const effectiveness = getTypeMultiplier(attackType, enemy_types);
  const stab = types.includes(attackType) ? 1.2 : 1;
  const weatherBoost = (getWeatherBoostedType(weather) ?? []).includes(
    attackType,
  )
    ? 1.2
    : 1;
  // https://pogo.gamepress.gg/how-calculate-comprehensive-dps
  return (
    Math.floor(
      ((0.5 * attack) / enemy_def) *
        power *
        effectiveness *
        stab *
        weatherBoost,
    ) + 1
  );
}

export function getAttacksTanked(hp: number, damage: number) {
  return Math.ceil(hp / damage);
}

export const getMaxMovePower = (maxMove: MaxMove) =>
  maxMovePower.get(maxMove) ?? 0;
