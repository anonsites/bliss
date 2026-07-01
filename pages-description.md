# 📍 BLISS V2 – PAGES, TABS & UI SPECIFICATION

This section defines **EXACT UI STRUCTURE, INTERACTIONS, AND BEHAVIOR**.

⚠️ RULE:

* DO NOT improvise layouts
* DO NOT add unnecessary UI
* FOLLOW interaction flow strictly

---

# 🏠 0. HOME PAGE (TRAFFIC → AUTH FUNNEL)

## PURPOSE

* Convert visitors into users
* Simulate app experience

## LAYOUT

* Desktop view: 
The left side has the title "Bliss" and sign in/up buttons
The right side has a preview of the app.
When the user sign up or sign in, the left side shows a qr code to connect the app with the user's phone, and the right side shows real content of the app.
Auth flow:
The sign in/up steps takes place on the right side.

* Mobile view:
The title "Bliss" is centered at the top, and the sign in/up buttons are below it on a smooth expanding card on scroll.
The preview of the app is below the buttons.
When the user sign up or sign in, the title and buttons are hidden, and they are shown real content.
Auth flow:
The sign in/up steps takes place normally on the mobile view.

## CONTENT

* Normal feed:

  * Profiles
  * Drops
  * Messages (ask to sign in)
  * Profile (ask to sign in)

* Each item:

  * Fullscreen media
  * Username
  * Distance
  * Activity status

## RIGHT OVERLAY (ICONS)

* '+' Sign/Like → wishlist
* 💬 Message → triggers AUTH modal


## AUTH MODAL

* Trigger: Message, Like, drop ring, profile avatar button
* Content:

  * Phone input
  * NO OTP verification
* Background must remain visible (blur only)

---

# 🔔 GLOBAL NAVIGATION

## MOBILE (BOTTOM NAV)

* Radar
* Drops
* Messages
* Profile

---

# 📍 1. RADAR (CORE DISCOVERY)

## (ICON BUTTONS)

1. Grid / Full Toggle

   * Grid → multiple profiles
   * Full → 1 profile per screen (vertical scroll)

2. Nearby / Explore Toggle

   * Nearby → ≤10KM
   * Explore → search by city (NO CHAT)

---

## CONTENT

### GRID MODE

* 2-column layout
* Profile cards:

  * Avatar
  * Username
  * Distance
  * Activity dot

### FULL MODE

* Fullscreen vertical scroll
* One profile per view

---

## PROFILE CARD / VIEW

Display:

* Profile images (carousel)
* Username
* Age
* Distance (e.g. "3km away")
* Activity:

  * Online / last seen
* Verification badge
* Drop indicator (green ring)

---

## RIGHT-SIDE OVERLAY (ICONS)

1. ⋮ OPTIONS

   * Hide profile
   * Report profile
   * Block profile

2. ❤️ LIKE

   * Adds to wishlist

3. 💬 MESSAGE

   * If ≤10KM → open chat
   * If >10KM → disabled OR show “Out of range”

---

# 📍 2. DROPS (STORY SYSTEM)

## TOP BAR FILTERS (ICONS)

* Filters:

  * Seen
  * New
  * All

---

## CONTENT

### STYLE

* WhatsApp/Instagram stories style

### LIST VIEW

* Avatar list (with ring)
* Username
* Timestamp

---

## DROP VIEW (FULLSCREEN)

* Media (image/video)
* Username
* Time (e.g. “2h ago”)
* Distance
* Progress bar (top)

---

## INTERACTIONS

* Tap right → next drop
* Tap left → previous
* Swipe down → close

---

## RIGHT OVERLAY (ICONS)

Same as RADAR:

* ⋮ Options
* ❤️ Wishlist
* 💬 Message (range-restricted)

---

# 📍 3. MESSAGES

## CHAT LIST PAGE

Display:

* User avatar
* Username
* Last message
* Timestamp
* Unread count

---

## CHAT CONVERSATION

### HEADER

* Avatar
* Username
* Online status

---

### MESSAGE AREA

* Scrollable
* Chat bubbles:

  * Sent → accent color
  * Received → dark bubble

---

### INPUT BAR

* Text input
* Send button
* Media upload (optional)

---

## SYSTEM RULES

* Chat only allowed within 10KM
* Chat persists once opened (your logic choice)

---

# 📍 4. PROFILE

## VIEW MODE

Display:

* Avatar
* Username
* Bio
* Age
* Location
* Verification badge

Sections:

* Media gallery
* Drops preview

---

## ACTIONS

* Edit profile
* Logout
* Delete account

---

## EDIT MODE

Editable:

* Username
* Bio
* Images
* Gender (locked or optional change)
* Birthdate

---

# 📍 5. WISHLIST

## PURPOSE

* Store users outside range

## CONTENT

* List of saved users

Display:

* Avatar
* Username
* Distance

---

## ACTIONS

* Remove from wishlist
* Open profile
* Auto-unlock chat if within range

---

# 📍 6. EXPLORE

## PURPOSE

* Discover outside 10KM

## FEATURES

* Search by city
* Show users globally

---

## LIMITATIONS

* NO CHAT allowed
* Only wishlist action

---

# 📍 7. NOTIFICATIONS

## CONTENT TYPES

* Profile viewed
* Wishlist added
* New message
* Drop posted nearby

---

## UI

* Simple list
* Timestamp
* Mark as read (automatically when opened)

---

# 📍 8. SETTINGS

## SECTIONS

### ACCOUNT

* Phone number
* Verification status

### PRIVACY

* Hide by phone contacts
* Blocked users

### PREFERENCES

* Notifications toggle
* Location permissions

---

# 📍 GLOBAL MODALS

## AUTH MODAL

* Phone/Email 
* Continue with google(future)


## OPTIONS MODAL

* Hide
* Report
* Block

---

# 📐 UI RULES (STRICT)

* MOBILE-FIRST design
* 3 column layout on desktop
* USE ICONS over text
* KEEP BUTTONS MINIMAL
* AVOID CLUTTER

---

# 🎯 UX PRINCIPLES

* FAST interactions (no delays)
* ALWAYS SHOW CONTENT (no empty states)
* PRIORITIZE ACTIVE USERS
* KEEP SCROLLING INFINITE

---

# ⚠️ FINAL NOTE

This UI is designed to:

* MAXIMIZE SCROLL TIME
* MINIMIZE FRICTION
* FORCE NATURAL CONVERSION

DO NOT:

* Add unnecessary steps
* Add complex navigation
* Break the vertical flow

---

# 🚀 IMPLEMENTATION PRIORITY

1. HOME (feed + auth trigger)
2. RADAR
3. MESSAGES
4. PROFILE
5. DROPS
6. WISHLIST / EXPLORE / NOTIFICATIONS

---
