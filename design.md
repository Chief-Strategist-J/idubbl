iDubbl — UX Copy & Image
Specification
Companion build doc to the iDubbl MVP PRD v1.0
This document gives your developer everything needed to build every
screen's content layer: copy, microcopy, validation/error states, and
image/icon specs. It follows the PRD's scope exactly (Sections 8–9)
and adds a small number of screens that are implied but not detailed
in the PRD (auth recovery, profile, notifications, support, error pages).
Those additions are flagged below so you can confirm or change
them before build.
A note on placeholder numbers: tier entry fees, rake %, minimums,
and timers below are concrete placeholder values so the developer
has real numbers to wire up — not hardcoded business decisions.
They live in Admin → Tiers and Admin → Game Settings per the PRD,
so they're configurable post-launch.
0. Additions beyond the literal PRD (confirm
before build)
Addition Why it's needed
18+ / Terms checkbox on signup
Real-money platform — needs
explicit age + terms acceptance
at registration
Forgot/Reset password flow
PRD lists "Forgot password" as a
button but doesn't spec the flow
Addition Why it's needed
OTP / account verification
screen
PRD mentions "OTP or email
verification if enabled" without a
screen spec
Wallet hub (lightweight landing
for Deposit/Withdraw/History)
Needed as a single bottom-nav
destination — PRD specs deposit,
withdraw, and history as three
separate screens with no shared
entry point
Profile & Settings
Standard requirement for any
account-based product; not in
PRD scope list
Notifications panel
Implied by "real-time"
requirement (Section 6) but not
specced
Support / Help screen
Needed given Support Agent role
exists (Section 5) but has no
user-facing counterpart
404 / generic error /
maintenance states
Standard production requirement
Admin login screen
Admin console (Section 9) has
no login spec
Word Duel game mechanic
PRD recommends "word duel"
(Section 12) as a concept but
doesn't define rules — a concrete
mechanic is specified below so
the game screen can actually be
built
1. Brand & Design Foundations
1.1 Color tokens
Token Hex Use
bg-base #0A0D12 App background
bg-surface #141821 Cards, panels
bg-elevated #1B202B
Modals, dropdowns, table
headers
border #232938 Dividers, input borders
text-primary #F5F7FA Headings, primary copy
text-secondary #9AA4B2 Helper text, captions
text-disabled #5B6472 Disabled labels
accent-primary
(brand green)
#00E37A
Primary CTAs, positive
amounts, "win" states
accent-primaryhover
#00C76B
Hover/active state of
primary
accent-secondary
(electric blue)
#5B8DEF
Links, info states,
secondary highlights
warning #FFB020 Pending states, holds
danger #FF4D4F
Errors, destructive actions,
losses
1.2 Typography
Headings: Space Grotesk — weights 500 (subhead) / 700
(headline). Fallback: 'Space Grotesk', Inter, sans-serif
Body / UI: Inter — weights 400 / 500 / 600. Fallback: Inter, -
apple-system, sans-serif
Monospace (tx hashes, wallet addresses, match IDs): JetBrains
Mono. Fallback: 'JetBrains Mono', 'Roboto Mono',
monospace
Style
Size / Line height
(mobile)
Size / Line height
(desktop)
H1 32px / 40px 44px / 52px
H2 24px / 32px 28px / 36px
H3 20px / 28px 22px / 30px
Body 16px / 24px 16px / 24px
Caption 13px / 18px 13px / 18px
1.3 Spacing, radius, components
Spacing grid: 4px base (4, 8, 12, 16, 24, 32, 48, 64)
Corner radius: 12px cards, 8px inputs/buttons, full pill (999px) for
chips/balance pill
Buttons: Primary = accent-primary fill, bg-base text, 48px
height (mobile, full-width on forms) / 44px (desktop). Secondary
= 1px border outline, transparent fill, text-primary text.
Destructive = danger fill, white text.
Icon style: 2px stroke line icons, 24×24 base grid, rounded joins,
single-color (inherits text-primary or accent-primary )
1.4 Logo & core asset specs
Asset Dimensions Format Notes
Wordmark
(header)
160×40
viewBox
SVG (PNG
fallback @2x,
320×80)
Transparent
background
Favicon
32×32,
16×16
ICO/PNG
App / PWA
icon
192×192,
512×512
PNG
Maskable safe
zone = inner
80%
Social share
(OG) image
1200×630 PNG/JPEG
Used for link
previews
2. Global UI Components
2.1 Header — logged out
Logo (left) · Nav: "How it works" / "Tiers" / "Support" · Right: "Log in"
(secondary button) / "Sign up" (primary button)
2.2 Header — logged in (app shell)
Logo (left, links to Dashboard) · Balance pill (center-right, shows
available balance) · Notification bell (badge dot if unread) · Profile
avatar (dropdown: Profile, Wallet, Match History, Support, Log out)
Balance pill copy: {amount} USDT available
Balance pill tooltip: "Available balance: ready to use. Locked
balance: reserved in active matches."
2.3 Bottom navigation (mobile, logged in)
5 icons: Home (Dashboard) · Play (Lobby) · Wallet (Wallet hub) ·
History (Transaction history) · Profile
2.4 Wallet hub (addition — single entry point for money
actions)
Purpose: landing screen when a user taps "Wallet" in bottom nav.
Layout: Balance card (Available / Locked, same as dashboard) →
two large buttons "Deposit" / "Withdraw" → "Recent activity" preview
(last 5 ledger rows) → "View full history" link.
Image specs: none beyond icons already specced for
dashboard/history.
2.5 Generic system copy (reused everywhere)
Element Copy
Loading (prefer
skeleton screens
over spinners for
lists)
"Loading…"
Generic error toast "Something went wrong. Please try again."
Offline banner "You're offline. Reconnecting…"
Session expired
modal
Title: "Session expired" · Body: "Please log
in again to continue." · Button: "Log in"
Notification bell —
empty state
"No notifications yet."
Leave-queue confirm
modal
Title: "Leave the queue?" · Body: "Your
reserved entry fee will be returned to your
available balance." · Buttons: "Stay in
queue" / "Leave queue"
3. Public Pages
3.1 Landing / Homepage
Purpose: explain iDubbl in one sentence and push registration (PRD
8.1).
Layout (top to bottom):
1. Sticky header (logged-out, see 2.1)
2. Hero section
3. Trust strip (3 points)
4. How it works (4 steps)
5. Game spotlight — Word Duel
6. Tier preview cards
7. "Why iDubbl" reassurance section
8. FAQ accordion
9. Footer
Copy
Element Copy
Hero headline Play fast skill matches.
Hero subhead Fund your wallet, join a tier, win the pool.
Hero
supporting
line
Instant matchmaking. Transparent prizes. Fast
payouts.
Primary CTA Play and win with skill
Secondary
CTA
View how it works
Trust point 1 Server-verified results
Trust point 2 Instant credit wallet
Element Copy
Trust point 3 Same-day withdrawals
How it works
— step 1
Fund your wallet — deposit USDT, credited after a
quick review.
How it works
— step 2
Choose a tier — pick an entry fee that fits your
bankroll.
How it works
— step 3
Get matched — we pair you with an opponent in
your tier, fast.
How it works
— step 4
Win the pool — best of 3 rounds. Win two, take the
pool.
Game
spotlight
headline
Word Duel: Anagram Sprint
Game
spotlight body
Same 7 letters. 20 seconds. Highest score wins
the round. Best of 3 takes the match.
Game
spotlight CTA
Play Word Duel
Tier preview
CTA
See all tiers
Why iDubbl —
point 1
Skill decides the winner, not chance.
Why iDubbl —
point 2
Every match result is calculated server-side.
Why iDubbl —
point 3
Large deposits and withdrawals get a manual
human check before anything moves.
FAQ Q1 What is iDubbl?
Element Copy
FAQ A1
iDubbl is a 1v1 skill game platform. Two players
put up the same entry fee, play a short match, and
the winner takes the pool minus a small platform
fee.
FAQ Q2 Is this gambling?
FAQ A2
No. Outcomes are decided by player skill in a
timed word game, not by chance or odds.
FAQ Q3 How fast are withdrawals?
FAQ A3
Approved withdrawal requests are typically paid
out the same day.
FAQ Q4 What happens if I disconnect mid-match?
FAQ A4
You'll have a short window to reconnect. If you
don't reconnect in time, the round may be scored
as a loss.
FAQ Q5 What currency do I use?
FAQ A5
iDubbl currently supports USDT on the TRC-20
network for deposits and withdrawals.
FAQ Q6 How is the winner of a round decided?
FAQ A6
The player with the higher score in the round wins
it. Two round wins takes the match.
Footer links
About · How it works · Tiers · Support · Terms ·
Privacy · Responsible Play
Image & asset specs
Asset Dimensions Format
Notes / alt
text
Hero illustration
1200×900 source
(4:3), responsive at
480w/768w/1200w
WebP
primary +
JPEG
fallback
Two
stylized
players
facing off
across a
glowing
digital
arena with
a prize
pool at
center. Alt:
"Two
players
competing
head-tohead in a
digital
arena."
Trust icons (×3) 48×48 SVG
Shieldcheck
(serververified) ·
Wallet
(instant
credit) ·
Lightning
bolt (fast
payout)
How-it-works
step icons (×4)
56×56 SVG
Numbered
badge
style, 1–4
Asset Dimensions Format
Notes / alt
text
Game spotlight
screenshot
720×1440 (phone
mockup, 9:18)
PNG
Word Duel
game
screen
inside a
phone
frame
Tier badge icons
(×3:
Rookie/Pro/Elite)
64×64 SVG
Colorcoded per
tier (see
4.3)
Payment
network badges
24×24 each SVG/PNG
Use
official
USDT/Tron
brand
marks per
their
usage
guidelines
— do not
redesign
3.2 Sign Up
Purpose: create an account (PRD 8.2).
Copy
Element Copy
Headline Create your account
Element Copy
Subhead
Create your account to start playing, funding
your wallet, and joining matches.
Field — First
name
Label: "First name" · Placeholder: "Jordan"
Field — Last
name
Label: "Last name" · Placeholder: "Smith"
Field — Email or
phone
Label: "Email or phone" · Placeholder:
"you@example.com or +1 555 000 0000"
Field —
Password
Label: "Password" · Placeholder: "At least 8
characters" · Helper: "Use 8+ characters with a
number and a symbol."
Field — Confirm
password
Label: "Confirm password" · Placeholder: "Reenter your password"
Field — Referral
code (optional)
Label: "Referral code (optional)" · Placeholder:
"Have a code? Enter it here"
Checkbox
(addition)
"I'm 18 or older and I agree to the Terms of
Service and Privacy Policy."
Primary button Sign up
Secondary link Already have an account? Log in
Validation / errors
Trigger Message
Empty required field This field is required.
Invalid email Enter a valid email address.
Trigger Message
Invalid phone Enter a valid phone number.
Email/phone already
registered
This email is already registered. Log in
instead.
Password mismatch Passwords don't match.
Weak password
Password must be at least 8 characters
and include a number.
Terms checkbox
unchecked
You must confirm you're 18 or older and
accept the Terms to continue.
Image specs: no hero image required. Optional subtle background
texture — 1920×1080 SVG/PNG, low-contrast radial gradient,
decorative only, aria-hidden="true" , file size under 50KB.
3.3 Log In
Element Copy
Headline Welcome back
Subhead
Log in to check your balance and jump
into a match.
Fields Email or phone · Password
Primary button Log in
Links
Forgot password? · New to iDubbl? Sign
up
Error — wrong
credentials
Incorrect email/phone or password.
Element Copy
Error — rate limited
Too many attempts. Try again in {n}
minutes.
Error — suspended
account
This account is suspended. Contact
support.
3.4 Forgot / Reset Password (addition)
Step 1 — Request code
Headline: "Reset your password"
Body: "Enter the email or phone on your account and we'll send
you a reset code."
Field: Email or phone
Button: "Send reset code"
Step 2 — Enter code
Headline: "Enter your code"
Body: "We sent a 6-digit code to {masked contact}."
Field: 6-digit OTP input (auto-advance boxes)
Resend: "Resend code in 0:45" → becomes link "Resend code" at
zero
Error: "That code is incorrect or expired. Request a new one."
Step 3 — New password
Headline: "Set a new password"
Fields: New password · Confirm new password
Button: "Update password"
Success toast: "Your password has been updated. Log in to
continue."
3.5 Verify Account (OTP) (addition)
Element Copy
Headline Verify your account
Body
Enter the 6-digit code we sent to {email/phone} to
activate your account.
Field 6-digit code input
Button Verify
Resend Resend code in 0:45 → "Resend code"
Error That code is incorrect or expired. Request a new one.
Success Toast: "Account verified." → redirect to Dashboard
4. App Pages (Authenticated)
4.1 Dashboard
Purpose: the user's main control room (PRD 8.3).
Layout (top to bottom):
1. Greeting bar — "Welcome back, {first_name}"
2. Balance card — Available + Locked, with Deposit / Withdraw
buttons
3. Queue/match status banner (conditional)
4. "Join a tier" CTA
5. Win/loss summary card
6. Pending withdrawals card (conditional)
7. Recent matches list (up to 5)
8. Recent ledger entries (last 10)
Copy
Element Copy
Greeting Welcome back, {first_name}
Available balance
label
Available balance: credits ready to play.
Locked balance label
Locked balance: credits reserved in active
matches.
Tier CTA Join a tier to start playing now.
Tier CTA button Browse tiers
Queue banner
(searching)
You're in the {tier_name} queue — searching
for an opponent
Queue banner link View queue
Active match banner Match in progress — Round {n} of 3
Active match button Return to match
Win/loss summary
{wins} wins · {losses} losses · {win_rate}%
win rate
Pending withdrawals
card
{n} withdrawal request(s) pending review
Empty — no matches
You haven't played a match yet. Join a tier
to get started.
Empty — no ledger
entries
No wallet activity yet. Make your first
deposit to begin.
Image & asset specs
Asset Dimensions Format Notes
Default
avatar set
96×96
SVG/PNG,
circular
6 flat-color variants
with initials
fallback; no
custom image
needed if user
hasn't uploaded
one
Empty-state
illustration
(no matches)
320×240 SVG
Simple line art, two
dueling icons at
rest. Alt: "No
matches played
yet"
Status chip
icons
16×16 SVG
Check-circle
(green, Won) · Xcircle (red, Lost) ·
Clock (gray,
Pending)
4.2 Deposit
Purpose: show deposit address, collect tx hash for manual review
(PRD 8.4).
Copy
Element Copy
Headline Deposit USDT
Intro
Send USDT to the address below and paste the
transaction hash for review.
Status note Deposits are credited after confirmation.
Element Copy
Network field
(locked)
USDT · TRC-20
Network warning
Only send USDT on the TRC-20 network. Funds
sent on the wrong network cannot be
recovered.
Minimum deposit
notice
Minimum deposit: 10 USDT
Address block
label
Platform deposit address
Copy button Copy
Copy
confirmation
toast
Address copied.
Field — Amount
sent
Label: "Amount sent (USDT)"
Field —
Transaction hash
Placeholder: "Paste the transaction ID from
your wallet or exchange"
Field — Note
(optional)
Placeholder: "Optional note for our review
team"
Submit button Submit for review
Review time note
Review usually takes under 30 minutes during
active hours.
Status chip —
pending
Pending review
Element Copy
Status chip —
approved
Approved & credited
Status chip —
rejected
Rejected — see note
Validation / errors
Trigger Message
Invalid tx hash format Enter a valid transaction hash.
Amount below
minimum
Amount must be at least 10 USDT.
Duplicate hash
submitted
This transaction hash has already been
submitted.
Image & asset specs
Asset Dimensions Format Notes
QR code 240×240
SVG/PNG,
generated
dynamically
High contrast,
error-correction
level H so a
centered logo
mark doesn't
break
scannability
Network logo
(USDT/Tron)
24×24 SVG
Official brand
mark
Copy icon 20×20 SVG
4.3 Tier Selection / Lobby
Purpose: choose entry tier and join queue (PRD 8.5).
Copy
Element Copy
Headline
Choose a tier to enter the next
available match.
Subhead
Your entry fee will be reserved when
you join.
Balance reminder strip Available: {amount} USDT · Deposit
Join button Join {tier_name}
Insufficient balance button
state
Add funds to join
Insufficient balance tooltip
You need {shortfall} more USDT to
join this tier.
Waiting count (active) {n} players waiting
Waiting count (empty) No one waiting — be the first
Estimated wait ~{n}s estimated wait
Rake disclosure {rake}% platform fee
Tier defaults (placeholder, configurable in Admin → Tiers)
Tier Entry fee Rake Est. prize (win up to)
Rookie 5 USDT 10% 9 USDT
Pro 20 USDT 10% 36 USDT
Tier Entry fee Rake Est. prize (win up to)
Elite 50 USDT 8% 92 USDT
Image & asset specs
Asset Dimensions Format Notes
Tier badge
icons (×3,
reused from
homepage)
64×64 SVG
Rookie = textsecondary tint · Pro
= accentsecondary tint · Elite
= accent-primary
tint
4.4 Match Queue
Purpose: show matchmaking status (PRD 8.6).
Copy by state
State Copy
Searching
Headline: "Finding an opponent in your tier. Stay
ready." · Subtext: "Elapsed time: {mm:ss}" · Button:
"Cancel"
Matched
Headline: "Opponent found!" · Subtext: "
{opponent_name} — get ready." · Button: "I'm ready"
· Waiting indicator: "Waiting for opponent…"
Starting Countdown: "Match starting in 3… 2… 1…"
Cancel
confirm
modal
Title: "Leave the queue?" · Body: "Your reserved
entry fee will be returned to your available balance
immediately." · Buttons: "Stay" / "Leave queue"
State Copy
Cancel toast
You left the queue. Your entry fee has been
returned.
Long wait (no
opponent)
Headline: "Still searching…" · Body: "This tier is
quiet right now. You can keep waiting or try a
different tier." · Buttons: "Keep waiting" / "Switch
tier"
Image & asset specs
Asset Dimensions Format Notes
Searching
indicator
120×120
Animated
SVG (loop)
Radar/pulse
animation
Opponent
avatar (inqueue)
96×96
Reused from
dashboard
set
"VS"
matchup
graphic
360×160 SVG
Two avatars
either side of a
"VS" mark
4.5 Game Screen — Word Duel: Anagram Sprint
Game mechanic (specified here since the PRD leaves it open):
Both players receive the same 7 random letters. Each player has 20
seconds to type the highest-value word using only those letters (a
letter can be used only as many times as it appears in the set). Score
= sum of letter point values + a length bonus of +1 per letter beyond
4 letters. Higher score wins the round. Best of 3 rounds wins the
match. A tie triggers a 15-second sudden-death round with a fresh
letter set.
Letter values (standard tile-game scoring distribution)
Points Letters
1 A, E, I, O, U, L, N, S, T, R
2 D, G
3 B, C, M, P
4 F, H, V, W, Y
5 K
8 J, X
10 Q, Z
Layout: Top bar — "Round {n} of 3" + round-win pips (●●○) for each
player + countdown ring. Center — 7 letter tiles. Below — text input
with live point-value preview + "Submit word" button. Players' zone
shows "You: submitted" / "{Opponent}: waiting…" — opponent's live
score is hidden until the round ends to prevent copying.
Copy
Element Copy
Round header Round {n} of 3
Instruction (pre-round
tooltip)
Play now. Highest score wins the round.
Match rule reminder Two round wins takes the match.
Submit button Submit word
Opponent status
(before they submit)
Waiting for opponent…
Element Copy
Opponent status (after
they submit)
{Opponent} has submitted
Round-end overlay
Round {n} complete · You: {word}
({points}) · {Opponent}: {word} ({points}) ·
Winner: {name}
Round-end continue (if
not auto-advancing)
Continue
Disconnect banner Reconnecting… {mm:ss}
Disconnect warning
If you don't reconnect in time, this round
may be forfeited.
Image & asset specs
Asset Dimensions Format Notes
Letter
tile
56×56
SVG
sprite
bg-elevated fill,
accent-primary 2px
border, letter in Space
Grotesk bold, point value
in 10px corner numeral
Round
timer
ring
64×64 SVG
Circular progress; stroke
transitions green →
amber → red as time runs
out
In-game
avatar
40×40
Reused,
smaller
crop
Roundwin pip
12×12 SVG
Filled (won) / outline (not
yet decided)
4.6 Result Screen
Purpose: show match outcome, prize breakdown, wallet update
(PRD 8.8).
Copy
Element Copy
Win headline
You won the match. Your prize has been
credited to your balance.
Lose headline
You lost this match. Your entry fee has been
added to the prize pool.
Round recap row
Round {n}: You {score} – {opponent} {score} ·
{Won/Lost}
Prize breakdown
(winner)
Pool: {2×entry} USDT · Platform fee: {rake}% (–
{fee} USDT) · Your prize: {prize} USDT
Prize breakdown
(loser)
Entry fee: –{entry} USDT
Wallet update line New available balance: {amount} USDT
Settlement meta Settled {timestamp} · Match #{match_id}
CTA copy
Play again in the same tier or choose a
different tier.
Buttons Play again · Choose a different tier
Image & asset specs
Asset Dimensions Format Notes
Win
illustration
280×280
SVG/Lottie
+ confetti
overlay
(≤50KB)
Trophy/checkmark
burst; respect
prefers-reducedmotion (fallback to
static)
Lose
illustration
200×200 SVG
Understated, neutral
tone — no shaming
imagery
4.7 Withdraw
Purpose: request payout (PRD 8.9).
Copy
Element Copy
Headline
Request a withdrawal. Requests are reviewed
before payout.
Available to
withdraw
{amount} USDT
Pending holds Pending holds: {amount} USDT
Holds tooltip
Funds reserved in active matches or pending
deposit review aren't withdrawable yet.
Field —
Amount
"Max" quick-fill button available
Field —
Destination
address
Placeholder: "Paste your USDT TRC-20 address"
Element Copy
Field —
Network
(locked)
USDT · TRC-20
Field — Note
(optional)
Minimum
withdrawal
notice
Minimum withdrawal: 10 USDT
Network fee
disclosure
Network fee: 1 USDT (deducted from payout)
Submit button Submit withdrawal request
Confirm modal
Title: "Confirm withdrawal" · Body: "You're
requesting {amount} USDT to {address,
truncated}. This can't be edited once submitted." ·
Buttons: "Edit" / "Confirm and submit"
Status chips Pending review · Approved · Paid · Rejected
Validation / errors
Trigger Message
Amount exceeds
available
Enter an amount within your available balance.
Invalid address
format
Enter a valid TRC-20 wallet address.
Below minimum Amount is below the minimum withdrawal.
Existing pending
request
You already have a pending withdrawal
request. Please wait for it to be reviewed.
4.8 Transaction History
Purpose: full wallet ledger (PRD 8.10).
Copy
Element Copy
Headline All wallet activity is recorded here.
Filter
chips
All · Deposits · Withdrawals · Matches · Refunds ·
Adjustments
Empty
state
No wallet activity yet. Make your first deposit to begin.
Load
more
Load more
Row
labels
Deposit · Withdrawal · Match entry — {tier} · Match win
— {tier} · Refund — canceled queue · Adjustment
Image & asset specs
Asset Dimensions Format Notes
Type
icons
(×6)
20×20 SVG
Deposit (down-arrow, green) ·
Withdrawal (up-arrow, gray) ·
Match entry (gray) · Match
win (green) · Refund (blue) ·
Adjustment (amber)
4.9 Profile & Settings (addition)
Layout: Account info (name, email/phone, editable) → Security
(change password) → Saved withdrawal address (optional
convenience) → Notification preferences (toggles: deposit
confirmed, withdrawal paid, match result) → Support link → Log out
→ Deactivate account.
Copy
Element Copy
Headline Profile
Save button Save changes
Save toast Profile updated.
Deactivate
confirm
Title: "Deactivate your account?" · Body: "You won't
be able to log in, deposit, or play until you contact
support to reactivate." · Button: "Deactivate"
Image specs: Avatar upload — accepted JPG/PNG, max 5MB, autocropped to 256×256 circular, falls back to default avatar set if none
uploaded.
4.10 Notifications Panel (addition)
Copy
Element Copy
Notification — deposit
approved
Deposit approved — {amount}
USDT credited
Notification — withdrawal paid
Withdrawal paid — {amount} USDT
sent
Notification — match found Match found — {tier}
Element Copy
Notification — match won
You won your match — {prize}
USDT credited
Notification — withdrawal
needs attention
Withdrawal request needs
attention — see note
Empty state No notifications yet.
Mark all read link Mark all as read
4.11 Support / Help (addition)
Copy
Element Copy
Headline Need help?
Subhead
Search common questions or message
support.
Search placeholder Search help articles
Contact button Message support
Contact form fields
Subject · Description · Reference ID
(optional — match or transaction)
FAQ topics
(account/walletspecific)
"My deposit hasn't been credited yet" ·
"How do I cancel a withdrawal?" · "What
happens if I disconnect mid-match?"
5. System Pages (additions)
5.1 404 Not Found
Headline: "Page not found"
Body: "The page you're looking for doesn't exist or has moved."
Button: "Back to dashboard" (logged in) / "Back to homepage"
(logged out)
Image: 240×240 SVG illustration, disconnected/lost icon. Alt:
"Page not found"
5.2 Generic Error (500)
Headline: "Something went wrong on our end"
Body: "Try again in a moment. If this keeps happening, contact
support."
Button: "Try again"
5.3 Maintenance Mode
Headline: "We'll be right back"
Body: "iDubbl is undergoing scheduled maintenance. Matches
and withdrawals are paused until {time}."
6. Admin Console
6.1 Admin Login (addition)
Element Copy
Headline Admin sign in
Fields Email · Password (· 2FA code, if enabled)
Restriction note
This portal is restricted to authorized
personnel. All access is logged.
Element Copy
Button Sign in
Error — invalid
credentials
Invalid credentials.
Error — no admin
access
Your account doesn't have admin access.
Error — lockout
Too many failed attempts. Try again in {n}
minutes.
6.2 Admin Dashboard Home
Layout: KPI tile grid (7 tiles) → wallet reserve health bar → failedsettlement alert (conditional) → queue depth table.
Copy
Element Copy
Headline
Monitor deposits, matches, withdrawals, and
platform health in real time.
Subhead Any wallet or settlement issue appears here first.
KPI tiles
Total users · Active users (24h) · Deposits
pending · Withdrawals pending · Open matches ·
Completed matches today · Revenue today
Wallet reserve
label
Hot wallet reserve: {pct}% healthy
Wallet reserve
alert
⚠ Hot wallet reserve below threshold — top up
required.
Failed
settlement
⚠ {n} match(es) failed to settle automatically.
Review immediately.
Element Copy
alert
Failed
settlement link
Review now
Queue depth
table columns
Tier · Waiting now · Avg wait (last hour) · Status
(Healthy / Slow / Stalled)
6.3 Deposits Module
Table columns: User · Amount · Network · Tx hash (truncated, click
to expand/copy, link to block explorer) · Submitted · Status · Actions
Action Modal copy
Approve
Title: "Approve deposit" · Body: "Confirm {amount} USDT
was received on-chain for {user}. This will credit their
wallet immediately." · Field: internal note (optional) ·
Button: "Approve and credit"
Reject
Title: "Reject deposit" · Field: reason (dropdown:
Transaction not found / Wrong network / Amount
mismatch / Duplicate submission / Other + free text) ·
Button: "Reject"
Hold
Title: "Place on hold" · Field: reason note · Button: "Hold
for review"
Status chips: Pending · On hold · Approved · Rejected
Bulk action (addition, for ops efficiency): checkbox select + "Approve
selected" for batches under a configurable risk threshold.
6.4 Withdrawals Module
Table columns: User · Amount · Destination address · Requested ·
Available balance (at request time) · Status · Actions
Action Modal copy
Approve
Title: "Approve withdrawal" · Body: "Confirm
{amount} USDT will be sent to {address}." · Button:
"Approve"
Mark paid
Title: "Mark as paid" · Field: payout tx hash
(optional) · Button: "Mark paid"
Mark failed
Title: "Mark as failed" · Field: reason · Note: "Funds
will be returned to the user's available balance." ·
Button: "Mark failed"
Reject
Field: reason (dropdown: Invalid address /
Suspicious activity / Exceeds limit / Other + free
text)
Request
extra checks
Title: "Flag for extra review" · Field: note to
risk/support · Status becomes "Extra review"
Status chips: Pending · Extra review · Approved · Paid · Failed ·
Rejected
6.5 Live Matches Module
Two views:
Queue view: Tier · Waiting count · Longest wait · Avg wait
Active matches view: Match ID · Tier · Player 1 · Player 2 · Round
· Time elapsed · Status
Actions:
| Action | Copy |
|---|---|
| Cancel match | Modal title: "Cancel this match?" · Body: "Both
players' entry fees will be refunded to their available balance. This
cannot be undone." · Confirmation requires typing "CANCEL" |
| Force end & settle (escalation only) | Same typed-confirmation
pattern |
6.6 Users Module
Table columns: Name · Email/phone · Status · Available balance ·
Locked balance · Joined date · Actions
Detail drawer: Profile info, balance breakdown, match history, ledger
history, dispute flags. Actions: Suspend / Reinstate / Force password
reset / Add admin note.
Action Modal copy
Suspend
Title: "Suspend this account?" · Field: reason (required) ·
Body: "Suspended users cannot log in, deposit, or join
matches until reinstated." · Button: "Suspend"
6.7 Tiers Module
Table columns: Tier name · Entry fee · Rake % · Min wait threshold ·
Status (Active/Paused) · Actions
Create/edit form fields: Tier name · Entry fee (USDT) · Rake percent ·
Minimum wait seconds (before "quiet tier" messaging shows to
users) · Status toggle
Trigger Message
Entry fee ≤ 0 Entry fee must be greater than 0.
Rake out of
range
Rake must be between 0–100%.
Duplicate name A tier with this name already exists.
Pause
confirmation
Pausing this tier stops new players from joining.
Players already queued will remain in queue.
6.8 Game Settings Module
Fields: Game type (locked to "Word Duel" in MVP — disabled
dropdown, note: "Additional games are out of scope for MVP") ·
Round time (default 20s) · Letters per round (default 7) · Scoring
table editor (per-letter point values) · Best-of setting (locked to 3) ·
Tie-break toggle ("Sudden death round," default on)
Element Copy
Save button Save game settings
Save
confirmation
Changes apply to new matches only. Matches in
progress are not affected.
6.9 System Ledger Module
Reconciliation summary (top of page): "Sum of all balances: {X}
USDT · Platform wallet balance: {Y} USDT · Variance: {Z} USDT" —
variance highlighted red if ≠ 0.
Table columns: Entry ID · User · Type · Amount · Reference · Status ·
Timestamp
Button: Export CSV
6.10 Audit Log Module
Table columns: Timestamp · Actor · Action · Entity · Entity ID ·
Metadata (expandable)
Reassurance copy: "Every admin action is recorded automatically
and cannot be edited or deleted."
7. Transactional Email & SMS Templates
Template Subject Body
Welcome /
Verify
Verify your
iDubbl account
Hi {first_name}, use this code
to verify your account: {code}.
Expires in 10 minutes.
Password
reset
Reset your
iDubbl
password
Use this code to reset your
password: {code}. If you didn't
request this, ignore this email.
Deposit
approved
Deposit
confirmed
Your deposit of {amount}
USDT has been confirmed and
credited. New balance:
{balance} USDT.
Deposit
rejected
Action needed:
deposit not
confirmed
We couldn't confirm your
deposit of {amount} USDT.
Reason: {reason}. Contact
support if you believe this is
an error.
Withdrawal
paid
Your
withdrawal is
on its way
Your withdrawal of {amount}
USDT has been sent to
{address}. Tx: {tx_hash}.
Withdrawal
rejected
Withdrawal
request update
Your withdrawal request of
{amount} USDT was not
approved. Reason: {reason}.
Match win
digest
(optional)
You won your
match!
{prize} USDT has been credited
to your balance. Play again?
8. Global Error & Validation Message Library
Code/context Message
Required field This field is required.
Invalid email Enter a valid email address.
Invalid phone Enter a valid phone number.
Network/offline You're offline. Reconnecting…
Session expired Please log in again to continue.
Rate limited Too many attempts. Try again in {n} minutes.
Insufficient
balance
You don't have enough available balance for
this action.
Generic 500
Something went wrong on our end. Try again in
a moment.
Maintenance
mode
iDubbl is undergoing scheduled maintenance.
Please check back shortly.
9. Master Image & Asset Manifest
Naming convention: kebab-case, e.g. hero-illustration.webp ,
logo-wordmark.svg , icon-trust-shield.svg , tile-letter.svg ,
avatar-default-01.png .
Asset Used on Dimensions Format
logo-wordmark Global header 160×40
SVG (+PNG
@2x)
favicon Browser tab
32×32 /
16×16
ICO/PNG
Asset Used on Dimensions Format
app-icon
PWA / home
screen
192×192,
512×512
PNG
og-share-image Link previews 1200×630 PNG/JPEG
heroillustration
Landing
1200×900
(responsive)
WebP/JPEG
icon-trust-*
(×3)
Landing 48×48 SVG
icon-howitworks-
* (×4)
Landing 56×56 SVG
screenshotwordduel
Landing 720×1440 PNG
badge-tierrookie/pro/elite
Landing, Lobby 64×64 SVG
payment-networklogo
Landing footer,
Deposit/Withdraw
24×24 SVG/PNG
bg-texture-auth Sign up/Login 1920×1080 SVG/PNG
avatar-default01…06
Dashboard,
Queue, Game
96×96 SVG/PNG
illustrationempty-matches
Dashboard 320×240 SVG
icon-statuswon/lost/pending
Dashboard,
History
16×16 SVG
qr-depositaddress
Deposit 240×240
SVG/PNG
(generated)
icon-copy Deposit 20×20 SVG
Asset Used on Dimensions Format
icon-searchingradar
Match queue 120×120
Animated
SVG
graphic-vsmatchup
Match queue 360×160 SVG
tile-letter Game screen 56×56 SVG sprite
ring-roundtimer
Game screen 64×64 SVG
pip-round-win Game screen 12×12 SVG
illustrationwin
Result screen 280×280 SVG/Lottie
illustrationlose
Result screen 200×200 SVG
icon-type-* (×6)
Transaction
history
20×20 SVG
illustration404
404 page 240×240 SVG
10. Open items for product/legal sign-off
Final tier names, entry fees, and rake % (placeholders above:
Rookie/Pro/Elite at 5/20/50 USDT)
Minimum deposit/withdrawal amounts and withdrawal network
fee (placeholders: 10 USDT min, 1 USDT network fee)
Word Duel scoring table and round/timer lengths (placeholder
mechanic specified above)
Terms of Service, Privacy Policy, and Responsible Play page
content (not drafted here — legal copy, out of scope for this
content pass)
Supported deposit/withdrawal network — placeholder set to
USDT (TRC-20) only for MVP, per PRD Section 6
