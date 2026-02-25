import { Component, type ReactNode } from "react";
import { Loader2, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  isRetrying: boolean;
}

/**
 * Error Boundary that catches chunk/module load failures
 * and auto-reloads the page to fetch fresh assets.
 */
class ChunkErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, isRetrying: false };
  }

  static getDerivedStateFromError(error: Error): State | null {
    // Check if it's a chunk load error
    const isChunkError =
      error.message?.includes("Failed to fetch dynamically imported module") ||
      error.message?.includes("Importing a module script failed") ||
      error.message?.includes("error loading dynamically imported module") ||
      error.message?.includes("Loading chunk") ||
      error.message?.includes("Loading CSS chunk") ||
      error.name === "ChunkLoadError";

    if (isChunkError) {
      return { hasError: true, isRetrying: false };
    }
    // Not a chunk error — let it propagate to React's default error handling
    return null;
  }

  componentDidCatch(error: Error) {
    const isChunkError =
      error.message?.includes("Failed to fetch dynamically imported module") ||
      error.message?.includes("Importing a module script failed") ||
      error.message?.includes("error loading dynamically imported module") ||
      error.message?.includes("Loading chunk") ||
      error.message?.includes("Loading CSS chunk") ||
      error.name === "ChunkLoadError";

    if (isChunkError) {
      // Check if we already tried reloading to avoid infinite loop
      const lastReload = sessionStorage.getItem("chunk_reload_time");
      const now = Date.now();
      if (!lastReload || now - Number(lastReload) > 10000) {
        sessionStorage.setItem("chunk_reload_time", String(now));
        window.location.reload();
        return;
      }
    }

    console.error("ChunkErrorBoundary caught:", error);
  }

  handleRetry = () => {
    this.setState({ isRetrying: true });
    sessionStorage.removeItem("chunk_reload_time");
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          className="min-h-screen flex items-center justify-center bg-background"
          dir="rtl"
        >
          <div className="text-center space-y-4 p-8 max-w-md">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <RefreshCw className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-xl font-bold text-foreground">
              تم تحديث التطبيق
            </h2>
            <p className="text-muted-foreground text-sm">
              يتوفر إصدار جديد من التطبيق. اضغط على الزر أدناه لتحميل النسخة
              الأحدث.
            </p>
            <button
              onClick={this.handleRetry}
              disabled={this.state.isRetrying}
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {this.state.isRetrying ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              إعادة تحميل الصفحة
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ChunkErrorBoundary;
