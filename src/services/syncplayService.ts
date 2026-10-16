import { registerPlugin, type PluginListenerHandle } from '@capacitor/core';

export interface SyncplayPluginInterface {
  hostSession(options?: { code?: string; host?: string; port?: number }): Promise<{
    code: string;
    room: string;
    memberId: string;
    isHost: boolean;
  }>;
  joinSession(options: { code: string; host?: string; port?: number }): Promise<{
    code: string;
    room: string;
    memberId: string;
    isHost: boolean;
  }>;
  leaveSession(): Promise<void>;
  sendMessage(options: { payload: Record<string, any> }): Promise<void>;
  getSessionState(): Promise<{
    connected: boolean;
    code: string;
    room: string;
    memberId: string;
    isHost: boolean;
  }>;
  addListener(
    eventName: 'joined' | 'disconnected' | 'error' | 'fluxMessage' | 'memberJoined' | 'memberLeft' | 'presenceUpdate',
    listenerFunc: (data: any) => void
  ): Promise<PluginListenerHandle>;
}

export const FluxSyncplay = registerPlugin<SyncplayPluginInterface>('FluxSyncplay');
