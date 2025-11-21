# Real-Time Collaboration Architecture for Canvas/Drawing Applications

**Status**: Research Documentation (Lower Priority - Future Implementation)
**Last Updated**: November 17, 2025
**Scope**: MangaFusion Collaboration Design Reference

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Core Technologies](#core-technologies)
3. [Analysis of Collaboration Tools](#analysis-of-collaboration-tools)
4. [Technical Implementation Patterns](#technical-implementation-patterns)
5. [Architecture Design](#architecture-design)
6. [Complexity Assessment](#complexity-assessment)
7. [Recommendations for MangaFusion](#recommendations-for-mangafusion)

---

## Executive Summary

Real-time collaboration for canvas/drawing applications requires careful consideration of synchronization mechanisms, conflict resolution, and network protocols. This document analyzes two primary approaches (Operational Transformation and CRDTs), evaluates communication protocols, and examines implementations from industry leaders.

**Key Findings**:
- **Figma** uses custom CRDT-inspired architecture with last-writer-wins semantics
- **tldraw** uses proprietary sync protocol with Durable Objects (not CRDT-based)
- **Excalidraw** uses WebSocket with Socket.IO and end-to-end encryption
- **Miro** uses WebSocket architecture with CRDT/OT logic
- WebSocket is favored for reliability; WebRTC adds complexity for peer-to-peer scenarios
- Canvas applications need special optimization for latency-sensitive rendering

---

## Core Technologies

### 1. Operational Transformation (OT)

**What It Is**:
Operational Transformation is a technique for maintaining consistency in real-time collaborative editing systems. It works by transforming operations as they arrive to maintain a consistent document state across multiple clients.

**How It Works**:
```
Client A: Insert("Hello") at position 0
Client B: Insert("World") at position 0

Transformation Process:
1. Both clients execute their local operation
2. When updates arrive, they're transformed relative to any
   concurrent operations that already executed
3. Transformed operation is applied to achieve consistent state
```

**Advantages**:
- Proven in production (Google Docs uses OT)
- Strong ordering guarantees
- Efficient for text-based content
- Server-centric architecture is simpler

**Disadvantages**:
- Difficult to implement correctly (proofs in literature contain errors)
- Complex transformation functions required
- Requires central server for ordering
- Not suitable for offline-first applications
- Hard to extend for custom data types

**Use Cases**:
- Real-time document editing (Google Docs, Office 365)
- Text-heavy collaborative applications
- Always-online systems with reliable connectivity

---

### 2. Conflict-Free Replicated Data Types (CRDTs)

**What It Is**:
CRDTs are data structures designed so that copies can be modified independently and then merged without requiring a central source of truth. All operations are commutative.

**How It Works**:
```
Client A: Set property "color" = "red" with timestamp T1
Client B: Set property "color" = "blue" with timestamp T2

Merge Strategy (Last-Writer-Wins):
- If T2 > T1: color = "blue"
- Automatic convergence without central coordination
- Both clients reach same state independently
```

**Advantages**:
- Peer-to-peer capable (no central server needed)
- Works offline seamlessly
- Automatic conflict resolution through merge semantics
- Easier to prove correctness
- Operations are commutative (order doesn't matter)

**Disadvantages**:
- Storage overhead for metadata/history
- Larger message sizes due to operation information
- Limited availability in production (rare in real systems)
- Harder to implement for complex UI interactions
- Less suitable for semantic conflicts

**Use Cases**:
- Offline-first applications (mobile apps, PWAs)
- Peer-to-peer collaboration (no server)
- Decentralized systems
- Variable connectivity scenarios

---

### 3. Hybrid Approaches (Industry Standard)

**Custom CRDT-Inspired Systems**:
Modern applications often use simplified, custom synchronization protocols rather than pure OT or CRDT:

- **Figma's Approach**: Custom system inspired by CRDT principles but optimized for their specific use case
- **tldraw's Approach**: Proprietary sync protocol with server-mediated state management
- **Excalidraw's Approach**: WebSocket-based with client-server architecture

**Why Hybrid?**:
- Pure approaches are either complex (OT) or storage-intensive (CRDT)
- Custom solutions can optimize for specific data types
- Canvas/drawing operations have different characteristics than text

---

## Communication Protocols

### WebSocket vs WebRTC for Drawing Applications

#### WebSocket

**Architecture**:
- Client-server communication protocol
- Persistent TCP connection
- Bidirectional message exchange
- Server acts as central relay/coordinator

**Characteristics**:
```
Client A --\
             --> Server --> Client B
Client C --/
```

**Advantages for Drawing**:
- Simple, well-established protocol
- Works through most proxies and firewalls
- No peer discovery needed
- Server can validate and enforce consistency
- Familiar to most developers
- Supports up to thousands of concurrent connections

**Disadvantages**:
- Server is a bottleneck/single point of failure
- Higher latency due to server hop
- Server infrastructure required
- Scaling requires load balancing

**Implementation Example**:
```javascript
// WebSocket for draw sync
const socket = new WebSocket('wss://server.example.com/draw');

socket.on('draw-stroke', (data) => {
  // Apply stroke from another user
  canvas.drawStroke(data);
});

// Send local drawing
canvas.on('stroke-complete', (stroke) => {
  socket.send('draw-stroke', stroke);
});
```

**Tools Using WebSocket**:
- Excalidraw (Socket.IO)
- Miro (custom WebSocket)
- Figma (custom multiplayer service)
- tldraw (WebSocket with Durable Objects)

---

#### WebRTC (with Data Channels)

**Architecture**:
- Peer-to-peer communication
- Direct connection between clients
- Signaling server needed only for initial setup
- Used for low-latency scenarios

**Characteristics**:
```
Client A <---Data Channel---> Client B
   ^                              ^
   |                              |
   +--------Signaling Server------+
           (setup only)
```

**Advantages for Drawing**:
- Lowest possible latency (P2P)
- No central server needed for data
- Works well for small groups (2-10 people)
- Can work with unreliable signaling

**Disadvantages**:
- Complex implementation
- Difficult NAT/firewall traversal
- Limited scalability (P2P doesn't scale to many users)
- Still requires signaling server
- Difficult debugging
- Browser support variations

**Use Cases**:
- Small group collaboration (2-5 people)
- Applications that can tolerate complexity
- Specialized scenarios needing ultra-low latency

**Recommended Hybrid Approach**:
```
WebSocket for signaling + WebRTC Data Channels:
1. Establish WebSocket connection to server
2. Negotiate P2P connection through signaling server
3. Transfer drawing data through WebRTC after connected
4. Fallback to WebSocket if P2P fails
```

**Verdict for Drawing Applications**:
**WebSocket is the standard choice** due to simplicity, reliability, and proven scalability. WebRTC adds complexity for minimal latency gain in most scenarios.

---

## Cursor Position and Presence Awareness

### Implementation Strategy

Cursor positions and presence awareness are separate from document state synchronization:

**Key Differences**:
- **Document State**: Permanent, must be synchronized perfectly
- **Cursor/Presence**: Ephemeral, eventual consistency acceptable
- **Cursor Updates**: High frequency, can tolerate loss

**Architecture**:

```javascript
// Separate channels for state vs presence
class CollaborationManager {
  constructor(socket) {
    // Reliable state sync
    this.stateSync = new StateSync(socket);

    // Ephemeral presence (lower priority)
    this.presence = new PresenceManager(socket);
  }

  // State changes (critical)
  drawStroke(stroke) {
    this.stateSync.send('stroke-add', stroke);
  }

  // Cursor movement (frequent but not critical)
  updateCursorPosition(x, y) {
    // Can batch, throttle, or drop frames
    this.presence.broadcast('cursor-move', { x, y });
  }
}
```

### Presence Implementation Pattern

**Technology Used by Industry**:
- **Yjs Awareness Protocol**: CRDT-based presence tracking
- **Tiptap Collaboration**: User presence, cursor positions, custom states
- **Supabase Realtime Cursors**: Managed cursor sharing
- **Custom Solutions**: Figma, Miro, Excalidraw all use custom presence tracking

**Implementation Approach**:

```javascript
// Presence state (shared separately from document)
const userPresence = {
  userId: "user-123",
  color: "#FF5733",
  cursor: { x: 100, y: 200 },
  selection: { start: 0, end: 10 },
  lastUpdate: Date.now()
};

// High-frequency updates (throttled)
socket.on('cursor-move', (data) => {
  updateRemoteUserCursor(data.userId, data.cursor);
});

// Low-frequency persistence (only on change)
socket.on('presence-update', (data) => {
  // Update user name, color, etc.
  updateUserPresence(data);
});
```

**Optimal Update Rates**:
- Cursor position: 10-30 Hz (every 33-100ms)
- Selection/viewport: 5-10 Hz (every 100-200ms)
- User presence: <1 Hz (on change only)

**Considerations**:
- Cursor updates can be lossy (not all frames need sync)
- Color-coded cursors with user names improve UX
- Throttling prevents network flooding
- Separate channel from document state

---

## Analysis of Collaboration Tools

### 1. Figma (CRDT-Inspired Custom Architecture)

**Architecture Overview**:
- WebSocket connection to "multiplayer" service
- In-memory document state
- Checkpointing to storage every 30-60 seconds
- Custom CRDT-inspired synchronization
- 30 FPS update rate (33ms intervals)

**Synchronization Strategy**:
```
Figma Document = Tree of Objects (like DOM)
Each object = { id, properties }

Conflict Resolution:
- Last-writer-wins for same property
- Server receives updates, applies them
- Diffs are highly optimized (only changes sent)
```

**Key Technical Decisions**:
- Rejected pure CRDT due to complexity
- Rejected pure OT due to implementation difficulty
- Custom solution optimized for their data model
- Server maintains single source of truth
- Offline support through re-download + reapply

**Code Pattern**:
```javascript
// Figma's approach (simplified)
const state = {
  objects: {
    "page-1": {
      id: "page-1",
      name: "Page 1",
      shapes: ["shape-1", "shape-2"]
    },
    "shape-1": {
      id: "shape-1",
      type: "rect",
      x: 100,
      y: 200,
      fill: "#FF0000",
      version: 42
    }
  }
};

// Incoming update from user B
const update = {
  objectId: "shape-1",
  property: "fill",
  value: "#00FF00",
  version: 43
};

// Apply with last-writer-wins
state.objects["shape-1"].fill = update.value;
state.objects["shape-1"].version = update.version;
```

**Performance Characteristics**:
- Update latency: ~33-100ms (depends on server + network)
- Supports hundreds of concurrent users
- Checkpointing prevents data loss
- Graceful offline handling

**Complexity**: **HIGH** (custom solution requires deep understanding)

---

### 2. tldraw (Proprietary Sync with Durable Objects)

**Architecture Overview**:
- Custom sync protocol (NOT CRDT-based despite exploration)
- Durable Objects (Cloudflare Workers) for state management
- Up to 50 concurrent collaborators per instance
- Separate layers for confirmed vs pending edits
- Socket.IO for communication

**Why NOT CRDT**:
- YJS is text-editor focused
- CRDTs require significant storage overhead
- Automatic undo/redo conflicts with CRDT merging
- Custom canvas operations don't fit CRDT model

**Synchronization Strategy**:
```
Durable Object = Persistent server-side state
Each has:
- Confirmed state (written to storage)
- Pending changes (in-memory)
- Conflict resolution layer

When users edit same element:
1. Changes go to Durable Object
2. Separate layers prevent conflicts
3. Auto-resolution applies
4. All clients updated
```

**Architecture Layers**:
```javascript
// tldraw sync architecture
class SyncServer {
  constructor() {
    this.confirmedState = {}; // From storage
    this.pendingEdits = {}; // Per user in-memory
  }

  applyEdit(userId, edit) {
    // Store pending edit
    this.pendingEdits[userId] = edit;

    // Merge with confirmed state
    const merged = this.mergeWithConfirmed(edit);

    // Broadcast to all
    this.broadcastUpdate(merged);

    // Periodically checkpoint confirmed state
    this.maybeCheckpoint();
  }
}
```

**Advantages**:
- Handles custom undo/redo well
- Geographic distribution via Cloudflare
- Simple mental model (not pure CRDT)
- Good performance characteristics

**Disadvantages**:
- Vendor lock-in (Cloudflare)
- Limited to Durable Objects architecture
- Harder to self-host

**Complexity**: **MEDIUM** (uses standard patterns but custom protocol)

---

### 3. Excalidraw (WebSocket + Socket.IO)

**Architecture Overview**:
- WebSocket via Socket.IO
- Client-server relay model (not true P2P)
- End-to-end encrypted messages
- No server-side persistence of drawing state
- Server only relays updates
- Separate collaboration rooms

**Synchronization Strategy**:
```
Client A --\
             Socket.IO --> Relay --> Socket.IO --> Client B
                Server      (no processing)
Client C --/
```

**Key Characteristics**:
- Server is dumb relay (doesn't validate)
- No server-side conflict resolution
- Clients must handle conflicts locally
- No built-in persistence (stateless)
- End-to-end encryption possible

**Implementation Pattern**:
```javascript
// Excalidraw approach
const socket = io(SERVER_URL);

socket.on('connect', () => {
  socket.emit('join-room', roomId);
});

// Outgoing changes
scene.on('change', (changes) => {
  socket.emit('drawing-change', {
    changes: changes,
    clientId: myId,
    timestamp: Date.now()
  });
});

// Incoming changes
socket.on('drawing-change', (data) => {
  if (data.clientId !== myId) {
    applyChangesToScene(data.changes);
  }
});
```

**Advantages**:
- Simple server logic (just relay)
- Stateless server (easy scaling)
- Works with self-hosted servers
- No central point of truth enforcement
- Good for security-conscious applications

**Disadvantages**:
- No server-side validation
- Clients must handle all conflicts
- Harder to enforce consistency rules
- No undo/redo synchronization
- Clients might see temporary inconsistencies

**Complexity**: **LOW-MEDIUM** (simple relay, complex client logic)

---

### 4. Miro (WebSocket + CRDT/OT Hybrid)

**Architecture Overview**:
- WebSocket for communication
- Server applies CRDT/OT logic
- Central sync service
- NoSQL storage (DynamoDB-like)
- Focus on sub-100ms latency

**Synchronization Strategy**:
```
Client Actions --> WebSocket --> Sync Service --> Apply CRDT/OT Logic
                                        |
                                        v
                                  NoSQL Store + Broadcast
```

**Performance Goals**:
- Cursor movement: <100ms latency
- Sticky note movement: <100ms latency
- Visual feedback: Immediate (optimistic UI)

**Architecture Pattern**:
```javascript
// Miro's sync service approach
class SyncService {
  async handleAction(action, userId) {
    // Apply CRDT/OT transformation
    const transformed = this.transform(
      action,
      this.serverState,
      this.pendingActions
    );

    // Store to NoSQL
    await this.storage.save(transformed);

    // Broadcast to all connected clients
    this.broadcastToRoom(action.roomId, transformed);

    // Update in-memory state
    this.serverState = merge(this.serverState, transformed);
  }
}
```

**Key Design Elements**:
- AWS infrastructure
- REST APIs + WebSocket
- Optimistic UI updates
- Server validation and final authority

**Complexity**: **HIGH** (CRDT/OT logic + infrastructure)

---

## Technical Implementation Patterns

### Pattern 1: State Synchronization

**Delta-Based Updates** (Figma, Miro):
```javascript
// Only send what changed
const delta = {
  objectId: "shape-1",
  changes: {
    fill: "#00FF00",
    x: 200
  },
  version: 43
};
```

**Snapshot-Based Updates** (Simpler but less efficient):
```javascript
// Send entire object state
const snapshot = {
  objectId: "shape-1",
  fill: "#00FF00",
  x: 200,
  y: 100,
  stroke: "#000000",
  version: 43
};
```

**Best Practice**: Use delta-based for performance, snapshot-based for error recovery.

---

### Pattern 2: Offline Support

**Approach 1: Queue + Merge** (Figma):
```javascript
class OfflineSyncManager {
  async goOffline() {
    this.isOffline = true;
    // Continue accepting local changes
  }

  async goOnline() {
    // Download fresh document
    const freshDocument = await fetch('/api/document/current');

    // Reapply offline changes
    const reapplied = this.reapplyOfflineEdits(
      this.offlineQueue,
      freshDocument
    );

    // Sync merged state
    await this.syncWithServer(reapplied);
  }
}
```

**Approach 2: Local-First CRDT** (Best for PWAs):
```javascript
class LocalFirstEditor {
  constructor(docId) {
    // CRDT allows offline edits to merge automatically
    this.doc = new CRDT.Document(docId);
    this.storage = new LocalStorage();
  }

  edit(change) {
    // Works offline automatically
    this.doc.apply(change);
    this.storage.save(this.doc);
  }

  sync() {
    // Merge with server - CRDT handles conflicts
    const remote = await fetch(`/api/doc/${this.docId}`);
    this.doc.merge(remote);
  }
}
```

**Tradeoffs**:
- Queue + Merge: Simple, requires server logic
- CRDT: Complex, fully offline-first

---

### Pattern 3: Conflict Resolution

**Last-Writer-Wins** (Figma, simple):
```javascript
// Simple timestamp-based resolution
const incoming = { value: 100, timestamp: 1000 };
const local = { value: 50, timestamp: 900 };

const resolved = incoming.timestamp > local.timestamp
  ? incoming.value
  : local.value;
// Result: 100
```

**Operational Transform** (Google Docs):
```javascript
// Transform operations based on history
function transform(op1, op2) {
  // If op1 inserts before op2, adjust op2 index
  if (op1.type === 'insert' && op2.type === 'insert') {
    if (op1.position <= op2.position) {
      op2.position += op1.content.length;
    }
  }
  return op2;
}
```

**Semantic Conflict Resolution** (Custom):
```javascript
// Understand intent, not just operation
if (bothUsersChangedFill() && different) {
  // Don't use last-writer-wins
  // Instead: ask user, merge colors, pick based on role
  return resolveColorConflict(userA, userB);
}
```

**Recommendation**: Start with last-writer-wins, add semantic resolution only when needed.

---

### Pattern 4: Cursor and Selection Sharing

**Presence-Only Approach**:
```javascript
class PresenceManager {
  updateLocalPresence() {
    const myPresence = {
      userId: this.myId,
      cursor: this.getCursorPosition(),
      selection: this.getSelection(),
      color: this.myColor,
      timestamp: Date.now()
    };

    // Send immediately (not batched)
    socket.emit('presence', myPresence);
  }

  // Render remote cursors
  renderRemoteCursors(presenceData) {
    presenceData.forEach(user => {
      this.drawCursor(user.cursor, user.color, user.userId);
    });
  }
}
```

**With Awareness Protocol** (Yjs approach):
```javascript
// Uses CRDT awareness protocol
const awareness = doc.awareness;

awareness.setLocalState({
  user: {
    name: 'Alice',
    color: '#FF0000'
  },
  cursor: {
    anchor: 10,
    head: 20
  }
});

// Listen for changes
awareness.on('change', changes => {
  changes.forEach(change => {
    const user = doc.awareness.getStates().get(change.clientID);
    updateRemoteUserUI(user);
  });
});
```

---

### Pattern 5: Version Control and History

**Lamport Clock** (Simple):
```javascript
class VersionControl {
  constructor() {
    this.version = 0;
  }

  // Increment on any change
  localChange() {
    this.version++;
    return { data, version: this.version };
  }

  // Increment on remote change
  remoteChange(remoteVersion) {
    this.version = Math.max(this.version, remoteVersion) + 1;
    return this.version;
  }
}
```

**Vector Clock** (For distributed systems):
```javascript
// Track causality between clients
class VectorClock {
  constructor(clientId, otherClients) {
    // Own counter
    this.clock[clientId] = 0;
    // Track all other clients
    otherClients.forEach(id => this.clock[id] = 0);
  }

  localChange() {
    this.clock[this.clientId]++;
    return { data, vector: { ...this.clock } };
  }

  remoteChange(remoteVector) {
    // Update local clock based on remote
    Object.keys(remoteVector).forEach(id => {
      this.clock[id] = Math.max(this.clock[id], remoteVector[id]);
    });
    this.clock[this.clientId]++;
  }
}
```

---

## Architecture Design

### Recommended Architecture for MangaFusion (Future Implementation)

Given MangaFusion's characteristics (manga editing, drawing-focused), here's a recommended collaboration architecture:

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (Canvas)                         │
│  ┌──────────────────┐         ┌───────────────────┐         │
│  │ Canvas Renderer  │◄────────┤ Collaboration     │         │
│  │                  │         │ Manager           │         │
│  └──────────────────┘         └────────┬──────────┘         │
│                                        │                      │
└────────────────────────────────────────┼──────────────────────┘
                                         │
                      ┌──────────────────┴──────────────────┐
                      │                                      │
          ┌───────────▼─────────┐          ┌─────────▼──────────┐
          │   State Sync        │          │  Presence Sync     │
          │   (Critical)        │          │  (Ephemeral)       │
          │ WebSocket Reliable  │          │  WebSocket Lossy   │
          └────────┬────────────┘          └────────┬───────────┘
                   │                               │
                   │    Shared WebSocket           │
                   │    Connection to Server       │
                   │                               │
┌──────────────────▼───────────────────────────────▼──────────┐
│                    Server (Node.js)                          │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Message Router                                      │  │
│  │  - Route state changes                               │  │
│  │  - Route presence updates                            │  │
│  └────────┬──────────────────────────────┬──────────────┘  │
│           │                               │                 │
│  ┌────────▼──────────┐       ┌────────────▼─────────┐     │
│  │ State Manager     │       │ Presence Manager     │     │
│  │ ─────────────     │       │ ─────────────────    │     │
│  │ - Merge changes   │       │ - Track users        │     │
│  │ - Version control │       │ - Broadcast cursors  │     │
│  │ - Validate        │       │ - Timeout inactive   │     │
│  │ - Checkpoint      │       │ - Color assignment   │     │
│  └────────┬──────────┘       └──────────────────────┘     │
│           │                                                 │
│  ┌────────▼──────────────────────────────────────────────┐ │
│  │  Persistent Storage (MongoDB / PostgreSQL)           │ │
│  │  ─────────────────────────────────────────           │ │
│  │  - Document snapshots                               │ │
│  │  - Change history                                   │ │
│  │  - User presence log                                │ │
│  └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

### Technology Choices

**Communication Protocol**: **WebSocket + Socket.IO**
- Simpler than WebRTC for drawing
- Works reliably through most networks
- Proven at scale
- Server-mediated makes conflict resolution easier

**Synchronization Method**: **Hybrid Custom System** (like Figma/tldraw)
- Not pure CRDT (too much storage overhead)
- Not pure OT (too complex to implement)
- Custom protocol optimized for canvas operations
- Delta-based updates for efficiency

**Conflict Resolution**: **Last-Writer-Wins + Server Authority**
- Simple to implement
- Works well for most scenarios
- Server validates final state
- Add semantic resolution only if needed

**State Management**: **Server-as-Source-of-Truth**
- All changes go through server
- Server applies transformations
- Server broadcasts to all clients
- Clients maintain optimistic UI

**Offline Support**: **Queue + Reapply on Reconnect**
- User can edit offline
- Queue changes locally
- Redownload fresh state on reconnect
- Reapply offline changes
- Handle merge conflicts

---

### Data Structures

**Canvas Object Model**:
```typescript
interface CanvasObject {
  id: string;
  type: 'stroke' | 'shape' | 'text' | 'image';
  version: number;
  timestamp: number;
  userId: string;

  // Visual properties
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
  fill?: string;
  stroke?: string;

  // Content
  data?: any; // stroke points, text content, etc.

  // Metadata
  locked: boolean;
  hidden: boolean;
  zIndex: number;
  groupId?: string;

  // For drawing: store stroke as point array
  points?: Array<{x: number; y: number; pressure?: number; time: number}>;
}

interface DrawingDocument {
  id: string;
  title: string;
  version: number;
  lastModified: number;
  objects: Map<string, CanvasObject>;
  layers: string[]; // Ordered list of object IDs
  metadata?: {
    resolution: { width: number; height: number };
    created: number;
    collaborators: string[];
  };
}
```

**Sync Message Format**:
```typescript
interface SyncMessage {
  // Metadata
  id: string;
  timestamp: number;
  clientId: string;
  userId: string;

  // Content
  type: 'object-add' | 'object-update' | 'object-delete';
  objectId: string;

  // For updates: only send changed fields
  changes: {
    [key: string]: any;
  };

  // For versioning
  baseVersion: number;
  newVersion: number;

  // Conflict handling
  isConflict?: boolean;
  conflictResolution?: 'server-wins' | 'client-request-merge';
}

interface PresenceMessage {
  userId: string;
  clientId: string;
  timestamp: number;

  cursor: {
    x: number;
    y: number;
    isActive: boolean;
  };

  selection?: {
    objectIds: string[];
    boundingBox?: { x, y, width, height };
  };

  user: {
    name: string;
    color: string;
    avatar?: string;
  };
}
```

---

### Implementation Phases

**Phase 1 - Foundation** (Weeks 1-2):
```
✓ WebSocket setup with Socket.IO
✓ Basic message routing
✓ Single-server state management
✓ Client-side state update handling
```

**Phase 2 - Core Sync** (Weeks 3-4):
```
✓ Delta-based change messages
✓ Version tracking (Lamport clock)
✓ Conflict detection and last-writer-wins
✓ Storage checkpointing (30-60 sec intervals)
```

**Phase 3 - Presence** (Weeks 5-6):
```
✓ Cursor position sharing
✓ User color coding
✓ Selection awareness
✓ User join/leave events
```

**Phase 4 - Reliability** (Weeks 7-8):
```
✓ Offline queue management
✓ Reconnection handling
✓ Consistency validation
✓ Error recovery
```

**Phase 5 - Optimization** (Weeks 9-10):
```
✓ Message compression
✓ Batch updates (when possible)
✓ Render optimization for multiple cursors
✓ Network performance tuning
```

---

## Complexity Assessment

### Implementation Complexity Matrix

| Feature | Complexity | Time Est. | Risk | Notes |
|---------|-----------|----------|------|-------|
| **WebSocket Setup** | LOW | 2 days | LOW | Well-established pattern |
| **Basic Sync** | MEDIUM | 3-5 days | LOW | Delta messages + versioning |
| **Conflict Resolution** | MEDIUM | 2-3 days | MEDIUM | Last-writer-wins simpler |
| **Persistence** | MEDIUM | 2-3 days | MEDIUM | Checkpointing strategy |
| **Presence/Cursors** | LOW-MEDIUM | 1-2 days | LOW | Ephemeral data is simpler |
| **Offline Support** | HIGH | 5-7 days | HIGH | Queue + reapply complex |
| **Error Recovery** | MEDIUM | 3-4 days | MEDIUM | Handle edge cases |
| **Scaling** | HIGH | 7-10 days | HIGH | Multi-server setup |
| **Testing** | MEDIUM | 4-6 days | HIGH | Race conditions hard to test |

### Complexity Score Breakdown

**CRDT Approach**: **9/10** (Very Complex)
- Steep learning curve
- Hard to debug
- Storage overhead
- Better offline-first support
- Academic implementation difficulty

**Operational Transformation**: **8/10** (Very Complex)
- Transformation functions error-prone
- Requires central server
- Good for always-online
- Industry adoption (Google)
- Complex proofs

**Custom Hybrid** (Recommended): **5/10** (Moderate)
- Last-writer-wins is simple
- Delta-based sync is manageable
- Server-as-truth simplifies logic
- Easy to reason about
- Easier to debug

**WebSocket-Based (vs WebRTC)**: **Lower Complexity by 2-3 points**
- No peer discovery
- No NAT traversal
- Simple client-server model
- Familiar pattern

### Estimated Effort for MangaFusion

**Minimum Viable Collaboration** (6-8 weeks):
- WebSocket transport
- Basic delta sync
- Last-writer-wins conflicts
- Cursor sharing
- Estimated 200-300 LOC backend + 150-200 LOC frontend

**Production-Ready** (12-16 weeks):
- Above +
- Offline support
- Error recovery
- Testing suite
- Monitoring/observability
- Performance optimization
- Estimated 800-1200 LOC backend + 500-700 LOC frontend

**Fully Featured** (20-24 weeks):
- Above +
- Multi-server scaling
- Advanced conflict resolution
- Presence persistence
- Analytics
- Estimated 2000+ LOC total

---

## Recommendations for MangaFusion

### Short-Term (Current Priority: Lower)

**Document-First Approach**: ✓ *Already documented*
- Keep collaboration knowledge centralized
- Reference for future implementation
- Design patterns are recorded
- Architecture decisions documented

### Medium-Term (When Implementing)

**Recommended Technology Stack**:
```javascript
// Backend
- Node.js + Express
- Socket.IO for WebSocket
- MongoDB for persistence
- Redis for session/presence (optional)

// Frontend
- React canvas library (Konva, Fabric.js, or custom)
- Socket.IO client
- Local state management (Redux or Zustand)

// Deployment
- Single server initially (handles 50-100 concurrent users)
- Horizontal scaling via message queue if needed
```

**Implementation Approach**:
1. Start with WebSocket + basic sync
2. Add last-writer-wins conflict resolution
3. Implement persistent storage
4. Add cursor/presence sharing
5. Enhance with offline support later

**NOT Recommended Initially**:
- CRDTs (too complex unless offline-first is critical)
- WebRTC (adds complexity for marginal gain)
- Custom OT implementation (error-prone)
- Multi-server setup (until actual scale needed)

### Integration Points with Existing Code

**Collaboration Manager Module**:
```typescript
// New module: src/lib/collaboration/
CollaborationManager.ts
├── SyncManager.ts        // Handle document sync
├── PresenceManager.ts    // Handle cursors/presence
├── ConflictResolver.ts   // Handle conflicts
├── OfflineQueue.ts       // Handle offline edits
└── StorageManager.ts     // Handle persistence
```

**Frontend Integration**:
```typescript
// In canvas component
const { document, syncManager } = useCollaboration(docId);

// On local change
syncManager.sendChange({
  objectId: shape.id,
  changes: { fill: '#FF0000' }
});

// Listen for remote changes
syncManager.on('change', (change) => {
  updateCanvasObject(change);
});
```

**Backend Integration**:
```typescript
// In server
const collaborationService = new CollaborationService(db, socket);

socket.on('change', (message) => {
  collaborationService.handleChange(message);
});

// Periodically checkpoint
setInterval(() => {
  collaborationService.checkpoint();
}, 45000); // 45 seconds
```

---

## Conclusion

Real-time collaboration for canvas/drawing applications is **achievable but non-trivial**. Key takeaways:

1. **Use WebSocket** - Proven, simple, scalable
2. **Use custom hybrid sync** - Simple last-writer-wins + server authority
3. **Separate concerns** - State sync vs presence tracking
4. **Plan for offline** - Queue + reapply on reconnect
5. **Test thoroughly** - Race conditions are subtle
6. **Start simple** - Add features as needed

**MangaFusion Status**: Current implementation does not include multiplayer collaboration. This documentation serves as a reference for future consideration when collaboration becomes a priority feature.

---

## References and Resources

### Academic Papers
- "Real Differences between OT and CRDT under a General Transformation Framework"
- Research on collaborative 2D editing systems

### Tools & Libraries
- **Yjs**: CRDT library with presence awareness
- **Automerge**: JSON-like CRDT
- **Socket.IO**: WebSocket abstraction
- **Convergence**: Specialized collaboration engine
- **Figma**: Reference implementation (blog posts)

### Further Reading
- [Figma's Multiplayer Blog](https://www.figma.com/blog/how-figmas-multiplayer-technology-works/)
- [tldraw Sync Documentation](https://tldraw.dev/docs/collaboration)
- [Excalidraw P2P Collaboration](https://blog.excalidraw.com/building-excalidraw-p2p-collaboration-feature/)
- [CRDT Overview](https://crdt.tech/)

---

**Document Metadata**
- Version: 1.0
- Status: Research Complete
- Priority: Lower
- Next Review: When collaboration feature is planned
- Author: Architecture Research
