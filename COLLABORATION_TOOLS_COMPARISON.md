# Real-Time Collaboration Tools - Detailed Comparison

Comprehensive analysis of Figma, Miro, tldraw, and Excalidraw collaboration implementations.

---

## Summary Comparison Table

| Feature | Figma | Miro | tldraw | Excalidraw |
|---------|-------|------|--------|-----------|
| **Synchronization** | CRDT-inspired | CRDT/OT Hybrid | Custom Sync | WebSocket Relay |
| **Architecture** | Client-Server | Client-Server | Durable Objects | Client-Server |
| **Conflict Resolution** | Last-Writer-Wins | Transform-based | Custom | Client-side |
| **Offline Support** | Yes (download + reapply) | Implied | Implied | No |
| **Persistence** | Server-side (MongoDB-like) | NoSQL (DynamoDB) | Durable Objects | Not built-in |
| **Scale (Concurrent Users)** | 1000+ | 1000+ | 50/instance | 100+ (per server) |
| **Latency Goal** | 33-100ms | <100ms | <100ms | <200ms |
| **Open Source** | No | No | Partially | Yes |
| **Self-Hostable** | No | No | Yes | Yes |
| **End-to-End Encryption** | No | No | No | Optional (P2P mode) |
| **Presence/Cursors** | Yes | Yes | Yes | Yes |
| **Implementation Complexity** | 9/10 | 9/10 | 7/10 | 6/10 |

---

## Detailed Analysis

### 1. FIGMA - CRDT-Inspired Custom Architecture

#### Overview
```
Figma = Custom CRDT-inspired system
        + Last-writer-wins conflict resolution
        + Server-as-source-of-truth
        + 30 FPS update rate
        + Checkpointing for persistence
```

#### Architecture Diagram
```
┌─────────────────────────────────────────────┐
│         Figma Client (Browser)              │
│  ┌──────────────────────────────────────┐  │
│  │ Canvas Rendering                     │  │
│  │ Local State = Tree of Objects        │  │
│  │ Version tracking (per object)        │  │
│  └──────────────────────────────────────┘  │
└──────────────┬──────────────────────────────┘
               │
         WebSocket (33ms interval)
               │
┌──────────────▼──────────────────────────────┐
│     Figma Multiplayer Service               │
│  ┌──────────────────────────────────────┐  │
│  │ In-Memory State (document tree)      │  │
│  │ - Receives updates from all clients  │  │
│  │ - Applies last-writer-wins           │  │
│  │ - Broadcasts diffs to others         │  │
│  │ - Validates operations               │  │
│  └──────────────────────────────────────┘  │
│  ┌──────────────────────────────────────┐  │
│  │ Checkpointing Service                │  │
│  │ - Saves to persistent storage        │  │
│  │ - Every 30-60 seconds                │  │
│  │ - Prevents data loss                 │  │
│  └──────────────────────────────────────┘  │
└──────────────┬──────────────────────────────┘
               │
        ┌──────▼──────┐
        │  Storage    │
        │  (MongoDB)  │
        └─────────────┘
```

#### Conflict Resolution Strategy
```javascript
// Figma's Last-Writer-Wins for Same Property

Scenario:
  User A: Sets shape.fill = "#FF0000" at timestamp 1000ms
  User B: Sets shape.fill = "#00FF00" at timestamp 1050ms

Server Logic:
  - Receives both updates
  - Compares timestamps
  - Applies: shape.fill = "#00FF00" (1050ms > 1000ms)
  - Broadcasts result to all clients

Result: Both clients eventually see "#00FF00"
```

#### Update Message Format
```javascript
// Figma sends optimized diffs (not full state)
{
  objectId: "shape-123",
  properties: {
    fill: "#FF0000",      // Only changed props
    x: 200
  },
  version: 42,            // Object-level versioning
  timestamp: 1000,
  clientId: "user-456"
}
```

#### Offline Handling
```javascript
// User goes offline while editing
1. Client continues accepting edits locally
2. Offline queue is stored locally
3. When reconnected:
   - Download fresh document from server
   - Re-apply offline changes on top
   - Server again applies last-writer-wins
   - Sync completes
```

#### Update Rate
```
- Canvas update interval: 33ms (30 FPS)
- Update batching: Aggregates changes within interval
- Efficient diffs: Only sends properties that changed
- Optimistic UI: Immediate visual feedback
```

#### Why Figma Chose This Approach
```
Rejected: Operational Transformation
  Reason: Too complex to implement correctly
  Issue: Transformation functions are error-prone

Rejected: Pure CRDT
  Reason: Too much storage overhead
  Issue: Need to track all metadata for merging

Chose: Custom CRDT-inspired system
  Benefit: Simple last-writer-wins semantics
  Benefit: Server validates final state
  Benefit: Minimal overhead
```

#### Strengths
✓ Proven at massive scale (millions of users)
✓ Fast conflict resolution (simple LWW)
✓ Works for complex nested objects (like design files)
✓ Offline support through reapply
✓ Optimistic UI reduces latency perception
✓ Checkpointing prevents data loss

#### Weaknesses
✗ Not open source (proprietary)
✗ Cannot self-host
✗ Requires continuous server connection for best experience
✗ No P2P mode
✗ Complex internals (not reproducible)
✗ Must understand their specific object model

#### Estimated Complexity to Replicate: **9/10**

---

### 2. MIRO - CRDT/OT Hybrid with NoSQL

#### Overview
```
Miro = CRDT/OT hybrid approach
       + WebSocket transport
       + NoSQL storage (DynamoDB-like)
       + Real-time presentation mode
       + Focus on <100ms latency
```

#### Architecture Diagram
```
┌────────────────────────────────────┐
│   Miro Client                      │
│   - Sticky notes, shapes           │
│   - Real-time rendering            │
│   - Optimistic updates             │
└──────────────┬─────────────────────┘
               │
         ┌─────▼────────┐
         │  WebSocket   │
         │ (Socket.IO)  │
         └─────┬────────┘
               │
┌──────────────▼──────────────────────┐
│   Miro Sync Service                 │
│  ┌────────────────────────────────┐│
│  │ Message Handler                ││
│  │ - Receives actions from clients││
│  │ - Routes to sync logic         ││
│  └────────────┬───────────────────┘│
│  ┌────────────▼───────────────────┐│
│  │ CRDT/OT Engine                 ││
│  │ - Applies transformation logic ││
│  │ - Merge with server state      ││
│  │ - Validate operations          ││
│  └────────────┬───────────────────┘│
│  ┌────────────▼───────────────────┐│
│  │ State Store                    ││
│  │ - In-memory document state     ││
│  │ - Versioning (per object)      ││
│  └────────────┬───────────────────┘│
└──────────────┬─────────────────────┘
               │
        ┌──────▼──────┐
        │  NoSQL      │
        │  (DynamoDB) │
        └─────────────┘
```

#### Conflict Transformation Logic
```javascript
// Example: Two users moving same sticky note

User A action: moveNote(noteId, x: 100, y: 200)
User B action: moveNote(noteId, x: 150, y: 150)

Transform Process:
1. Both clients send local action immediately
2. Server receives both (possibly out of order)
3. Applies transformation function:
   - If operations on same object, transform
   - If different objects, apply independently
4. Broadcasts final state to all
5. Clients update to match server

Result: Consistent state across all clients
```

#### Performance Strategy
```
Latency Goals:
- Cursor movement: <100ms (real-time)
- Sticky note drag: <100ms (smooth UX)
- Text input: <100ms (responsive)

Implementation:
- Optimistic UI: Update locally immediately
- Server validation: Apply and broadcast
- If conflict: Server-wins transformation
- Retry on failure: Queue client-side
```

#### Message Format
```javascript
{
  type: "move-object",
  objectId: "sticky-123",
  x: 100,
  y: 200,
  userId: "user-456",
  clientId: "client-789",
  timestamp: 1000,
  version: 42
}
```

#### AWS Infrastructure
```
Miro uses AWS components:
- Compute: Lambda or EC2
- Storage: DynamoDB (NoSQL)
- Real-time: ALB with WebSocket support
- Distribution: CloudFront CDN
- Monitoring: CloudWatch
```

#### Strengths
✓ Proven at scale (enterprise adoption)
✓ Advanced conflict handling with OT
✓ Sub-100ms latency achievable
✓ NoSQL allows flexible schema
✓ AWS integration for reliability
✓ Real-time presentations

#### Weaknesses
✗ Proprietary implementation
✗ Not open source
✗ Complex OT logic (implementation risk)
✗ Cannot self-host
✗ OT difficult to extend for custom types

#### Estimated Complexity to Replicate: **9/10**

---

### 3. TLDRAW - Durable Objects + Custom Sync

#### Overview
```
tldraw = Custom sync protocol
         + Cloudflare Durable Objects (serverless)
         + No CRDT (rejected YJS/CRDTs)
         + Up to 50 concurrent users per instance
         + WebSocket communication
```

#### Architecture Diagram
```
┌────────────────────────────┐
│   tldraw Client            │
│   (Canvas Editor)          │
│   - Drawing tools          │
│   - Shape manipulation     │
│   - Real-time sync         │
└──────────────┬─────────────┘
               │
         ┌─────▼─────┐
         │ WebSocket │
         │ Socket.IO │
         └─────┬─────┘
               │
    ┌──────────▼────────────────┐
    │ Cloudflare Workers        │
    │ (Global Edge Network)     │
    └────────┬─────────────────┘
             │ routes to
             │
    ┌────────▼──────────────────────────┐
    │ Durable Object (Persistent State) │
    │                                   │
    │ ┌─────────────────────────────┐  │
    │ │ Confirmed State (storage)   │  │
    │ │ - Persisted shapes, objects │  │
    │ │ - Checkpoint saved          │  │
    │ └──────────┬──────────────────┘  │
    │ ┌──────────▼──────────────────┐  │
    │ │ Pending Edits (in-memory)   │  │
    │ │ - Per-user change tracking  │  │
    │ │ - Conflict detection        │  │
    │ │ - Auto-resolution           │  │
    │ └─────────────────────────────┘  │
    │                                   │
    │ Max: 50 concurrent users/instance │
    └────────────────────────────────────┘
```

#### Why tldraw Rejected CRDT

```
Evaluation Results:

YJS (Popular CRDT library):
  ✗ Text-editor focused (not drawing)
  ✗ Tight integration with ProseMirror
  ✗ Overkill for canvas operations
  ✗ Storage overhead concerns
  ✗ Undo/redo conflicts with merging

CRDTs in General:
  ✗ Automatic merging conflicts with:
    - Custom undo/redo
    - Grouped operations
    - Transform operations
  ✗ Storage overhead (metadata)
  ✗ Requires understanding merge semantics
  ✗ Harder to reason about canvas state

Custom Solution Instead:
  ✓ Optimized for canvas operations
  ✓ Simpler conflict handling
  ✓ Better undo/redo support
  ✓ Less storage overhead
  ✓ Easier to extend
```

#### Conflict Resolution Strategy
```javascript
// tldraw's approach: Separate confirmed vs pending

Server State: {
  confirmed: {
    "shape-1": { x: 100, y: 200 }
  },
  pending: {
    "user-a": [
      { type: "update", objectId: "shape-1", changes: { x: 150 } }
    ],
    "user-b": [
      { type: "update", objectId: "shape-1", changes: { x: 120 } }
    ]
  }
}

Merge Process:
1. Apply user-a's pending change
2. Check for conflict with user-b
3. If conflicting property: server-wins
4. Merge result
5. Broadcast to all
```

#### Durable Objects Advantage
```
What are Durable Objects?
- Persistent state objects at edge
- Strong consistency within object
- Automatic state durability
- Geographic distribution
- Cost-effective

For Collaboration:
- One Durable Object per document/room
- State automatically persisted
- Handles 50 concurrent users
- Auto-scaling (Cloudflare manages)
- Strong consistency guarantees
```

#### Code Example: tldraw Sync
```javascript
// Simplified tldraw sync logic

class TldrawSyncServer {
  constructor() {
    this.confirmed = {}; // Durable storage
    this.pending = {};   // Per-user in-memory
  }

  handleChange(userId, change) {
    // Queue user's change
    if (!this.pending[userId]) {
      this.pending[userId] = [];
    }
    this.pending[userId].push(change);

    // Merge with confirmed state
    const merged = this.mergeChange(change, this.confirmed);

    // Apply to confirmed state
    this.confirmed = merge(this.confirmed, merged);

    // Broadcast to all users
    this.broadcast(merged);

    // Clear this user's pending
    delete this.pending[userId];
  }

  mergeChange(change, confirmedState) {
    // Conflict resolution logic
    // If property already changed: last-writer-wins
    // If new property: add it
    // If object doesn't exist: create it
    return change; // simplified
  }
}
```

#### Strengths
✓ Optimized for canvas/drawing operations
✓ Simple sync protocol (not pure CRDT/OT)
✓ Good undo/redo support
✓ Geographic distribution via Cloudflare
✓ Handles up to 50 concurrent per instance
✓ Automatic state persistence
✓ Modern serverless architecture

#### Weaknesses
✗ Proprietary sync protocol (not reproducible)
✗ Limited to Cloudflare (vendor lock-in)
✗ 50 concurrent users limit (need multiple instances for larger)
✗ Documentation limited (proprietary)
✗ Complex deployment model (Durable Objects)

#### Estimated Complexity to Replicate: **7/10**

---

### 4. EXCALIDRAW - Stateless WebSocket Relay

#### Overview
```
Excalidraw = Simple WebSocket relay
             + End-to-end encryption (optional)
             + No server-side state management
             + Client-side conflict handling
             + Low server complexity
```

#### Architecture Diagram
```
┌────────────────────────────┐
│   Excalidraw Client        │
│                            │
│ ┌──────────────────────┐  │
│ │ Local Drawing State  │  │
│ │ - Shapes, strokes    │  │
│ │ - Version tracking   │  │
│ │ - Conflict handling  │  │
│ └──────────────────────┘  │
└──────────────┬─────────────┘
               │
         ┌─────▼──────────┐
         │  WebSocket     │
         │  (Socket.IO)   │
         │  Encrypted     │
         │  (optional E2E)│
         └─────┬──────────┘
               │
    ┌──────────▼──────────────────────┐
    │ Excalidraw Relay Server         │
    │                                 │
    │ ┌─────────────────────────────┐│
    │ │ Message Router              ││
    │ │ - Receive from client A     ││
    │ │ - Forward to other clients  ││
    │ │ - NO processing/validation  ││
    │ │ - NO conflict resolution    ││
    │ │ - NO state storage          ││
    │ └─────────────────────────────┘│
    │                                 │
    │ Server is STATELESS             │
    │ (Any server can handle room)   │
    └────────────────────────────────┘
```

#### Communication Pattern
```javascript
// Excalidraw message flow

Client A sends:
{
  type: "shape_add",
  shape: {
    id: "shape-1",
    type: "rectangle",
    x: 100,
    y: 200,
    width: 50,
    height: 50
  },
  clientId: "client-a",
  timestamp: 1000
}

Server action: Forward to all other clients in room
(No validation, no merging, just relay)

Client B receives: Same message (unmodified)
Client B applies: Adds shape-1 to local state
Client B renders: Shows shape on canvas
```

#### Conflict Handling (Client-Side)
```javascript
// Excalidraw clients must handle conflicts

class ExcalidrawState {
  applyRemoteChange(change) {
    const local = this.state[change.shapeId];

    if (!local) {
      // New shape: add it
      this.state[change.shapeId] = change.shape;
      return;
    }

    // Shape exists locally
    // Conflict: Both clients modified same shape

    // Strategy: Last-writer-wins (by timestamp)
    if (change.timestamp > local.timestamp) {
      // Remote is newer: apply it
      this.state[change.shapeId] = change.shape;
    } else {
      // Local is newer: keep local
      // Ignore remote (implicit conflict resolution)
    }
  }
}
```

#### Why Stateless Server?
```
Advantages:
✓ Extremely simple (just relay)
✓ Highly scalable (any server handles any room)
✓ No data consistency issues at server level
✓ Low infrastructure requirements
✓ Easy to self-host

Disadvantages:
✗ No server-side validation
✗ Clients must handle all conflicts
✗ No persistence (need separate backend)
✗ Clients might see temporary inconsistencies
✗ Harder to enforce business rules
✗ No undo/redo sync across clients
```

#### End-to-End Encryption (Optional)
```javascript
// Excalidraw can do E2E encryption

Encryption Flow:
1. Generate encryption key (shared via URL)
2. Encrypt all drawing operations locally
3. Send encrypted to server (server can't read)
4. Server relays encrypted messages
5. Clients decrypt using URL key
6. Apply to local state

Limitation:
- Server cannot validate content
- Cannot store drawing state
- Must keep clients in sync (hard without visibility)
```

#### Code Example: Simple Relay
```javascript
// Excalidraw-style server (simplified)

const rooms = {};

io.on('connection', (socket) => {
  socket.on('join-room', (roomId) => {
    socket.join(roomId);

    // Send current state to new user
    if (rooms[roomId]) {
      socket.emit('load-state', rooms[roomId].state);
    }
  });

  socket.on('change', (change) => {
    const room = rooms[socket.rooms[1]];

    // Just relay - no processing
    socket.to(socket.rooms[1]).emit('change', change);

    // Optionally store state (but not required)
    if (room) {
      room.state = applyChangeToState(room.state, change);
    }
  });
});
```

#### Strengths
✓ Very simple server (easy to understand)
✓ Easy to self-host (minimal backend)
✓ Scalable (stateless = horizontal scaling)
✓ Open source
✓ Optional E2E encryption
✓ Minimal server infrastructure
✓ Works with simple Node.js/Express server

#### Weaknesses
✗ No server-side validation
✗ Clients must handle all conflicts
✗ No built-in persistence
✗ Difficult undo/redo synchronization
✗ No way to enforce consistency rules
✗ Eventual consistency only
✗ No permission management at server

#### Estimated Complexity to Replicate: **6/10**

---

## Comparison Summary

### Synchronization Complexity

```
Excalidraw (Stateless Relay)     ████░░░░░░ 4/10
  - Just forward messages
  - Client handles everything

tldraw (Custom Sync)              ███████░░░ 7/10
  - Custom protocol
  - Durable Objects handling
  - Separate confirmed/pending

Figma (CRDT-Inspired)             █████████░ 9/10
  - Complex last-writer-wins
  - Optimized diffs
  - Checkpointing logic

Miro (CRDT/OT Hybrid)             █████████░ 9/10
  - OT transformation functions
  - NoSQL complexity
  - Advanced merging
```

### Scalability (Concurrent Users)

```
Excalidraw (Per Server)           100-500 users
tldraw (Per Instance)             50 users
Figma (Global Infrastructure)     1000+ users
Miro (With NoSQL scaling)         1000+ users
```

### Self-Hosting Difficulty

```
Easy:     Excalidraw, tldraw (with caveats)
Medium:   Miro (need noSQL setup)
Hard:     Figma (not available)
```

### Offline Support

```
None:     Excalidraw (server relay can't work offline)
Partial:  tldraw, Miro (depends on implementation)
Full:     Figma (download + reapply strategy)
```

---

## Recommendation for Different Use Cases

### For Maximum Scale (>100 concurrent)
**Choose: Figma or Miro approach**
- Proven at scale
- Robust conflict handling
- Optimized networking

### For Self-Hosted Canvas App
**Choose: Excalidraw approach**
- Simple relay server
- Easy to understand
- Minimal overhead

### For Custom Canvas Editor
**Choose: tldraw approach**
- Optimized for canvas
- Not text-editor focused
- Flexible conflict resolution

### For PWA/Offline-First
**Choose: CRDT (Yjs)**
- Automatic conflict merging
- Works completely offline
- Eventual consistency

---

## Key Takeaways

1. **No single "best" architecture** - depends on requirements
2. **Excalidraw's simplicity** comes at cost of server validation
3. **Figma's complexity** is necessary for their scale/features
4. **tldraw's approach** balances simplicity and features well
5. **Miro's OT** is powerful but hard to implement correctly
6. **For MVP**: Start with Excalidraw pattern (simple relay)
7. **For Production**: Evolve to Figma pattern (LWW + server authority)

---

**Last Updated**: November 17, 2025
**Research Status**: Complete
**Priority for MangaFusion**: Lower (future feature)
