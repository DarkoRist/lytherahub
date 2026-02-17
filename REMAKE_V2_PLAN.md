# LYTHERAHUB V2 — Complete Product Remake Plan
# Target: Pipedrive / Linear / Stripe quality
# This replaces REMAKE_PLAN.md

---

## DIAGNOSIS — WHAT'S WRONG (from screenshots)

### Critical Issues
1. **Dark mode is STILL the default** — Analytics, Reports, Automations, Settings pages all render in dark navy. ThemeContext fix was either not applied or reverted.
2. **Landing page hero widget is BLANK** — Shows "Dashboard Preview" text with a lightning bolt icon. No actual preview. This is the first thing visitors see. It screams "unfinished project."
3. **Landing page copy is THIN** — Generic marketing speak. No personality. No persuasion. No "why should I trust this?" content. Compare to Pipedrive's landing page: rich copy sections, real testimonials with names/photos, feature deep-dives with actual screenshots, security badges, integration logos.
4. **AI Chat sidebar is BROKEN** — When user says "yes" to a contextual question, it responds with generic fallback: "I understand you're asking about: 'yes'... everything looks on track." It's not following conversation context at all.
5. **Analytics AI Insights** — Only 2 warning cards in a massive empty page. Should have 6-8 rich insight cards covering revenue trends, client health, productivity metrics, recommendations.
6. **Reports morning briefing** — Shows just a sparkles spinner icon with no content below it. The briefing card is empty.
7. **Settings page** — Only shows Profile tab content. Narrow layout. Missing the left sidebar nav pattern from REMAKE_PLAN. Missing Integrations, Notifications, Billing sections with full content.
8. **Automations page** — Structurally okay but dark mode makes it look like a developer tool.
9. **OutdoorSupply / Etrias screenshots** — These appear to be reference sites you're browsing, not LytheraHub issues. Noted as context.

### Secondary Issues
10. **No real dashboard screenshot in hero** — The landing page hero "browser mockup" should show an actual rendered dashboard, not a placeholder.
11. **Feature sections lack depth** — Pipedrive shows: real UI screenshots, customer quotes inline, detailed bullet points per feature. LytheraHub shows: icon + 4 bullet points + empty colored box.
12. **No integration logo grid** — Pipedrive prominently shows Slack, Zoom, Gmail, Zapier, Asana, Trello, HubSpot, etc. LytheraHub mentions integrations but doesn't show logos.
13. **No security/trust badges** — Pipedrive shows GDPR, SOC 2, AES 256, ISO badges. LytheraHub has nothing.
14. **No "How it actually works" section with depth** — Current "3 steps" is too thin.
15. **Testimonials are generic** — Need real-sounding quotes with specific metrics, company names, roles.
16. **FAQ section is functional but could be richer** — Needs more detailed answers.

---

## EXECUTION PLAN — 6 SESSIONS

### SESSION 1: Theme Fix + Landing Page Overhaul
### SESSION 2: Dashboard + Inner Page Light Mode
### SESSION 3: Analytics + Reports + Settings Complete Rebuild
### SESSION 4: AI Chat Sidebar Intelligence + Command Bar
### SESSION 5: Feature Pages Polish (Inbox, Calendar, Invoices, Clients, Tasks, Automations)
### SESSION 6: Final QA + Build Verification

---

## SESSION 1: LANDING PAGE — COMPLETE OVERHAUL

### Priority: This is the #1 thing any visitor sees. It must convert.

### 1A. ThemeContext — Force Light Mode (AGAIN)

The dark mode default was NOT fixed properly. Apply this definitively:

**frontend/src/context/ThemeContext.jsx:**
```jsx
const [dark, setDark] = useState(() => {
  const stored = localStorage.getItem('lytherahub_theme')
  return stored === 'dark' // Only dark if explicitly set
})
```

**frontend/index.html — Add BEFORE any scripts in <head>:**
```html
<script>
  if (localStorage.getItem('lytherahub_theme') !== 'dark') {
    document.documentElement.classList.remove('dark')
  } else {
    document.documentElement.classList.add('dark')
  }
</script>
```

**VERIFY:** Load every page. If any page shows dark navy background by default → ThemeContext is still broken.

---

### 1B. Landing Page — Complete Rewrite

**Target:** Pipedrive-level quality. Rich, persuasive, human, trustworthy.

**frontend/src/pages/Landing.jsx — Full rewrite covering these sections:**

#### SECTION 1: Hero
- **Headline:** "Your Business on Autopilot" (keep, it's good)
- **Subheadline:** Make it longer and more specific:
  > "The AI-powered command center that connects your email, calendar, invoices, and clients into one intelligent dashboard. Stop switching between 12 tabs. Stop forgetting follow-ups. Stop losing revenue to missed invoices. LytheraHub handles the admin so you can focus on growing your business."
- **CTA buttons:** "Start Free →" (blue, prominent) + "Watch Demo" (outlined)
- **Trust line below CTAs:** "No credit card required · Free forever plan · Setup in 2 minutes"
- **Hero image: ACTUAL DASHBOARD SCREENSHOT** — NOT a placeholder.

##### How to create the hero dashboard preview:
Create a **static SVG or HTML mockup** of the dashboard inside the hero browser frame. This should show:
- Sidebar with nav items (simplified)
- Morning briefing card with text
- 4 stat cards with numbers (8 Unread, 2 Meetings, €34K Outstanding, 14 Clients)
- Activity feed items (3-4 rows)
- Alerts panel with 2 colored alerts
- Command bar input

This can be a simplified, stylized version — NOT an iframe of the real app. Think of it like a Figma screenshot rendered in code. Use actual colors and layout that match the real dashboard.

**Implementation approach:** Create a `DashboardMockup` component that renders a simplified, static version of the dashboard using divs and Tailwind. This loads instantly, looks professional, and shows visitors exactly what they'll get.

#### SECTION 2: Social Proof Bar
- "TRUSTED BY 500+ BUSINESSES"
- Logo row: Acme Corp, TechFlow, NovaBuild, DataPeak, StartEdge, Cloudy (use gray text logos, not just names — create simple SVG text logos with a subtle icon)
- Metrics row: **93% Time Saved** · **50+ Automations** · **10,000+ Emails Classified** · **500+ Businesses**
- Each metric should have a small descriptive line below it

#### SECTION 3: Feature Deep-Dives (THE BIG ONE)

**This is where LytheraHub currently fails hardest.** The current version shows icon + 4 bullets + empty colored box. Pipedrive shows: real screenshot + detailed copy + inline testimonial per feature.

**Structure: Alternating left-right layout, 6 features:**

Each feature section gets:
- **Section label** (small, colored): e.g., "SMART INBOX"
- **Headline** (large, bold): e.g., "Never miss an important email again"
- **Description** (2-3 sentences of real copy, not marketing fluff):
  > "LytheraHub reads every incoming email and instantly classifies it — urgent client messages rise to the top while newsletters and spam fade away. Get one-line AI summaries so you know what matters without reading the full email. Draft professional replies in seconds with AI that knows your tone."
- **Feature bullets** (4 items with check icons): specific capabilities
- **Inline testimonial quote** (optional, 1 per 2 features):
  > "I used to spend 2 hours every morning sorting emails. Now LytheraHub does it in seconds and I start my day with a clear priority list." — Sarah Chen, Founder at BrightPath Digital
- **Feature screenshot/mockup** on the opposite side: A stylized rendering of that feature's UI

**The 6 features and their copy:**

**1. Smart Inbox**
- Headline: "Never miss an important email again"
- Copy: AI classification, one-line summaries, smart reply drafts, auto-categorization
- Screenshot: Simplified inbox view showing email list with category badges and AI summary panel

**2. AI Calendar**
- Headline: "Walk into every meeting prepared"
- Copy: Auto-generated meeting prep briefs, client context pulled automatically, open invoices and last interactions shown, action items tracked
- Screenshot: Calendar view with meeting prep panel open

**3. Invoice Tracker**
- Headline: "Get paid on time, every time"
- Copy: Track every invoice, predict late payments, automated escalating reminders, revenue forecasting
- Screenshot: Invoice dashboard with stats and chart

**4. CRM Pipeline**
- Headline: "See your entire pipeline at a glance"
- Copy: Drag-and-drop kanban, AI client enrichment, activity timeline, stale lead detection
- Screenshot: Pipeline board with client cards

**5. AI Reports & Analytics**
- Headline: "Know exactly how your business is performing"
- Copy: Daily briefings, weekly summaries, monthly deep-dives, AI-generated recommendations
- Screenshot: Reports view with charts

**6. Automations**
- Headline: "Put your repetitive work on autopilot"
- Copy: Pre-built automation templates, one-click activation, Slack notifications, custom workflows
- Screenshot: Automations grid with toggle switches

#### SECTION 4: How It Works — 3 Steps (Enhanced)

Current version is too thin. Expand each step:

**Step 1: Connect Your Tools** (2 minutes)
- "Link Gmail, Google Calendar, Slack, and Stripe in one click. No complex setup. No developer needed."
- Icon: plug/connection

**Step 2: AI Organizes Everything** (instant)
- "Our AI classifies your emails, generates meeting prep briefs, tracks invoices, and enriches your client data — all automatically."
- Icon: sparkles/brain

**Step 3: You Focus on What Matters** (every day)
- "Get a morning briefing with your priorities. Ask questions in plain English. Let automations handle the rest."
- Icon: rocket/target

#### SECTION 5: Integration Logos

**New section — doesn't exist yet.**

- Headline: "Connects with the tools you already use"
- Subheadline: "Seamlessly integrate with your favorite software. No migration needed."
- Logo grid (3 rows):
  Row 1: Gmail, Google Calendar, Google Drive, Google Sheets
  Row 2: Slack, Stripe, n8n, Zapier (coming soon)
  Row 3: Notion (coming soon), WhatsApp Business (coming soon), HubSpot (coming soon)
- Note: Use simple SVG/text representations of these logos. For "coming soon" items, show them slightly muted.

#### SECTION 6: Security & Trust

**New section — doesn't exist yet.**

- Headline: "Enterprise-grade security you can trust"
- Subheadline: "Your data is encrypted, protected, and never shared."
- Badge row: 🔒 SSL Encrypted · 🛡️ GDPR Compliant · 🔐 AES-256 Encryption · ☁️ EU Data Centers
- Copy: "LytheraHub uses industry-standard encryption for all data in transit and at rest. Your Google tokens are stored with AES-256 encryption. We never sell your data. We never train on your data. Your business information stays yours."

#### SECTION 7: Testimonials (Enhanced)

Current testimonials are generic. Make them specific and believable:

**Testimonial 1:**
> "LytheraHub saved us 15 hours a week on admin work. The AI email classification alone was worth the subscription — I went from 200+ unread emails daily to a clean, prioritized inbox. The morning briefing is like having a personal executive assistant."
> — **Sarah Chen**, Founder & CEO, BrightPath Digital
> 📍 Munich, Germany

**Testimonial 2:**
> "The invoice tracker predicted which clients would pay late with scary accuracy. We reduced our average payment collection time from 34 days to 12 days. That's real cash flow impact."
> — **Marco Weber**, Managing Director, Weber Consulting GmbH
> 📍 Berlin, Germany

**Testimonial 3:**
> "I used to start every morning checking 6 different apps. Now I open LytheraHub, read my AI briefing, and I know exactly what to focus on. It's like having a chief of staff for €49/month."
> — **Jenna Cruz**, Freelance Designer, Studio Jenna
> 📍 Lisbon, Portugal

Each testimonial card: 5-star rating row, quote text, name bold, title, company, location with flag/pin icon.

#### SECTION 8: Pricing (Keep current but enhance)

Current pricing section is decent. Enhancements:
- Add **Monthly / Annual (-20%)** toggle
- Add feature comparison table below the 3 cards
- Pro plan should have "MOST POPULAR" badge
- Business plan should have "BEST VALUE" badge
- Each plan CTA: Free="Start Free", Pro="Start Pro Trial", Business="Contact Sales"

#### SECTION 9: FAQ (Keep but enhance answers)

Expand answers to be more detailed and specific. Add 2 more questions:
- "How does the AI work?" → Explain Claude API, classification, summarization
- "Can I use it with my team?" → Explain Business plan team features

#### SECTION 10: Final CTA Section

- Dark background (slate-900)
- Headline: "Ready to Put Your Business on Autopilot?"
- Subheadline: "Join hundreds of business owners who save 15+ hours every week with LytheraHub."
- CTA: "Get Started for Free →" (large blue button)
- Trust line: "No credit card required"

#### SECTION 11: Footer (Enhanced)

- 4-column layout:
  - **Product**: Features, Pricing, Demo, API
  - **Company**: About, Blog, Careers, Contact
  - **Legal**: Privacy Policy, Terms of Service, Cookie Policy, GDPR
  - **Connect**: Twitter/X, LinkedIn, GitHub
- Bottom bar: "© 2026 LytheraHub. All rights reserved." + "Made with ⚡ for small businesses"

---

## SESSION 2: INNER PAGES — LIGHT MODE + DASHBOARD POLISH

### 2A. Verify Light Mode on EVERY Page

After Session 1's ThemeContext fix, manually verify:
- [ ] Dashboard — white background
- [ ] Inbox — white background
- [ ] Calendar — white background
- [ ] Invoices — white background
- [ ] Clients — white background
- [ ] Tasks — white background
- [ ] Analytics — white background
- [ ] Reports — white background
- [ ] Automations — white background
- [ ] Settings — white background

If ANY page still renders dark by default, the issue is hardcoded dark classes in that page's components. Search for `bg-slate-900`, `bg-gray-900`, `bg-[#0f1629]` or similar and replace with proper light/dark variants.

### 2B. Dashboard Improvements

The dashboard (Image 8/11) actually looks pretty good in light mode. Minor improvements:

1. **Morning Briefing card** — Add the red underline (visible in Image 11) as `border-b-2 border-red-500` or change to blue accent `border-l-4 border-blue-600`
2. **Command Bar** — Verify it actually processes commands (currently sends to API, needs demo fallback)
3. **Stats Grid** — Colors look good. Verify trend arrows are data-driven.
4. **Activity Feed** — Looks good. Verify "View all" links somewhere.
5. **Alerts panel** — Verify Read/Dismiss buttons work.

### 2C. Sidebar Improvements

Current sidebar (Image 11) looks good in light mode with section groups (MAIN, WORK, INSIGHTS, SYSTEM). Verify:
- Active state uses `bg-blue-50 text-blue-700` with left border accent
- Section labels are uppercase, tiny, muted
- Collapse toggle works
- Bottom user info shows plan badge

---

## SESSION 3: ANALYTICS + REPORTS + SETTINGS REBUILD

### 3A. Analytics Page — Complete Content Fix

**Current state (Image 14):** AI Insights tab shows only 2 warning cards in a sea of empty space. This is the worst-looking page in the app.

**Fix: All 4 tabs must have real content.**

#### Revenue Tab
- 4 stat cards: Total Revenue (last 12mo), This Month, Outstanding, Growth %
- Monthly Revenue BarChart (12 months of data, blue bars)
- Revenue by Client PieChart (top 5 clients + "Other")
- Revenue by Industry horizontal BarChart

#### Clients Tab
- 4 stat cards: Total Clients, Win Rate %, Avg Deal Value, New This Month
- Pipeline Funnel visualization (Lead → Contacted → Proposal → Negotiation → Won)
- Top Clients by Deal Value (ranked list, 5 items)
- Clients by Industry (PieChart)

#### Productivity Tab
- 4 stat cards: Emails (30d), Meetings (30d), Tasks Completed, Response Time
- Weekly Email Volume LineChart (4 weeks)
- Task Completion Rate donut chart
- Automation Runs bar chart

#### AI Insights Tab — MUST have 6-8 cards
1. 📈 "Revenue up 12% this month" — "Driven by 3 new SaaS clients and a 15% increase in average deal size. TechVision's €8,500 contract was the largest single deal."
2. ⚠️ "2 invoices overdue totaling €11,700" — "CloudFirst AG (€7,200, 14 days late) and MediaWave GmbH (€4,500, 7 days late). Consider escalating CloudFirst."
3. 🔴 "3 stale leads need attention" — "DataStream Analytics, GreenEnergy Solutions, and NovaTech haven't been contacted in 10+ days. Pipeline could stall."
4. ✅ "Client win rate improved to 34%" — "Up from 28% last month. The new follow-up automation is converting 2x more leads in the Contacted stage."
5. 📧 "Email response time: 2.3 hours avg" — "Down from 3.8 hours last month. AI draft replies are helping you respond 40% faster."
6. 🎯 "Top performer: TechVision GmbH" — "€24,500 total revenue, 4 paid invoices, regular communication. Consider upselling premium services."
7. 💡 "Recommendation: Enable invoice auto-reminders" — "3 of your 5 overdue invoices this quarter could have been caught earlier with automated day-3 reminders."
8. 📊 "Task completion rate: 78%" — "17 of 22 tasks completed this week. 3 overdue tasks are blocking client deliverables."

Each insight card: colored icon (left), bold title, description text, optional "Take Action" button.

### 3B. Reports Page — Fix Empty Briefing

**Current state (Image 15):** Morning briefing shows just a sparkles icon with no content. Charts render okay in dark mode.

**Fix:**
1. The morning briefing card must render actual content, not just a loading spinner. If API fails, show demo briefing content:
   ```
   📧 Emails: 12 new (3 urgent, 2 client, 4 invoice-related, 3 newsletters). 3 need replies.
   📅 Calendar: 2 meetings today — 10:00 AM Standup, 3:00 PM Client Call with Hans Weber (TechVision)
   💰 Invoices: €34,000 outstanding. 2 overdue (€11,700). 3 payments expected this week.
   👥 Clients: 1 new lead added (TouchMedia GmbH). SecureNet moved to Negotiation.
   ✅ Tasks: 5 due today, 3 overdue. Top priority: Reply to Frank Hartmann's urgent email.

   🎯 Today's Priorities:
   1. Reply to 3 urgent emails (Frank Hartmann, Hans Weber, Dr. Vogel)
   2. Prepare for Hans Weber client call at 3 PM — review TechVision's open invoice
   3. Follow up on CloudFirst AG overdue invoice (€7,200, 14 days late)
   ```

2. Charts should use light mode colors (white bg, slate axes, blue data).
3. Report list items should be expandable — click to show full report content.
4. "Generate Now" button must work — show loading → then insert new report.

### 3C. Settings Page — Complete Rebuild

**Current state (Image 17):** Only Profile tab visible. Narrow card. Dark mode. Missing Integrations, Notifications, Billing.

**Target: Left sidebar nav + right content area (like Pipedrive settings)**

#### Layout
- Left: Vertical nav (200px wide), white bg, border-right
  - Account section: Profile
  - Integrations section: Connected Apps
  - Preferences section: Notifications
  - Billing section: Plan & Usage
- Right: Content area, padded, full width

#### Profile Tab (exists but needs light mode fix)
- Avatar (80px circle with initial), name, email
- Fields: Full Name, Email (disabled), Business Name, Timezone dropdown
- "Save Changes" button → API call → toast

#### Integrations Tab (NEW — must be built)
Cards for each service:
- **Gmail** — Icon, "Gmail", status pill (Connected ✓ green / Not connected gray), "Last synced: 2 min ago", Disconnect button
- **Google Calendar** — same pattern
- **Google Drive** — same pattern
- **Slack** — same pattern
- **Stripe** — same pattern
- **n8n** — same pattern

In demo mode: Gmail, Calendar, Drive show as "Connected". Others show "Connect" button. Clicking Connect shows modal: "Connect [Service] — This integration is available in production. In demo mode, [Service] features use sample data."

#### Notifications Tab (NEW — must be built)
- Toggle rows:
  - Email notifications: on/off
  - Push notifications: on/off
  - Slack notifications: on/off
- Morning briefing time: time picker (default 8:00 AM)
- Alert severity threshold: dropdown (All / Warning & Critical / Critical only)
- Quiet hours: Start time + End time
- "Save Preferences" → API call → toast

#### Billing Tab (NEW — must be built)
- Current plan card:
  - "Pro Plan" badge (blue)
  - "€49/month" price
  - Feature list (5 items)
  - "Renews March 16, 2026"
- "Change Plan" button → opens modal with 3 plan cards
- "Cancel Subscription" → confirm dialog → toast
- Billing history table:
  | Date | Description | Amount | Receipt |
  | Feb 1, 2026 | Pro Plan - Monthly | €49.00 | Download |
  | Jan 1, 2026 | Pro Plan - Monthly | €49.00 | Download |
  | Dec 1, 2025 | Pro Plan - Monthly | €49.00 | Download |

---

## SESSION 4: AI CHAT SIDEBAR + COMMAND BAR INTELLIGENCE

### 4A. AI Chat Sidebar — Context-Aware Responses

**Current problem (Image 9):** User says "yes" and AI gives a completely generic response ignoring conversation context.

**Fix: Smarter demo response engine**

The chat sidebar's demo fallback must:
1. Parse the FULL conversation history, not just the last message
2. If the previous AI message asked a question, the user's response should be interpreted as answering that question
3. Response keywords should be more granular

**Demo response map (expand significantly):**

```javascript
const SMART_RESPONSES = {
  // Contextual follow-ups
  'yes': (history) => {
    const lastAI = getLastAIMessage(history)
    if (lastAI.includes('draft replies')) {
      return "I'll draft replies for all 3 urgent emails. Here's what I've prepared:\n\n" +
        "**1. Frank Hartmann (SmartHome)** — Acknowledged the IoT dashboard issue and proposed a fix timeline for next Tuesday.\n\n" +
        "**2. Hans Weber (TechVision)** — Confirmed the Q1 contract review meeting for Thursday at 2 PM.\n\n" +
        "**3. Dr. Vogel (BioPharm)** — Thanked them for the data visualization project inquiry and requested a brief call.\n\n" +
        "Want me to send these, or would you like to edit any of them first?"
    }
    if (lastAI.includes('reminder')) {
      return "Done! I've sent a polite payment reminder to CloudFirst AG for invoice #INV-2024-018 (€7,200). This is their second reminder — the tone has been slightly firmed up. I'll escalate again in 7 days if unpaid."
    }
    return "Got it! What would you like me to do next?"
  },

  // Revenue queries
  'revenue': () => "Here's your revenue breakdown:\n\n" +
    "**This month (February):** €27,600 collected from 8 paid invoices\n" +
    "**Outstanding:** €34,000 across 6 invoices\n" +
    "**Overdue:** €11,700 (2 invoices — CloudFirst AG and MediaWave GmbH)\n" +
    "**Trend:** Up 12% vs January (€24,600)\n\n" +
    "Your top client this month is TechVision GmbH at €8,500. Want me to break this down further?",

  // Client queries
  'client': () => "You have **15 active clients** across your pipeline:\n\n" +
    "• **Lead:** 3 (DataStream, GreenEnergy, NovaTech)\n" +
    "• **Contacted:** 2 (TouchMedia, FutureNet)\n" +
    "• **Proposal:** 3 (SecureNet, BrightPath, MediaWave)\n" +
    "• **Negotiation:** 2 (CloudFirst, RoboTech)\n" +
    "• **Won:** 5 (TechVision, SmartHome, BioPharm, DataBeam, FinanceFlow)\n\n" +
    "⚠️ 3 leads haven't been contacted in 10+ days. Want me to draft follow-up emails?",

  // Invoice queries  
  'invoice': () => "Invoice summary:\n\n" +
    "**Total outstanding:** €34,000 across 6 invoices\n" +
    "**Overdue:** 2 invoices totaling €11,700\n" +
    "  → CloudFirst AG: €7,200 (14 days late)\n" +
    "  → MediaWave GmbH: €4,500 (7 days late)\n" +
    "**Paid this month:** €27,600\n" +
    "**Expected this week:** €12,300 (3 invoices due)\n\n" +
    "Should I send reminders to the overdue accounts?",

  // Email queries
  'email': () => "Your inbox right now:\n\n" +
    "**12 unread emails:**\n" +
    "• 🔴 3 urgent (Frank Hartmann, Hans Weber, Dr. Vogel)\n" +
    "• 👤 2 client-related (TechVision contract, SecureNet proposal)\n" +
    "• 💰 2 invoice-related (payment confirmations)\n" +
    "• 📰 2 newsletters\n" +
    "• 3 need replies (oldest: 2 days from Hans at TechVision)\n\n" +
    "Would you like me to draft replies to the urgent ones?",

  // Schedule/meeting queries
  'schedule': () => "Today's schedule:\n\n" +
    "**10:00 AM** — Team Standup (15 min)\n" +
    "**3:00 PM** — Client Call with Hans Weber, TechVision GmbH\n" +
    "  📋 Prep brief ready: Q1 contract review, open invoice €3,200\n\n" +
    "**Tomorrow:**\n" +
    "**9:30 AM** — BioPharm Research Partnership Call\n" +
    "**2:00 PM** — SecureNet Kickoff Meeting\n\n" +
    "You have 3 free slots today: 11-12, 1-2:30, and 4-5. Want me to schedule something?",

  // Task queries
  'task': () => "Your tasks:\n\n" +
    "**Due today (5):**\n" +
    "1. 🔴 Reply to Frank Hartmann — urgent IoT dashboard email\n" +
    "2. 🟠 Send TechVision Q1 contract for review\n" +
    "3. 🔵 Prepare BioPharm partnership proposal\n" +
    "4. 🔵 Review SmartHome project milestones\n" +
    "5. ⚪ Update CRM notes for SecureNet call\n\n" +
    "**Overdue (3):**\n" +
    "1. Follow up with CloudFirst AG on payment\n" +
    "2. Send DataStream Analytics onboarding email\n" +
    "3. Complete GreenEnergy Solutions pricing proposal",

  // Default
  'default': () => "I'm your AI business assistant. I have access to all your business data. Here's what I can help with:\n\n" +
    "📧 **Emails** — \"How many urgent emails do I have?\"\n" +
    "📅 **Calendar** — \"What's my schedule tomorrow?\"\n" +
    "💰 **Invoices** — \"Which invoices are overdue?\"\n" +
    "👥 **Clients** — \"Show me my pipeline\"\n" +
    "📊 **Revenue** — \"How much revenue this month?\"\n" +
    "✅ **Tasks** — \"What's due today?\"\n\n" +
    "Just ask in plain English!"
}
```

### 4B. Command Bar — Working Demo Responses

Same approach as chat sidebar but for the dashboard command bar. Must:
1. Accept input on Enter key AND Send button click
2. Show loading spinner briefly (500ms)
3. Display response in a result box below the input
4. Quick chips must auto-populate and submit

---

## SESSION 5: FEATURE PAGES POLISH

### 5A. Inbox
- Verify split layout works (list left, detail right)
- Verify email click opens detail panel
- Verify Draft Reply generates content (demo fallback)
- Verify tone buttons regenerate
- Verify Copy button works with toast
- Verify category tabs filter

### 5B. Calendar
- Verify Day/Week/Month toggles work
- Verify event click opens detail panel
- Verify Add Event modal opens and closes
- Verify prep brief content renders (not empty)

### 5C. Invoices
- Verify three-dot menu works (all 4 actions)
- Verify Mark as Paid updates badge
- Verify Send Reminder shows toast
- Verify Delete confirms then removes
- Verify Add Invoice modal works

### 5D. Clients
- Verify drag-and-drop moves cards between pipeline columns
- Verify client click opens detail panel
- Verify Add Client modal works
- Verify stale leads banner shows and is dismissable

### 5E. Tasks
- Verify 3-column kanban renders with demo tasks
- Verify drag-and-drop between columns
- Verify inline add task works
- Verify task modal works

### 5F. Automations
- Verify toggle switches work (optimistic update)
- Verify Run Now shows toast
- Verify View History expands inline
- Apply light mode styling

---

## SESSION 6: FINAL QA

### Build Verification
```bash
cd frontend && npm run build 2>&1 | tail -20
echo "EXIT: $?"
```
Must exit 0.

### Page-by-Page Checklist
- [ ] Landing page: all 11 sections render, hero shows dashboard mockup, all links work
- [ ] Dashboard: briefing, command bar, stats, activity, alerts all render with demo data
- [ ] Inbox: split layout, email selection, reply draft, category filter
- [ ] Calendar: grid renders, events clickable, modal works
- [ ] Invoices: table, actions, chart, add modal
- [ ] Clients: pipeline drag-drop, detail panel, add modal
- [ ] Tasks: kanban drag-drop, add task, modal
- [ ] Analytics: all 4 tabs with charts and 6+ insights
- [ ] Reports: briefing content visible, charts render, generate works
- [ ] Automations: toggles, run now, history expand
- [ ] Settings: all 4 sections with working save buttons
- [ ] AI Chat: opens, sends, receives contextual responses
- [ ] Light mode: DEFAULT on all pages
- [ ] Dark mode: works when toggled, persists

### Git
```bash
git add -A && git commit -m "feat: V2 complete remake — landing page overhaul, light mode, full analytics, settings rebuild, smart AI chat"
git push origin main
```

---

## LANDING PAGE COPY REFERENCE

### Why People Should Use LytheraHub (persuasion points to weave throughout)

1. **Time savings are massive** — Average user saves 15+ hours/week on admin tasks
2. **Revenue protection** — Overdue invoice detection catches money before it's lost
3. **No more context switching** — One dashboard replaces Gmail + Calendar + Spreadsheets + CRM + Slack
4. **AI that actually helps** — Not a chatbot that says "I don't know." An assistant that reads your emails, knows your clients, and takes action.
5. **Built for small businesses** — Not enterprise bloatware. Clean, fast, focused.
6. **European roots** — GDPR compliant, EU data centers, EUR-first pricing.
7. **Works in 2 minutes** — Connect Gmail, connect Calendar, done. AI starts organizing immediately.
8. **Free tier is generous** — 1 email account, 5 clients, basic reports. No credit card.

### Voice and Tone
- Professional but warm. Not corporate. Not startup-bro.
- Specific, not vague. "Save 15 hours a week" not "Save time."
- Show, don't tell. Features → outcomes.
- Address objections directly in FAQ and feature descriptions.

---

## CLAUDE CODE PROMPTS

### Session 1 Prompt:
```
Read REMAKE_V2_PLAN.md. Execute Session 1: Theme Fix + Landing Page Overhaul.

1. Fix ThemeContext.jsx to force light mode as default
2. Add flash prevention script to index.html
3. Complete rewrite of Landing.jsx with all 11 sections from the plan
4. Create DashboardMockup component for hero section
5. All feature sections with rich copy, screenshots mockups, testimonials
6. Integration logos section, security badges, enhanced FAQ
7. Professional footer with 4 columns

Build must pass: cd frontend && npm run build
Commit: git add -A && git commit -m "feat: landing page overhaul + light mode fix"
```

### Session 2 Prompt:
```
Read REMAKE_V2_PLAN.md. Execute Session 2: Inner Pages Light Mode + Dashboard Polish.

1. Verify and fix light mode on ALL inner pages (search for hardcoded dark classes)
2. Dashboard minor improvements from plan
3. Sidebar and header verification

Build must pass. Commit.
```

### Session 3 Prompt:
```
Read REMAKE_V2_PLAN.md. Execute Session 3: Analytics + Reports + Settings Rebuild.

1. Analytics: all 4 tabs with charts and 8 AI insight cards
2. Reports: fix empty briefing, show actual content, light mode
3. Settings: complete rebuild with left sidebar nav, 4 sections (Profile, Integrations, Notifications, Billing)

Build must pass. Commit.
```

### Session 4 Prompt:
```
Read REMAKE_V2_PLAN.md. Execute Session 4: AI Chat + Command Bar Intelligence.

1. Rewrite AIChatSidebar.jsx with context-aware demo responses
2. Rewrite CommandBar.jsx with working demo responses
3. Both must handle conversation context, not just keyword matching

Build must pass. Commit.
```

### Session 5 Prompt:
```
Read REMAKE_V2_PLAN.md. Execute Session 5: Feature Pages Polish.

Verify and fix all interactive features on: Inbox, Calendar, Invoices, Clients, Tasks, Automations.
Every button must do something. Every modal must open AND close. Every action must show a toast.
Light mode on everything.

Build must pass. Commit.
```

### Session 6 Prompt:
```
Read REMAKE_V2_PLAN.md. Execute Session 6: Final QA.

Run the full page-by-page checklist. Fix anything broken.
Final build. Final commit. Tag v2.0.0.
```

---

## SUCCESS CRITERIA

Before marking V2 as done:

1. **Landing page** — Would a business owner seeing this for the first time think "this looks like a real product I'd pay for"? If no → not done.
2. **Dashboard** — Does it show real-feeling business data with working interactions? If no → not done.
3. **Every page** — Is it light mode by default? If no → not done.
4. **Every button** — Does it do something? If no → not done.
5. **AI Chat** — Does it give contextual, useful responses? If no → not done.
6. **Analytics** — Are there charts and 6+ insight cards? If no → not done.
7. **Settings** — Are all 4 sections fully built? If no → not done.
8. **Pipedrive test** — Could this page sit next to Pipedrive in a comparison and not look embarrassing? If no → not done.
