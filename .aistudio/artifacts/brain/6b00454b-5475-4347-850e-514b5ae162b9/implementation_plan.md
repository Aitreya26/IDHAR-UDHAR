# Safe Meetup Spots & Custom Location Entry

Update campus safe meetup locations to 7 verified university zones and provide a fluid custom location input option across both the Secure Meetup scheduling modal and Chat quick suggestions.

## User Review & Critical Decisions

> [!IMPORTANT]
> The following architectural and user experience decisions were confirmed during Phase 1:
> - **Scope of Availability**: Custom meetup locations will be accessible in both the **Secure Meetup modal** (`SecureExchangeModal`) and **Chat quick suggestion chips** (`ChatView`).
> - **Input Experience**: Custom location input will be rendered as an **inline text input field** immediately upon choosing the "Other / Custom Location" radio option, maintaining keyboard focus and seamless form submission.
> - **Preset College Coverage**: The 7 new spots will serve as the verified campus presets across colleges and default fallbacks in `src/data/colleges.ts`.

---

## 1. Overview & Core Concept

Campus peer-to-peer commerce requires trusted, well-lit, public meeting zones to eliminate student safety concerns and prevent off-campus disputes. This update replaces outdated generic spots with 7 high-traffic UIET/campus landmarks:
1. **University Market**
2. **Central Library**
3. **UIET Main Building**
4. **Mechanical Block**
5. **Sports Complex Gate**
6. **Boys Hostel Complex Gate**
7. **Girls Hostel Complex Gate**

In addition, students frequently need to negotiate specific handover points (e.g. "Department Seminar Hall", "Hostel 7 Warden Office", "Canteen Roundabout"). A dedicated "Other / Custom Location" option allows entering custom text without friction.

---

## 2. User Experience & Visual Design

### A. Secure Meetup Scheduling Modal (`SecureExchangeModal.tsx`)
- **Radio List of 7 Verified Locations**: Clean selection list styled with active state accents (`border-indigo-600 bg-indigo-50/60 dark:bg-cyan-950/40 dark:border-cyan-400`).
- **Inline Custom Option**: An 8th option labeled **"Other / Custom Location"**:
  - Selecting this radio smoothly reveals an inline text input directly underneath:
    - Placeholder: `e.g. Near UIET Canteen, Department Lawn, Block B Lab 3...`
    - Auto-focuses when selected.
    - Real-time character limit (max 60 chars) and trim validation.
  - If "Other" is selected but the input is blank, the "Confirm & Schedule Meetup" button requires input or gently prompts the student.

### B. Live Chat Interaction (`ChatView.tsx`)
- **Safety Banner Text Update**: Update banner copy to mention verified spots:
  - *"Coordinate handovers at verified campus spots like University Market, Central Library, or Hostel Gates."*
- **Meetup Quick Chips**: Add quick meetup suggestion chips:
  - `"Meet at University Market?"`
  - `"Meet at Central Library?"`
  - `"Meet at UIET Main Building?"`
  - `"Suggest another meetup spot..."` (clicking prompts or opens custom spot composer into input bar)

### C. College Data Model (`src/data/colleges.ts`)
- Replace legacy spots in `COLLEGES` with the exact 7 spots.

---

## 3. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────┐
│                   COLLEGES dataset                     │
│                (src/data/colleges.ts)                  │
│       safeMeetupSpots: [ 7 verified locations ]        │
└──────────────────────────┬─────────────────────────────┘
                           │
             ┌─────────────┴─────────────┐
             ▼                           ▼
┌─────────────────────────┐ ┌─────────────────────────┐
│   SecureExchangeModal   │ │        ChatView         │
│  - 7 preset radio spots │ │  - Quick suggestion     │
│  - "Other / Custom" opt │ │    chips for top spots  │
│  - Inline text input    │ │  - Custom spot insertion│
│  - Validates & saves to │ │  - Updated banner copy  │
│    ExchangeSession      │ │                         │
└─────────────────────────┘ └─────────────────────────┘
```

### Component State Mapping:
- `selectedSpotType`: `'preset' | 'custom'`
- `selectedPresetSpot`: string (defaults to `'University Market'`)
- `customSpotText`: string
- Resulting `session.campusLocation`: `selectedSpotType === 'custom' ? customSpotText.trim() : selectedPresetSpot`

---

## 4. Step-by-Step Implementation Sequence

1. **Update `src/data/colleges.ts`**: Update `safeMeetupSpots` across `COLLEGES` to the 7 designated spots.
2. **Refactor `src/components/SecureExchangeModal.tsx`**:
   - Implement state for custom location toggle and text input.
   - Render the 7 preset options + "Other / Custom Location" radio with inline text input.
   - Ensure `session.campusLocation` captures the custom string properly.
3. **Enhance `src/components/ChatView.tsx`**:
   - Update safety tips banner to reflect new safe meetup spots.
   - Update quick chips with meetup location proposals.
4. **Compile & Lint Verification**:
   - Run `compile_applet` and `lint_applet` to guarantee error-free TypeScript compilation.
