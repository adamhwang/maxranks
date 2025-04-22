import { BossTier, combineStats, getBossCPM, getCPM } from "./cpm";
import {
  getAttacksTanked,
  getDamange,
  getMaxMovePower,
  MaxMove,
} from "./damage";
import {
  getCM,
  getFM,
  getMon,
  pokemon,
  pokemonTypes,
  Pokemon,
  PokemonType,
  WeatherType,
} from "./gamemaster";

export type BattleConfig = {
  targetedRate: number;
  targetDamageMultiplier: number;
  dodgeRate: number;
  dodgeMultiplier: number;
  trainers: number;
  weather: WeatherType;
};

export const defaultBattleConfig: BattleConfig = {
  targetedRate: 0.5,
  targetDamageMultiplier: 2,
  dodgeRate: 1,
  dodgeMultiplier: 0.5,
  trainers: 4,
  weather: "Extreme",
};

export type PokeStats = {
  name: string;
  level: number;
  iv: [attack: number, defense: number, stamina: number];
  maxMove: MaxMove;
};

export const getAllPokemon = () =>
  pokemon.flatMap((p) => {
    const stats: PokeStats[] = [];
    if (p.dmax) {
      stats.push({
        name: p.name,
        level: 40,
        iv: [15, 15, 15],
        maxMove: "D3",
      });
    }
    if (p.gmax) {
      stats.push({
        name: p.name,
        level: 40,
        iv: [15, 15, 15],
        maxMove: "G3",
      });
    }
    return stats;
  });

export const rankAllPokemon = () => {
  const allPokemon = getAllPokemon();
  return generateBosses().flatMap((boss) =>
    rankPokemon(allPokemon, boss, "G6", defaultBattleConfig),
  );
};

export const rankPokemon = (
  myPokemon: PokeStats[],
  boss: Pokemon | string,
  bossTier: BossTier,
  settings: BattleConfig,
) => {
  const bossMon = typeof boss === "string" ? getMon(boss) : boss;
  if (!bossMon) {
    throw `Unkonwn pokemon: ${boss}`;
  }
  const bossCPM = getBossCPM(bossTier);
  if (!bossCPM) {
    throw `Unkonwn max battle tier: ${bossTier}`;
  }

  // https://www.reddit.com/r/TheSilphRoad/comments/1ier5h0/new_year_new_bugs_discoveries_on_combat_mechanics/
  const baseAttackRate =
    bossTier == "G6" ? 3000 + 2000 * settings.targetedRate : 10000;

  const bossCMs = (bossMon.chargeMoves ?? [])
    .map((cm) => getCM(cm))
    .filter((cm) => !!cm);
  const bossStats = combineStats(bossMon.stats, [15, 15, 15], bossCPM);

  const ranks = myPokemon
    .map((my) => {
      const mon = getMon(my.name);
      if (!mon) {
        throw `Unkonwn Pokemon: ${my.name}`;
      }

      const cpm = getCPM(my.level);
      if (!cpm) {
        throw `Unkonwn level: ${my.level}`;
      }
      const { attack, defense, stamina } = combineStats(mon.stats, my.iv, cpm);

      const cp = Math.max(
        10,
        Math.floor(
          (attack * Math.pow(defense, 0.5) * Math.pow(stamina, 0.5)) / 10,
        ),
      );
      const hp = Math.floor(stamina);

      const fms = (mon.fastMoves ?? [])
        .map((fm) => getFM(fm))
        .filter((fm) => !!fm);
      return fms.map((fm) => {
        const maxType = my.maxMove.startsWith("G") ? mon.gmaxMoveType : fm.type;
        if (!maxType) return;

        const maxPower = getMaxMovePower(my.maxMove);
        if (!maxPower) return;

        const mmDamage = getDamange(
          mon.types as PokemonType[],
          maxType as PokemonType,
          attack,
          maxPower,
          settings.weather,
          bossStats.defense,
          bossMon.types as PokemonType[],
        );

        let avgFmDamage = 0;
        let avgFmCount = 0;
        const tankStats = bossCMs.reduce(
          (acc, cm) => {
            const spreadDamage = getDamange(
              bossMon.types as PokemonType[],
              cm.type as PokemonType,
              bossStats.attack,
              cm.power,
              settings.weather,
              defense,
              mon.types as PokemonType[],
            );
            const targetedDamage =
              (spreadDamage *
                settings.targetDamageMultiplier *
                (1 - settings.dodgeRate) +
                spreadDamage *
                  settings.targetDamageMultiplier *
                  settings.dodgeRate *
                  settings.dodgeMultiplier) *
              (1 / settings.trainers / 3); // # of trainers * 3 pokemon each = prob of targeted attack
            const bossDamage =
              spreadDamage * (1 - settings.targetedRate) +
              targetedDamage * settings.targetedRate;
            const attacksTanked = getAttacksTanked(hp, bossDamage);
            const tof = attacksTanked * (baseAttackRate + cm.duration);

            const fmDamage =
              Math.floor(tof / fm.duration) *
              getDamange(
                mon.types as PokemonType[],
                fm.type as PokemonType,
                attack,
                fm.power,
                settings.weather,
                bossStats.defense,
                bossMon.types as PokemonType[],
              );

            // TODO: calculate max particles as 0.5% of boss hp
            // TODO: compare max particles from fm + cm
            const fmCount = Math.floor(tof / fm.duration);
            avgFmCount += fmCount / bossCMs.length;
            avgFmDamage += fmDamage / bossCMs.length;
            acc[cm.name] = { tof, fmCount, fmDamage };
            return acc;
          },
          {} as {
            [cm: string]: { tof: number; fmCount: number; fmDamage: number };
          },
        );

        return {
          name: `${my.maxMove[0]}Max ${mon.name}`,
          cp,
          hp,
          maxPower,
          fm: fm.name,
          maxType,
          mmDamage,
          tankStats,
          avgFmCount,
          avgFmDamage,
        };
      });
    })
    .flat()
    .filter((o) => !!o);

  return ranks;
};

const generateBosses = () => {
  const allTypes = [
    ...pokemonTypes.map((type) => [type]),
    ...pokemonTypes.flatMap((a, i) =>
      pokemonTypes.slice(i + 1).map((b) => [a, b] as [string, string]),
    ),
  ];
  const [bestStats, allFastMoves, allChargeMoves] = pokemon.reduce(
    ([stats, fm, cm], mon) => [
      {
        baseAttack: Math.max(stats.baseAttack, mon.stats.baseAttack),
        baseDefense: Math.max(stats.baseDefense, mon.stats.baseDefense),
        baseStamina: Math.max(stats.baseStamina, mon.stats.baseStamina),
      },
      [...fm, ...mon.fastMoves],
      [...cm, ...mon.chargeMoves],
    ],
    [
      {
        baseAttack: 0,
        baseDefense: 0,
        baseStamina: 0,
      } as ArrayElement<typeof pokemon>["stats"],
      [] as string[],
      [] as string[],
    ],
  );
  return allTypes.map<Pokemon>((types) => ({
    number: -1,
    name: types.join(" | "),
    form: "Normal",
    types,
    stats: bestStats,
    fastMoves: [...new Set(allFastMoves)],
    chargeMoves: [...new Set(allChargeMoves)],
  }));
};
