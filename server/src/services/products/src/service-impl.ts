import type { Product } from '@prisma/client';
import type { IProduct } from '../../../common/models/product';
import type { IZipCode } from '../../../common/models/zip-code';
import type { IStoreInventory, IStoreProduct } from '../../../common/models/store-inventory';

import { Prisma } from '@prisma/client';

import { DB_ROW_STATUS } from '../../../common/models/order';
import { getPrismaClient } from '../../../common/utils/prisma/prisma-wrapper';
import * as ProductRepo from '../../../common/models/product-repo';
import * as ZipCodeRepo from '../../../common/models/zip-code-repo';
import * as StoreInventoryRepo from '../../../common/models/store-inventory-repo';
import { SERVER_CONFIG } from '../../../common/config/server-config';

import { getNodeRedisClient, AggregateSteps } from '../../../common/utils/redis/redis-wrapper';
import {
  chatBotMessage, getChatBotHistory, CHAT_CONSTANTS,
  getSimilarProductsByVSS, getSimilarProductsScoreByVSS,
  getSimilarProductsScoreByVSSImageSummary
} from './open-ai-prompt';

interface IInventoryBodyFilter {
  productDisplayName?: string; // 1
  semanticProductSearchText?: string; // 2 , either 1 or 2

  productId?: string;
  searchRadiusInMiles?: number;
  userLocation?: {
    latitude?: number;
    longitude?: number;
  },
}
interface IChatMessage {
  sender: string;
  message: string;
}

interface IProductsVSSBodyFilter {
  searchText?: string;
  maxProductCount?: number;
  similarityScoreLimit?: number;
  embeddingsType?: string;
}

const getProductsByFilter = async (productFilter: Product) => {
  return await getProductsByFilterFromDB(productFilter);
};

async function getProductsByFilterFromDB(productFilter: Product) {
  const prisma = getPrismaClient();

  const whereQuery: Prisma.ProductWhereInput = {
    statusCode: DB_ROW_STATUS.ACTIVE,
    stockQty: {
      gt: 0
    }
  };

  if (productFilter?.productDisplayName) {
    whereQuery.productDisplayName = {
      contains: productFilter.productDisplayName,
      mode: 'insensitive',
    };
  }
  else if (productFilter?.productId) {
    whereQuery.productId = productFilter.productId;
  }


  const products: Product[] = await prisma.product.findMany({
    where: whereQuery,
  });

  return products;
}

const triggerResetInventory = async () => {
  const redisClient = getNodeRedisClient();

  //@ts-ignore
  const result = await redisClient.sendCommand(["TFCALLASYNC", "OnDemandTriggers.resetInventory", "0"], {
    isolated: true
  });
  console.log(`triggerResetInventory :  `, result);

  return result;
}

const getZipCodes = async () => {
  // ZipCodes uses RediSearch. We are returning an empty array to bypass CMC Cloud Redis limitations.
  return [];
};

const getSemanticProductsForStoreSearch = async (
  _inventoryFilter: IInventoryBodyFilter,
  openAIApiKey?: string,
  maxProductCount?: number,
  similarityScoreLimit?: number
) => {

  let productIds: string[] = [];

  if (_inventoryFilter.semanticProductSearchText) {
    //VSS search
    const vectorDocs = await getSimilarProductsScoreByVSS({
      standAloneQuestion: _inventoryFilter.semanticProductSearchText,
      openAIApiKey: openAIApiKey,
      KNN: maxProductCount,
      scoreLimit: similarityScoreLimit,
    });

    if (vectorDocs?.length) {
      productIds = vectorDocs.map(doc => doc?.metadata?.productId);
    }
  }

  return productIds;
}

const searchStoreInventoryByGeoFilter = async (
  _inventoryFilter: IInventoryBodyFilter,
  openAIApiKey?: string,
  maxProductCount?: number,
  similarityScoreLimit?: number
) => {
  const redisClient = getNodeRedisClient();
  const repository = StoreInventoryRepo.getRepository();
  let storeProducts: IStoreInventory[] = [];
  const trimmedStoreProducts: IStoreInventory[] = [] // similar item of other stores are removed
  const uniqueProductIds = {};
  let semanticProductIds: string[] = [];

  if (repository
    && _inventoryFilter?.userLocation?.latitude
    && _inventoryFilter?.userLocation?.longitude) {


    if (_inventoryFilter.semanticProductSearchText) {
      semanticProductIds = await getSemanticProductsForStoreSearch(_inventoryFilter, openAIApiKey, maxProductCount, similarityScoreLimit);
      console.log("semanticProductIds : ", semanticProductIds);
      if (!semanticProductIds?.length) {
        _inventoryFilter.productDisplayName = _inventoryFilter.semanticProductSearchText;
      }
    }


    const lat = _inventoryFilter.userLocation.latitude;
    const long = _inventoryFilter.userLocation.longitude;
    const radiusInMiles = _inventoryFilter.searchRadiusInMiles || 500;

    let queryBuilder = repository
      .search()
      .and('statusCode')
      .eq(DB_ROW_STATUS.ACTIVE)
      .and('stockQty')
      .gt(0)
      .and('storeLocation')
      .inRadius((circle) => {
        return circle
          .latitude(lat)
          .longitude(long)
          .radius(radiusInMiles)
          .miles
      });

    if (_inventoryFilter.productDisplayName) {
      queryBuilder = queryBuilder
        .and('productDisplayName')
        .matches(_inventoryFilter.productDisplayName)
    }
    else if (_inventoryFilter.productId) {
      queryBuilder = queryBuilder
        .and('productId')
        .eq(_inventoryFilter.productId)
    }

    console.log(queryBuilder.query);

    /* Sample queryBuilder.query to run on CLI
    FT.SEARCH "storeInventory:storeInventoryId:index" "( ( ( (@statusCode:[1 1]) (@stockQty:[(0 +inf]) ) (@storeLocation:[-73.968285 40.785091 50 mi]) ) (@productDisplayName:'puma') )"
            */

    const indexName = `${StoreInventoryRepo.STORE_INVENTORY_KEY_PREFIX}:index`;
    const aggregator = await redisClient.ft.aggregate(
      indexName,
      queryBuilder.query,
      {
        LOAD: ["@storeId", "@storeName", "@storeLocation", "@productId", "@productDisplayName", "@stockQty"],
        STEPS: [{
          type: AggregateSteps.APPLY,
          expression: `geodistance(@storeLocation, ${long}, ${lat})/1609`, //convert to miles
          AS: 'distInMiles'
        }, {
          type: AggregateSteps.SORTBY,
          BY: ["@distInMiles", "@productId"]
        }, {
          type: AggregateSteps.LIMIT,
          from: 0,
          size: 1000, //must be > storeInventory count
        }]
      });

    /* Sample command to run on CLI
        FT.AGGREGATE "storeInventory:storeInventoryId:index"
          "( ( ( (@statusCode:[1 1]) (@stockQty:[(0 +inf]) ) (@storeLocation:[-73.968285 40.785091 50 mi]) ) (@productDisplayName:'puma') )"
          "LOAD" "6" "@storeId" "@storeName" "@storeLocation" "@productId" "@productDisplayName" "@stockQty"
          "APPLY" "geodistance(@storeLocation, -73.968285, 40.785091)/1609"
          "AS" "distInMiles"
          "SORTBY" "1" "@distInMiles"
          "LIMIT" "0" "100"
    */

    storeProducts = <IStoreInventory[]>aggregator.results;

    if (!storeProducts.length) {
      // throw `Product not found with in ${radiusInMiles}mi range!`;
    }
    else {

      // filter storeProducts to keep only  semanticProductIds
      if (_inventoryFilter.semanticProductSearchText && semanticProductIds?.length) {
        storeProducts = storeProducts.filter((storeProduct) => {
          return storeProduct.productId && semanticProductIds.includes(storeProduct.productId);
        });
      }

      storeProducts.forEach((storeProduct) => {
        if (storeProduct?.productId && !uniqueProductIds[storeProduct.productId]) {
          uniqueProductIds[storeProduct.productId] = true;

          if (typeof storeProduct.storeLocation == "string") {
            const location = storeProduct.storeLocation.split(",");
            storeProduct.storeLocation = {
              longitude: Number(location[0]),
              latitude: Number(location[1]),
            }
          }

          trimmedStoreProducts.push(storeProduct)
        }
      });
    }
  }
  else {
    throw "Mandatory fields like userLocation latitude / longitude missing !"
  }

  return {
    storeProducts: trimmedStoreProducts,
    productIds: Object.keys(uniqueProductIds)
  };
};
const getStoreProductsByGeoFilter = async (_inventoryFilter: IInventoryBodyFilter) => {
  let products: IStoreProduct[] = [];

  const openAIApiKey = process.env.OPEN_AI_API_KEY;
  const maxProductCount = 10;// IfSemanticSearch
  const similarityScoreLimit = SERVER_CONFIG.PRODUCTS_SERVICE.VSS_SCORE_LIMIT;

  const { storeProducts, productIds } = await searchStoreInventoryByGeoFilter(_inventoryFilter, openAIApiKey, maxProductCount, similarityScoreLimit);

  if (storeProducts?.length && productIds?.length) {
    const repository = ProductRepo.getRepository();
    //products with details
    let generalProducts = <IProduct | IProduct[]>await repository.fetch(...productIds);
    if (!Array.isArray(generalProducts)) {
      generalProducts = [generalProducts];
    }

    //mergedProducts
    products = storeProducts.map(storeProd => {
      const matchingGeneralProd = generalProducts.find(generalProd => generalProd.productId === storeProd.productId);
      //@ts-ignore
      const mergedProd: IStoreProduct = { ...matchingGeneralProd, ...storeProd };
      return mergedProd;
    });
  }


  return products;
};

const chatBot = async (_userMessage: string, _sessionId: string) => {
  let answer = "";

  if (_userMessage && _sessionId) {
    const openAIApiKey = process.env.OPEN_AI_API_KEY;
    if (openAIApiKey) {
      answer = await chatBotMessage(_userMessage, _sessionId, openAIApiKey);
    }
    else {
      answer = "Please provide openAI API key in .env file";
    }
  }
  else {
    throw new Error("No user message or session id provided");
  }

  return answer;
}
const getChatHistory = async (_sessionId: string) => {
  let chatMessages: IChatMessage[] = [];

  if (_sessionId) {
    const historyArr = await getChatBotHistory(_sessionId);

    if (historyArr?.length) {
      historyArr.forEach((item) => {
        let sender = "";
        let message = "";
        if (item.startsWith(CHAT_CONSTANTS.userMessagePrefix)) {
          sender = CHAT_CONSTANTS.senderUser;
          message = item.replace(CHAT_CONSTANTS.userMessagePrefix, "");
        }
        else if (item.startsWith(CHAT_CONSTANTS.openAIMessagePrefix)) {
          sender = CHAT_CONSTANTS.senderAssistant;
          message = item.replace(CHAT_CONSTANTS.openAIMessagePrefix, "");
        }

        chatMessages.push({
          sender: sender,
          message: message
        })
      });
    }
  }
  else {
    throw new Error("No session id provided");
  }

  return chatMessages;
}

const getProductByIds = async (productIds: string[], isActiveQty: boolean) => {
  let products: IProduct | IProduct[] = [];

  if (productIds?.length) {
    const repository = ProductRepo.getRepository();
    products = <IProduct | IProduct[]>await repository.fetch(...productIds);
    if (!Array.isArray(products)) {
      products = [products];
    }
    if (isActiveQty) {
      products = products.filter(prod => prod?.statusCode === DB_ROW_STATUS.ACTIVE && prod?.stockQty > 0);
    }

    //return products in  order of productIds
    products.sort((prod1, prod2) => {
      return productIds.indexOf(prod1.productId) - productIds.indexOf(prod2.productId);
    });

  }
  return products;
}

const getProductsByVSSText = async (productsVSSFilter: IProductsVSSBodyFilter) => {
  let { searchText, maxProductCount, similarityScoreLimit, embeddingsType } = productsVSSFilter;
  let products: IProduct[] = [];

  const openAIApiKey = process.env.OPEN_AI_API_KEY || "";
  const huggingFaceApiKey = process.env.HUGGING_FACE_API_KEY || "";
  const VSS_EMBEDDINGS_TYPE = SERVER_CONFIG.PRODUCTS_SERVICE.VSS_EMBEDDINGS_TYPE;
  maxProductCount = maxProductCount || SERVER_CONFIG.PRODUCTS_SERVICE.VSS_KNN;
  similarityScoreLimit = similarityScoreLimit || SERVER_CONFIG.PRODUCTS_SERVICE.VSS_SCORE_LIMIT;
  embeddingsType = embeddingsType || VSS_EMBEDDINGS_TYPE.OPEN_AI;

  if (embeddingsType === VSS_EMBEDDINGS_TYPE.OPEN_AI && !openAIApiKey) {
    throw new Error("Please provide openAI API key in .env file");
  }
  else if (embeddingsType === VSS_EMBEDDINGS_TYPE.HUGGING_FACE && !huggingFaceApiKey) {
    throw new Error("Please provide huggingFace API key in .env file");
  }

  if (!searchText) {
    throw new Error("Please provide search text");
  }

  //VSS search
  const vectorDocs = await getSimilarProductsScoreByVSS({
    standAloneQuestion: searchText,
    openAIApiKey: openAIApiKey,
    huggingFaceApiKey: huggingFaceApiKey,
    KNN: maxProductCount,
    scoreLimit: similarityScoreLimit,
    embeddingsType: embeddingsType
  });

  if (vectorDocs?.length) {
    const productIds = vectorDocs.map(doc => doc?.metadata?.productId);

    //get product with details
    products = await getProductByIds(productIds, true);
  }

  //add similarityScore to products
  if (products?.length) {
    products = products.map(prod => {
      const matchingDoc = vectorDocs.find(doc => doc?.metadata?.productId === prod.productId);
      if (matchingDoc) {
        prod["similarityScore"] = matchingDoc["similarityScore"];
      }
      return prod;
    });
  }

  return products;
}

const getProductsByVSSImageSummary = async (productsVSSFilter: IProductsVSSBodyFilter) => {
  let { searchText, maxProductCount, similarityScoreLimit } = productsVSSFilter;
  let products: IProduct[] = [];

  const openAIApiKey = process.env.OPEN_AI_API_KEY || "";
  maxProductCount = maxProductCount || SERVER_CONFIG.PRODUCTS_SERVICE.VSS_KNN;
  similarityScoreLimit = similarityScoreLimit || SERVER_CONFIG.PRODUCTS_SERVICE.VSS_SCORE_LIMIT;

  if (!openAIApiKey) {
    throw new Error("Please provide openAI API key in .env file");
  }

  if (!searchText) {
    throw new Error("Please provide search text");
  }

  //VSS search
  const vectorDocs = await getSimilarProductsScoreByVSSImageSummary({
    standAloneQuestion: searchText,
    openAIApiKey: openAIApiKey,
    KNN: maxProductCount,
    scoreLimit: similarityScoreLimit,
  });

  if (vectorDocs?.length) {
    const productIds = vectorDocs.map(doc => doc?.metadata?.productId);

    //get product with details
    products = await getProductByIds(productIds, true);
  }

  //add similarityScore to products
  if (products?.length) {
    products = products.map(prod => {
      const matchingDoc = vectorDocs.find(doc => doc?.metadata?.productId === prod.productId);
      if (matchingDoc) {
        prod["similarityScore"] = matchingDoc["similarityScore"];
        prod["imageSummary"] = matchingDoc["pageContent"];
      }
      return prod;
    });
  }

  return products;
}

const addProduct = async (productData: {
  productDisplayName: string;
  price: number;
  brandName?: string;
  variantName?: string;
  ageGroup?: string;
  gender?: string;
  displayCategories?: string;
  masterCategory_typeName?: string;
  subCategory_typeName?: string;
  styleImages_default_imageURL?: string;
  productDescriptors_description_value?: string;
  stockQty?: number;
  productColors?: string;
}) => {
  const prisma = getPrismaClient();
  const redisClient = getNodeRedisClient();

  // Generate a unique productId
  const productId = 'P_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);

  const newProduct: Prisma.ProductCreateInput = {
    productId,
    productDisplayName: productData.productDisplayName,
    price: Number(productData.price),
    brandName: productData.brandName || '',
    variantName: productData.variantName || '',
    ageGroup: productData.ageGroup || '',
    gender: productData.gender || '',
    displayCategories: productData.displayCategories || '',
    masterCategory_typeName: productData.masterCategory_typeName || '',
    subCategory_typeName: productData.subCategory_typeName || '',
    styleImages_default_imageURL: productData.styleImages_default_imageURL || '',
    productDescriptors_description_value: productData.productDescriptors_description_value || '',
    stockQty: Number(productData.stockQty) || 25,
    productColors: productData.productColors || '',
    createdBy: 'ADMIN',
  };

  // 1. Save to MongoDB via Prisma
  const insertedProduct = await prisma.product.create({
    data: newProduct,
  });

  // 2. Save to Redis JSON for instant search/cache availability
  // Disabled: redisClient.json.set requires RedisJSON module which is not available on CMC Cloud Redis.

  return insertedProduct;
};

export {
  getProductsByFilter,
  getProductsByFilterFromDB,
  triggerResetInventory,
  getZipCodes,
  getStoreProductsByGeoFilter,
  chatBot,
  getChatHistory,
  getProductsByVSSText,
  getProductsByVSSImageSummary,
  addProduct
};
