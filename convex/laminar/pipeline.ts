/**
 * LAMINAR PIPELINE — Composable Stage Architecture
 *
 * Each stage receives the current LaminarState and returns a partial update.
 * The orchestrator merges updates sequentially. Stages are independently
 * testable, swappable, and upgradeable.
 *
 * SC2 Principle: Composition over Inheritance
 * Units are containers for swappable components, not rigid inheritance trees.
 * A Flying Building (Terran) works because it composes FlightComponent
 * with BuildingComponent -- not because it extends both.
 *
 * BOUNDARY RULE: This file must NEVER import from:
 *   - convex/_generated/
 *   - convex/server
 *   - convex/values
 *   - Any Convex runtime module
 *
 * All types and the orchestrator function are pure TypeScript.
 */

// ── Core State Shape ────────────────────────────────────────────────────────

export interface LaminarDocument {
  _id: string;
  userId: string;
  contentPlain: string;
  type: "pdf" | "text" | "markdown";
  title: string;
}

export interface ClusterAssignment {
  clusterId: string;
  probability: number;
  isPrimary: boolean;
  isAmbiguous: boolean;
}

export interface KnowledgeEdge {
  sourceDocId: string;
  targetDocId: string;
  weight: number;
  signals: {
    contentSimilarity: number;
    temporalProximity: number;
    coAccessStrength: number;
    structuralLink: number;
  };
  isBridge: boolean;
}

export interface CascadeImpact {
  documentId: string;
  impactScore: number;
  depth: number;
}

export interface WisdomPattern {
  patternType: "micro" | "meso" | "macro";
  description: string;
  documentIds: string[];
  confidence: number;
}

// ── Pipeline State ──────────────────────────────────────────────────────────

export interface LaminarState {
  userId: string;
  runId: string;
  documents: LaminarDocument[];

  // Stage 1: ARCHIPELAGOS -- populated after clustering
  clusters?: {
    assignments: Map<string, ClusterAssignment[]>;
    centroids: number[][];
    silhouetteScore: number;
  };

  // Stage 2: CURRENTS -- populated after temporal analysis
  temporalGraph?: {
    cooccurrences: Map<string, number>;
    patterns: Map<string, { trend: string; predictedRelevance: number }>;
  };

  // Stage 3: Knowledge Graph -- populated after edge fusion
  knowledgeEdges?: KnowledgeEdge[];

  // Stage 4: CASCADE -- populated after butterfly effect analysis
  cascadeMap?: Map<string, CascadeImpact[]>;

  // Stage 5: FRACTAL -- populated after wisdom distillation
  fractalPatterns?: WisdomPattern[];
}

// ── Stage Interface ─────────────────────────────────────────────────────────

export interface RunContext {
  // The Convex action context -- passed from runner.ts
  // Typed as unknown here to avoid importing Convex internals into this file
  db: unknown;
  scheduler: unknown;
  runQuery: unknown;
  runMutation: unknown;
}

export interface LaminarStageResult {
  // Each stage returns only the state slice it populates.
  // Uses conditional spreading to satisfy exactOptionalPropertyTypes.
  clusters?: LaminarState["clusters"];
  temporalGraph?: LaminarState["temporalGraph"];
  knowledgeEdges?: LaminarState["knowledgeEdges"];
  cascadeMap?: LaminarState["cascadeMap"];
  fractalPatterns?: LaminarState["fractalPatterns"];
}

export interface LaminarStage {
  name: string;
  /**
   * Process receives the full current state and returns only the fields
   * this stage populates. The orchestrator merges the result into state.
   *
   * Stages must be pure with respect to state -- read any field from
   * input state, write only to the fields declared in LaminarStageResult.
   */
  process(
    state: LaminarState,
    ctx: RunContext
  ): Promise<LaminarStageResult>;
}

// ── Orchestrator Helper ─────────────────────────────────────────────────────

/**
 * Run a pipeline of stages sequentially, merging state after each.
 * Any stage can be skipped by filtering the pipeline array before calling.
 *
 * Usage in runner.ts:
 *   const finalState = await runPipeline(initialState, pipeline, ctx);
 */
export async function runPipeline(
  initialState: LaminarState,
  stages: LaminarStage[],
  ctx: RunContext
): Promise<LaminarState> {
  let state = initialState;
  for (const stage of stages) {
    console.log(`[LAMINAR] Running stage: ${stage.name}`);
    const startMs = Date.now();
    try {
      const delta = await stage.process(state, ctx);
      // Merge only defined keys from delta into state.
      // This respects exactOptionalPropertyTypes: we never assign undefined.
      const nextState: LaminarState = {
        userId: state.userId,
        runId: state.runId,
        documents: state.documents,
      };
      // Preserve existing optional fields from state
      if (state.clusters !== undefined) nextState.clusters = state.clusters;
      if (state.temporalGraph !== undefined) nextState.temporalGraph = state.temporalGraph;
      if (state.knowledgeEdges !== undefined) nextState.knowledgeEdges = state.knowledgeEdges;
      if (state.cascadeMap !== undefined) nextState.cascadeMap = state.cascadeMap;
      if (state.fractalPatterns !== undefined) nextState.fractalPatterns = state.fractalPatterns;
      // Apply delta (overrides with new values from this stage)
      if (delta.clusters !== undefined) nextState.clusters = delta.clusters;
      if (delta.temporalGraph !== undefined) nextState.temporalGraph = delta.temporalGraph;
      if (delta.knowledgeEdges !== undefined) nextState.knowledgeEdges = delta.knowledgeEdges;
      if (delta.cascadeMap !== undefined) nextState.cascadeMap = delta.cascadeMap;
      if (delta.fractalPatterns !== undefined) nextState.fractalPatterns = delta.fractalPatterns;
      state = nextState;
      console.log(`[LAMINAR] ${stage.name} complete in ${Date.now() - startMs}ms`);
    } catch (err) {
      console.error(`[LAMINAR] Stage ${stage.name} failed:`, err);
      throw err;
    }
  }
  return state;
}

// ── Document Signal Types (Phase 5) ─────────────────────────────────────────

/**
 * DocumentSignals: type-specific semantic signals extracted before vectorization.
 *
 * These signals are LOST when documents are converted to contentPlain strings.
 * Recovering them improves cluster quality -- markdown headers signal structure,
 * PDF metadata signals authority, plain text density signals richness.
 *
 * SC2 Principle: Polymorphism -- a Zergling and Stalker implement IAttackable.
 * A markdown doc and PDF doc implement IProcessable -> DocumentSignals.
 */
export interface DocumentSignals {
  /** Cleaned, normalized terms for TF-IDF vectorization */
  terms: string[];

  /**
   * Structural organization score [0.0, 1.0]
   * Markdown: presence of headers, lists, code blocks -> high
   * PDF: document outline depth -> moderate
   * Plain text: paragraph density -> low
   */
  structuralWeight: number;

  /**
   * External authority score [0.0, 1.0]
   * PDF: title, author, subject metadata present -> high
   * Markdown: front matter / YAML headers -> moderate
   * Plain text: no metadata -> 0.0
   */
  authorityScore: number;

  /**
   * Content richness ratio [0.0, 1.0]
   * Ratio of unique meaningful terms to total tokens.
   * High density -> topic-focused doc (good for tight clusters)
   * Low density -> broad/overview doc (likely bridge candidate)
   */
  density: number;

  /** Original document type for logging and debugging */
  sourceType: "pdf" | "text" | "markdown";
}

export interface IProcessable {
  extract(content: string, type: "pdf" | "text" | "markdown"): DocumentSignals;
}
