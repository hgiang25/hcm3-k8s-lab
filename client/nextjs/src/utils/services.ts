let authorization: string;

export function clearAuthToken() {
  authorization = '';
}

async function request(input: RequestInfo | URL, init: RequestInit = {}) {
  const clientSide = typeof window !== 'undefined';

  init.headers = {
    ...init.headers,
    Accept: 'application/json',
    'Content-Type': 'application/json',
  };

  if (!authorization) {
    authorization = window.sessionStorage.getItem('myAuthToken') ?? '';
  }

  if (authorization) {
    (init.headers as any).Authorization = `Bearer ${authorization}`;
  }

  init.cache = 'no-store';
  init.next = { revalidate: 0 };

  const response = await fetch(input, init);
  const result = await response.json();

  if (!!result.auth && clientSide) {
    authorization = result.auth;
    window.sessionStorage.setItem('myAuthToken', authorization);
  }

  return result;
}

export async function getOrderHistory(): Promise<models.Order[]> {
  const results: api.OrderHistoryResponse = await request(
    `${process.env.NEXT_PUBLIC_API_GATEWAY_URI}/orderHistory/viewOrderHistory`,
  );

  return results.data;
}

export async function createOrder(
  order: Omit<models.OrderItem, 'productData'>[],
): Promise<{ data: string; error?: unknown }> {
  return await request(
    `${process.env.NEXT_PUBLIC_API_GATEWAY_URI}/orders/createOrder`,
    {
      method: 'POST',
      body: JSON.stringify({
        products: order,
      }),
    },
  );
}

export async function getProducts(_productDisplayName?: string, _productId?: string): Promise<models.Product[]> {
  const result: api.ProductResponse = await request(
    `${process.env.NEXT_PUBLIC_API_GATEWAY_URI}/products/getProductsByFilter`,
    {
      method: 'POST',
      body: JSON.stringify({
        productDisplayName: _productDisplayName || "",
        productId: _productId || "",
      }),
    },
  );

  return result.data?.map((product) => product) ?? [];
}

export async function triggerResetInventory(): Promise<string> {
  const result: string = await request(
    `${process.env.NEXT_PUBLIC_API_GATEWAY_URI}/products/triggerResetInventory`,
    {
      method: 'POST'
    }
  );

  return result;
}

export async function getOrderStats(): Promise<api.OrderStatsResponse> {
  const result = await request(
    `${process.env.NEXT_PUBLIC_API_GATEWAY_URI}/orders/getOrderStats`,
    {
      method: 'POST'
    }
  );

  return result.data;
}

export async function getZipCodes(): Promise<models.ZipCode[]> {
  const result = await request(
    `${process.env.NEXT_PUBLIC_API_GATEWAY_URI}/products/getZipCodes`,
    {
      method: 'POST',
    },
  );

  return result.data;
}

export async function getStoreProductsByGeoFilter(zipCodeInfo: models.ZipCode,
  _productDisplayName?: string, _productId?: string, _semanticProductSearchText?: string
): Promise<models.Product[]> {

  const result = await request(
    `${process.env.NEXT_PUBLIC_API_GATEWAY_URI}/products/getStoreProductsByGeoFilter`,
    {
      method: 'POST',
      body: JSON.stringify({
        productDisplayName: _productDisplayName || "",
        semanticProductSearchText: _semanticProductSearchText || "",
        productId: _productId || "",
        userLocation: {
          latitude: zipCodeInfo?.zipLocation?.latitude,
          longitude: zipCodeInfo?.zipLocation?.longitude,
        },
        other: {
          zipCode: zipCodeInfo?.zipCode
        }
      }),
    },
  );

  return result.data;
}

export async function chatBot(userMessage: string): Promise<string> {

  const result = await request(
    `${process.env.NEXT_PUBLIC_API_GATEWAY_URI}/products/chatBot`,
    {
      method: 'POST',
      body: JSON.stringify({
        userMessage: userMessage,
      }),
    },
  );

  return result.data;
}

export async function getChatHistory(): Promise<IChatMessage[]> {

  const result = await request(
    `${process.env.NEXT_PUBLIC_API_GATEWAY_URI}/products/getChatHistory`,
    {
      method: 'POST'
    },
  );

  return result.data;
}

export async function getProductsByVSSText(_searchText?: string, _embeddingsType?: string): Promise<models.Product[]> {
  const result: api.ProductResponse = await request(
    `${process.env.NEXT_PUBLIC_API_GATEWAY_URI}/products/getProductsByVSSText`,
    {
      method: 'POST',
      body: JSON.stringify({
        searchText: _searchText || "",
        maxProductCount: 10,
        similarityScoreLimit: 0.2, // 0 to 1 , here near to 0 are more similar
        embeddingsType: _embeddingsType, //OpenAI (default), HuggingFace
      }),
    },
  );

  return result.data || [];
}

export async function getProductsByVSSImageSummary(_searchText?: string): Promise<models.Product[]> {
  const result: api.ProductResponse = await request(
    `${process.env.NEXT_PUBLIC_API_GATEWAY_URI}/products/getProductsByVSSImageSummary`,
    {
      method: 'POST',
      body: JSON.stringify({
        searchText: _searchText || "",
        maxProductCount: 10,
        similarityScoreLimit: 0.2, // 0 to 1 ,  here near to 0 are more similar
      }),
    },
  );

  return result.data || [];
}

export async function login(username: string, password: string): Promise<any> {
  const result = await request(
    `${process.env.NEXT_PUBLIC_API_GATEWAY_URI}/profile/login`,
    {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    },
  );
  return result;
}

export async function registerUser(username: string, password: string, role?: string): Promise<any> {
  const result = await request(
    `${process.env.NEXT_PUBLIC_API_GATEWAY_URI}/profile/register`,
    {
      method: 'POST',
      body: JSON.stringify({ username, password, role }),
    },
  );
  return result;
}

export async function addProduct(productData: {
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
}): Promise<any> {
  const result = await request(
    `${process.env.NEXT_PUBLIC_API_GATEWAY_URI}/products/addProduct`,
    {
      method: 'POST',
      body: JSON.stringify(productData),
    },
  );
  return result;
}