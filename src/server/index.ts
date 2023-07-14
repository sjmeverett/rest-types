import z from 'zod';
import { inferRoutes, route } from './framework';
import { PrismaClient } from '@prisma/client';
import { createKoaRouter } from './framework/createKoaRouter';
import Koa from 'koa';

const prisma = new PrismaClient();

const createPet = route({
  method: 'post',
  path: '/pets',
  input: z.object({
    name: z.string(),
  }),
  output: z.object({
    id: z.string(),
    name: z.string(),
  }),
}).handler(async (ctx, data) => {
  ctx.status = 201;
  return prisma.pet.create({ data });
});

const getAllPets = route({
  method: 'get',
  path: '/pets',
  input: z.object({}),
  output: z.array(z.object({ id: z.string(), name: z.string() })),
}).handler(async () => {
  return prisma.pet.findMany();
});

const getPet = route({
  method: 'get',
  path: '/pets/:id',
  input: z.object({ id: z.string() }),
  output: z.object({ id: z.string(), name: z.string() }),
}).handler(async (_ctx, input) => {
  return prisma.pet.findUniqueOrThrow({ where: { id: input.id } });
});

const petsApi = [createPet, getAllPets, getPet] as const;
export type Routes = inferRoutes<typeof petsApi>;

const app = new Koa();
const router = createKoaRouter(petsApi);

app.use(router.routes()).use(router.allowedMethods());

app.listen(5000);
