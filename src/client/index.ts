import type { PetsApi } from '../../dist/api-types';
import { ApiClient } from './framework';
import 'isomorphic-fetch';

// this is how we'd use the API
// note we're using that PetsAPI API definition type
const client = new ApiClient<PetsApi>('http://localhost:5000');

async function main() {
  const newPet = await client.post('/pets', {
    name: 'Eloise',
  });
  console.log(newPet.name);

  // this is all strongly typed
  const pets = await client.get('/pets');
  console.log(pets.length);
  console.log(pets);

  const pet = await client.get(`/pets/${newPet.id}`);
  console.log(pet.name);
}

main().catch(console.error);
