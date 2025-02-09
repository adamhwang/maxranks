"use client";

import { useState } from "react";
import {
  BattleConfig,
  getAllPokemon,
  PokeStats,
  rankPokemon,
} from "@/utils/rank";

const myPokemons: { [group: string]: PokeStats[] } = {
  "All Pokemon": getAllPokemon(),
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
    const bossCMs = Object.keys(ranks[0].tankStats);

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
              <th>Attacker Rank</th>
              <th>Fast Move Damage</th>
              {bossCMs.map((cm, i) => (
                <th key={`${group}-fm-${i}`}>{cm}</th>
              ))}
              <th>Tank Rank</th>
            </tr>
          </thead>
          <tbody>
            {ranks
              .toSorted((a, b) => b.mmDamage - a.mmDamage) // by attacker
              // .toSorted((a, b) => a.bestTankRank - b.bestTankRank || b.fmDamage - a.fmDamage || b.mmDamage - a.mmDamage) // by tankiness
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
                    attackRank,
                    fmDamage,
                    tankStats,
                    bestTankRank,
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
                      <td>{attackRank}</td>
                      <td>{fmDamage}</td>
                      {bossCMs.map((cm, j) => {
                        return (
                          <td key={`${group}-${i}.${j}`}>
                            {tankStats[cm].fmCount}
                          </td>
                        );
                      })}
                      <td>{bestTankRank}</td>
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
