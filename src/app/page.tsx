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

// toFixed with rounding: https://stackoverflow.com/questions/10015027/javascript-tofixed-not-rounding
function toFixed(num: number, precision: number) {
  return (+(Math.round(+(num + "e" + precision)) + "e" + -precision)).toFixed(
    precision,
  );
}

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
        <table className="table table-zebra table-pin-rows">
          <thead>
            <tr>
              <th>Pokemon</th>
              <th>CP</th>
              <th>HP</th>
              <th>Max Power</th>
              <th>Fast Move</th>
              <th>Max Move Type</th>
              <th>Max Move Damage</th>
              {bossCMs.map((cm, i) => (
                <th key={`${group}-fm-${i}`}>{cm}</th>
              ))}
              <th>Average FMs</th>
              <th>FM Damage</th>
            </tr>
          </thead>
          <tbody>
            {ranks
              .toSorted((a, b) => b.mmDamage - a.mmDamage) // by attacker
              // .toSorted((a, b) => b.avgFmCount - a.avgFmCount || b.avgFmDamage - a.avgFmDamage || b.mmDamage - a.mmDamage) // by tankiness
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
                    tankStats,
                    avgFmCount,
                    avgFmDamage,
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
                      {bossCMs.map((cm, j) => {
                        return (
                          <td key={`${group}-${i}.${j}`}>
                            {tankStats[cm].fmCount}
                          </td>
                        );
                      })}
                      <td>{toFixed(avgFmCount, 0)}</td>
                      <td>{toFixed(avgFmDamage, 0)}</td>
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
