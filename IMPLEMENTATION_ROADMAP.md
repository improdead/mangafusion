# Canvas Drawing + Sketch-to-Manga Refinement: Implementation Roadmap

**Project Timeline:** 12-16 weeks from start to profitability
**Budget:** $30,000-35,000 development + ongoing operations
**Target Launch:** 8-10 weeks

---

## Phase 1: MVP Development (Weeks 1-8)

### Week 1-2: Planning & Setup

#### Tasks
- [ ] Set up Stability AI free account
- [ ] Configure Redis Cloud (Essentials $5/month)
- [ ] Create Supabase bucket for sketches
- [ ] Design database schema for sketches
- [ ] Set up cost tracking infrastructure

#### Database Schema Addition (Prisma Migration)

```typescript
// schema.prisma additions
model Sketch {
  id              String    @id @default(cuid())
  userId          String
  user            User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  title           String
  description     String?
  originalData    String    @db.Text  // Base64 or JSON canvas data
  originalImage   String?   // Supabase URL

  status          String    @default("draft") // draft, processing, completed, failed

  refinement      Refinement[]

  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  @@index([userId])
  @@index([status])
}

model Refinement {
  id              String    @id @default(cuid())
  sketchId        String
  sketch          Sketch    @relation(fields: [sketchId], references: [id], onDelete: Cascade)

  provider        String    // "stability", "gemini", "dall-e"
  prompt          String    @db.Text
  refinedImage    String?   // Supabase URL

  status          String    @default("pending") // pending, processing, completed, failed
  cost            Float     // Cost in dollars
  processingTime  Int?      // Time in seconds

  errorMessage    String?
  retryCount      Int       @default(0)

  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  @@index([sketchId])
  @@index([status])
  @@index([provider])
}

model UsageMetrics {
  id              String    @id @default(cuid())
  userId          String
  user            User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  month           DateTime
  imagesGenerated Int       @default(0)
  totalCost       Float     @default(0)

  createdAt       DateTime  @default(now())

  @@unique([userId, month])
  @@index([userId])
}
```

#### Development Cost: 20 hours @ $70/hr = $1,400

---

### Week 2-4: Frontend Canvas Component (120 hours)

#### Component Structure

```typescript
// pages/studio/canvas.tsx
import Konva from 'react-konva';
import SketchCanvas from '@/components/SketchCanvas';
import SketchToolbar from '@/components/SketchToolbar';
import RefinementPanel from '@/components/RefinementPanel';

interface CanvasComponentProps {
  episodeId: string;
  pageId?: string;
}

export default function CanvasComponent({ episodeId, pageId }: CanvasComponentProps) {
  const [canvasRef, setCanvasRef] = useState<Konva.Stage>(null);
  const [sketch, setSketch] = useState<Sketch | null>(null);
  const [tool, setTool] = useState<'pen' | 'eraser' | 'select'>('pen');
  const [color, setColor] = useState('#000000');
  const [strokeWidth, setStrokeWidth] = useState(3);

  const handleExportSketch = async () => {
    // Export canvas as PNG
    const uri = canvasRef?.current?.toDataURL();
    // Save to Supabase
    const result = await api.post(`/sketches/upload`, {
      episodeId,
      imageUri: uri,
      metadata: { tool: 'canvas' }
    });
    setSketch(result.data);
  };

  const handleRefine = async (prompt: string) => {
    // Send sketch to refinement API
    const result = await api.post(`/sketches/${sketch.id}/refine`, {
      prompt,
      provider: 'stability'
    });
    // Track cost
    updateUsageMetrics(result.cost);
  };

  return (
    <div className="flex h-screen">
      <div className="flex-1">
        <SketchCanvas
          ref={setCanvasRef}
          tool={tool}
          color={color}
          strokeWidth={strokeWidth}
        />
      </div>
      <div className="w-80 bg-gray-100">
        <SketchToolbar
          tool={tool}
          color={color}
          strokeWidth={strokeWidth}
          onToolChange={setTool}
          onColorChange={setColor}
          onStrokeWidthChange={setStrokeWidth}
          onExport={handleExportSketch}
        />
        {sketch && (
          <RefinementPanel
            sketch={sketch}
            onRefine={handleRefine}
          />
        )}
      </div>
    </div>
  );
}
```

#### Components to Build

| Component | Purpose | Complexity | Hours |
|-----------|---------|-----------|-------|
| SketchCanvas | Main drawing canvas using Konva | High | 40 |
| SketchToolbar | Tool selection, color, brush size | Low | 15 |
| RefinementPanel | Prompt input, refinement controls | Medium | 20 |
| LayerPanel | Layer management and visibility | Medium | 15 |
| UndoRedoManager | Undo/redo history | Medium | 15 |
| ExportDialog | Canvas export options | Low | 10 |
| ComparisonView | Side-by-side original/refined | Low | 10 |

**Subtotal:** 125 hours @ $70/hr = $8,750

#### Key Features

1. **Brush Tools**
   - Freehand drawing with pressure sensitivity
   - Eraser tool
   - Shape tools (line, rectangle, circle)
   - Text tool for annotations

2. **Canvas Features**
   - Adjustable brush size (1-100px)
   - Color picker
   - Transparency/opacity control
   - Grid/snap-to-grid option

3. **Layer System**
   - Multiple layers with visibility toggle
   - Layer ordering
   - Layer opacity/blending modes
   - Layer merging

4. **File Operations**
   - Export as PNG/JPEG
   - Save to Supabase
   - Load from URL
   - Batch processing

#### Dependencies

```json
{
  "react-konva": "^18.2.10",
  "konva": "^9.2.0",
  "react-color": "^2.19.3",
  "lz-string": "^1.5.0",
  "zustand": "^4.4.0"
}
```

---

### Week 4-6: Backend API & Integration (100 hours)

#### API Endpoints

```typescript
// sketches.controller.ts
@Controller('api/sketches')
export class SketchesController {

  @Post('upload')
  async uploadSketch(
    @Body() dto: UploadSketchDto,
    @Headers('authorization') token: string
  ) {
    // 1. Validate sketch data
    // 2. Compress with lz-string
    // 3. Upload to Supabase
    // 4. Save to Prisma
    // 5. Return sketch ID
  }

  @Post(':id/refine')
  async refineSketch(
    @Param('id') sketchId: string,
    @Body() dto: RefineSketchDto
  ) {
    // 1. Get sketch from DB
    // 2. Validate permissions
    // 3. Create job in BullMQ queue
    // 4. Return job ID
  }

  @Get(':id/status')
  async getSketchStatus(@Param('id') sketchId: string) {
    // Return sketch and refinement status
  }

  @Get(':id/refinements')
  async getSketchRefinements(@Param('id') sketchId: string) {
    // Return all refinements for sketch
  }

  @Delete(':id')
  async deleteSketch(
    @Param('id') sketchId: string,
    @Headers('authorization') token: string
  ) {
    // 1. Delete from Prisma
    // 2. Delete from Supabase
    // 3. Cancel pending jobs
  }
}
```

#### AI Provider Integration Service

```typescript
// sketch-refiner.service.ts
@Injectable()
export class SketchRefinerService {

  private queue: Queue<RefineJobPayload>;

  async refineSketch(
    sketch: Sketch,
    prompt: string,
    provider?: 'stability' | 'gemini' | 'dall-e'
  ): Promise<Refinement> {
    // 1. Pre-process sketch image
    // 2. Optimize prompt
    // 3. Add to queue
    // 4. Return job tracking info
  }

  async processRefineJob(job: Job<RefineJobPayload>) {
    try {
      const { sketchId, prompt, provider } = job.data;

      // 1. Get sketch image
      // 2. Call AI provider
      // 3. Upload result to Supabase
      // 4. Save refinement to DB
      // 5. Track cost

      return { status: 'completed', imageUrl, cost };
    } catch (error) {
      // Implement retry logic
      throw error;
    }
  }

  private async callStabilityAI(imageUrl: string, prompt: string) {
    // Call Stability API
    // Handle rate limiting
    // Track cost
  }

  private async callGemini(imageUrl: string, prompt: string) {
    // Call Gemini Vision API for editing
    // Track cost
  }
}
```

#### Cost Tracking Service

```typescript
// usage-tracker.service.ts
@Injectable()
export class UsageTrackerService {

  async trackRefineCall(
    userId: string,
    cost: number,
    provider: string,
    processingTime: number
  ) {
    // 1. Get current month's usage
    // 2. Update cost and count
    // 3. Check against quota
    // 4. Emit cost alert if needed
  }

  async getUserUsage(userId: string, month: Date) {
    // Get monthly usage metrics
  }

  async getAggregateMetrics(startDate: Date, endDate: Date) {
    // Get total cost across all users
  }

  async checkQuota(userId: string): Promise<QuotaStatus> {
    // Verify user hasn't exceeded their plan quota
  }
}
```

#### Queue Implementation

```typescript
// bull-queue.module.ts
@Module({
  providers: [
    {
      provide: 'REFINE_QUEUE',
      useFactory: async (redisService: RedisService) => {
        const queue = new Queue('sketch-refine', {
          connection: redisService.getClient(),
          defaultJobOptions: {
            attempts: 3,
            backoff: { type: 'exponential', delay: 2000 },
            removeOnComplete: true,
            removeOnFail: false,
          },
        });

        queue.process(async (job) => {
          return await sketchRefiner.processRefineJob(job);
        });

        return queue;
      },
    },
  ],
})
export class BullQueueModule {}
```

**Subtotal:** 100 hours @ $75/hr = $7,500

---

### Week 6-8: Testing, Deployment & Polish (80 hours)

#### Testing Strategy

```typescript
// sketches.controller.spec.ts
describe('SketchesController', () => {

  it('should upload sketch and save to Supabase', async () => {
    // Mock Supabase
    // Call uploadSketch
    // Verify saved to DB
    // Verify returned correct data
  });

  it('should queue refinement job', async () => {
    // Mock queue
    // Call refineSketch
    // Verify job added to queue
    // Verify cost tracking initiated
  });

  it('should handle API rate limiting', async () => {
    // Make 100 requests
    // Verify rate limiter responds
    // Verify queue prioritization
  });

  it('should handle provider failover', async () => {
    // Mock Stability AI failure
    // Call refineSketch
    // Verify fallback to Gemini
  });
});
```

#### Deployment Checklist

- [ ] Environment variables configured
- [ ] Database migrations run
- [ ] Redis queue tested
- [ ] Supabase permissions verified
- [ ] Cost tracking initialized
- [ ] Rate limiting configured
- [ ] Error handling verified
- [ ] Monitoring/logging enabled
- [ ] Backup strategy implemented
- [ ] Load testing completed

**Subtotal:** 80 hours @ $70/hr = $5,600

---

### Phase 1 Summary

| Component | Hours | Cost |
|-----------|-------|------|
| Planning & DB | 20 | $1,400 |
| Frontend Canvas | 125 | $8,750 |
| Backend API | 100 | $7,500 |
| Testing & Deploy | 80 | $5,600 |
| **Phase 1 Total** | **325** | **$23,250** |

**Deliverable:** Working MVP with canvas drawing and single-provider refinement

---

## Phase 2: Production Readiness (Weeks 9-12)

### Multi-Provider Support (40 hours)

```typescript
// sketch-refiner.factory.ts
export class SketchRefinerFactory {

  static createRefiner(provider: string): SketchRefiner {
    switch (provider) {
      case 'stability':
        return new StabilityAIRefiner();
      case 'gemini':
        return new GeminiRefiner();
      case 'dall-e':
        return new DallERefiner();
      default:
        throw new Error(`Unknown provider: ${provider}`);
    }
  }

  static async refineWithFallback(
    sketch: Sketch,
    prompt: string,
    primaryProvider: string
  ): Promise<RefinedImage> {
    const providers = [primaryProvider, 'stability', 'gemini'];

    for (const provider of providers) {
      try {
        const refiner = this.createRefiner(provider);
        return await refiner.refine(sketch, prompt);
      } catch (error) {
        logger.warn(`${provider} failed, trying next...`);
        continue;
      }
    }

    throw new Error('All providers failed');
  }
}
```

### Advanced Features (40 hours)

- [ ] Batch refinement (process multiple sketches)
- [ ] Refinement history and comparison
- [ ] Custom style transfer
- [ ] Sketch-to-prompt suggestions (using vision API)
- [ ] Sketch editing after refinement

### Performance Optimization (20 hours)

- [ ] Image compression pipeline
- [ ] Cache refined images
- [ ] CDN integration for image serving
- [ ] Queue priority system
- [ ] Rate limiting by user tier

### Monitoring & Analytics (20 hours)

```typescript
// metrics.service.ts
@Injectable()
export class MetricsService {

  async trackRefineCall(
    userId: string,
    sketchId: string,
    provider: string,
    cost: number,
    processingTime: number,
    success: boolean
  ) {
    // Save to metrics database
    // Update Prometheus metrics
    // Emit to observability backend
  }

  async getProviderMetrics(startDate: Date, endDate: Date) {
    return {
      stability: { totalCost: 100, totalCalls: 1000, avgTime: 5.2 },
      gemini: { totalCost: 95, totalCalls: 950, avgTime: 6.1 },
      dall_e: { totalCost: 150, totalCalls: 1500, avgTime: 8.3 }
    };
  }
}
```

### Phase 2 Cost

| Component | Hours | Cost |
|-----------|-------|------|
| Multi-provider | 40 | $3,000 |
| Advanced features | 40 | $3,000 |
| Performance | 20 | $1,500 |
| Monitoring | 20 | $1,500 |
| **Phase 2 Total** | **120** | **$9,000** |

---

## Phase 3: Scale & Monetization (Weeks 13-16)

### User Quotas & Billing (30 hours)

```typescript
// user-quota.service.ts
@Injectable()
export class UserQuotaService {

  async checkAndConsumeQuota(
    userId: string,
    provider: string,
    estimatedCost: number
  ): Promise<QuotaCheckResult> {
    const user = await userService.getUser(userId);
    const usage = await usageTracker.getUserUsage(userId);

    const monthlyQuota = this.getQuotaForPlan(user.plan);
    const remainingBudget = monthlyQuota - usage.totalCost;

    if (remainingBudget < estimatedCost) {
      return { allowed: false, reason: 'Quota exceeded' };
    }

    return { allowed: true, remainingBudget: remainingBudget - estimatedCost };
  }

  private getQuotaForPlan(plan: UserPlan): number {
    const quotas = {
      free: 1,      // $1/month
      starter: 10,  // $2.99/month
      pro: 50,      // $9.99/month
      studio: null, // Unlimited
    };
    return quotas[plan.type];
  }
}
```

### User Analytics Dashboard (25 hours)

```typescript
// dashboard.controller.ts
@Controller('api/dashboard')
export class DashboardController {

  @Get('usage')
  async getUserUsage(@Headers('authorization') token: string) {
    // Return user's monthly usage and costs
    // Show refinements by provider
    // Show comparison metrics
  }

  @Get('admin/metrics')
  async getAdminMetrics(@RequireRole('admin')) {
    // Return aggregate metrics for admin
    // Cost breakdown by provider
    // User growth metrics
    // Revenue metrics
  }
}
```

### Email Notifications (15 hours)

```typescript
// notification.service.ts
@Injectable()
export class NotificationService {

  async sendMonthlyUsageSummary(userId: string) {
    const usage = await usageTracker.getUserUsage(userId);
    const email = template.render('monthly_summary', {
      totalCost: usage.totalCost,
      imagesGenerated: usage.imagesGenerated,
      suggestedUpgrade: this.suggestUpgrade(usage),
    });

    await emailService.send(user.email, email);
  }

  async alertBudgetThreshold(userId: string) {
    // Send alert when user reaches 80% of quota
  }
}
```

### Phase 3 Cost

| Component | Hours | Cost |
|-----------|-------|------|
| Quotas & Billing | 30 | $2,250 |
| Analytics | 25 | $1,875 |
| Notifications | 15 | $1,125 |
| **Phase 3 Total** | **70** | **$5,250** |

---

## Total Development Cost

```
Phase 1 (MVP):           325 hours = $23,250
Phase 2 (Production):    120 hours = $9,000
Phase 3 (Monetization):  70 hours  = $5,250
---
TOTAL:                   515 hours = $37,500

Realistic Range:         $30,000-40,000
(accounting for iteration and unforeseen issues)
```

---

## Cost Tracking Implementation

### Cost Database Queries

```sql
-- Monthly cost by provider
SELECT
  provider,
  COUNT(*) as refinement_count,
  SUM(cost) as total_cost,
  AVG(cost) as avg_cost
FROM refinement
WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', NOW())
GROUP BY provider;

-- Cost per user
SELECT
  user_id,
  SUM(cost) as monthly_cost,
  COUNT(*) as refinement_count
FROM refinement r
JOIN sketch s ON r.sketch_id = s.id
WHERE DATE_TRUNC('month', r.created_at) = DATE_TRUNC('month', NOW())
GROUP BY user_id
ORDER BY monthly_cost DESC;

-- Hourly cost trends
SELECT
  DATE_TRUNC('hour', created_at) as hour,
  SUM(cost) as hourly_cost,
  COUNT(*) as refinement_count
FROM refinement
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY hour
ORDER BY hour DESC;
```

### Cost Alerts

```typescript
// Set up alerts
const costAlert = new CostAlert({
  dailyLimit: 50,        // $50/day max
  monthlyLimit: 1000,    // $1,000/month max
  alertThreshold: 0.8,   // Alert at 80%

  onDailyLimitExceeded: async (cost) => {
    await notificationService.alert('Daily cost limit exceeded', cost);
    await refineService.pauseQueue(); // Stop processing new jobs
  },
});
```

---

## Launch Timeline

### Week 1-2: Validate Core Functionality
- [ ] Canvas drawing works smoothly
- [ ] Sketch export is reliable
- [ ] API integration confirmed
- [ ] Cost tracking accurate

### Week 3-4: Beta Testing with 20 Users
- [ ] Gather user feedback
- [ ] Test with real workflows
- [ ] Validate cost assumptions
- [ ] Fix edge cases

### Week 5-6: Prepare for Launch
- [ ] Create pricing page
- [ ] Set up billing infrastructure
- [ ] Draft user documentation
- [ ] Plan marketing strategy

### Week 7-8: Limited Launch (100 users)
- [ ] Monitor costs and performance
- [ ] Gather usage metrics
- [ ] Iterate based on feedback
- [ ] Plan scaling strategy

### Week 9+: Gradual Rollout
- [ ] Increase user capacity
- [ ] Monitor infrastructure
- [ ] Optimize based on data
- [ ] Plan next features

---

## Key Success Metrics

### User Engagement
- Canvas adoption rate
- Refinements per user per month
- Completion rate (sketch to refined image)
- User satisfaction score

### Cost Management
- Cost per user per month
- Cost per refinement
- Provider efficiency (quality per dollar)
- Infrastructure utilization

### Business Health
- Monthly Recurring Revenue (MRR)
- Customer Acquisition Cost (CAC)
- Customer Lifetime Value (LTV)
- Gross Margin %
- Path to breakeven

---

## Risk Mitigation

### Technical Risks

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|-----------|
| Canvas performance issues | Medium | High | Load testing, optimization sprint |
| API rate limiting | Low | High | Queue management, fallback providers |
| Storage cost overruns | Low | Medium | Compression, cleanup jobs, quotas |
| Redis queue failures | Low | High | Redundancy, monitoring, alerts |

### Business Risks

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|-----------|
| User churn | High | High | Retention focus, feature updates |
| Competition | Medium | Medium | Unique features, lock-in strategy |
| Provider price increases | Medium | Medium | Multi-provider support, switching plan |
| Lower adoption | Medium | High | User research, marketing, pivot |

---

## Next Steps

1. **Immediate:** Set up development environment
   - Clone repository
   - Install dependencies
   - Configure environment variables
   - Set up Stability AI account

2. **Week 1:** Begin frontend development
   - Create SketchCanvas component
   - Build toolbar and controls
   - Implement layer system

3. **Week 2:** Backend API foundation
   - Create database schema
   - Implement upload endpoint
   - Set up queue infrastructure

4. **Week 3:** Integration
   - Connect frontend to API
   - Implement AI provider integration
   - Set up cost tracking

5. **Week 4+:** Testing and iteration

---

**Document Version:** 1.0
**Last Updated:** November 17, 2024
**Status:** Ready for Implementation
