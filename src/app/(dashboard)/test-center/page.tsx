"use client";

interface SimDoc {
  id: string;
  title: string;
  terms: string[];
  cluster: number;
}

interface SimCluster {
  id: number;
  name: string;
  topKeywords: string[];
  documentCount: number;
  coherenceScore: number;
}

const SAMPLE_DOCS: SimDoc[] = [
  { id: "doc-1", title: "Q4 Marketing Strategy", terms: ["marketing", "strategy", "campaign", "brand"], cluster: 0 },
  { id: "doc-2", title: "Campaign Budget 2026", terms: ["budget", "campaign", "spend", "roi"], cluster: 0 },
  { id: "doc-3", title: "Client Brief: Acme Corp", terms: ["client", "brief", "scope", "deliverables"], cluster: 1 },
  { id: "doc-4", title: "Acme SOW Draft", terms: ["sow", "scope", "timeline", "deliverables"], cluster: 1 },
  { id: "doc-5", title: "Design System v2", terms: ["design", "components", "tokens", "accessibility"], cluster: 2 },
  { id: "doc-6", title: "Brand Guidelines", terms: ["brand", "colors", "typography", "logo"], cluster: 2 },
];

const SAMPLE_CLUSTERS: SimCluster[] = [
  { id: 0, name: "Marketing & Campaigns", topKeywords: ["campaign", "marketing", "strategy"], documentCount: 2, coherenceScore: 0.82 },
  { id: 1, name: "Client Projects", topKeywords: ["client", "scope", "deliverables"], documentCount: 2, coherenceScore: 0.76 },
  { id: 2, name: "Design & Brand", topKeywords: ["design", "brand", "components"], documentCount: 2, coherenceScore: 0.71 },
];

function computeSimSimilarity(a: SimDoc, b: SimDoc): number {
  const setA = new Set(a.terms);
  const setB = new Set(b.terms);
  let overlap = 0;
  for (const term of setA) {
    if (setB.has(term)) overlap++;
  }
  return overlap / Math.sqrt(setA.size * setB.size);
}

export default function TestCenterPage() {
  const similarities: Array<{ docA: string; docB: string; score: number }> = [];
  for (let i = 0; i < SAMPLE_DOCS.length; i++) {
    for (let j = i + 1; j < SAMPLE_DOCS.length; j++) {
      const score = computeSimSimilarity(SAMPLE_DOCS[i]!, SAMPLE_DOCS[j]!);
      if (score > 0) {
        similarities.push({
          docA: SAMPLE_DOCS[i]!.title,
          docB: SAMPLE_DOCS[j]!.title,
          score: Math.round(score * 100) / 100,
        });
      }
    }
  }
  similarities.sort((a, b) => b.score - a.score);

  return (
    <div className="container mx-auto max-w-6xl p-6 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-[#1B3D5C]">
          Test Center
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          In-memory LAMINAR simulator — no live data queries
        </p>
      </div>

      {/* Clusters */}
      <section>
        <h2 className="text-lg font-semibold text-[#1B3D5C] mb-3">
          Simulated ARCHIPELAGOS
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {SAMPLE_CLUSTERS.map((cluster) => (
            <div
              key={cluster.id}
              className="bg-slate-50 rounded-xl p-4 space-y-2"
            >
              <p className="text-sm font-medium text-[#1B3D5C]">
                {cluster.name}
              </p>
              <p className="text-xs text-slate-500">
                {cluster.documentCount} docs · coherence{" "}
                {cluster.coherenceScore.toFixed(2)}
              </p>
              <div className="flex gap-1 flex-wrap">
                {cluster.topKeywords.map((kw) => (
                  <span
                    key={kw}
                    className="text-[10px] bg-[#00BCD4]/10 text-[#00BCD4] px-1.5 py-0.5 rounded-full"
                  >
                    {kw}
                  </span>
                ))}
              </div>
              <div className="space-y-1 mt-2">
                {SAMPLE_DOCS.filter((d) => d.cluster === cluster.id).map(
                  (doc) => (
                    <p
                      key={doc.id}
                      className="text-xs text-slate-600 pl-2 border-l-2 border-[#00BCD4]/30"
                    >
                      {doc.title}
                    </p>
                  )
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Similarity Matrix */}
      <section>
        <h2 className="text-lg font-semibold text-[#1B3D5C] mb-3">
          Simulated Similarity Scores
        </h2>
        <div className="bg-slate-50 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#1B3D5C] text-white">
                <th className="px-4 py-2 text-left">Document A</th>
                <th className="px-4 py-2 text-left">Document B</th>
                <th className="px-4 py-2 text-right">Score</th>
              </tr>
            </thead>
            <tbody>
              {similarities.map((sim, idx) => (
                <tr
                  key={idx}
                  className="border-t border-slate-200"
                >
                  <td className="px-4 py-2 text-slate-700">{sim.docA}</td>
                  <td className="px-4 py-2 text-slate-700">{sim.docB}</td>
                  <td className="px-4 py-2 text-right font-mono text-[#00BCD4]">
                    {sim.score.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Pipeline Status */}
      <section>
        <h2 className="text-lg font-semibold text-[#1B3D5C] mb-3">
          Simulated Pipeline
        </h2>
        <div className="space-y-2">
          {[
            { stage: "ARCHIPELAGOS", status: "completed", docs: 6, time: "45ms" },
            { stage: "CURRENTS", status: "completed", docs: 6, time: "12ms" },
            { stage: "Knowledge Graph", status: "completed", edges: 8, time: "23ms" },
            { stage: "CASCADE", status: "completed", affected: 4, time: "8ms" },
            { stage: "Fractal Wisdom", status: "completed", patterns: 3, time: "15ms" },
          ].map((stage) => (
            <div
              key={stage.stage}
              className="flex items-center justify-between bg-slate-50 rounded-lg px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <span className="h-2 w-2 rounded-full bg-[#00BCD4]" />
                <span className="text-sm font-medium text-[#1B3D5C]">
                  {stage.stage}
                </span>
              </div>
              <span className="text-xs text-slate-500">{stage.time}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
