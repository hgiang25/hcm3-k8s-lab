import type { IProfile } from './profile';
import {
  getNodeRedisClient,
  RedisSchema,
  RedisRepository,
  RedisEntityId,
  getRedis
} from '../utils/redis/redis-wrapper';

const PROFILE_KEY_PREFIX = 'Profile';

const schema = new RedisSchema(PROFILE_KEY_PREFIX, {
  persona: { type: 'string', indexed: true },//--
  accessories: { type: 'number', indexed: false },
  apparel: { type: 'number', indexed: false },
  'accessories:watches': { type: 'number', indexed: false },
  'apparel:topwear': { type: 'number', indexed: false },
  'apparel:bottomwear': { type: 'number', indexed: false },
  avgCartPrice: { type: 'number', indexed: false },

  createdOn: { type: 'date', indexed: false },
  createdBy: { type: 'string', indexed: false },
  lastUpdatedOn: { type: 'date', indexed: false },
  lastUpdatedBy: { type: 'string', indexed: false },
  statusCode: { type: 'number', indexed: true },//--
});

/*
 A Repository is the main interface into Redis OM. It gives us the methods to read, write, and remove a specific Entity
 */

const getRepository = () => {
  const redisClient = getNodeRedisClient();
  const repository = new RedisRepository(schema, redisClient);
  return repository;
};

/*
we need to create an index or we won't be able to search.
Redis OM uses hash to see if index needs to be recreated or not 
*/

const createRedisIndex = async () => {
  const repository = getRepository();
  // await repository.createIndex(); // Disabled for CMC Cloud Redis
};

const DEFAULT_PROFILES: IProfile[] = [
  {
    persona: 'GRANDMOTHER',
    accessories: 0,
    apparel: 3,
    'accessories:watches': 0,
    'apparel:topwear': 3,
    'apparel:bottomwear': 0,
    avgCartPrice: 2894,
  },
  {
    persona: 'GRANDFATHER',
    accessories: 2,
    apparel: 1,
    'accessories:watches': 2,
    'apparel:topwear': 1,
    'apparel:bottomwear': 0,
    avgCartPrice: 7990,
  },
  {
    persona: 'MOTHER',
    accessories: 0,
    apparel: 7,
    'accessories:watches': 0,
    'apparel:topwear': 4,
    'apparel:bottomwear': 3,
    avgCartPrice: 4780,
  },
  {
    persona: 'FATHER',
    accessories: 5,
    apparel: 1,
    'accessories:watches': 5,
    'apparel:topwear': 0,
    'apparel:bottomwear': 1,
    avgCartPrice: 11990,
  },
  {
    persona: 'SON',
    accessories: 0,
    apparel: 8,
    'accessories:watches': 0,
    'apparel:topwear': 5,
    'apparel:bottomwear': 3,
    avgCartPrice: 4780,
  },
  {
    persona: 'DAUGHTER',
    accessories: 0,
    apparel: 15,
    'accessories:watches': 0,
    'apparel:topwear': 10,
    'apparel:bottomwear': 5,
    avgCartPrice: 4950,
  },
];

const initialize = async () => {
  await createRedisIndex();

  const repository = getRepository();
  const existingProfiles = await getRedis().getKeys(`${PROFILE_KEY_PREFIX}:*`);

  if (!existingProfiles || existingProfiles.length === 0) {
    DEFAULT_PROFILES.forEach(async (profile) => {
      await repository.save(profile);

      // Disabled Bloom Filter logic because CMC Cloud Redis does not support RedisBloom
    });
  }
};

export { getRepository, initialize, RedisEntityId };
