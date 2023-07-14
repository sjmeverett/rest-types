import dts from "rollup-plugin-dts";

const config = [
  {
    input: "dist/server/api-types.d.ts",
    output: [{ file: "dist/api-types.d.ts", format: "es" }],
    plugins: [dts()],
  },
];

export default config;
