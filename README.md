# 🚀 BLISS V2 – HOOKUP WEB APP (NEXT.JS + SUPABASE)

## 📌 PROJECT OVERVIEW

BLISS V2 is a **LOCATION-BASED HOOKUP WEB APPLICATION** designed for **REAL-TIME, LOCAL CONNECTIONS**.

Core principles:

* 🔥 INSTANT INTERACTION (no matching system)
* 📍 PROXIMITY-BASED DISCOVERY (≤ 10KM)
* 💬 DIRECT MESSAGING (with future monetization tiers)
* 👀 FREE VISIBILITY (no paywalls on activity)
* 🔒 PRIVACY-FIRST (phone-based filtering & blocking)

---

## 🧠 CORE PRODUCT LOGIC

### DISCOVERY SYSTEM

* Users see **opposite gender only**
* Discovery limited to **10KM radius**
* Outside range:

  * Profiles visible
  * Chat disabled
  * Add to **wishlist**

---

### MESSAGING SYSTEM

* NO MATCHING REQUIRED
* Instant chat allowed (within 10KM)
* Future monetization:

  * FREE → limited chats/week
  * PRO → extended chats/week
  * PRO MAX → unlimited chats/month

---

### DROPS (STORIES)

* Temporary posts (24h)
* Location-based visibility
* Chat locked if outside 10KM

---

### PRIVACY SYSTEM

* Hide users via **phone number hash**
* Block users
* No exact location exposure (distance only)

---

## 🏗️ TECH STACK

### FRONTEND

* Next.js (App Router)
* Tailwind CSS
* ShadCN UI
* PWA (installable web app)

### BACKEND

* Supabase

  * PostgreSQL database
  * Authentication
  * Realtime (chat, presence)

### STORAGE

* Cloudinary (images/videos)

---

## 🧩 ARCHITECTURE EXPLANATION

### 1. ROUTE-BASED LAYER (`app/`)

* Defines UI pages
* Each folder = route
* Uses App Router (layout, page structure)

👉 Example:

* `/radar` → nearby discovery
* `/messages` → chat system

---

### 2. FEATURE LAYER (`features/`)

This is the **brain of the app**

Each feature contains:

* queries
* business logic
* data handling

Example:

```
features/messaging/
  ├── sendMessage.ts
  ├── getChats.ts
  ├── getMessages.ts
```

👉 This prevents spaghetti code

---

### 3. COMPONENT LAYER

#### Global (`components/`)

* Reusable UI
* Buttons, cards, modals

#### Local (`_components/`)

* Specific to a page/route
* Keeps features isolated

👉 Next.js supports colocation safely ([Next.js][1])

---

### 4. LIB LAYER (`lib/`)

Handles:

* Supabase client
* Cloudinary config
* Geo calculations (distance, radius)

---

### 5. SERVICES LAYER

Handles:

* API communication
* External integrations

---

### 6. DATA FLOW

```
UI (app/)
   ↓
Feature Logic (features/)
   ↓
Services / Lib
   ↓
Supabase / Cloudinary
```

---

## 📍 KEY SYSTEMS

### LOCATION SYSTEM

* GPS-based tracking
* Distance calculation (10KM rule)
* Real-time updates

---

### DISCOVERY SYSTEM

* Grid-based feed
* Ranked by:

  * distance
  * activity
  * profile quality

---

### CHAT SYSTEM

* Chat threads + messages
* No matching required
* Proximity gated

---

### MONETIZATION SYSTEM (FUTURE)

* Subscription-based
* Chat limits per plan
* Boost features

---

## 🔐 SECURITY & PRIVACY

* Profile verification
* Phone hashing for contact filtering
* No exact location exposed
* Blocking + reporting system

---

### PAGES DESCRIPTION
👉 Pages description can be found in `PAGES_DESCRIPTION.md`


---

## ⚠️ DEVELOPMENT RULES

* DO NOT mix UI and business logic
* ALWAYS use feature-based structure
* KEEP components small and reusable
* AVOID direct DB calls inside UI
* LOCATION must always be validated before chat

---

## 🚀 MVP PRIORITIES

1. AUTH (phone-based)
2. PROFILE CREATION
3. LOCATION TRACKING
4. RADAR (DISCOVERY)
5. MESSAGING
6. DROPS

---

## 🧠 FINAL NOTE

This is NOT a “dating app clone”.

This is:

> A REAL-TIME, LOCATION-FIRST CONNECTION SYSTEM

If discovery feels dead → app fails
If location is fake → app fails
If chat is spammy → app fails

---
