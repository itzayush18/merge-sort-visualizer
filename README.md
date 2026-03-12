# Merge Sort — Divide & Conquer Visualizer

| | |
|---|---|
| **Name** | Ayush Kumar Sharma |
| **Reg. No.** | RA2411003011922 |
| **Section** | J2 |
| **Faculty** | Dr. Kishore Anthuvan Sahayaraj K |

---

## About

A web-based visualizer that animates the **Merge Sort** algorithm step by step, built with HTML, CSS, and JavaScript (no libraries). Open `index.html` in any browser to run it.

## File Structure

- `index.html` — Page layout and structure
- `styles.css` — Styling, themes, and animations
- `script.js` — Algorithm logic, rendering, and user interaction

## Implementation Logic

The app **pre-computes** the entire Merge Sort execution into an array of step objects before any animation begins. Each step records the array state, the operation type (divide / compare / merge), and metadata for the recursion tree. The animation engine then replays these steps one by one.

### Algorithm — Divide and Conquer

1. **Divide** — Recursively split the array into two halves until each sub-array has one element.
2. **Conquer** — Single-element sub-arrays are already sorted (base case).
3. **Combine** — Merge two sorted halves by comparing elements one by one, producing a sorted sub-array. Repeat upward until the full array is sorted.

### Visualization

- **Bar chart** reflects the array state at each step — red (dividing), yellow (comparing), green (merged).
- **Recursion tree** builds progressively, showing divide levels going down and combine levels going up.
- **Pseudocode panel** highlights the active line of the algorithm at each step.
- **Step log** records every operation in text form.

### Time Complexity

```
Recurrence:  T(n) = 2·T(n/2) + O(n)
Solution:    O(n log n)  — via Master Theorem (a=2, b=2, Case 2)
```

| Case | Time | Space |
|---|---|---|
| Best / Average / Worst | O(n log n) | O(n) |

Merge Sort is always O(n log n) regardless of input order. The O(n) space is for temporary arrays used during merging.
