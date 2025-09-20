export class RealtimeService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private userId: string | null = null;
  private listeners: Map<string, ((data: any) => void)[]> = new Map();

  connect(userId: string) {
    this.userId = userId;
    this.connectWebSocket();
  }

  private connectWebSocket() {
    if (!this.userId) return;

    const wsUrl = `${
      process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:3001"
    }?userId=${this.userId}`;

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log("WebSocket connected");
        this.reconnectAttempts = 0;
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleRealtimeUpdate(data);
        } catch (error) {
          console.error("Failed to parse WebSocket message:", error);
        }
      };

      this.ws.onclose = () => {
        console.log("WebSocket disconnected");
        this.handleReconnect();
      };

      this.ws.onerror = (error) => {
        console.error("WebSocket error:", error);
      };
    } catch (error) {
      console.error("Failed to connect WebSocket:", error);
      this.handleReconnect();
    }
  }

  private handleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error("Max reconnection attempts reached");
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    setTimeout(() => {
      console.log(`Reconnecting... (attempt ${this.reconnectAttempts})`);
      this.connectWebSocket();
    }, delay);
  }

  private handleRealtimeUpdate(data: any) {
    switch (data.type) {
      case "PROMPT_UPDATED":
        this.emit("prompt_updated", data.prompt);
        break;
      case "PROMPT_DELETED":
        this.emit("prompt_deleted", data.promptId);
        break;
      case "GENERATION_COMPLETE":
        this.emit("generation_complete", data);
        break;
      case "COLLABORATION_UPDATE":
        this.emit("collaboration_update", data);
        break;
      case "NOTIFICATION":
        this.emit("notification", data);
        break;
      default:
        console.warn("Unknown WebSocket message type:", data.type);
    }
  }

  // イベントリスナー管理
  on(event: string, callback: (data: any) => void) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  off(event: string, callback: (data: any) => void) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  private emit(event: string, data: any) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          console.error("Error in WebSocket event callback:", error);
        }
      });
    }
  }

  // メッセージ送信
  send(type: string, data: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, ...data }));
    } else {
      console.warn("WebSocket is not connected");
    }
  }

  // プロンプト更新の通知
  notifyPromptUpdate(promptId: string, updates: any) {
    this.send("PROMPT_UPDATE", { promptId, updates });
  }

  // コラボレーション開始
  startCollaboration(promptId: string) {
    this.send("START_COLLABORATION", { promptId });
  }

  // コラボレーション終了
  endCollaboration(promptId: string) {
    this.send("END_COLLABORATION", { promptId });
  }

  // カーソル位置の共有
  shareCursor(promptId: string, position: number) {
    this.send("CURSOR_UPDATE", { promptId, position });
  }

  // 接続状態確認
  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.listeners.clear();
    this.userId = null;
    this.reconnectAttempts = 0;
  }
}

export const realtimeService = new RealtimeService();
