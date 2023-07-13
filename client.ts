import { ApiClient } from "./framework";
import type { PetsApi } from "./server";

// this is how we'd use the API
// note we're using that PetsAPI API definition type
const client = new ApiClient<PetsApi>("http://localhost");

async function test() {
  // this is all strongly typed
  const pets = await client.get("/pets");
  console.log(pets.items.length);
  console.log(pets.items[0].name);

  const pet = await client.get("/pets/5");
  console.log(pet.name);

  const newPet = await client.post("/pets", {
    name: "Eloise",
    animal: "cat",
  });
  console.log(newPet.name);
}
