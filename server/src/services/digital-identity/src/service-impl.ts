import type { ITransactionStreamMessage } from '../../../common/models/misc';
import type { IDigitalIdentity } from '../../../common/models/digital-identity';

import {
  IMessageHandler,
  nextTransactionStep,
  listenToStreams,
  streamLog,
} from '../../../common/utils/redis/redis-streams';

import {
  TransactionStreamActions,
  DB_ROW_STATUS,
} from '../../../common/models/misc';

import * as digitalIdentityRepo from '../../../common/models/digital-identity-repo';
import { REDIS_STREAMS } from '../../../common/config/server-config';
import { CryptoCls } from '../../../common/utils/crypto';
import { LoggerCls } from '../../../common/utils/logger';

const addDigitalIdentityToRedis = async (
  message: ITransactionStreamMessage,
) => {
  let insertedKey = '';
  if (message && message.userId) {
    const userId = message.userId;
    const digitalIdentity: IDigitalIdentity = {
      action: message.action,
      userId: userId,

      createdOn: new Date(),
      createdBy: userId,
      statusCode: DB_ROW_STATUS.ACTIVE,
    };

    if (message.sessionId) {
      digitalIdentity.sessionId = message.sessionId;
    }

    if (message.identityBrowserAgent) {
      digitalIdentity.browserFingerprint = CryptoCls.hashString(
        message.identityBrowserAgent,
      );
    }
    if (message.identityIpAddress) {
      digitalIdentity.ipAddress = message.identityIpAddress;
    }

    if (message.identityScore) {
      digitalIdentity.identityScore = message.identityScore;
    }

    const repository = digitalIdentityRepo.getRepository();
    const entity: any = await repository.save(digitalIdentity);
    insertedKey = entity[digitalIdentityRepo.RedisEntityId] ?? '';
  } else {
    throw 'addDigitalIdentityToRedis() input params failed ! ';
  }

  return insertedKey;
};

const calculateIdentityScore = async (message: ITransactionStreamMessage) => {
  // Bypassed identity scoring because CMC Cloud Redis does not support RediSearch.
  // Returning a default average score.
  return 0.5;
};

const insertLoginIdentity: IMessageHandler = async (
  message: ITransactionStreamMessage,
  messageId,
) => {
  LoggerCls.info(`Adding digital identity to redis for ${message.userId}`);

  //step 1 - add login digital identity to redis
  const insertedKey = await addDigitalIdentityToRedis(message);

  await streamLog({
    action: TransactionStreamActions.INSERT_LOGIN_IDENTITY,
    message: `[${REDIS_STREAMS.CONSUMERS.IDENTITY}] New Login Digital Identity added to Redis (JSON) at key ${insertedKey} for the user ${message.userId}`,
    metadata: message,
  });

  await nextTransactionStep(message);

  return true;
};

const scoreDigitalIdentity: IMessageHandler = async (
  message: ITransactionStreamMessage,
  messageId,
) => {
  LoggerCls.info(`Scoring digital identity for ${message.userId}`);

  await streamLog({
    action: TransactionStreamActions.CALCULATE_IDENTITY_SCORE,
    message: `[${REDIS_STREAMS.CONSUMERS.IDENTITY}] Calculating digital identity score for the user ${message.userId}`,
    metadata: message,
  });

  //step 1 - calculate score for validation digital identity
  const identityScore = await calculateIdentityScore(message);
  message.identityScore = identityScore.toString();

  await streamLog({
    action: TransactionStreamActions.CALCULATE_IDENTITY_SCORE,
    message: `[${REDIS_STREAMS.CONSUMERS.IDENTITY}] Digital identity score for the user ${message.userId} is ${identityScore}`,
    metadata: message,
  });

  LoggerCls.info(`Adding digital identity to redis for ${message.userId}`);
  //step 2 - add validation digital identity to redis
  const insertedKey = await addDigitalIdentityToRedis(message);

  await streamLog({
    action: TransactionStreamActions.CALCULATE_IDENTITY_SCORE,
    message: `[${REDIS_STREAMS.CONSUMERS.IDENTITY}] Digital Identity score added to Redis [${insertedKey}] for the user ${message.userId}`,
    metadata: {
      ...message,
      identityScore: identityScore.toString(),
    },
  });

  await nextTransactionStep({
    ...message,
    logMessage: `[${REDIS_STREAMS.CONSUMERS.IDENTITY}] Requesting next step in transaction risk scoring for the user ${message.userId}`,

    identityScore: identityScore.toString(),
  });

  return true;
};

const listen = () => {
  listenToStreams({
    streams: [
      {
        streamKeyName: REDIS_STREAMS.STREAMS.TRANSACTIONS,
        eventHandlers: {
          [TransactionStreamActions.INSERT_LOGIN_IDENTITY]: insertLoginIdentity,
          [TransactionStreamActions.CALCULATE_IDENTITY_SCORE]:
            scoreDigitalIdentity,
        },
      },
    ],
    groupName: REDIS_STREAMS.GROUPS.IDENTITY,
    consumerName: REDIS_STREAMS.CONSUMERS.IDENTITY,
  });
};

const initialize = () => {
  listen();
};

export { initialize };
