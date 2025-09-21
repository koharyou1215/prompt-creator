import React from "react";

export class ErrorHandler {
  private static isDevelopment = process.env.NODE_ENV === "development";

  static handle(error: any, context?: string): void {
    const timestamp = new Date().toISOString();
    const errorInfo = {
      timestamp,
      context: context || "Unknown",
      message: error.message || "Unknown error",
      stack: error.stack,
      type: error.constructor.name,
    };

    if (this.isDevelopment) {
      console.group(`Error in ${errorInfo.context}`);
      console.error("Message:", errorInfo.message);
      console.error("Type:", errorInfo.type);
      console.error("Stack:", errorInfo.stack);
      console.groupEnd();
    } else {
      console.error(
        `[${timestamp}] ${errorInfo.context}: ${errorInfo.message}`
      );
    }

    if (!this.isDevelopment) {
      this.sendToErrorTracking(errorInfo);
    }
  }

  static handleAsync<T>(
    fn: () => Promise<T>,
    context?: string
  ): Promise<T | null> {
    return fn().catch((error) => {
      this.handle(error, context);
      return null;
    });
  }

  static createErrorBoundary(Component: React.ComponentType<any>) {
    return class ErrorBoundary extends React.Component<
      any,
      { hasError: boolean; error?: Error }
    > {
      constructor(props: any) {
        super(props);
        this.state = { hasError: false };
      }

      static getDerivedStateFromError(error: Error) {
        return { hasError: true, error };
      }

      componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        ErrorHandler.handle(error, `ErrorBoundary: ${Component.name}`);

        if (errorInfo.componentStack) {
          console.error("Component Stack:", errorInfo.componentStack);
        }
      }

      render() {
        if (this.state.hasError) {
          return React.createElement(
            "div",
            { className: "error-boundary" },
            React.createElement("h2", null, "何か問題が発生しました"),
            React.createElement("p", null, "ページを再読み込みして再試行してください。"),
            React.createElement(
              "button",
              {
                onClick: () => window.location.reload(),
                className: "retry-button"
              },
              "再読み込み"
            )
          );
        }

        return this.props.children;
      }
    };
  }

  private static sendToErrorTracking(errorInfo: any): void {
    console.log("Would send to error tracking:", errorInfo);
  }

  static suppressBrowserExtensionErrors(): void {
    if (typeof window === "undefined") return;

    const originalConsoleError = console.error;
    console.error = (...args: any[]) => {
      const message = args.join(" ");

      if (
        message.includes("cognitive.microsofttranslator.com") ||
        message.includes("content.js") ||
        message.includes("extension") ||
        message.includes("chrome-extension://")
      ) {
        return;
      }

      originalConsoleError.apply(console, args);
    };

    window.addEventListener("unhandledrejection", (event) => {
      const message = event.reason?.message || String(event.reason);

      if (
        message.includes("cognitive.microsofttranslator.com") ||
        message.includes("extension")
      ) {
        event.preventDefault();
        return;
      }

      this.handle(event.reason, "Unhandled Promise Rejection");
    });

    window.addEventListener("error", (event) => {
      const message = event.message || "";

      if (
        message.includes("cognitive.microsofttranslator.com") ||
        message.includes("extension") ||
        message.includes("content.js")
      ) {
        event.preventDefault();
        return;
      }

      this.handle(event.error, "Unhandled Error");
    });
  }
}