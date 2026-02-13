/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as ai from "../ai.js";
import type * as documents from "../documents.js";
import type * as laminar_confidence from "../laminar/confidence.js";
import type * as laminar_engine from "../laminar/engine.js";
import type * as laminar_kmeans from "../laminar/kmeans.js";
import type * as laminar_queries from "../laminar/queries.js";
import type * as laminar_tfidf from "../laminar/tfidf.js";
import type * as migrations from "../migrations.js";
import type * as queries from "../queries.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  ai: typeof ai;
  documents: typeof documents;
  "laminar/confidence": typeof laminar_confidence;
  "laminar/engine": typeof laminar_engine;
  "laminar/kmeans": typeof laminar_kmeans;
  "laminar/queries": typeof laminar_queries;
  "laminar/tfidf": typeof laminar_tfidf;
  migrations: typeof migrations;
  queries: typeof queries;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
