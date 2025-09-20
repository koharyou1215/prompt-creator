export class RealtimeService {
  private ws: WebSocket | null = null;

  connect(userId: string) {
    const url = `${
      process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:3001"
    }?userId=${userId}`;
    this.ws = new WebSocket(url);

    this.ws.onopen = () => console.log("Realtime connected");
    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.handleRealtimeUpdate(data);
      } catch (e) {
        console.warn("Malformed realtime message", e);
      }
    };
    this.ws.onclose = () => console.log("Realtime disconnected");
    this.ws.onerror = (e) => console.warn("Realtime error", e);
  }

  private handleRealtimeUpdate(data: any) {
    switch (data.type) {
      case "PROMPT_UPDATED":
        // 別タブへ変更を反映するためのフック（usePromptStore の同期関数を想定）
        // usePromptStore.getState().syncFromRealtime(data.prompt);
        break;
      case "GENERATION_COMPLETE":
        // 画像生成完了の通知ハンドリング
        // this.notifyGenerationComplete(data);
        break;
      default:
        break;
    }
  }

  disconnect() {
    try {
      this.ws?.close();
    } catch (e) {
      /* noop */
    }
  }
}

export const realtimeService = new RealtimeService();
