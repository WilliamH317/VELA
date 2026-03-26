import React from "react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// ============================================================================
// Error Boundary — React class component (required by React API)
// ============================================================================

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    console.error("[VELA ErrorBoundary]", error, info.componentStack);
  }

  render(): React.ReactNode {
    if (!this.state.hasError) {
      return this.props.children;
    }

    if (this.props.fallback) {
      return this.props.fallback;
    }

    return (
      <div className="py-8 text-center">
        <Card className="max-w-sm mx-auto border-[#1B3D5C]/20">
          <CardHeader>
            <CardTitle className="text-[#1B3D5C] font-bold text-lg">
              Stormy Seas
            </CardTitle>
            <CardDescription className="text-gray-500">
              We hit rough water — this section is temporarily unavailable.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-400 mb-4">
              The rest of VELA is still sailing.
            </p>
            {process.env.NODE_ENV === "development" && this.state.error && (
              <pre className="text-xs bg-gray-100 p-2 rounded text-red-600 text-left overflow-auto max-h-32">
                {this.state.error.message}
                {this.state.error.stack &&
                  "\n" +
                    this.state.error.stack
                      .split("\n")
                      .slice(0, 3)
                      .join("\n")}
              </pre>
            )}
          </CardContent>
          <CardFooter className="justify-center">
            <Button
              variant="default"
              className="bg-[#1B3D5C] text-white hover:bg-[#1B3D5C]/90"
              onClick={() => this.setState({ hasError: false, error: null })}
            >
              Try Again
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }
}

export default ErrorBoundary;
