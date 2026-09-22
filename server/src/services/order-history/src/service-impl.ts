import type { IOrder } from '../../../common/models/order';

import { getPrismaClient } from '../../../common/utils/prisma/prisma-wrapper';
import { ORDER_STATUS, DB_ROW_STATUS } from '../../../common/models/order';
const viewOrderHistory = async (userId: string) => {
  if (userId) {
    const prisma = getPrismaClient();
    let orders: any[] = [];
    
    try {
      orders = await prisma.order.findMany({
        where: {
          userId: userId,
          orderStatusCode: { gte: ORDER_STATUS.CREATED },
          statusCode: DB_ROW_STATUS.ACTIVE
        },
        include: {
          products: true
        }
      });
    } catch (err) {
      console.error("Error fetching order history from DB", err);
    }

    return orders;
  } else {
    throw 'userId is mandatory!';
  }
};

export { viewOrderHistory };
