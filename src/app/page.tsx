import { getBossCPM, getCPM, combineStats } from "@/utils/cpm";
import {
  getDamange,
  getAttacksTanked,
  MaxMove,
  getMaxMovePower,
} from "@/utils/damage";
import { getCM, getFM, getMon, pokemon, PokemonType } from "@/utils/gamemaster";
import { average, median } from "@/utils/math";

// TODO: parameterize settings below
const bossName = "Moltres";
const bossTier = "D5";
const targetedRate = 0.5; // targeted vs spread attack %
const targetDamageMultiplier = 2; // boss targeted attack multiplier

// https://www.reddit.com/r/TheSilphRoad/comments/1ier5h0/new_year_new_bugs_discoveries_on_combat_mechanics/
// TODO: break out damage per tier
const attackRate = 10000; // time (ms) between boss attacks

const dodgeRate = 1; // dodge %
const dodgeMultiplier = 0.5; // dodge damage reduction %

const trainers = 4; // number of trainers to calculate % each is targeted

const weather = "Fog"; // weather boosted damage

type PokeStats = {
  name: string;
  level: number;
  iv: [attack: number, defense: number, stamina: number];
  maxMove: MaxMove;
};

const myPokemons: { [group: string]: PokeStats[] } = {
  "All Pokemon": pokemon
    .map((p) => {
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
    })
    .flat(),
};

export default function Home() {
  const bossMon = getMon(bossName);
  if (!bossMon) {
    throw `Unkonwn pokemon: ${bossName}`;
  }
  const bossCPM = getBossCPM(bossTier);
  if (!bossCPM) {
    throw `Unkonwn max battle tier: ${bossTier}`;
  }
  const bossCMs = (bossMon.chargeMoves ?? [])
    .map((cm) => getCM(cm))
    .filter((cm) => !!cm);
  const bossStats = combineStats(bossMon.stats, [15, 15, 15], bossCPM);

  const getGroupData = (group: keyof typeof myPokemons) =>
    myPokemons[group]
      .map((my) => {
        const mon = getMon(my.name);
        if (!mon) {
          throw `Unkonwn Pokemon: ${my.name}`;
        }

        const cpm = getCPM(my.level);
        if (!cpm) {
          throw `Unkonwn level: ${my.level}`;
        }
        const { attack, defense, stamina } = combineStats(
          mon.stats,
          my.iv,
          cpm,
        );

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
          const maxType = my.maxMove.startsWith("G")
            ? mon.gmaxMoveType
            : fm.type;
          if (!maxType) return;

          const maxPower = getMaxMovePower(my.maxMove);
          if (!maxPower) return;

          const mmDamage = getDamange(
            mon.types as PokemonType[],
            maxType as PokemonType,
            attack,
            maxPower,
            weather,
            bossStats.defense,
            bossMon.types as PokemonType[],
          );
          const fmDamage =
            Math.floor(attackRate / fm.duration) *
            getDamange(
              mon.types as PokemonType[],
              fm.type as PokemonType,
              attack,
              fm.power,
              weather,
              bossStats.defense,
              bossMon.types as PokemonType[],
            );

          // TODO: calculate max particles as 0.5% of damage dealt
          // TODO: compare max particles from fm + cm
          const maxParticles = bossCMs.map((cm) => {
            const spreadDamage = getDamange(
              bossMon.types as PokemonType[],
              cm.type as PokemonType,
              bossStats.attack,
              cm.power,
              weather,
              defense,
              mon.types as PokemonType[],
            );
            const targetedDamage =
              spreadDamage * targetDamageMultiplier * (1 - dodgeRate) +
              spreadDamage *
                targetDamageMultiplier *
                dodgeRate *
                dodgeMultiplier *
                (1 / trainers / 3); // 4 trainers * 3 pokemon each
            const bossDamage =
              spreadDamage * (1 - targetedRate) + targetedDamage * targetedRate;
            const attacksTanked = getAttacksTanked(hp, bossDamage);
            const tol = attacksTanked * attackRate;
            return Math.floor(tol / fm.duration);
          });
          const avgMaxParticles = average([
            average(maxParticles),
            median(maxParticles) ?? 0,
          ]);

          return {
            name: `${my.maxMove[0]}Max ${mon.name}`,
            cp,
            hp,
            maxPower,
            fm: fm.name,
            fmType: fm.type,
            mmDamage,
            fmDamage,
            fmCount: maxParticles,
            avgFastMoves: avgMaxParticles,
          };
        });
      })
      .flat()
      .filter((o) => !!o);

  return Object.keys(myPokemons).map((group) => {
    const data = getGroupData(group);

    return (
      <>
        <h1>
          {group} vs Tier {bossTier[1]} {bossTier[0]}Max {bossName}
        </h1>
        <table>
          <thead>
            <tr>
              <th>Pokemon</th>
              <th>CP</th>
              <th>HP</th>
              <th>Max Power</th>
              <th>Fast Move</th>
              <th>Fast Type</th>
              <th>Max Move Damage</th>
              <th>Fast Move Damage</th>
              {bossCMs.map((cm, i) => (
                <th key={`${group}-fm-${i}`}>{cm.name}</th>
              ))}
              <th>Average Particles</th>
            </tr>
          </thead>
          <tbody>
            {data
              .toSorted((a, b) => b.mmDamage - a.mmDamage) // by attacker
              // .toSorted((a, b) => b.avgFastMoves - a.avgFastMoves || b.fmDamage - a.fmDamage || b.mmDamage - a.mmDamage) // by tankiness
              .map(
                (
                  {
                    name,
                    cp,
                    hp,
                    maxPower,
                    fm,
                    fmType,
                    mmDamage,
                    fmDamage,
                    fmCount,
                    avgFastMoves,
                  },
                  i,
                ) => {
                  return (
                    <tr key={`${group}-${i}`}>
                      <td>{name}</td>
                      <td>{cp}</td>
                      <td>{hp}</td>
                      <td>{maxPower}</td>
                      <td>{fm}</td>
                      <td>{fmType}</td>
                      <td>{mmDamage}</td>
                      <td>{fmDamage}</td>
                      {fmCount.map((count, j) => {
                        return <td key={`${group}-${i}.${j}`}>{count}</td>;
                      })}
                      <td>{avgFastMoves}</td>
                    </tr>
                  );
                },
              )}
          </tbody>
        </table>
      </>
    );
  });
}
