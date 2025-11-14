# KuboHub — Project Documentation

Version: 1.0  
Generated: 2025-11-14

---

## Table of Contents

1. [Project Overview](#project-overview)  
2. [System Architecture](#system-architecture)  
3. [Installation Guide (Developer Manual)](#installation-guide-developer-manual)  
4. [User Manual](#user-manual)  
5. [Database Structure](#database-structure)  
6. [System Requirements](#system-requirements)  
7. [Testing & Validation](#testing--validation)  
8. [Conclusion / Summary](#conclusion--summary)  
9. [References to Code & Important Symbols](#references-to-code--important-symbols)

---

## Project Overview

### System name
KuboHub — a web platform for hosts and guests to list, discover, book, and manage stays, experiences, and services.

### Problem statement
Many small hospitality providers lack a simple, integrated platform to publish listings, manage reservations, and receive payments while guests need an easy-to-use, trustable marketplace with messaging, reviews, and booking flow. KuboHub addresses these gaps in a lightweight full-stack web app.

### Purpose, goals, and benefits
- Purpose: Provide a unified platform for hosts to publish and manage offerings and for guests to discover and book services.
- Goals:
  - Simplify listing creation, management, and monetization for hosts.
  - Provide intuitive booking, favorites, and messaging features for guests.
  - Provide admin tools for rewards, policies, and cashout management.
- Benefits:
  - Faster onboarding for hosts.
  - Centralized communication (chat and notifications).
  - Automated billing and reward tooling.

### Target users
- Hosts (role: `host`) — create and manage listings, view earnings, request cashouts.
- Guests (role: `guest`) — browse, favorite, book, message hosts.
- Admins (role: `admin`) — manage rewards, policies, cashouts, wishlists, site-wide settings.
- Developers / Maintainers — extend, maintain and deploy the app.

---

## System Features & Functionalities

### Detailed feature list (high level)
- User authentication and roles (guest, host, admin)
- Listings (Homes, Experiences, Services) — create, edit, publish, draft
- Search and filters on Homepage
- Listing details pages with booking/payment
- Favorites / Wishlist
- Messaging / Chat (guest ↔ host)
- Notifications system for hosts
- Host dashboard: listings, reservations, earnings, points & rewards
- Admin panels: rewards, service fees & policy, payment cashouts, wishlists
- Cloud functions for scheduled billing jobs (Firebase Functions)
- Payment integration with PayPal
- Points & tier management for hosts and rewards claiming

### Description of how each feature works

- Authentication & Roles
  - Implemented using Firebase Authentication.
  - See configuration and exports in [`src/firebaseConfig.js`](src/firebaseConfig.js).
  - Protected routes handled by [`ProtectedRoute`](src/components/pages/ProtectedRoute.js) which reads role from Firestore.

- Listings
  - Hosts create listings through host UI components such as [`HostNav`](src/components/pages/hostpage-comp/HostNav.js) and manage via [`Listings`](src/components/pages/hostpage-comp/Listings.js).
  - Listings documents are stored in Firestore collection `listings` with fields like `title`, `images`, `price`, `hostId`, `latitude`, `longitude`.

- Search & Homepage
  - Search component invoked from [`Homepage`](src/components/pages/Homepage.js); clicking a listing triggers `handleListingClick` (see file) which requires authentication.

- Listing Details & Booking
  - Pages: [`ListingDetails`](src/components/pages/ListingDetails.js), [`ExperiencesDetails`](src/components/pages/ExperiencesDetails.js), [`ServicesDetails`](src/components/pages/ServicesDetails.js).
  - Booking flow uses PayPal Buttons embedded via `@paypal/react-paypal-js`. On success, a reservation document is created in Firestore (see `createOrder` / `onApprove` callbacks in each details page).
  - Example: booking code is in [`src/components/pages/ListingDetails.js`](src/components/pages/ListingDetails.js), including PayPal hooks.

- Favorites & Wishlist
  - Favorites logic uses helpers in `src/utils/favorites` (imported and used in detail pages).
  - Wishlist pages: [`WishlistPage`](src/components/pages/WishlistPage.js) and admin view [`WishlistsView`](src/components/pages/admin-comp/WishlistsView.js). Wish items stored in `wishlist` collection.

- Messaging & Chat
  - Chat collections: `chats/{chatId}/messages`. Implemented in [`ServicesDetails`](src/components/pages/ServicesDetails.js), [`ExperiencesDetails`](src/components/pages/ExperiencesDetails.js), [`GuestMessages`](src/components/pages/GuestMessages.js), and host-side [`HostMessages`](src/components/pages/hostpage-comp/Messages.js).
  - Message sending uses Firestore `addDoc` to nested `messages` collection and initial "system" messages.

- Notifications
  - Utility: [`addNotification`](src/utils/notificationSystem.js) writes to `notifications` collection.
  - Host notifications are listened to in [`Notifications`](src/components/pages/hostpage-comp/Notifications.js).

- Points & Rewards
  - Points managed in `hostPoints` collection via utilities such as [`updateHostPoints`](src/utils/pointSystem.js).
  - Reward management functions in [`src/utils/rewardsSystem.js`](src/utils/rewardsSystem.js). Admin UI: [`RewardsAdminPanel`](src/components/pages/admin-comp/RewardsAdminPanel.js). Host claims via `claimReward` helper.

- Cashouts & Earnings
  - Host cashouts use [`cashoutSystem`](src/utils/cashoutSystem.js). Admin approves/declines in [`PaymentCashoutsPanel`](src/components/pages/admin-comp/PaymentCashoutsPanel.js).

- Admin Panels
  - Admin main wrapper in [`AdminPage`](src/components/pages/AdminPage.js).
  - Panels: [`RewardsAdminPanel`](src/components/pages/admin-comp/RewardsAdminPanel.js), [`ServiceFeeAndPolicyPanel`](src/components/pages/admin-comp/ServiceFeeAndPolicyPanel.js), [`PaymentCashoutsPanel`](src/components/pages/admin-comp/PaymentCashoutsPanel.js), [`WishlistsView`](src/components/pages/admin-comp/WishlistsView.js).

- Scheduled Billing
  - Cloud Functions for scheduled operations live in [`functions/index.js`](functions/index.js). Example scheduled job: `markUnpaidHosts` found in [`src/utils/billing.js`](src/utils/billing.js) (a function used to create scheduled marking).

### Screenshots placeholders
- Homepage: ![screenshot](screenshots/homepage.png)
- Listing Details: ![screenshot](screenshots/listing_details.png)
- Host Dashboard: ![screenshot](screenshots/host_dashboard.png)
- Admin Rewards Panel: ![screenshot](screenshots/admin_rewards.png)
- Wishlist Page: ![screenshot](screenshots/wishlist.png)

---

## System Architecture

### Tech stack
- Frontend: React (Create React App) — main entry [`src/App.js`](src/App.js)
- UI: Tailwind CSS, lucide-react icons, react-icons
- Routing: react-router (see [`src/App.js`](src/App.js))
- Backend: Firebase (Authentication, Firestore, Cloud Functions)
  - Firestore for data
  - Firebase Auth for user accounts
  - Firebase Functions (Node) for scheduled tasks (see `functions/index.js`)
- Payments: PayPal SDK (included in `public/index.html`)
- Third-party: Cloudinary (image hosting), axios for external HTTP
- Utilities: date-fns, react-date-range, react-leaflet for maps

### System flow (high level)
1. User opens SPA served by React (`public/index.html`).
2. Authentication via Firebase Auth. Protected routes implemented in [`ProtectedRoute`](src/components/pages/ProtectedRoute.js).
3. Guest/Host/Admin roles read from Firestore users documents to gate UI flows.
4. Hosts create listings → documents written to `listings` collection.
5. Guests browse and book → reservations written to `reservations` collection (created in listing details `onApprove` callbacks).
6. Messaging uses chat documents in `chats` collection with nested `messages`.
7. Notifications are produced by utilities and listened to by host dashboard components.
8. Admins manage system-wide settings `servicepolicy` and `rewards` collections.

### Data flow diagram / workflow explanation
- Users (Auth) → `users` collection (profile and role)
- Listings → `listings` collection (hostId, details, geolocation, images)
- Bookings → `reservations` collection (link to listingId, guestId, hostId, status)
- Chats → `chats/{chatId}` with nested `messages`
- Notifications → `notifications` collection (hostId field filters)
- Host points → `hostPoints` (points, tier)
- Rewards → `rewards` collection (admin-managed)
- Cashouts → `cashouts` collection (host cashout requests)
- Policies & Config → `servicepolicy` document(s)

(Firestore relationships are document references keyed by IDs; many-to-one relationships are modeled via stored `hostId`/`listingId` fields.)

### Firebase integration (key files)
- Firebase initialization and exports: [`src/firebaseConfig.js`](src/firebaseConfig.js)
- Cloud Functions: [`functions/index.js`](functions/index.js) (email sending, scheduled tasks)
- Example utilities:
  - Notifications: [`src/utils/notificationSystem.js`](src/utils/notificationSystem.js) — function [`addNotification`](src/utils/notificationSystem.js)
  - Points: [`src/utils/pointSystem.js`](src/utils/pointSystem.js) — function [`updateHostPoints`](src/utils/pointSystem.js)
  - Rewards: [`src/utils/rewardsSystem.js`](src/utils/rewardsSystem.js) — functions like [`claimReward`](src/utils/rewardsSystem.js), [`generateRewardCode`](src/utils/rewardsSystem.js)
  - Cashouts: [`src/utils/cashoutSystem.js`](src/utils/cashoutSystem.js) — function [`cashoutRequest`](src/utils/cashoutSystem.js)

---

## Installation Guide (Developer Manual)

### Requirements (developer)
- Node.js LTS (recommended v18+)
- npm (or yarn)
- Firebase project and credentials
- PayPal client id (configured in `public/index.html`)
- Cloudinary account for image uploads (used in host components)
- Optional: Firebase CLI for deploying functions

### How to clone
1. Clone repository:
```bash
git clone <repository-url>
cd invitation
```

### How to install dependencies
```bash
npm install
# or
yarn install
```

Key dependency files:
- Frontend dependencies: listed in [package.json](package.json).
- Cloud functions: `functions/package.json` (install in `functions` folder if necessary).

### How to run the project (development)
1. Start local dev server:
```bash
npm start
```
This uses Create React App; open http://localhost:3000.

2. If developing cloud functions:
```bash
cd functions
npm install
firebase emulators:start --only functions,firestore,auth
```
(Adjust as needed.)

Key entries:
- App routes and pages configured in [`src/App.js`](src/App.js)
- PayPal SDK is included in [`public/index.html`](public/index.html) (ensure client-id is set).

### How to deploy (if needed)
- Frontend: build and deploy to hosting provider (e.g., Firebase Hosting)
```bash
npm run build
# then deploy via Firebase CLI or host your build folder
```
- Cloud Functions:
```bash
cd functions
firebase deploy --only functions
```
- Make sure Firestore rules and Firebase project settings are correct.

---

## User Manual

### How to log in / sign up
- Sign up via [`src/components/pages/SignUp.js`](src/components/pages/SignUp.js) — signs up with Firebase Auth and creates a `users` document.
- Host sign up uses [`src/components/pages/HostSignUp.js`](src/components/pages/HostSignUp.js) for host-specific onboarding and optional payment flow.
- Login via [`src/components/pages/Login.js`](src/components/pages/Login.js) — checks `emailVerified` and redirects by role to `/`, `/hostpage`, or `/adminpage`.

### How to navigate the interface
- Main router in [`src/App.js`](src/App.js) maps route paths to pages (Homepage, HostPage, ListingDetails, etc).
- Header and navigation: [`src/components/pages/homepage-comp/Navbar.js`](src/components/pages/homepage-comp/Navbar.js).
- Footer: [`src/components/pages/homepage-comp/Footer.js`](src/components/pages/homepage-comp/Footer.js).

### How to use each major feature (concise)
- Create listing (Host):
  - Use Host interface (HostNav / Listings). Upload images (Cloudinary), fill details, save draft or publish.
  - Publishing triggers `updateHostPoints` utility to reward points.
- Book a listing (Guest):
  - On listing page, pick dates and pay with PayPal. Payment confirmation adds `reservations` document.
- Messaging:
  - From a listing page use chat / message buttons. Chats create or update a `chats` document and nested `messages`.
- Favorites / Wishlist:
  - Click favorite button; uses `isFavorite` / `toggleFavorite` utils stored in Firestore. Wishlist submission via [`WishlistPage`](src/components/pages/WishlistPage.js).
- Host Dashboard:
  - View bookings, earnings, recent reservations and notifications in [`hostpage-comp/Dashboard.js`](src/components/pages/hostpage-comp/Dashboard.js).
- Admin tasks:
  - Use AdminPage panels to manage rewards, cashouts, and policies (see `RewardsAdminPanel`, `PaymentCashoutsPanel`, `ServiceFeeAndPolicyPanel`).

### How to manage account settings
- Guest profile and settings: [`GuestProfile`](src/components/pages/GuestProfile.js) — update profile pic (Cloudinary), email, and logout.
- Host settings: [`hostpage-comp/Settings.js`](src/components/pages/hostpage-comp/Settings.js).
- To logout use Firebase `signOut(auth)` in Navbar or HostNav.

### Common errors and solutions
- "Please verify your email before logging in" — ensure new user verifies email. Verification handled by function in `functions/index.js` or custom email logic in `SignUp.js`.
- PayPal payment fails — check `public/index.html` PayPal client id and network connectivity.
- Firestore permission errors — confirm Firestore rules and that authenticated user has proper role fields in `users` doc.
- Cloudinary upload fails — verify `upload_preset` and Cloudinary account details used in upload helpers (see `HostNav`, `GuestProfile`, `Settings`).

---

## Database Structure

### Firebase collections (summary)
- users
- listings
- reservations
- chats (and subcollection messages)
- notifications
- wishlist
- hostPoints
- rewards
- cashouts
- servicepolicy (single document `main`)
- ratings

### Example documents / fields (examples)
- users/{uid}
  - name, fullName, email, role, profilePic, subscribed, nextbilling, joinedAt
  - See usage: [`src/components/pages/HostPage.js`](src/components/pages/HostPage.js)

- listings/{listingId}
  - id, hostId, title, description, images[], price, priceType, location, latitude, longitude, createdAt, status
  - Manipulated in: [`src/components/pages/hostpage-comp/Listings.js`](src/components/pages/hostpage-comp/Listings.js)

- reservations/{reservationId}
  - listingId, guestId, hostId, checkIn, checkOut, guests, totalAmount, paymentId, status, createdAt
  - Created in: [`src/components/pages/ListingDetails.js`](src/components/pages/ListingDetails.js) and [`ServicesDetails.js`](src/components/pages/ServicesDetails.js)

- chats/{chatId}
  - participants[], listingId, lastMessage, createdAt
  - subcollection: `messages` with senderId, text, createdAt, system flag.
  - Accessed in: [`ServicesDetails.js`](src/components/pages/ServicesDetails.js) and [`HostMessages.js`](src/components/pages/hostpage-comp/Messages.js)

- hostPoints/{hostId}
  - hostId, points, tier, lastUpdated
  - Managed by: [`src/utils/pointSystem.js`](src/utils/pointSystem.js) — see [`updateHostPoints`](src/utils/pointSystem.js) and [`getTierFromPoints`](src/utils/pointSystem.js)

- rewards/{rewardId}
  - tier, title, pointsRequired, type, discountPercent, ewalletAmount, codes[], active
  - Admin create in: [`src/utils/rewardsSystem.js`](src/utils/rewardsSystem.js) and [`RewardsAdminPanel.js`](src/components/pages/admin-comp/RewardsAdminPanel.js)

### Data relationships
- One-to-many: hosts → listings (hostId)
- One-to-many: listing → reservations (listingId)
- Many-to-many: chats participants (participant ids stored in chat doc)
- HostPoints reference host by hostId
- Rewards: standalone collection, claim codes tracked in reward documents

---

## System Requirements

### Hardware (minimum)
- Developer:
  - CPU: dual-core 2GHz+
  - RAM: 4 GB+
  - Disk: 1 GB free
- Production (hosting scales depending on expected traffic)

### Software
- Node.js, npm
- Modern browser (see below)
- Firebase project and CLI (for functions and hosting)
- Cloudinary account (optional but recommended for image uploads)

### Browser compatibility
- Tested and optimized for modern browsers:
  - Chrome (latest)
  - Firefox (latest)
  - Edge (latest)
  - Safari (latest on macOS / iOS)
- Progressive enhancement: ensure JS enabled

---

## Testing & Validation

### Test cases (representative)
- Auth & Roles
  - TC-Auth-01: Sign up new guest and verify email flow (expected: `users` doc created, email verification token sent).
  - TC-Auth-02: Sign in with verified account (expected: redirect based on role).

- Listing CRUD (Host)
  - TC-List-01: Create listing with images (expected: `listings` doc created and images uploaded).
  - TC-List-02: Publish listing (expected: status updated to Active and host points incremented).

- Booking & Payment
  - TC-Book-01: Guest books listing and completes PayPal payment (expected: `reservations` doc created with paymentId and status Confirmed).
  - TC-Book-02: Booking fails (expected: no reservation saved or saved with failed payment status).

- Messaging
  - TC-Chat-01: Start chat from listing; send and receive messages (expected: chat doc created and messages in subcollection).

- Rewards & Cashouts (Admin/Host)
  - TC-Reward-01: Admin creates reward for tier; host claims (expected: claim code generated and host points deducted).
  - TC-Cashout-01: Host requests cashout (expected: `cashouts` doc created with status Pending).

### Expected results
- Functional correctness as described in test cases.
- No uncaught JS errors in browser console.
- Correct Firestore document writes and reads.

### Actual results
- Validate by running app locally and checking Firestore, authentication, and functions logs.
- Use console and UI to record actual vs expected.

---

## Conclusion / Summary

### Why this system is effective
- Integrates listing, booking, messaging, rewards, and admin tooling in one SPA.
- Uses Firebase to provide rapid development, real-time updates, and scalable backend.
- PayPal integration enables payments without complex PCI compliance.

### Future improvements
- Add unit & E2E tests (Jest + Cypress)
- Improve analytics and reporting for hosts & admin
- Role-based permissions and improved Firestore security rules
- Webhooks for payment provider to avoid relying only on client-side onApprove
- Improve offline support / PWA features
- Internationalization (i18n) and currency switching

---

## References to Code & Important Symbols

Open these files in the workspace for implementation details:

- App entry and routes: [src/App.js](src/App.js)  
- Firebase init: [src/firebaseConfig.js](src/firebaseConfig.js)  
- Public HTML including PayPal SDK: [public/index.html](public/index.html)  
- Authentication & Protected Route: [`ProtectedRoute`](src/components/pages/ProtectedRoute.js) — [src/components/pages/ProtectedRoute.js](src/components/pages/ProtectedRoute.js)  
- Host pages and components:
  - Host main page: [src/components/pages/HostPage.js](src/components/pages/HostPage.js)  
  - Host navigation / add listing: [src/components/pages/hostpage-comp/HostNav.js](src/components/pages/hostpage-comp/HostNav.js)  
  - Listings editor: [src/components/pages/hostpage-comp/Listings.js](src/components/pages/hostpage-comp/Listings.js)  
  - Dashboard: [src/components/pages/hostpage-comp/Dashboard.js](src/components/pages/hostpage-comp/Dashboard.js)  
  - Messages (host): [src/components/pages/hostpage-comp/Messages.js](src/components/pages/hostpage-comp/Messages.js)  
  - Notifications (host): [src/components/pages/hostpage-comp/Notifications.js](src/components/pages/hostpage-comp/Notifications.js)

- Guest / Public pages:
  - Homepage: [src/components/pages/Homepage.js](src/components/pages/Homepage.js)  
  - Listing details: [src/components/pages/ListingDetails.js](src/components/pages/ListingDetails.js)  
  - Experiences details: [src/components/pages/ExperiencesDetails.js](src/components/pages/ExperiencesDetails.js)  
  - Services details: [src/components/pages/ServicesDetails.js](src/components/pages/ServicesDetails.js)  
  - Wishlist: [src/components/pages/WishlistPage.js](src/components/pages/WishlistPage.js)  
  - Guest profile: [src/components/pages/GuestProfile.js](src/components/pages/GuestProfile.js)  
  - Guest messages: [src/components/pages/GuestMessages.js](src/components/pages/GuestMessages.js)  

- Admin pages:
  - Admin dashboard: [src/components/pages/AdminPage.js](src/components/pages/AdminPage.js)  
  - Rewards Panel: [src/components/pages/admin-comp/RewardsAdminPanel.js](src/components/pages/admin-comp/RewardsAdminPanel.js) — uses [`addReward`](src/utils/rewardsSystem.js)  
  - Service Fee & Policy Panel: [src/components/pages/admin-comp/ServiceFeeAndPolicyPanel.js](src/components/pages/admin-comp/ServiceFeeAndPolicyPanel.js)  
  - Payment Cashouts Panel: [src/components/pages/admin-comp/PaymentCashoutsPanel.js](src/components/pages/admin-comp/PaymentCashoutsPanel.js)  
  - Wishlists View: [src/components/pages/admin-comp/WishlistsView.js](src/components/pages/admin-comp/WishlistsView.js)

- Utilities:
  - Host points: [`updateHostPoints`](src/utils/pointSystem.js) — [src/utils/pointSystem.js](src/utils/pointSystem.js)  
  - Rewards & claim helpers: [`claimReward`](src/utils/rewardsSystem.js), [`generateRewardCode`](src/utils/rewardsSystem.js) — [src/utils/rewardsSystem.js](src/utils/rewardsSystem.js)  
  - Notifications: [`addNotification`](src/utils/notificationSystem.js) — [src/utils/notificationSystem.js](src/utils/notificationSystem.js)  
  - Cashouts: [`cashoutRequest`](src/utils/cashoutSystem.js) — [src/utils/cashoutSystem.js](src/utils/cashoutSystem.js)  
  - Billing scheduled job: [src/utils/billing.js](src/utils/billing.js) and cloud functions in [functions/index.js](functions/index.js)

---

## Notes
- Wherever the document references a code symbol or file, open the file in the workspace path shown above to inspect implementation.
- Replace screenshot placeholders with actual images placed under `screenshots/` before final submission.

---

End of document.