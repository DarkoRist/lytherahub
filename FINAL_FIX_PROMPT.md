# LytheraHub — Final Bug Fix & Deployment Readiness Prompt

## INSTRUCTIONS FOR CLAUDE CODE

You are fixing the final bugs in LytheraHub before production deployment. Read each file listed before editing it. After ALL changes, run the build test at the bottom. Do NOT commit until the build passes.

---

## BUG 1: INBOX — Emails from backend have `from_addr` but frontend expects `sender_name` and `from`

**Root cause:** The backend EmailResponse schema returns `from_addr` (e.g. "hans@techvision.de") but has NO `sender_name` field. The frontend DEMO_EMAILS array uses `sender_name` and `from` which only work when the API is down and fallback data is used. When the backend IS running (demo mode with seeded data), emails come back with `from_addr` only — so avatars show email-prefix initials and reply says "Dear there,".

**Files to fix:**

### 1a. `frontend/src/components/inbox/EmailCard.jsx`
The `senderDisplay` resolution chain must include `from_addr` and extract a human name from the email body signature. Update the chain:

```javascript
const senderDisplay =
  email.sender_name ||
  email.from_name ||
  email.sender ||
  (email.from && !email.from.includes('@') ? email.from : null) ||
  (email.from_addr && !email.from_addr.includes('@') ? email.from_addr : null) ||
  extractNameFromAddr(email.from_addr || email.from || '') ||
  ''
```

Add this helper function at the top of the file (below imports):
```javascript
function extractNameFromAddr(addr) {
  if (!addr || !addr.includes('@')) return null
  const local = addr.split('@')[0]
  // Handle patterns like "hans", "anna.schmidt", "k.richter", "noreply"
  if (['noreply', 'no-reply', 'notifications', 'newsletter', 'calendar', 'digest', 'billing'].includes(local.toLowerCase())) {
    // Use the domain name instead: "newsletter@techcrunch.com" → "TechCrunch"
    const domain = addr.split('@')[1]?.split('.')[0] || ''
    return domain.charAt(0).toUpperCase() + domain.slice(1)
  }
  // "anna.schmidt" → "Anna Schmidt", "k.richter" → "K Richter"
  return local
    .split(/[._-]/)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}
```

Also remove the console.log on line 70.

### 1b. `frontend/src/components/inbox/ReplyDraft.jsx`
The `buildDemoReply` function must also handle `from_addr`:

Change line 16 from:
```javascript
const firstName = email?.sender_name?.split(' ')[0] || email?.from?.split('@')[0] || 'there'
```
To:
```javascript
const senderName = email?.sender_name || email?.from_name || null
const firstName = senderName
  ? senderName.split(' ')[0]
  : extractFirstNameFromAddr(email?.from_addr || email?.from || '')

// ...add above buildDemoReply:
function extractFirstNameFromAddr(addr) {
  if (!addr) return 'there'
  const local = addr.split('@')[0]
  if (['noreply', 'no-reply', 'notifications', 'newsletter', 'calendar'].includes(local)) return 'there'
  const parts = local.split(/[._-]/)
  return parts[0].charAt(0).toUpperCase() + parts[0].slice(1)
}
```

Also in the professional tone template, change:
```javascript
`Dear ${email?.sender_name || firstName},`
```
To:
```javascript
`Dear ${senderName || firstName},`
```

### 1c. `frontend/src/pages/Inbox.jsx` — EmailDetail component
Update the `senderDisplay` resolution at line 510-517 to match the same pattern as EmailCard (include `from_addr` and `extractNameFromAddr`). Add the same `extractNameFromAddr` helper or import it from a shared location.

### 1d. `frontend/src/pages/Inbox.jsx` — Line 582
Change `{email.sender_name}` to `{senderDisplay}` since sender_name might be undefined from backend data.

**Test after fix:**
```bash
cd frontend
grep -c "from_addr" src/components/inbox/EmailCard.jsx && echo "PASS: EmailCard handles from_addr"
grep -c "from_addr" src/components/inbox/ReplyDraft.jsx && echo "PASS: ReplyDraft handles from_addr"
grep -c "from_addr" src/pages/Inbox.jsx && echo "PASS: Inbox EmailDetail handles from_addr"
grep -c "console.log" src/components/inbox/EmailCard.jsx | grep "0" && echo "PASS: No debug logs" || echo "WARN: Debug logs remain"
```

---

## BUG 2: INBOX — "Send Reply" fails silently in demo mode

**Root cause:** `sendMutation` in ReplyDraft.jsx calls `api.post('/emails/{id}/send-reply')` which fails when backend is down. The `onError` handler shows a toast error, but in demo mode it should simulate success.

**File:** `frontend/src/components/inbox/ReplyDraft.jsx`

Change the sendMutation (lines 55-69):
```javascript
const sendMutation = useMutation({
  mutationFn: async () => {
    try {
      const res = await api.post(`/emails/${email?.id}/send-reply`, { body: replyBody })
      return res.data
    } catch {
      // Demo mode: simulate success
      return { success: true, demo: true }
    }
  },
  onSuccess: () => {
    toast.success('Reply sent successfully')
    setReplyBody('')
    setHasGenerated(false)
    onSend?.()
  },
  onError: () => {
    toast.success('Reply sent (demo)')
    setReplyBody('')
    setHasGenerated(false)
  },
})
```

**Test:** `grep -c "demo.*true\|Demo mode" src/components/inbox/ReplyDraft.jsx && echo "PASS: Send has demo fallback"`

---

## BUG 3: REPORTS — "Generate Now" creates duplicates with identical titles

**Root cause:** Clicking "Generate Now" multiple times creates entries all titled "Weekly Business Report" with the same date because `getTitleForType()` always returns the same string for a given type.

**File:** `frontend/src/pages/Reports.jsx`

Update `getTitleForType` to include a timestamp for uniqueness:
```javascript
function getTitleForType(type) {
  const now = new Date()
  const time = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  if (type === 'daily') {
    return `Morning Briefing — ${now.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} (${time})`
  }
  if (type === 'weekly') {
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() - now.getDay() + 1)
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 6)
    return `Weekly Business Report — ${weekStart.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}–${weekEnd.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} (${time})`
  }
  return `Monthly Report — ${now.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })} (${time})`
}
```

**Test:** 
```bash
grep -c "time\|toLocaleTimeString" src/pages/Reports.jsx && echo "PASS: Report titles include time"
```

---

## BUG 4: AI CHAT — Remove debug console.log

**File:** `frontend/src/components/shared/AIChatSidebar.jsx`

Remove the console.log on line 112.

**Test:** `grep -c "console.log" src/components/shared/AIChatSidebar.jsx | grep "0" && echo "PASS: No debug logs"`

---

## BUG 5: INVOICES — "Create Invoice" fails when backend is down

**Root cause:** The mutation in Invoices.jsx tries `api.post('/invoices')`, catches the error, and returns `{ fromApi: false }`. Then `onSuccess` runs and calls `queryClient.setQueryData(['invoices', statusFilter])`. BUT the query key might not match what the query actually uses, so the cache update has no effect.

**File:** `frontend/src/pages/Invoices.jsx`

Verify that the query key in the invoice list query matches exactly. Check what `useQuery` uses:
```bash
grep "queryKey.*invoice" src/pages/Invoices.jsx
```

If the list query uses `['invoices', statusFilter]`, the `setQueryData` key must match exactly. Also add `refetchQueries` as fallback:

In the `onSuccess` of `createInvoice` mutation, after the setQueryData block, add:
```javascript
queryClient.invalidateQueries({ queryKey: ['invoices'] })
queryClient.invalidateQueries({ queryKey: ['invoice-stats'] })
```

This ensures the demo-created invoice shows up even if the cache key doesn't match perfectly.

**Test:** `grep -c "invalidateQueries.*invoices" src/pages/Invoices.jsx && echo "PASS: Invoice cache invalidation exists"`

---

## BUG 6: LANDING PAGE FAQ — Verify expand/collapse works

**File:** `frontend/src/pages/Landing.jsx`

Read the `FAQItem` component. Verify it has useState for open/closed and an onClick handler. If it uses just CSS (details/summary), confirm it renders properly. This was working in a previous session — just verify, no change needed unless broken.

**Test:** `grep -c "useState\|setOpen\|toggle\|details\|summary" src/pages/Landing.jsx && echo "PASS: FAQ has toggle state"`

---

## BUG 7: PRODUCTION CLEANUP — Remove all debug console.logs

**All frontend files:**
```bash
grep -rn "console.log" frontend/src/ --include="*.jsx" --include="*.js" | grep -v "node_modules" | grep -v "// console"
```

Remove every `console.log` from production code. Keep only `console.error` and `console.warn` for actual error handling.

---

## BUG 8: MISSING — Dashboard stat cards show "NaN" or wrong data when API is unreachable

**File:** `frontend/src/pages/Dashboard.jsx`

Verify the dashboard stats query has a proper demo fallback. Check that the `DEMO_STATS` or equivalent is complete and used as `placeholderData`. If the query fails and there's no fallback, stat cards show empty or NaN.

**Test:** `grep -c "placeholderData\|DEMO.*STATS\|fallback" src/pages/Dashboard.jsx && echo "PASS: Dashboard has demo fallback"`

---

## FINAL BUILD TEST — Run this after ALL fixes

```bash
cd frontend

# 1. Build must pass
npm run build 2>&1 | tail -10
BUILD_EXIT=$?

# 2. No debug console.logs in production code
LOGS=$(grep -rn "console.log" src/ --include="*.jsx" --include="*.js" | grep -v node_modules | grep -v "// console" | wc -l)

# 3. Verify critical fixes
EMAILCARD_FROMADDR=$(grep -c "from_addr" src/components/inbox/EmailCard.jsx)
REPLY_FROMADDR=$(grep -c "from_addr" src/components/inbox/ReplyDraft.jsx)
INBOX_FROMADDR=$(grep -c "from_addr" src/pages/Inbox.jsx)
REPLY_DEMO=$(grep -c "demo" src/components/inbox/ReplyDraft.jsx)
REPORT_TIME=$(grep -c "toLocaleTimeString" src/pages/Reports.jsx)

echo ""
echo "=============================="
echo "  DEPLOYMENT READINESS CHECK  "
echo "=============================="
echo "Build:              $([ $BUILD_EXIT -eq 0 ] && echo '✅ PASS' || echo '❌ FAIL')"
echo "Console.logs:       $([ $LOGS -eq 0 ] && echo '✅ PASS (0 found)' || echo '⚠️  '$LOGS' found')"
echo "EmailCard from_addr: $([ $EMAILCARD_FROMADDR -gt 0 ] && echo '✅ PASS' || echo '❌ FAIL')"
echo "ReplyDraft from_addr: $([ $REPLY_FROMADDR -gt 0 ] && echo '✅ PASS' || echo '❌ FAIL')"
echo "Inbox from_addr:    $([ $INBOX_FROMADDR -gt 0 ] && echo '✅ PASS' || echo '❌ FAIL')"
echo "Reply demo fallback: $([ $REPLY_DEMO -gt 0 ] && echo '✅ PASS' || echo '❌ FAIL')"
echo "Report unique titles: $([ $REPORT_TIME -gt 0 ] && echo '✅ PASS' || echo '❌ FAIL')"
echo "=============================="

# 4. If all pass, commit
if [ $BUILD_EXIT -eq 0 ] && [ $EMAILCARD_FROMADDR -gt 0 ] && [ $REPLY_FROMADDR -gt 0 ]; then
  echo ""
  echo "All checks passed — committing..."
  cd ..
  git add -A
  git commit -m "fix: resolve inbox avatars, reply names, send demo fallback, report duplicates, remove debug logs"
  git push origin main
else
  echo ""
  echo "❌ FIX FAILURES BEFORE COMMITTING"
fi
```

---

## WHAT NOT TO TOUCH
- Do NOT change the layout, sidebar, header, or theme
- Do NOT change the landing page design
- Do NOT refactor component structure
- Do NOT add new features
- Do NOT change API endpoints or backend code
- Only fix the specific bugs listed above
