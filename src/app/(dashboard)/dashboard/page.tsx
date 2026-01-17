export default function DashboardPage() {
  return (
    <div className="container py-10">
      <h1 className="text-4xl font-bold mb-4">Dashboard</h1>
      <p className="text-muted-foreground mb-6">
        Your VELA workspace coming on Day 9!
      </p>
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border p-6">
          <h3 className="font-semibold mb-2">Documents</h3>
          <p className="text-sm text-muted-foreground">Upload and manage your knowledge base</p>
        </div>
        <div className="rounded-lg border p-6">
          <h3 className="font-semibold mb-2">Search</h3>
          <p className="text-sm text-muted-foreground">AI-powered instant answers</p>
        </div>
        <div className="rounded-lg border p-6">
          <h3 className="font-semibold mb-2">Insights</h3>
          <p className="text-sm text-muted-foreground">Chaos theory pattern detection</p>
        </div>
      </div>
    </div>
  );
}