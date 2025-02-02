import type { NextConfig } from "next";
import createNextPluginPreval from "next-plugin-preval/config";

const withNextPluginPreval = createNextPluginPreval();

const nextConfig: NextConfig = {
  output: "export",
};

export default [withNextPluginPreval].reduce(
  // eslint-disable-next-line  @typescript-eslint/no-explicit-any
  (acc, next) => next(acc as any),
  nextConfig,
);
