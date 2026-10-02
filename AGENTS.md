
- Realtime channel names are made unique globally by src/lib/realtimeChannelPatch.ts (imported first in main.tsx); why: reused channel topics crash pages when a listener mounts twice.
