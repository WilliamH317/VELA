"use client";

import { useState, useRef } from "react";
import { ChevronDown } from "lucide-react";

// ============================================================================
// CONTENT — pasted verbatim from Captain's Watch
// ============================================================================

const STEPS = [
  {
    title: "Upload Your First Documents Through PORT",
    body: `Start with what you reach for most — a recent client brief, a statement of work, a set of meeting notes. PDF, Markdown, and plain text files all work. Drag them onto the PORT upload area or click to browse. VELA processes each document in the background and marks it "ready" within a few seconds.

One document is enough to start searching. Three is when things get interesting — that's when LAMINAR begins finding patterns you didn't ask it to find. The more you add, the smarter your knowledge map becomes.`,
  },
  {
    title: "Search Across Everything with COMPASS",
    body: `COMPASS searches the full text of every document the moment you start typing — no waiting, no separate index step. Try a client name, a project code, or a topic you know is buried somewhere. If you uploaded it, COMPASS can find it.

One tip worth knowing early: broader terms usually outperform exact phrases. "rebrand" will surface more than "Meridian rebrand Q3" — let VELA do the narrowing.`,
  },
  {
    title: "Ask LIGHTHOUSE a Real Question",
    body: `COMPASS is for finding. LIGHTHOUSE is for answering. Switch to the LIGHTHOUSE tab on the search page and ask the kind of question you'd normally spend twenty minutes tracking down.

Good starting questions for agencies:
\u2022 "What did we agree on for the Apex retainer cancellation clause?"
\u2022 "What's our standard payment schedule for web projects?"
\u2022 "When did we last discuss the rebrand scope with the client?"
\u2022 "What were the action items from the Northfield kickoff?"

LIGHTHOUSE reads your documents, finds the relevant passages, and answers with citations — so you can see exactly where the answer came from. You don't need to remember which file it was in.`,
  },
  {
    title: "Discover Your ARCHIPELAGOS",
    body: `Once you have three or more documents uploaded, LAMINAR runs automatically in the background. Navigate to ARCHIPELAGOS and you'll find your documents already sorted into clusters — groups of related knowledge that VELA identified without you lifting a finger. No folders. No tags. No manual sorting.

Each cluster has a name drawn from its content, a short description, and a list of the documents inside it. A "Still forming" badge means clustering is still in progress. Give it a moment, then refresh.`,
  },
  {
    title: "Follow the Connections",
    body: `When you're ready to go deeper, CONNECTIONS shows the web of relationships between your documents — which briefs reference the same client, which SOWs share scope language, which meeting notes connect to a deliverable. Edges between documents represent four signals LAMINAR tracks: how similar the content is, how often they're accessed together, how close in time they were created, and whether one structurally references the other.

CASCADE takes it further: select any document and see which others would be affected if it changed. Useful when a scope change ripples across a project.`,
  },
];

const FEATURE_GUIDES: Record<string, { title: string; body: string }> = {
  PORT: {
    title: "PORT — Uploading Documents",
    body: `PORT accepts PDF, Markdown (.md), and plain text (.txt) files. There's no strict file size limit for text documents, but PDFs with very complex layouts or heavy image content may take a moment longer to process.

After you upload, PORT moves each file through a processing pipeline — extracting text, building the search index, and queuing it for LAMINAR. The document status shows "processing" while this is running and switches to "ready" when it's available for search and AI queries. The whole thing usually takes under ten seconds.

If a document sits on "processing" for more than a minute, refresh the page. If it still shows "processing" after a refresh, try re-uploading — it's rare but occasionally a PDF with unusual encoding gets stuck. Text and Markdown files never have this issue.

Your document limit depends on your plan: 10 documents on Free, 100 on Individual, and unlimited on Team. If you hit your limit, PORT will let you know before the upload completes.`,
  },
  COMPASS: {
    title: "COMPASS — Searching Your Documents",
    body: `COMPASS is a real-time full-text search across everything in your account. It searches document content, not just titles — so if a phrase appears once in a 40-page SOW, COMPASS will find it.

Results appear as you type. Each card shows the document title, a snippet of the matching text, and the document type. Click any result to open the full document.

A few things COMPASS is particularly good at: finding a specific clause you remember writing, locating a client name across multiple files, surfacing everything related to a particular project phase. It's fastest when you search for the words that actually appear in the document rather than a paraphrase.

COMPASS is different from LIGHTHOUSE: COMPASS finds documents, LIGHTHOUSE answers questions about them. If you're not sure which to use, start with LIGHTHOUSE — it will draw on COMPASS results internally.`,
  },
  LIGHTHOUSE: {
    title: "LIGHTHOUSE — AI Questions and Answers",
    body: `LIGHTHOUSE has two modes. Smart Search picks the most relevant documents automatically based on your question — this is the right choice most of the time. Manual Selection lets you choose specific documents first, then ask a question scoped to those files — useful when you want to interrogate a particular project or contract without noise from unrelated work.

What makes a good LIGHTHOUSE question: be specific, include context, and ask what you'd actually ask a colleague. "What did we agree on the scope?" is weaker than "What did we agree on the scope for the Hartwell website project?" The more context in your question, the more precise the answer.

Citations appear alongside every answer, showing which documents LIGHTHOUSE drew from and which passages specifically. Click any citation to jump directly to the source.

Free plan users have 20 LIGHTHOUSE queries per month. Individual and Team plans are unlimited. If you see "The LIGHTHOUSE is temporarily dark," it means VELA encountered a problem reaching the AI provider — this is temporary. COMPASS search still works normally while the LIGHTHOUSE recovers.`,
  },
  ARCHIPELAGOS: {
    title: "ARCHIPELAGOS — Automatic Document Clusters",
    body: `LAMINAR needs at least three documents to find meaningful patterns. Once you cross that threshold, ARCHIPELAGOS updates automatically every time you upload something new — no button to press, no settings to configure.

Cluster names come from the documents themselves. LAMINAR reads the content, identifies the dominant topics, and names the cluster accordingly. A cluster called "Project Scope & Deliverables" contains documents that consistently use that vocabulary. If a name seems off, it's usually a sign that those documents have more thematic overlap than you'd expect — worth exploring.

The coherence score on each cluster tells you how tightly related the documents inside it are. A high score means LAMINAR found strong, consistent signal. A low score means the documents share some vocabulary but are pulling in different directions — not a problem, just information.

ARCHIPELAGOS is the fastest way to rediscover knowledge you forgot you had. If you're starting a new engagement and want to find everything remotely related to a past client's industry, search COMPASS and then look at which ARCHIPELAGOS the results belong to.`,
  },
};

const LAMINAR_EXPLAINER = `Most knowledge tools ask you to do the organizing. You create a folder structure, add tags, file things in the right place, and hope future-you remembers where present-you put them. That works fine when you have twenty documents. By the time you have two hundred — spread across clients, projects, and years — it stops working entirely. The folders exist, but the knowledge is still lost.

LAMINAR inverts this. Instead of asking you to organize before you can find, it watches how your knowledge actually behaves: what documents land in your account, which ones you reach for together, how recently they were active, what language runs through them. From those signals, it builds a picture of your knowledge that reflects how your team actually thinks — not how someone hoped you'd organize things at the start of a project.

The underlying idea comes from chaos theory: complex, seemingly unpredictable systems often have deep structure that emerges from simple rules. The way knowledge accumulates in a working agency is chaotic on the surface — brief in Drive, SOW in email, notes in Notion, deliverables in Dropbox. But underneath, there are patterns. The documents about a particular client cluster together in how they're accessed, even if they've never been tagged as related. LAMINAR finds those patterns and surfaces them as ARCHIPELAGOS, CONNECTIONS, and CASCADE predictions.

What this means in practice: you don't maintain LAMINAR. You don't feed it metadata or train it on your taxonomy. You upload your documents and work normally, and LAMINAR recalculates every time something new arrives. The knowledge map you see today reflects your team's actual usage, not an organizational scheme from eighteen months ago that nobody updates anymore.`;

const FAQ: Array<{ q: string; a: string }> = [
  {
    q: "How many documents can I upload on the free plan?",
    a: "The Free plan includes 10 documents. If you need more, the Individual plan supports up to 100, and the Team plan is unlimited. You can see your current usage on the HELM dashboard.",
  },
  {
    q: "What file types does VELA support?",
    a: "PDF, Markdown (.md), and plain text (.txt). We don't yet support Word documents (.docx) or Google Docs directly — for those, export to PDF or copy the text into a .txt file. Most agency documents export to PDF cleanly from any tool.",
  },
  {
    q: "How long does it take for LAMINAR to organize my documents?",
    a: "Clustering usually runs within a few seconds of your third document finishing processing. If you've just uploaded a batch, give it a minute and then check ARCHIPELAGOS. The more documents you have, the richer the clusters — don't judge LAMINAR's output on three files, it's just getting started.",
  },
  {
    q: "Why aren't my ARCHIPELAGOS updating after I uploaded new documents?",
    a: 'Check that your new documents have finished processing — their status should show "ready" before LAMINAR can include them. If they\'re ready but ARCHIPELAGOS hasn\'t updated after a minute or two, navigate away and back to the page. If you see a "Recharting the ARCHIPELAGOS" banner, LAMINAR is recalculating and will update shortly.',
  },
  {
    q: "I hit my monthly query limit. What do I do?",
    a: "The Free plan includes 20 LIGHTHOUSE queries per month. Once you've used them, LIGHTHOUSE will let you know and COMPASS search still works normally. You can upgrade to Individual ($15/month) for unlimited queries, or wait until your limit resets at the start of next month. Your usage counter resets on a rolling 30-day basis.",
  },
  {
    q: "Can I delete documents I've uploaded?",
    a: "Yes — open any document and you'll find a delete option. Deleting a document removes it from search, from LIGHTHOUSE's context, and from LAMINAR's calculations. ARCHIPELAGOS will recalculate after deletion, which may reorganize your clusters slightly.",
  },
  {
    q: "Is my data private?",
    a: "Your documents are only visible to your account. VELA does not use your documents to train AI models, share data between accounts, or expose your content to other users. If you're on a Team plan with multiple users, all team members share access to the same documents — review who's on your team before uploading anything sensitive.",
  },
  {
    q: "What's the difference between COMPASS and LIGHTHOUSE?",
    a: "COMPASS is keyword search — it finds documents that contain the words you typed. LIGHTHOUSE is a question-answering engine — it reads your documents and synthesizes an answer from their contents, with citations. If you know what you're looking for, use COMPASS. If you're not sure where the answer lives, or you want a summary across multiple documents, use LIGHTHOUSE.",
  },
  {
    q: "Why does LIGHTHOUSE sometimes say it can't find an answer?",
    a: "Two common reasons: the answer isn't in your uploaded documents, or the question is too broad for LIGHTHOUSE to anchor to specific content. Try being more specific — include the client name, project name, or time period. If you know the answer is in a particular document, use Manual Selection mode and ask LIGHTHOUSE to focus there.",
  },
  {
    q: "How do I cancel my subscription?",
    a: "Visit the pricing page and open the customer portal — you'll find a link to manage or cancel your subscription there. Cancellations take effect at the end of your current billing period. Your documents and knowledge map stay accessible until then.",
  },
];

const TABS = [
  { id: "getting-started", label: "Getting Started" },
  { id: "feature-guides", label: "Feature Guides" },
  { id: "how-laminar-works", label: "How LAMINAR Works" },
  { id: "faq", label: "FAQ" },
] as const;

const GUIDE_ORDER = ["PORT", "COMPASS", "LIGHTHOUSE", "ARCHIPELAGOS"] as const;

// ============================================================================
// PAGE COMPONENT
// ============================================================================

export default function HelpPage() {
  const [activeTab, setActiveTab] = useState<string>("getting-started");
  const [activeGuide, setActiveGuide] = useState<string | null>("PORT");

  const sectionRefs = {
    "getting-started": useRef<HTMLDivElement>(null),
    "feature-guides": useRef<HTMLDivElement>(null),
    "how-laminar-works": useRef<HTMLDivElement>(null),
    faq: useRef<HTMLDivElement>(null),
  };

  const scrollToSection = (id: string) => {
    setActiveTab(id);
    const ref = sectionRefs[id as keyof typeof sectionRefs];
    ref?.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div>
      {/* Header */}
      <div className="bg-gradient-to-r from-[#1B3D5C] to-[#00BCD4] py-12 px-8 text-center">
        <h1 className="text-3xl font-bold text-white">
          Navigate Your Knowledge
        </h1>
        <p className="text-white/80 text-lg mt-2 max-w-xl mx-auto">
          Everything you need to get the most out of VELA.
        </p>
      </div>

      {/* Tab navigation */}
      <div className="sticky top-16 z-40 bg-white border-b border-[#1B3D5C]/10">
        <div className="max-w-3xl mx-auto px-6 flex gap-1 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => scrollToSection(tab.id)}
              className={`px-4 py-3 text-sm whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? "text-[#1B3D5C] font-semibold border-b-2 border-[#1B3D5C]"
                  : "text-gray-500 hover:text-[#1B3D5C]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-10 space-y-16">
        {/* ============================================================
            SECTION 1 — YOUR MAIDEN VOYAGE
            ============================================================ */}
        <section ref={sectionRefs["getting-started"]} id="getting-started">
          <h2 className="text-2xl font-bold text-[#1B3D5C] mb-6">
            Your Maiden Voyage
          </h2>
          <div className="space-y-4">
            {STEPS.map((step, i) => (
              <div
                key={i}
                className="border border-[#1B3D5C]/20 rounded-xl p-6 bg-white"
              >
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-[#1B3D5C] text-white flex items-center justify-center font-bold text-sm shrink-0">
                    {i + 1}
                  </div>
                  <div>
                    <h3 className="font-semibold text-[#1B3D5C] text-lg">
                      {step.title}
                    </h3>
                    <p className="text-gray-600 text-sm mt-2 leading-relaxed whitespace-pre-line">
                      {step.body}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ============================================================
            SECTION 2 — FEATURE GUIDES
            ============================================================ */}
        <section ref={sectionRefs["feature-guides"]} id="feature-guides">
          <h2 className="text-2xl font-bold text-[#1B3D5C] mb-6">
            Feature Guides
          </h2>
          <div className="space-y-3">
            {GUIDE_ORDER.map((key) => {
              const guide = FEATURE_GUIDES[key]!;
              const isOpen = activeGuide === key;
              return (
                <div
                  key={key}
                  className="border border-[#1B3D5C]/20 rounded-xl bg-white overflow-hidden"
                >
                  <button
                    onClick={() =>
                      setActiveGuide(isOpen ? null : key)
                    }
                    className="w-full px-6 py-4 flex justify-between items-center cursor-pointer"
                  >
                    <span className="font-semibold text-[#1B3D5C]">
                      {guide.title}
                    </span>
                    <ChevronDown
                      className={`h-5 w-5 text-[#00BCD4] transition-transform ${
                        isOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-6 pb-4 text-gray-600 text-sm leading-relaxed whitespace-pre-line">
                      {guide.body}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* ============================================================
            SECTION 3 — HOW LAMINAR WORKS
            ============================================================ */}
        <section
          ref={sectionRefs["how-laminar-works"]}
          id="how-laminar-works"
        >
          <h2 className="text-2xl font-bold text-[#1B3D5C] mb-4">
            How LAMINAR Works
          </h2>
          <span className="inline-block bg-gradient-to-r from-[#1B3D5C] to-[#00BCD4] text-white text-xs font-bold rounded-full px-3 py-1 mb-6">
            Powered by Chaos Theory
          </span>
          <div className="text-gray-600 leading-relaxed space-y-4">
            {LAMINAR_EXPLAINER.split("\n\n").map((paragraph, i) => (
              <p key={i}>{paragraph}</p>
            ))}
          </div>
        </section>

        {/* ============================================================
            DEMO VIDEO PLACEHOLDER
            ============================================================ */}
        <section id="demo">
          <h2 className="text-2xl font-bold text-[#1B3D5C] mb-6">
            See VELA in Action
          </h2>
          <div className="border-2 border-dashed border-[#1B3D5C]/30 rounded-xl bg-[#1B3D5C]/5 p-12 text-center text-gray-400">
            Demo video coming soon — check back before launch
          </div>
        </section>

        {/* ============================================================
            SECTION 4 — FAQ
            ============================================================ */}
        <section ref={sectionRefs["faq"]} id="faq">
          <h2 className="text-2xl font-bold text-[#1B3D5C] mb-6">
            Frequently Asked Questions
          </h2>
          <div>
            {FAQ.map((item, i) => (
              <div
                key={i}
                className={
                  i < FAQ.length - 1
                    ? "border-b border-[#1B3D5C]/10 mb-6 pb-6"
                    : ""
                }
              >
                <h3 className="font-semibold text-[#1B3D5C] text-base">
                  {item.q}
                </h3>
                <p className="text-gray-600 text-sm mt-1 leading-relaxed">
                  {item.a}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ============================================================
            FOOTER
            ============================================================ */}
        <div className="py-8 border-t border-[#1B3D5C]/10 mt-8">
          <p className="font-semibold text-[#1B3D5C]">
            Still have questions?
          </p>
          <p className="text-gray-500 text-sm mt-2">
            Start a conversation with LIGHTHOUSE — it knows everything
            in your knowledge base.
          </p>
        </div>
      </div>
    </div>
  );
}
