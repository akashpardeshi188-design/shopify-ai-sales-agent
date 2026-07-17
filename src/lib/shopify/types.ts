export type ValidateConnectionResult = {
  shop: {
    name: string;
    myshopifyDomain: string;
    currencyCode: string;
    ianaTimezone: string;
    plan: { displayName: string } | null;
  };
  currentAppInstallation: {
    accessScopes: { handle: string }[];
  };
};

export type PageInfo = { hasNextPage: boolean };

export type ShopifyCollectionNode = {
  id: string;
  title: string;
  handle: string;
};

export type ShopifyProductNode = {
  id: string;
  title: string;
  description: string | null;
  vendor: string | null;
  productType: string | null;
  tags: string[];
  status: "ACTIVE" | "ARCHIVED" | "DRAFT";
  handle: string;
  featuredImage: { url: string } | null;
  priceRangeV2: {
    minVariantPrice: { amount: string };
    maxVariantPrice: { amount: string };
  };
  collections: { edges: { node: { id: string } }[] };
  variants: {
    edges: {
      node: {
        id: string;
        title: string;
        sku: string | null;
        price: string;
        compareAtPrice: string | null;
        inventoryQuantity: number | null;
        availableForSale: boolean;
      };
    }[];
  };
};

export type ShopifyCustomerNode = {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  numberOfOrders: string;
  amountSpent: { amount: string } | null;
};

export type ShopifyOrderNode = {
  id: string;
  name: string;
  customer: { id: string } | null;
  totalPriceSet: { shopMoney: { amount: string; currencyCode: string } };
  displayFinancialStatus: string | null;
  displayFulfillmentStatus: string | null;
  createdAt: string;
  lineItems: {
    edges: {
      node: {
        title: string;
        quantity: number;
        originalUnitPriceSet: { shopMoney: { amount: string } } | null;
      };
    }[];
  };
};

export type Connection<T> = {
  edges: { cursor: string; node: T }[];
  pageInfo: PageInfo;
};
