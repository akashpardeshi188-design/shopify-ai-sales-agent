export const VALIDATE_CONNECTION_QUERY = /* GraphQL */ `
  query ValidateConnection {
    shop {
      name
      myshopifyDomain
      currencyCode
      ianaTimezone
      plan {
        displayName
      }
    }
    currentAppInstallation {
      accessScopes {
        handle
      }
    }
  }
`;

export const COLLECTIONS_QUERY = /* GraphQL */ `
  query Collections($first: Int!, $after: String, $filter: String) {
    collections(first: $first, after: $after, query: $filter) {
      edges {
        cursor
        node {
          id
          title
          handle
        }
      }
      pageInfo {
        hasNextPage
      }
    }
  }
`;

export const PRODUCTS_QUERY = /* GraphQL */ `
  query Products($first: Int!, $after: String, $filter: String) {
    products(first: $first, after: $after, query: $filter) {
      edges {
        cursor
        node {
          id
          title
          description
          vendor
          productType
          tags
          status
          handle
          featuredImage {
            url
          }
          priceRangeV2 {
            minVariantPrice {
              amount
            }
            maxVariantPrice {
              amount
            }
          }
          collections(first: 20) {
            edges {
              node {
                id
              }
            }
          }
          variants(first: 100) {
            edges {
              node {
                id
                title
                sku
                price
                compareAtPrice
                inventoryQuantity
                availableForSale
              }
            }
          }
        }
      }
      pageInfo {
        hasNextPage
      }
    }
  }
`;

export const CUSTOMERS_QUERY = /* GraphQL */ `
  query Customers($first: Int!, $after: String, $filter: String) {
    customers(first: $first, after: $after, query: $filter) {
      edges {
        cursor
        node {
          id
          email
          firstName
          lastName
          numberOfOrders
          amountSpent {
            amount
          }
        }
      }
      pageInfo {
        hasNextPage
      }
    }
  }
`;

export const ORDERS_QUERY = /* GraphQL */ `
  query Orders($first: Int!, $after: String, $filter: String) {
    orders(first: $first, after: $after, query: $filter) {
      edges {
        cursor
        node {
          id
          name
          customer {
            id
          }
          totalPriceSet {
            shopMoney {
              amount
              currencyCode
            }
          }
          displayFinancialStatus
          displayFulfillmentStatus
          createdAt
          lineItems(first: 50) {
            edges {
              node {
                title
                quantity
                originalUnitPriceSet {
                  shopMoney {
                    amount
                  }
                }
              }
            }
          }
        }
      }
      pageInfo {
        hasNextPage
      }
    }
  }
`;

export const WEBHOOK_SUBSCRIPTION_CREATE_MUTATION = /* GraphQL */ `
  mutation WebhookSubscriptionCreate(
    $topic: WebhookSubscriptionTopic!
    $webhookSubscription: WebhookSubscriptionInput!
  ) {
    webhookSubscriptionCreate(
      topic: $topic
      webhookSubscription: $webhookSubscription
    ) {
      webhookSubscription {
        id
      }
      userErrors {
        field
        message
      }
    }
  }
`;
