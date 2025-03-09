"use client";

import { useState } from "react";
import {
  BattleConfig,
  defaultBattleConfig,
  getAllPokemon,
  PokeStats,
  rankPokemon,
} from "@/utils/rank";
import { BossTier } from "@/utils/cpm";

const myPokemons: { [group: string]: PokeStats[] } = {
  "All Pokemon": getAllPokemon(),
};

export default function Home() {
  const [bossName] = useState<string>("Charizard");
  const [bossTier] = useState<BossTier>("G6");
  const [battleConfig] = useState<BattleConfig>(defaultBattleConfig);

  return Object.keys(myPokemons).map((group) => {
    const ranks = rankPokemon(
      myPokemons[group],
      bossName,
      bossTier,
      battleConfig,
    );
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
              <th>Max Move Type</th>
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
                    maxType,
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
                      <td>{maxType}</td>
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
