import data, { PokemonType } from "@/data/gamemaster.preval";

const { pokemon, fm, cm, typeEffectives, weatherBoosts } = data;

export type WeatherType = keyof typeof weatherBoosts;

export function getWeatherBoostedType(weather: WeatherType) {
  return weatherBoosts[weather];
}

export function getCM(name: string) {
  return cm.find((c) => c.name == name);
}

export function getFM(name: string) {
  return fm.find((f) => f.name == name);
}

export function getMon(name: string) {
  return pokemon.find((p) => p.name === name);
}

export function getTypeMultiplier(
  attackType: PokemonType,
  types: PokemonType[],
) {
  let mult = 1.0;

  const eff = typeEffectives[attackType];

  for (const type of types) {
    mult *= eff[type];
  }

  return mult;
}

export { pokemon, type PokemonType };
