import type { IOrder, OrderWithIncludes, OrderProduct, Product } from '../../../common/models/order';

import * as yup from 'yup';
import { v4 as uuidv4 } from 'uuid';
import { Prisma } from '@prisma/client';

import {
  ITransactionStreamMessage,
  TransactionPipelines,
} from '../../../common/models/misc';
import {
  IMessageHandler,
  nextTransactionStep,
  streamLog,
} from '../../../common/utils/redis/redis-streams';

import * as OrderRepo from '../../../common/models/order-repo';
import { TransactionStreamActions } from '../../../common/models/misc';
import { ORDER_STATUS, DB_ROW_STATUS } from '../../../common/models/order';
import {
  ISessionData, REDIS_STREAMS
} from '../../../common/config/server-config';
import { USERS } from '../../../common/config/constants';
import { YupCls } from '../../../common/utils/yup';
import { LoggerCls } from '../../../common/utils/logger';
import { listenToStreams } from '../../../common/utils/redis/redis-streams';
import { addMessageToStream } from '../../../common/utils/redis/redis-streams';
import { getPrismaClient } from '../../../common/utils/prisma/prisma-wrapper';

const validateOrder = async (_order) => {
  const schema = yup.object().shape({
    orderId: yup.string(),
    userId: yup.string().required(),
    orderStatusCode: yup.number().required(),
    potentialFraud: yup.boolean().optional(),

    products: yup
      .array()
      .of(
        yup.object().shape({
          productId: yup.string().required(),
          qty: yup.number().required(),
          productPrice: yup.number().required(),
          storeId: yup.string().optional(),
          storeName: yup.string().optional(),
        }),
      )
      .min(1),

    createdBy: yup.string().required(),
    createdOn: yup.date().required(),
    lastUpdatedBy: yup.string().nullable(),
    statusCode: yup.number().required(),
  });

  //@ts-ignore
  _order = await YupCls.validateSchema(_order, schema);

  return _order;
};

const addProductDataToOrders = (order: OrderWithIncludes, products: Product[]) => {
  if (order && order.products?.length && products.length) {
    for (let orderedProduct of order.products) {
      const resultProduct = products.find(
        (_p) => _p.productId == orderedProduct.productId,
      );
      if (resultProduct) {
        orderedProduct.productData = resultProduct;
        orderedProduct.createdBy = order.createdBy;
        orderedProduct.createdOn = order.createdOn;
        orderedProduct.statusCode = DB_ROW_STATUS.ACTIVE;
      }
    }
  }
  return order;
};

const getProductByIds = async (_productIdArr: string[]) => {
  const prisma = getPrismaClient();
  let products: Product[] = [];

  if (_productIdArr && _productIdArr.length) {
    products = await prisma.product.findMany({
      where: {
        statusCode: DB_ROW_STATUS.ACTIVE,
        productId: {
          in: _productIdArr,
        },
      },
    });
  }

  return products;
}

const getProductDetails = async (order: OrderWithIncludes) => {
  let products: Product[] = [];

  if (order && order.products?.length) {
    const productIdArr = order.products.map((product) => {
      return product.productId;
    });

    products = await getProductByIds(productIdArr);
  }

  return products;
};

const addOrderToRedis = async (order: OrderWithIncludes) => {
  if (order) {
    const repository = OrderRepo.getRepository();

    await repository.save(order.orderId, order);
  }
};

const addOrderToPrismaDB = async (order: OrderWithIncludes, orderAmount: number) => {
  const prisma = getPrismaClient();

  const orderProductData = (order.products || []).map((p) => ({
    id: p.id || uuidv4(),
    productId: p.productId,
    productPrice: Math.round(Number(p.productPrice) || 0),
    qty: Number(p.qty) || 1,
    storeId: p.storeId || null,
    storeName: p.storeName || null,
    productData: p.productData || {},
    createdBy: order.createdBy,
    createdOn: order.createdOn || new Date(),
    statusCode: DB_ROW_STATUS.ACTIVE,
  }));

  await prisma.order.create({
    data: {
      orderId: order.orderId,
      orderStatusCode: ORDER_STATUS.PAYMENT_SUCCESS,
      potentialFraud: order.potentialFraud ?? false,
      userId: order.userId,
      createdBy: order.createdBy,
      statusCode: DB_ROW_STATUS.ACTIVE,

      products: {
        create: orderProductData,
      },

      Payment: {
        create: {
          paymentId: uuidv4(),
          orderAmount: orderAmount,
          paidAmount: Math.round(orderAmount),
          orderStatusCode: ORDER_STATUS.PAYMENT_SUCCESS,
          userId: order.userId,
          createdBy: order.createdBy,
          statusCode: DB_ROW_STATUS.ACTIVE,
        },
      },
    },
  });
};

const addMessageToTransactionStream = async (
  message: ITransactionStreamMessage,
) => {
  if (message) {
    const streamKeyName = REDIS_STREAMS.STREAMS.TRANSACTIONS;
    await addMessageToStream(message, streamKeyName);
  }
};

const createOrder = async (
  order: IOrder,
  browserAgent: string,
  ipAddress: string,
  sessionId: string,
  sessionData: ISessionData,
) => {
  if (order) {
    const userId = order.userId;
    const orderId = uuidv4();

    order.orderId = orderId;
    order.orderStatusCode = ORDER_STATUS.PAYMENT_SUCCESS;
    order.userId = userId;
    order.createdBy = userId;
    order.createdOn = new Date();
    order.statusCode = DB_ROW_STATUS.ACTIVE;
    order.potentialFraud = false;

    order = await validateOrder(order);

    const products = await getProductDetails(order);
    addProductDataToOrders(order, products);

    let orderAmount = 0;
    order.products?.forEach((product) => {
      orderAmount += product.productPrice * product.qty;
    });

    await addOrderToRedis(order);

    /**
     * In real world scenario : can use RDI/ redis gears/ any other database to database sync strategy for REDIS-> MongoDB  data transfer.
     * To keep it simple, adding  data to MongoDB manually in the same service
     */
    await addOrderToPrismaDB(order, orderAmount);

    await streamLog({
      action: 'CREATE_ORDER',
      message: `[${REDIS_STREAMS.CONSUMERS.ORDERS}] Order created with id ${orderId} for the user ${userId}`,
      metadata: {
        userId: userId,
        persona: sessionData.persona,
        sessionId: sessionId,
      },
    });

    const orderDetails: Partial<IOrder> = {
      orderId: orderId,
      orderAmount: orderAmount.toFixed(2),
      userId: userId,
      sessionId: sessionId,
      orderStatusCode: order.orderStatusCode,
      products: order.products,
    };

    await addMessageToTransactionStream({
      //adding Identity To TransactionStream
      action: TransactionPipelines.CHECKOUT[0],
      logMessage: `[${REDIS_STREAMS.CONSUMERS.IDENTITY}] Digital identity to be validated/ scored for the user ${userId}`,
      userId: userId,
      persona: sessionData.persona,
      sessionId: sessionId,
      orderDetails: orderDetails ? JSON.stringify(orderDetails) : '',
      transactionPipeline: JSON.stringify(TransactionPipelines.CHECKOUT),

      identityBrowserAgent: browserAgent,
      identityIpAddress: ipAddress,
    });

    return orderId;
  } else {
    throw 'Order data is mandatory!';
  }
};

const updateOrderStatusInRedis = async ({
  orderId,
  orderStatusCode,
  potentialFraud,
  userId,
}: Partial<OrderWithIncludes>) => {
  const repository = OrderRepo.getRepository();
  if (orderId && repository) {
    const dbOrder = await repository.fetch(orderId);

    dbOrder.orderStatusCode = orderStatusCode ?? dbOrder.orderStatusCode;
    dbOrder.potentialFraud =
      (potentialFraud === true || potentialFraud === false)
        ? potentialFraud
        : dbOrder.potentialFraud;
    dbOrder.lastUpdatedOn = new Date();
    dbOrder.lastUpdatedBy = userId;

    await repository.save(dbOrder);
  }
};

const updateOrderStatusInPrismaDB = async ({
  orderId,
  orderStatusCode,
  potentialFraud,
  userId,
}: Partial<OrderWithIncludes>) => {
  const prisma = getPrismaClient();

  const dbOrder = await prisma.order.findUnique({
    where: {
      orderId: orderId
    },
    select: {
      orderStatusCode: true,
      potentialFraud: true
    }
  });

  if (dbOrder) {
    await prisma.order.update({
      where: {
        orderId: orderId,
      },
      data: {
        orderStatusCode: orderStatusCode ?? dbOrder.orderStatusCode,
        potentialFraud: (potentialFraud === true || potentialFraud === false)
          ? potentialFraud
          : dbOrder.potentialFraud,
        lastUpdatedBy: userId,
        // lastUpdatedOn: new Date() //auto update
      },
    });
  }
};

const updateOrderStatus: IMessageHandler = async (
  message: ITransactionStreamMessage,
  messageId,
) => {
  let retVal = false;

  LoggerCls.info(`Incoming message in Order Service ${messageId}`);
  if (message.orderDetails) {
    const orderDetails: Partial<IOrder> = JSON.parse(message.orderDetails);

    if (orderDetails.orderId && orderDetails.paymentId && orderDetails.userId) {
      LoggerCls.info(`payment received ${orderDetails.paymentId}`);

      orderDetails.orderStatusCode = ORDER_STATUS.PAYMENT_SUCCESS;

      updateOrderStatusInRedis(orderDetails);
      /**
       * In real world scenario : can use RDI/ redis gears/ any other database to database sync strategy for REDIS-> MongoDB  data transfer.
       * To keep it simple, adding  data to MongoDB manually in the same service
       */
      updateOrderStatusInPrismaDB(orderDetails);

      message.orderDetails = JSON.stringify(orderDetails);

      await streamLog({
        action: TransactionStreamActions.ASSESS_RISK,
        message: `[${REDIS_STREAMS.CONSUMERS.ORDERS}] Order status updated after payment for orderId ${orderDetails.orderId} and user ${orderDetails.userId}`,
        metadata: message,
      });

      await nextTransactionStep(message);

      retVal = true;
    }
  }
  return retVal;
};

async function checkOrderRiskScore(message: ITransactionStreamMessage) {
  let retVal = false;

  LoggerCls.info(`Incoming message in Order Service`);
  if (message.orderDetails) {
    const orderDetails: Partial<IOrder> = JSON.parse(message.orderDetails);

    if (orderDetails.orderId && orderDetails.userId) {
      LoggerCls.info(
        `Transaction risk scoring for user ${message.userId} and order ${orderDetails.orderId}`,
      );

      const { identityScore, profileScore } = message;
      const identityScoreNumber = Number(identityScore);
      const profileScoreNumber = Number(profileScore);
      let potentialFraud = false;

      if (identityScoreNumber <= 0 || profileScoreNumber < 0.5) {
        LoggerCls.info(
          `Transaction risk score is too low for user ${message.userId} and order ${orderDetails.orderId}`,
        );

        await streamLog({
          action: TransactionStreamActions.ASSESS_RISK,
          message: `[${REDIS_STREAMS.CONSUMERS.ORDERS}] Order failed fraud checks for orderId ${orderDetails.orderId} and user ${message.userId}`,
          metadata: message,
        });

        potentialFraud = true;
      }

      orderDetails.orderStatusCode = ORDER_STATUS.PENDING;
      orderDetails.potentialFraud = potentialFraud;

      updateOrderStatusInRedis(orderDetails);
      /**
       * In real world scenario : can use RDI/ redis gears/ any other database to database sync strategy for REDIS-> MongoDB  data transfer.
       * To keep it simple, adding  data to MongoDB manually in the same service
       */
      updateOrderStatusInPrismaDB(orderDetails);

      message.orderDetails = JSON.stringify(orderDetails);

      await streamLog({
        action: TransactionStreamActions.ASSESS_RISK,
        message: `[${REDIS_STREAMS.CONSUMERS.ORDERS}] Order status updated after fraud checks for orderId ${orderDetails.orderId} and user ${message.userId}`,
        metadata: message,
      });

      await nextTransactionStep(message);

      retVal = true;
    }
  }
  return retVal;
}

/**
 * Order Stats — computed on-demand directly from PostgreSQL (Payment + OrderProduct tables),
 * instead of relying on RedisGears stream triggers (statsTotalPurchaseAmount / statsProductPurchaseQtySet / ...),
 * since RedisGears / Triggers-and-Functions module is NOT available on CMC Cloud managed Redis.
 *
 * Business rule preserved from the old trigger (database/src/triggers/stream-trigger.js):
 * only orders that have a successful Payment record count towards stats
 * (a Payment row is only ever created once payment succeeds — see payments-service/service-impl.ts).
 */
const getOrderStats = async () => {
  const prisma = getPrismaClient();
  let products: Product[] = [];

  // 1. total purchase amount = sum of orderAmount across all successful payments
  const totalAgg = await prisma.payment.aggregate({
    where: { statusCode: DB_ROW_STATUS.ACTIVE },
    _sum: { orderAmount: true },
  });
  const totalPurchaseAmount = totalAgg._sum.orderAmount ?? 0;

  // 2. all order line items belonging to orders that have a successful payment
  const paidOrderProducts = await prisma.orderProduct.findMany({
    where: {
      Order: {
        Payment: { statusCode: DB_ROW_STATUS.ACTIVE },
      },
    },
    select: {
      productId: true,
      qty: true,
      productPrice: true,
      productData: true,
    },
  });

  const productQtyMap = new Map<string, number>();
  const categoryAmountMap = new Map<string, number>();
  const brandAmountMap = new Map<string, number>();

  for (const item of paidOrderProducts) {
    const qty = Number(item.qty) || 0;
    const amount = qty * (Number(item.productPrice) || 0);
    const productData: any = item.productData || {};

    productQtyMap.set(item.productId, (productQtyMap.get(item.productId) || 0) + qty);

    const category = `${productData.masterCategory_typeName || ''}:${productData.subCategory_typeName || ''}`.toLowerCase();
    if (category !== ':') {
      categoryAmountMap.set(category, (categoryAmountMap.get(category) || 0) + amount);
    }

    const brand = productData.brandName;
    if (brand) {
      brandAmountMap.set(brand, (brandAmountMap.get(brand) || 0) + amount);
    }
  }

  // shape matches the old redis zRangeWithScores(...).reverse() output: [{ value, score }], sorted desc by score
  const toSortedScoreSet = (map: Map<string, number>) =>
    Array.from(map.entries())
      .map(([value, score]) => ({ value, score }))
      .sort((a, b) => b.score - a.score);

  const productPurchaseQtySet = toSortedScoreSet(productQtyMap);
  const categoryPurchaseAmountSet = toSortedScoreSet(categoryAmountMap);
  const brandPurchaseAmountSet = toSortedScoreSet(brandAmountMap);

  if (productPurchaseQtySet.length) {
    const productIdArr = productPurchaseQtySet.map(itm => itm.value);
    products = await getProductByIds(productIdArr);

    products.sort((a, b) => {
      return productIdArr.indexOf(a.productId) - productIdArr.indexOf(b.productId);
    });
  }

  const retValue = {
    totalPurchaseAmount,
    productPurchaseQtySet,
    categoryPurchaseAmountSet,
    brandPurchaseAmountSet,
    products
  };

  return retValue;
}

const listen = () => {
  listenToStreams({
    streams: [
      {
        streamKeyName: REDIS_STREAMS.STREAMS.TRANSACTIONS,
        eventHandlers: {
          [TransactionStreamActions.PAYMENT_PROCESSED]: updateOrderStatus,
          [TransactionStreamActions.ASSESS_RISK]: checkOrderRiskScore,
        },
      },
    ],
    groupName: REDIS_STREAMS.GROUPS.ORDERS,
    consumerName: REDIS_STREAMS.CONSUMERS.ORDERS,
  });
};

const initialize = () => {
  listen();
};

export { createOrder, initialize, getOrderStats };
