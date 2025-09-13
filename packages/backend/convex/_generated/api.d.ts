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
import type * as admins from "../admins.js";
import type * as assignments from "../assignments.js";
import type * as healthCheck from "../healthCheck.js";
import type * as markets from "../markets.js";
import type * as members from "../members.js";
import type * as products from "../products.js";
import type * as reports from "../reports.js";
import type * as seeds from "../seeds.js";
import type * as settings from "../settings.js";
import type * as surveyItems from "../surveyItems.js";
import type * as surveys from "../surveys.js";
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
  admins: typeof admins;
  assignments: typeof assignments;
  healthCheck: typeof healthCheck;
  markets: typeof markets;
  members: typeof members;
  products: typeof products;
  reports: typeof reports;
  seeds: typeof seeds;
  settings: typeof settings;
  surveyItems: typeof surveyItems;
  surveys: typeof surveys;
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
