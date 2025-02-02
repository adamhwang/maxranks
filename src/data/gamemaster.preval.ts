import axios from "axios";
import preval from "next-plugin-preval";

const url =
  "https://raw.githubusercontent.com/PokeMiners/game_masters/master/latest/latest.json";

const pokemonTypes = [
  "Normal",
  "Fighting",
  "Flying",
  "Poison",
  "Ground",
  "Rock",
  "Bug",
  "Ghost",
  "Steel",
  "Fire",
  "Water",
  "Grass",
  "Electric",
  "Psychic",
  "Ice",
  "Dragon",
  "Dark",
  "Fairy",
] as const;

export type PokemonType = (typeof pokemonTypes)[number];

const proper = (str: string) =>
  str
    ?.replace(/_/g, " ")
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ")
    .trim();

const properForm = (pokemonId: string, form: string) =>
  proper(String(form ?? "Normal")?.replace(pokemonId, ""));

const properType = (type: string) => proper(type?.substring(13));

const properMove = (move: string) => proper(String(move).replace(/_FAST$/, ""));

// eslint-disable-next-line  @typescript-eslint/no-explicit-any
const getPokemon = (template: any) => {
  const {
    pokemonId,
    type,
    type2,
    stats,
    quickMoves,
    cinematicMoves,
    form,
  }: {
    pokemonId: string;
    type: string;
    type2: string;
    stats: {
      baseAttack: number;
      baseDefense: number;
      baseStamina: number;
    };
    quickMoves: string[];
    cinematicMoves: string[];
    form: string;
  } = template.data.pokemonSettings;
  return {
    name: proper(pokemonId),
    form: properForm(pokemonId, form),
    types: [properType(type), properType(type2)].filter((t) => !!t),
    stats,
    fastMoves: (quickMoves ?? []).map((fm: string) => properMove(fm)),
    chargeMoves: (cinematicMoves ?? []).map((cm: string) => properMove(cm)),
  };
};

// eslint-disable-next-line  @typescript-eslint/no-explicit-any
const getMove = (template: any) => {
  const {
    movementId,
    pokemonType,
    power,
    durationMs,
  }: {
    movementId: string;
    pokemonType: string;
    power: number;
    durationMs: number;
  } = template.data.moveSettings;
  return {
    name: properMove(movementId),
    type: properType(pokemonType),
    power,
    duration: durationMs,
  };
};

// eslint-disable-next-line  @typescript-eslint/no-explicit-any
const getTypeEffective = (template: any) => {
  const { attackScalar, attackType } = template.data.typeEffective;
  return {
    [properType(attackType)]: (attackScalar as number[]).reduce(
      (acc, cur, i: number) => {
        acc[pokemonTypes[i]] = cur;
        return acc;
      },
      {} as { [defendType in PokemonType]: number },
    ),
  };
};

// eslint-disable-next-line  @typescript-eslint/no-explicit-any
const getMaxForms = (template: any) => {
  return (
    template.data.breadPokemonScalingSettings.visualSettings as {
      pokemonId: string;
      pokemonFormData: {
        pokemonForm: string;
        visualData: { breadMode: string }[];
      }[];
    }[]
  )
    .map((s) =>
      s.pokemonFormData
        .map((p) =>
          p.visualData.map((v) => ({
            name: proper(s.pokemonId),
            form: properForm(s.pokemonId, p.pokemonForm),
            breadMode: v.breadMode,
          })),
        )
        .flat(),
    )
    .flat()
    .reduce(
      (acc, { name, form, breadMode }) => {
        acc[name] = acc[name] ?? {};
        acc[name][form] = acc[name][form] ?? {};
        if (breadMode === "BREAD_MODE") {
          acc[name][form].dmax = true;
        }
        if (breadMode === "BREAD_DOUGH_MODE") {
          acc[name][form].gmax = true;
        }
        return acc;
      },
      {} as {
        [name: string]: { [form: string]: { dmax?: boolean; gmax?: boolean } };
      },
    );
};

// eslint-disable-next-line  @typescript-eslint/no-explicit-any
const getGMaxMoveMap = (template: any) => {
  return (
    template.data.sourdoughMoveMappingSettings.mappings as {
      pokemonId: string;
      form: string;
      move: string;
    }[]
  )
    .map(({ pokemonId, form, move }) => ({
      name: proper(pokemonId),
      form: properForm(pokemonId, form),
      move: move,
    }))
    .reduce(
      (acc, { name, form, move }) => {
        acc[name] = acc[name] ?? {};
        acc[name][form] = acc[name][form] ?? {};
        acc[name][form].move = move;
        return acc;
      },
      {} as { [name: string]: { [form: string]: { move: string } } },
    );
};

// eslint-disable-next-line  @typescript-eslint/no-explicit-any
const getGMaxMoves = (template: any) => {
  const {
    movementId,
    pokemonType,
    vfxName,
  }: { movementId: string; pokemonType: string; vfxName: string } =
    template.data.moveSettings;
  return {
    [movementId]: {
      gmax: true, // sometimes max forms lags behind gmax moves
      gmaxMoveType: properType(pokemonType),
      gmaxMoveName: proper(vfxName).replace("Gmax", "G-Max"),
    },
  };
};

// eslint-disable-next-line  @typescript-eslint/no-explicit-any
const getWeatherBoost = (template: any) => {
  const { weatherCondition, pokemonType } = template.data.weatherAffinities;
  return {
    [proper(weatherCondition)]: pokemonType.map((t: string) => properType(t)),
  };
};

async function loadGameMaster() {
  console.log("Loading game master...");
  const { data: gameMaster } = await axios.get(url);

  const pokemon: (ReturnType<typeof getPokemon> &
    ReturnType<typeof getMaxForms>[0][0] &
    Partial<ReturnType<typeof getGMaxMoves>[0]>)[] = [];
  const fastMoves: ReturnType<typeof getMove>[] = [];
  const chargeMoves: ReturnType<typeof getMove>[] = [];
  const typeEffectives: ReturnType<typeof getTypeEffective> = {};
  const maxForms: ReturnType<typeof getMaxForms> = {};
  const gmaxMoveMap: ReturnType<typeof getGMaxMoveMap> = {};
  const gmaxMoves: ReturnType<typeof getGMaxMoves> = {};
  const weatherBoosts: ReturnType<typeof getWeatherBoost> = {};

  for (const template of gameMaster) {
    const { templateId } = template;

    // pokemon
    if (
      templateId.startsWith("V") &&
      templateId.substring(6, 13) === "POKEMON" &&
      !templateId.includes("REVERSION")
    ) {
      pokemon.push(getPokemon(template));
    }

    // fast and charged moves
    else if (
      templateId.startsWith("V") &&
      templateId.substring(6, 10) === "MOVE"
    ) {
      if (templateId.endsWith("FAST")) {
        fastMoves.push(getMove(template));
      } else {
        chargeMoves.push(getMove(template));
      }
    }

    // type effectives
    else if (templateId.startsWith("POKEMON_TYPE")) {
      Object.assign(typeEffectives, getTypeEffective(template));
    }

    // dynamax and gigantamax
    else if (templateId === "BREAD_POKEMON_SCALING_SETTINGS") {
      Object.assign(maxForms, getMaxForms(template));
    }

    // gigantamax to gmax moves
    else if (templateId === "SOURDOUGH_MOVE_MAPPING_SETTINGS") {
      Object.assign(gmaxMoveMap, getGMaxMoveMap(template));
    }

    // gmax moves
    else if (templateId.startsWith("VN_BM")) {
      Object.assign(gmaxMoves, getGMaxMoves(template));
    }

    // weather boosts
    else if (templateId.startsWith("WEATHER_AFFINITY")) {
      Object.assign(weatherBoosts, getWeatherBoost(template));
    }
  }

  // filter non-Dynamax, non-Gigantamax pokemon
  for (let i = pokemon.length - 1; i >= 0; i--) {
    const mon = pokemon[i];

    // add gmaxMoveName and gmaxMoveType field
    if (gmaxMoveMap[mon.name]?.[mon.form]) {
      Object.assign(mon, gmaxMoves[gmaxMoveMap[mon.name][mon.form].move]);
    }

    // add dmax and dmax fields
    if (maxForms[mon.name]?.[mon.form]) {
      Object.assign(mon, maxForms[mon.name][mon.form]);
    }

    if (!mon.dmax && !mon.gmax) {
      pokemon.splice(i, 1);
    }
  }

  console.log("Game master successfully loaded...");

  return {
    pokemon,
    fm: fastMoves.filter((fm) =>
      pokemon
        .map((p) => p.fastMoves)
        .flat()
        .includes(fm.name),
    ),
    cm: chargeMoves.filter((cm) =>
      pokemon
        .map((p) => p.chargeMoves)
        .flat()
        .includes(cm.name),
    ),
    typeEffectives,
    weatherBoosts,
  };
}

export default preval(await loadGameMaster());
