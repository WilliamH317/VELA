export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Sign In</h1>
        <p className="text-muted-foreground mb-6">
          Clerk authentication coming on Day 8!
        </p>
        <a href="/" className="text-accent hover:underline">
          ← Back to Home
        </a>
      </div>
    </div>
  );
}