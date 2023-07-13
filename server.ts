import z from "zod";
import { createApi, inferApiType } from "./framework";

// this is how we define our API, note it doesn't all have to be inline like this
const petsApi = createApi()
  .post("/pets", {
    input: z.object({
      name: z.string(),
      animal: z.string(),
    }),
    output: z.object({
      id: z.string(),
      name: z.string(),
      animal: z.string(),
    }),
    handler: async (input) => {
      return { id: "1", ...input };
    },
  })
  .get("/pets", {
    input: z.object({}),
    output: z.object({
      items: z.array(
        z.object({ id: z.string(), name: z.string(), animal: z.string() })
      ),
    }),
    handler: async () => {
      return { items: [{ id: "1", name: "Eloise", animal: "cat" }] };
    },
  })
  .get("/pets/:id", {
    input: z.object({}),
    output: z.object({ id: z.string(), name: z.string(), animal: z.string() }),
    handler: async () => {
      return { id: "1", name: "Eloise", animal: "cat" };
    },
  });

// this is the type that represents our API definition, that we can use on the client
export type PetsApi = inferApiType<typeof petsApi>;

// there would be framework code to take petsApi and turn it into an express/koa API, but this is trivial
