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
  PokemonType,
  WeatherType,
} from "./gamemaster";

export type BattleConfig = {
  bossName: string;
  bossTier: BossTier;
  targetedRate: number;
  targetDamageMultiplier: number;
  attackRate: number;
  dodgeRate: number;
  dodgeMultiplier: number;
  trainers: number;
  weather: WeatherType;
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

export const rankPokemon = (myPokemon: PokeStats[], settings: BattleConfig) => {
  const bossMon = getMon(settings.bossName);
  if (!bossMon) {
    throw `Unkonwn pokemon: ${settings.bossName}`;
  }
  const bossCPM = getBossCPM(settings.bossTier);
  if (!bossCPM) {
    throw `Unkonwn max battle tier: ${settings.bossTier}`;
  }

  const bossCMs = (bossMon.chargeMoves ?? [])
    .map((cm) => getCM(cm))
    .filter((cm) => !!cm);
  const bossStats = combineStats(bossMon.stats, [15, 15, 15], bossCPM);

  const attackRanks = new Set<number>();
  const tankRanks = new Map<string, Set<number>>();

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

        attackRanks.add(mmDamage);

        const fmDamage =
          Math.floor(settings.attackRate / fm.duration) *
          getDamange(
            mon.types as PokemonType[],
            fm.type as PokemonType,
            attack,
            fm.power,
            settings.weather,
            bossStats.defense,
            bossMon.types as PokemonType[],
          );

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
            const tol = attacksTanked * settings.attackRate;
            // TODO: calculate max particles as 0.5% of boss hp
            // TODO: compare max particles from fm + cm
            const fmCount = Math.floor(tol / fm.duration);
            tankRanks.set(
              cm.name,
              (tankRanks.get(cm.name) ?? new Set<number>()).add(fmCount),
            );
            acc[cm.name] = {
              fmCount,
            };
            return acc;
          },
          {} as { [cm: string]: { fmCount: number; tankRank?: number } },
        );

        return {
          name: `${my.maxMove[0]}Max ${mon.name}`,
          cp,
          hp,
          maxPower,
          fm: fm.name,
          fmType: fm.type,
          mmDamage,
          attackRank: Number.POSITIVE_INFINITY,
          fmDamage,
          tankStats,
          bestTankRank: Number.POSITIVE_INFINITY,
        };
      });
    })
    .flat()
    .filter((o) => !!o);

  // Create maps with proper ranking (handling ties)
  const attackRankMap = new Map<number, number>();
  [...attackRanks]
    .sort((a, b) => b - a)
    .forEach((value, index) => attackRankMap.set(value, index + 1));

  const tankRankMap = new Map<string, Map<number, number>>();
  tankRanks.forEach((tankRank, cm) => {
    [...tankRank]
      .sort((a, b) => b - a)
      .forEach((value, index) => {
        tankRankMap.set(
          cm,
          (tankRankMap.get(cm) ?? new Map<number, number>()).set(
            value,
            index + 1,
          ),
        );
      });
  });

  for (const rank of ranks) {
    rank.attackRank = attackRankMap.get(rank.mmDamage) ?? rank.attackRank;
    Object.entries(rank.tankStats).forEach(([cm, tankStat]) => {
      tankStat.tankRank = tankRankMap.get(cm)?.get(tankStat.fmCount);
      if (tankStat.tankRank) {
        rank.bestTankRank = Math.min(rank.bestTankRank, tankStat.tankRank);
      }
    });
  }

  return ranks;
};
