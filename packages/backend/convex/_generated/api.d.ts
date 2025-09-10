/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as auth from "../auth.js";
import type * as healthCheck from "../healthCheck.js";
import type * as marketMembers from "../marketMembers.js";
import type * as marketProducts from "../marketProducts.js";
import type * as markets from "../markets.js";
import type * as priceRounds from "../priceRounds.js";
import type * as priceRoundsAdmin from "../priceRoundsAdmin.js";
import type * as prices from "../prices.js";
import type * as products from "../products.js";
import type * as profiles from "../profiles.js";
import type * as seeds from "../seeds.js";
import type * as todos from "../todos.js";
import type * as units from "../units.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  healthCheck: typeof healthCheck;
  marketMembers: typeof marketMembers;
  marketProducts: typeof marketProducts;
  markets: typeof markets;
  priceRounds: typeof priceRounds;
  priceRoundsAdmin: typeof priceRoundsAdmin;
  prices: typeof prices;
  products: typeof products;
  profiles: typeof profiles;
  seeds: typeof seeds;
  todos: typeof todos;
  units: typeof units;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
