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
import type * as laminar_access from "../laminar/access.js";
import type * as laminar_cascade from "../laminar/cascade.js";
import type * as laminar_confidence from "../laminar/confidence.js";
import type * as laminar_cooccurrence from "../laminar/cooccurrence.js";
import type * as laminar_engine from "../laminar/engine.js";
import type * as laminar_fractal from "../laminar/fractal.js";
import type * as laminar_graph from "../laminar/graph.js";
import type * as laminar_kmeans from "../laminar/kmeans.js";
import type * as laminar_pipeline from "../laminar/pipeline.js";
import type * as laminar_processors from "../laminar/processors.js";
import type * as laminar_queries from "../laminar/queries.js";
import type * as laminar_runner from "../laminar/runner.js";
import type * as laminar_temporal from "../laminar/temporal.js";
import type * as laminar_temporalRunner from "../laminar/temporalRunner.js";
import type * as laminar_tfidf from "../laminar/tfidf.js";
import type * as lib_tierGuard from "../lib/tierGuard.js";
import type * as migrations from "../migrations.js";
import type * as queries from "../queries.js";
import type * as subscriptions from "../subscriptions.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  ai: typeof ai;
  documents: typeof documents;
  "laminar/access": typeof laminar_access;
  "laminar/cascade": typeof laminar_cascade;
  "laminar/confidence": typeof laminar_confidence;
  "laminar/cooccurrence": typeof laminar_cooccurrence;
  "laminar/engine": typeof laminar_engine;
  "laminar/fractal": typeof laminar_fractal;
  "laminar/graph": typeof laminar_graph;
  "laminar/kmeans": typeof laminar_kmeans;
  "laminar/pipeline": typeof laminar_pipeline;
  "laminar/processors": typeof laminar_processors;
  "laminar/queries": typeof laminar_queries;
  "laminar/runner": typeof laminar_runner;
  "laminar/temporal": typeof laminar_temporal;
  "laminar/temporalRunner": typeof laminar_temporalRunner;
  "laminar/tfidf": typeof laminar_tfidf;
  "lib/tierGuard": typeof lib_tierGuard;
  migrations: typeof migrations;
  queries: typeof queries;
  subscriptions: typeof subscriptions;
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
