"use client";

import { Fragment, useState } from "react";
import {
  BattleConfig,
  defaultBattleConfig,
  getAllPokemon,
  PokeStats,
  rankPokemon,
} from "@/utils/rank";
import { BossTier } from "@/utils/cpm";

import { getMon } from "../utils/gamemaster";
import dmax_png from "../assets/dmax.png";
import gmax_png from "../assets/gmax.png";

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
  const [bossName] = useState<string>("Entei");
  const [bossTier] = useState<BossTier>("D5");
  const [battleConfig] = useState<BattleConfig>(defaultBattleConfig);

  const boss = getMon(bossName)!;

  const getIconUrl = (
    form: string,
    number: number,
    fixedSize: boolean = true,
  ) => {
    const f =
      form === "Normal" ? "" : `.f${form.replaceAll(" ", "_").toUpperCase()}`;
    return `https://raw.githubusercontent.com/PokeMiners/pogo_assets/refs/heads/master/Images/Pokemon${fixedSize ? "%20-%20256x256" : ""}/Addressable%20Assets/pm${number}${f}.icon.png`;
  };

  const getGroups = () =>
    Object.keys(myPokemons).map((group, i) => {
      const ranks = rankPokemon(
        myPokemons[group],
        boss ?? bossName,
        bossTier,
        battleConfig,
      );
      const bossCMs = Object.keys(ranks[0].tankStats);

      return (
        <Fragment key={group}>
          <input
            type="radio"
            name="pokemon-tabs"
            className="tab"
            aria-label={group}
            defaultChecked={i === 0}
          />
          <div className="tab-content bg-base-100 border-base-300 p-6">
            <div className="overflow-x-auto">
              <table className="table table-zebra table-pin-rows table-pin-cols">
                <thead>
                  <tr>
                    <th>Pokemon</th>
                    <td>CP</td>
                    <td>Max Power</td>
                    <td>Fast Move</td>
                    <td>Max Move Type</td>
                    <td>Max Move Damage</td>
                    <td>FM Damage</td>
                    {bossCMs.map((cm, i) => (
                      <td key={`${group}-fm-${i}`}>{cm}</td>
                    ))}
                    <td>Average FMs</td>
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
                            <th>{name}</th>
                            <td>{cp}</td>
                            <td>{maxPower}</td>
                            <td>{fm}</td>
                            <td>{maxType}</td>
                            <td>{mmDamage}</td>
                            <td>{toFixed(avgFmDamage, 0)}</td>
                            {bossCMs.map((cm, j) => {
                              return (
                                <td key={`${group}-${i}.${j}`}>
                                  {tankStats[cm].fmCount}
                                </td>
                              );
                            })}
                            <td>{toFixed(avgFmCount, 0)}</td>
                          </tr>
                        );
                      },
                    )}
                </tbody>
              </table>
            </div>
          </div>
        </Fragment>
      );
    });

  return (
    <div className="p-6">
      <div className="flex items-center justify-center">
        <div className="uppercase font-bold text-5xl">
          <h2 className="text-right text-secondary">
            {bossTier === "G6" ? "Gigantamax" : "Dynamax"}
          </h2>
          <h1 className="text-right text-primary-content">{bossName}</h1>
        </div>

        <div className="relative h-[256px] w-[256px]">
          <img
            className="z-0 absolute top-[16px] right-0 h-[50%] w-[50%]"
            src={bossTier === "G6" ? gmax_png.src : dmax_png.src}
          />
          <img
            className="z-10 absolute dmax-icon"
            src={getIconUrl(boss.form, boss.number)}
          ></img>
        </div>
      </div>

      <div className="tabs tabs-lift">{getGroups()}</div>
    </div>
  );
}
