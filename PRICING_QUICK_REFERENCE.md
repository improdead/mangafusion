# Sketch-to-Manga Refinement: Pricing Quick Reference

**Last Updated:** November 17, 2024

---

## AI Provider Pricing Comparison at a Glance

### Cost Per Image Generated

```
DALL-E 3          : $0.040 per 1024x1024 image (Standard)
                  : $0.080 per 1024x1024 image (HD)

Stability AI      : $0.030 per 512x512 image
                  : ~$0.10 per 1024x1024 image

Gemini 2.5 Flash  : $0.039 per 1024x1024 image

Self-Hosted Cloud : $0.005-0.01 per image (at 10k+/month)

Self-Hosted GPU   : $0.001-0.003 per image (at 20k+/month)
```

### Monthly Cost for 1,000 Sketch Refinements

```
Provider          | Cost      | Notes
---               | ---       | ---
DALL-E 3 (Std)    | $40       | No inpainting support
DALL-E 3 (HD)     | $80       | Higher quality
Stability AI      | $30       | Free for indie devs <$1M revenue
Gemini            | $39       | Already integrated
Self-Hosted Cloud | $5-10     | RunPod RTX 4090
Self-Hosted GPU   | $2-3      | Dedicated hardware
```

---

## Infrastructure Costs

### Supabase Storage

```
Tier      | Cost/Month | Storage | Suitable For
---       | ---        | ---     | ---
Free      | $0         | 1 GB    | <10 users (testing)
Pro       | $25        | 100 GB  | 100-300 users
Team      | $599       | 500 GB  | 300-1,000 users
Enterprise| Custom     | Custom  | 1,000+ users
```

**Per-User Storage Cost:**
- 100 users: $0.25/month
- 500 users: $1.20/month
- 1,000 users: $0.60/month

### Redis Queue

```
Plan                | Cost/Month | Capacity
---                 | ---        | ---
Essentials 512 MB   | $5         | <1,000 users
Essentials 1 GB     | $15        | 1,000-2,000 users
Essentials 2.5 GB   | $30        | 2,000-5,000 users
Essentials 5 GB     | $60        | 5,000+ users
```

**Per-User Queue Cost:**
- <1,000 users: $0.005-0.05/month
- 1,000+ users: $0.01-0.03/month

---

## Total Monthly Operational Cost

### By User Count (Using Stability AI)

```
Active Users | AI Cost | Storage | Queue | Total | Per-User
100          | $30    | $25    | $5   | $60  | $0.60
500          | $150   | $30    | $5   | $185 | $0.37
1,000        | $300   | $60    | $15  | $375 | $0.38
5,000        | $1,500 | $200   | $30  | $1,730 | $0.35
10,000       | $3,000 | $400   | $60  | $3,460 | $0.35
```

### By User Count (Using Gemini)

```
Active Users | AI Cost | Storage | Queue | Total | Per-User
100          | $39    | $25    | $5   | $69  | $0.69
500          | $195   | $30    | $5   | $230 | $0.46
1,000        | $390   | $60    | $15  | $465 | $0.47
5,000        | $1,950 | $200   | $30  | $2,180 | $0.44
10,000       | $3,900 | $400   | $60  | $4,360 | $0.44
```

### By User Count (Using Self-Hosted GPU)

```
Active Users | AI Cost | Storage | Queue | Hardware | Total | Per-User
100          | $2    | $25    | $5   | $50  | $82  | $0.82
500          | $10   | $30    | $5   | $50  | $95  | $0.19
1,000        | $20   | $60    | $15  | $50  | $145 | $0.15
5,000        | $100  | $200   | $30  | $50  | $380 | $0.08
10,000       | $200  | $400   | $60  | $50  | $710 | $0.07
```

---

## Development Cost Summary

### By Component (Estimate)

```
Component              | Hours | Cost @ $75/hr
---                    | ---   | ---
Frontend Canvas        | 140   | $10,500
Backend API            | 125   | $9,375
AI Integration Layer   | 105   | $7,875
Infrastructure Setup   | 60    | $4,500
---                    | ---   | ---
TOTAL MVP              | 430   | $32,250

Realistic Range: $20,000-35,000 (accounting for iteration)
```

### Timeline

```
Phase 1 (MVP):        8-10 weeks
Phase 2 (Production): 6-8 weeks
Phase 3 (Optimization): 8-12 weeks
Total to Profitability: 4-6 months
```

---

## Break-Even Analysis

### Monthly Subscription Model ($5/user/month)

```
Active Users | Monthly Revenue | Monthly Ops Cost | Margin
50           | $250            | $50-100         | 60-80%
100          | $500            | $60-150         | 70-88%
200          | $1,000          | $100-250        | 75-90%
500          | $2,500          | $185-500        | 80-93%
1,000        | $5,000          | $375-1,000      | 80-93%
```

### Development Payback Period

```
Scenario                      | Payback Timeline
Conservative (100 users)      | 19-24 months
Standard (300 users)          | 10-15 months
Optimistic (500+ users)       | 6-10 months
Aggressive (1,000+ users)     | 3-6 months
```

---

## Recommended Configuration by Stage

### Stage 1: MVP/Beta (0-100 Users)

```
Provider:       Stability AI (Free Community License)
Storage:        Supabase Pro ($25/month)
Queue:          Redis Cloud Essentials ($5/month)
Cost/Month:     ~$30 operations
Cost/Year:      ~$360 + $30,000 dev = $30,360
```

**Rationale:**
- No API costs while learning user behavior
- Sufficient for beta testing
- Easy migration path later

---

### Stage 2: Growth (100-500 Users)

```
Provider:       Stability AI (Pay-as-you-go)
Storage:        Supabase Pro ($25/month)
Queue:          Redis Cloud Essentials ($5/month)
Cost/Month:     $60-150 operations
Cost/Year:      ~$2,000 + $360 = $2,360
```

**Rationale:**
- Balanced cost/quality
- Supports 500 users on free tier growth
- Inpainting capability for refinements

---

### Stage 3: Scale (500+ Users)

```
Provider:       Self-Hosted (RunPod) or Gemini
Storage:        Supabase Team ($599/month)
Queue:          Redis Cloud ($30/month)
Cost/Month:     $200-700 operations
Cost/Year:      ~$5,000-8,000
```

**Rationale:**
- Lower per-image cost at scale
- Better margins for profitability
- Multiple provider redundancy option

---

## Cost Optimization Strategies

### 1. Implement User Quotas
```
Starter Plan:   20 refinements/month  ($2.99/month)
Creator Plan:   200 refinements/month ($9.99/month)
Studio Plan:    Unlimited             ($29.99/month)
```

**Benefit:** Controls AI costs while increasing ARPU

### 2. Batch Processing
```
Standard: $0.039/image (on-demand)
Batch:    $0.025/image (10+ images)
Savings:  35% reduction at scale
```

**Benefit:** Users get 35% discount, you get better margins

### 3. Time-Based Pricing
```
Premium Hours (9-5 PT): $0.039/image
Off-Peak (5-9 PT):      $0.025/image
Night (9-9 PT):         $0.015/image
```

**Benefit:** Load balancing + cost optimization

### 4. Quality Tiers
```
Standard: 512x512  ($0.010/image)
HD:       1024x1024 ($0.025/image)
Ultra:    2048x2048 ($0.080/image)
```

**Benefit:** Users choose quality/cost tradeoff

---

## Revenue Model Scenarios

### Conservative: $4.99/month Starter Plan
```
500 Users × $4.99 = $2,495/month
- Operations:  $150
- Dev Amort:   $1,500 (30k over 20 months)
Net Monthly:   $845
Annual Profit: $10,140
```

### Standard: Tiered Pricing Model
```
300 Starter @ $2.99    = $897
200 Creator @ $9.99    = $1,998
50 Studio @ $29.99     = $1,500
Total Revenue:         $4,395

- Operations:  $200
- Dev Amort:   $1,500
Net Monthly:   $2,695
Annual Profit: $32,340
```

### Growth: Enterprise Tier
```
1,000 Users × $6 average ARPU = $6,000/month

- Operations:  $500
- Dev Amort:   $1,500 (if continuing investment)
Net Monthly:   $4,000
Annual Profit: $48,000
```

---

## Risk Assessment & Mitigation

### Cost Risk: AI Provider Price Increases
**Mitigation:**
- Implement provider abstraction layer (+$2,000 dev)
- Support 2+ providers (+$3,000 dev)
- Budget for 20-30% price increases
- Switch costs: <1 week

### Revenue Risk: User Churn
**Strategy:**
- Target 5-10% monthly churn initially
- Focus on retention (reduce CAC payback)
- User satisfaction drives CLTV
- LTV:CAC ratio target: >3:1

### Operational Risk: API Outages
**Mitigation:**
- Implement queue-based architecture (already have it)
- Automatic retry logic (+$1,000 dev)
- Fallback providers (+$3,000 dev)
- SLA: 99.5% uptime target

---

## Key Metrics to Track

### User Metrics
```
- Monthly Active Users (MAU)
- Cost Per User
- Revenue Per User (ARPU)
- Churn Rate
- LTV:CAC Ratio
```

### Operational Metrics
```
- Images Generated/Month
- Cost Per Image
- API Success Rate
- Queue Processing Time
- Storage Used
```

### Business Metrics
```
- Gross Margin %
- Customer Acquisition Cost
- Payback Period
- Monthly Burn Rate
- Path to Profitability
```

---

## Next Steps

### Week 1: Evaluation
- [ ] Set up Stability AI community account (free)
- [ ] Test image quality with sample sketches
- [ ] Verify Supabase storage integration
- [ ] Validate Redis queue setup

### Week 2: MVP Development
- [ ] Implement canvas component (react-konva)
- [ ] Create sketch upload API endpoint
- [ ] Integrate Stability AI API
- [ ] Set up cost tracking

### Week 3: Testing
- [ ] Beta test with 10-20 users
- [ ] Measure cost per refinement
- [ ] Validate user workflows
- [ ] Plan provider migration if needed

### Week 4: Launch
- [ ] Deploy to production
- [ ] Monitor costs and performance
- [ ] Collect user feedback
- [ ] Plan scaling strategy

---

## Contact & Support

**Questions about costs?**
- Review the detailed analysis: `/COST_ANALYSIS_SKETCH_TO_MANGA.md`
- Check provider documentation links
- Test with free trials before committing

**Implementation support:**
- Backend: Use existing NestJS module patterns
- Frontend: React-konva documentation at konvajs.org
- Storage: Supabase docs at supabase.com/docs
- Queue: BullMQ documentation at docs.bullmq.io

---

**Version:** 1.0
**Last Updated:** November 17, 2024
