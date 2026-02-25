import { Component, type ReactNode } from "react";
import { Loader2, RefreshCw, AlertTriangle } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  isChunkError: boolean;
  isRetrying: boolean;
}

class ChunkErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, isChunkError: false, isRetrying: false };
  }

  static getDerivedStateFromError(error: Error): State {
    const isChunkError =
      error.message?.includes("Failed to fetch dynamically imported module") ||
      error.message?.includes("Importing a module script failed") ||
      error.message?.includes("error loading dynamically imported module") ||
      error.message?.includes("Loading chunk") ||
      error.message?.includes("Loading CSS chunk") ||
      error.name === "ChunkLoadError";

    return { hasError: true, isChunkError, isRetrying: false };
  }

  componentDidCatch(error: Error) {
    if (this.state.isChunkError) {
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
      const { isChunkError } = this.state;
      return (
        <div className="min-h-screen flex items-center justify-center bg-background" dir="rtl">
          <div className="text-center space-y-4 p-8 max-w-md">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              {isChunkError ? (
                <RefreshCw className="w-8 h-8 text-primary" />
              ) : (
                <AlertTriangle className="w-8 h-8 text-destructive" />
              )}
            </div>
            <h2 className="text-xl font-bold text-foreground">
              {isChunkError ? "تم تحديث التطبيق" : "حدث خطأ غير متوقع"}
            </h2>
            <p className="text-muted-foreground text-sm">
              {isChunkError
                ? "يتوفر إصدار جديد من التطبيق. اضغط على الزر أدناه لتحميل النسخة الأحدث."
                : "حدث خطأ أثناء تحميل الصفحة. اضغط على الزر أدناه لإعادة المحاولة."}
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
