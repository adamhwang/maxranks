"use client";

import { useState } from "react";
import { pokemon } from "@/utils/gamemaster";
import { BattleConfig, PokeStats, rankPokemon } from "@/utils/rank";

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
  const [battleConfig] = useState<BattleConfig>({
    bossName: "Moltres",
    bossTier: "D5",
    targetedRate: 0.5,
    targetDamageMultiplier: 2,
    attackRate: 10000,
    dodgeRate: 1,
    dodgeMultiplier: 0.5,
    trainers: 4,
    weather: "Fog",
  });

  return Object.keys(myPokemons).map((group) => {
    const ranks = rankPokemon(myPokemons[group], battleConfig);
    const bossCMs = Object.keys(ranks[0].tankRanks);

    return (
      <div key={group}>
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
                <th key={`${group}-fm-${i}`}>{cm}</th>
              ))}
              <th>Average Particles</th>
            </tr>
          </thead>
          <tbody>
            {ranks
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
                    tankRanks,
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
                      {bossCMs.map((cm, j) => {
                        return (
                          <td key={`${group}-${i}.${j}`}>
                            {tankRanks[cm].fmCount}
                          </td>
                        );
                      })}
                      <td>{avgFastMoves}</td>
                    </tr>
                  );
                },
              )}
          </tbody>
        </table>
      </div>
    );
  });
}
