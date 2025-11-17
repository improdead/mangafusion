# Collaboration Architecture - Quick Reference

**For Implementation**: See `COLLABORATION_ARCHITECTURE.md` for detailed analysis

---

## Decision Matrix

### Synchronization Method

| Method | Complexity | Offline | Scalability | Recommendation |
|--------|-----------|---------|-------------|-----------------|
| **Custom Hybrid** | 5/10 | Medium | Good | ✓ **USE THIS** |
| CRDT | 9/10 | Excellent | Medium | Only for offline-first |
| Operational Transform | 8/10 | Poor | Good | Only for text-heavy |

### Communication Protocol

| Protocol | Latency | Complexity | Firewall | Recommendation |
|----------|---------|-----------|----------|-----------------|
| **WebSocket** | 50-200ms | Low | Good | ✓ **USE THIS** |
| WebRTC | 20-50ms | High | Poor | P2P only, if needed |
| Hybrid WS + WebRTC | 30-100ms | Medium | Medium | Complex fallback |

### Conflict Resolution

| Strategy | Complexity | Use Case | Recommendation |
|----------|-----------|----------|-----------------|
| **Last-Writer-Wins** | Low | Most cases | ✓ **START HERE** |
| Operational Transform | High | Text operations | Later if needed |
| Semantic Resolution | Medium | Specialized conflicts | Only when necessary |

---

## Technology Stack (Recommended)

```
Backend:
├── Node.js + Express
├── Socket.IO (WebSocket)
├── MongoDB (persistence)
├── Redis (optional: session/presence)
└── Jest (testing)

Frontend:
├── React
├── Konva/Fabric.js/Pixi.js (canvas)
├── Socket.IO Client
├── Zustand/Redux (state)
└── Vitest (testing)

Infrastructure:
├── Single server initially (50-100 concurrent)
├── Docker for deployment
├── PostgreSQL or MongoDB
└── Queue system (when scaling needed)
```

---

## Implementation Checklist

### Phase 1: Foundation (1 week)
- [ ] Set up Socket.IO server
- [ ] Create message routing
- [ ] Implement basic client connection
- [ ] Set up database connection
- [ ] Create simple state store

### Phase 2: Core Sync (1 week)
- [ ] Define message schema (delta-based)
- [ ] Implement version tracking (Lamport clock)
- [ ] Add last-writer-wins conflict resolution
- [ ] Create storage checkpointing (30-60s)
- [ ] Handle object add/update/delete

### Phase 3: Presence (3-5 days)
- [ ] Implement cursor position updates
- [ ] Add user color coding
- [ ] Create selection awareness
- [ ] Handle user join/leave
- [ ] Render remote cursors

### Phase 4: Reliability (1 week)
- [ ] Implement offline queue
- [ ] Add reconnection handling
- [ ] Create consistency validation
- [ ] Add error logging
- [ ] Test edge cases

---

## Code Templates

### Server Setup (Node.js + Socket.IO)

```javascript
// server.js
const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const mongoose = require('mongoose');

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: { origin: process.env.FRONTEND_URL }
});

const collaborationManager = new CollaborationManager(io, mongoose);

// WebSocket events
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Join document
  socket.on('join-document', (docId) => {
    collaborationManager.addUser(docId, socket);
  });

  // State changes
  socket.on('change', (message) => {
    collaborationManager.handleChange(docId, message);
  });

  // Presence updates
  socket.on('cursor', (data) => {
    collaborationManager.updatePresence(docId, data);
  });

  socket.on('disconnect', () => {
    collaborationManager.removeUser(socket.id);
  });
});

// Checkpointing (every 45 seconds)
setInterval(() => {
  collaborationManager.checkpoint();
}, 45000);

server.listen(3001, () => {
  console.log('Server running on :3001');
});
```

### Client Setup (React)

```javascript
// useCollaboration.ts
import { useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';

export function useCollaboration(docId) {
  const socketRef = useRef(null);
  const [document, setDocument] = useState(null);
  const [remoteUsers, setRemoteUsers] = useState({});
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Connect to server
    socketRef.current = io(process.env.REACT_APP_SERVER_URL);

    socketRef.current.on('connect', () => {
      setIsConnected(true);
      socketRef.current.emit('join-document', docId);
    });

    // Receive state updates
    socketRef.current.on('change', (change) => {
      setDocument(applyChange(document, change));
    });

    // Receive presence updates
    socketRef.current.on('cursor', (data) => {
      setRemoteUsers(prev => ({
        ...prev,
        [data.userId]: data
      }));
    });

    return () => socketRef.current.disconnect();
  }, [docId]);

  // Send local change
  const sendChange = (change) => {
    socketRef.current.emit('change', {
      docId,
      ...change,
      clientId: socketRef.current.id,
      timestamp: Date.now()
    });
  };

  // Send cursor position
  const updateCursor = (x, y) => {
    socketRef.current.emit('cursor', {
      docId,
      cursor: { x, y },
      userId: socketRef.current.id
    });
  };

  return {
    document,
    remoteUsers,
    isConnected,
    sendChange,
    updateCursor
  };
}

// In component
export function CanvasEditor({ docId }) {
  const { document, remoteUsers, sendChange, updateCursor } =
    useCollaboration(docId);

  const handleStrokeEnd = (stroke) => {
    sendChange({
      type: 'object-add',
      object: {
        id: generateId(),
        type: 'stroke',
        points: stroke.points
      }
    });
  };

  const handleMouseMove = (e) => {
    updateCursor(e.clientX, e.clientY);
  };

  return (
    <div>
      <Canvas
        document={document}
        remoteUsers={remoteUsers}
        onStrokeEnd={handleStrokeEnd}
        onMouseMove={handleMouseMove}
      />
    </div>
  );
}
```

### Change Message Schema

```typescript
// Message formats
interface StateChangeMessage {
  id: string;                    // Unique message ID
  timestamp: number;             // Client timestamp
  clientId: string;             // Sender client ID
  docId: string;                // Document ID

  type: 'object-add' | 'object-update' | 'object-delete';
  objectId: string;

  // For updates: only changed properties
  changes?: {
    [key: string]: any;
  };

  // Full object for adds
  object?: CanvasObject;

  // Version info
  baseVersion: number;          // Version when change created
  newVersion?: number;          // Assigned by server
}

interface PresenceMessage {
  userId: string;
  clientId: string;
  timestamp: number;

  cursor: {
    x: number;
    y: number;
  };

  selection?: string[];         // Selected object IDs

  user: {
    name: string;
    color: string;
  };
}
```

---

## Conflict Resolution Logic

```javascript
// server/conflictResolver.ts
class ConflictResolver {
  // Last-Writer-Wins strategy
  resolveConflict(incoming, local, baseVersion) {
    // Incoming change is newer
    if (incoming.timestamp > local.timestamp) {
      return incoming;
    }

    // If same timestamp, use clientId as tiebreaker
    if (incoming.timestamp === local.timestamp) {
      if (incoming.clientId > local.clientId) {
        return incoming;
      }
    }

    return local;
  }

  // Apply change to server state
  applyChange(state, change) {
    if (change.type === 'object-add') {
      state.objects[change.objectId] = change.object;
      return;
    }

    if (change.type === 'object-update') {
      const existing = state.objects[change.objectId];
      if (existing) {
        // Apply only changed fields
        Object.assign(existing, change.changes);
        existing.version = change.newVersion;
      }
      return;
    }

    if (change.type === 'object-delete') {
      delete state.objects[change.objectId];
    }
  }
}
```

---

## Update Rate Guidelines

| Update Type | Frequency | Description |
|-------------|-----------|-------------|
| Cursor position | 10-30 Hz | Can skip frames |
| Selection | 5-10 Hz | Less critical |
| Brush preview | 30 Hz | Real-time feedback |
| Final stroke | On complete | Critical, no throttle |
| User presence | <1 Hz | Only on change |

---

## Offline Handling Pattern

```javascript
// client/offlineManager.ts
class OfflineManager {
  constructor() {
    this.isOnline = navigator.onLine;
    this.queue = [];

    window.addEventListener('online', () => this.goOnline());
    window.addEventListener('offline', () => this.goOffline());
  }

  goOffline() {
    this.isOnline = false;
    console.log('Going offline - queuing changes');
  }

  addToQueue(change) {
    this.queue.push({
      ...change,
      queuedAt: Date.now()
    });
  }

  async goOnline() {
    this.isOnline = true;
    console.log('Online - syncing', this.queue.length, 'changes');

    // Download fresh document
    const fresh = await fetch(`/api/doc/${this.docId}`);
    this.document = await fresh.json();

    // Reapply queued changes
    for (const change of this.queue) {
      await this.syncChange(change);
    }

    this.queue = [];
  }

  async syncChange(change) {
    try {
      const response = await fetch(
        `/api/doc/${this.docId}/changes`,
        {
          method: 'POST',
          body: JSON.stringify(change)
        }
      );

      if (!response.ok) {
        this.queue.push(change); // Re-queue on error
      }
    } catch (e) {
      this.queue.push(change);
      throw e;
    }
  }
}
```

---

## Performance Tips

1. **Batch Updates**: Combine multiple changes into single message
2. **Compress Deltas**: Only send changed fields
3. **Use Throttling**: Limit cursor/presence updates
4. **Render Optimization**: Use Canvas/WebGL for many remote cursors
5. **Worker Threads**: Offload sync logic to Web Worker
6. **Storage Indexing**: Index by docId for quick lookups

---

## Testing Strategy

### Unit Tests
- Conflict resolution logic
- Version tracking
- Message serialization

### Integration Tests
- Two-client sync scenarios
- Offline + reconnect
- Concurrent edits

### Load Tests
- 10+ concurrent users
- Message throughput
- Memory usage over time

---

## Monitoring Checklist

Track these metrics:
- [ ] Sync latency (p50, p95, p99)
- [ ] Message throughput (msgs/sec)
- [ ] Conflict frequency
- [ ] User connection/disconnection
- [ ] Queue depth (offline)
- [ ] Memory usage per document
- [ ] Storage growth rate

---

## Common Pitfalls to Avoid

1. ❌ **Not validating server-side**: Trust client timestamps
2. ❌ **Sending full objects**: Always use deltas
3. ❌ **Not handling network lag**: Optimistic UI is key
4. ❌ **Missing version tracking**: Causes consistency issues
5. ❌ **Not testing offline**: Sync bugs appear under load
6. ❌ **Ignoring presence updates**: Bad UX
7. ❌ **No error recovery**: Connection issues cascade
8. ❌ **Real-time sync of all presence**: Use throttling

---

## Getting Help

- **CRDT Questions**: See `COLLABORATION_ARCHITECTURE.md` Section 2
- **Protocol Questions**: See Section 3 (WebSocket vs WebRTC)
- **Tool References**: See Section 4 (Analysis section)
- **Code Examples**: See Section 5 (Patterns)

---

**Last Updated**: November 17, 2025
**Complexity Rating**: 5/10 (for recommended approach)
**Estimated Implementation**: 6-8 weeks (MVP)
