# Merge Sort: Divide and Conquer Visualizer

🔗 **Live Demo:** [https://itzayush18.github.io/merge-sort-visualizer/](https://itzayush18.github.io/merge-sort-visualizer/)

| | |
|---|---|
| **Name** | Ayush Kumar Sharma |
| **Reg. No.** | RA2411003011922 |
| **Section** | J2 |
| **Faculty** | Dr. Kishore Anthuvan Sahayaraj K |

---

## About

A web-based visualizer that animates the **Merge Sort** algorithm step by step, built with plain HTML, CSS, and JavaScript — no external libraries. Open `index.html` in any browser to run it locally, or visit the live demo above.

---

## File Structure

| File | Role |
|---|---|
| `index.html` | Page layout, UI panels (bar chart, tree, pseudocode, log, stats, modals) |
| `styles.css` | All visual styles, dark/light theme via CSS custom properties, keyframe animations |
| `script.js` | Algorithm, step pre-computation, rendering engine, audio, confetti, event wiring |

---

## Merge Sort: Algorithm Deep Dive

### The Core Idea

Merge Sort is a **divide and conquer** algorithm. It breaks the problem into smaller subproblems, solves each recursively, and combines the results. The key insight is that **merging two already-sorted arrays is an O(n) operation**, so if we sort both halves first, the final combination is cheap.

---

### Step 1: Divide

The array is split at the midpoint repeatedly until every subarray has exactly one element. A single-element array is trivially sorted — this is the **base case** that stops the recursion.

```
Original:  [38, 27, 43, 3, 9, 82, 10]
           /                          \
     [38, 27, 43, 3]           [9, 82, 10]
      /          \               /       \
  [38, 27]    [43, 3]        [9, 82]    [10]
   /    \      /    \         /    \
 [38]  [27]  [43]  [3]     [9]  [82]
```

The split always uses `mid = floor((lo + hi) / 2)`, giving:
- Left half: indices `lo` to `mid` (inclusive)
- Right half: indices `mid + 1` to `hi` (inclusive)

This guarantees the recursion terminates and produces `n` total leaves.

---

### Step 2: Conquer (Base Case)

When `lo >= hi`, the subarray has at most one element. It is already sorted by definition, so no work is done — the function simply returns. This base case is what makes the recursion finite.

---

### Step 3: Merge (Combine)

This is the heart of the algorithm. Given two sorted subarrays, they are merged into one sorted result using the **two-pointer technique**:

```
Left:  [27, 38]     (sorted)
Right: [3, 43]      (sorted)

i=0, j=0  →  compare 27 vs 3   →  pick 3    →  result: [3]
i=0, j=1  →  compare 27 vs 43  →  pick 27   →  result: [3, 27]
i=1, j=1  →  compare 38 vs 43  →  pick 38   →  result: [3, 27, 38]
j=1 left  →  drain right        →  pick 43   →  result: [3, 27, 38, 43]
```

```
left  = arr[lo .. mid]       // copy left half
right = arr[mid+1 .. hi]     // copy right half
i = 0, j = 0, k = lo

while i < left.length AND j < right.length:
    if left[i] <= right[j]:
        arr[k++] = left[i++]    // take from left
    else:
        arr[k++] = right[j++]   // take from right

// one of these loops will be empty, the other drains remaining
while i < left.length:  arr[k++] = left[i++]
while j < right.length: arr[k++] = right[j++]
```

The drain loops at the end handle the case where one pointer exhausts its half before the other. Since the remaining elements are already in sorted order, they are appended directly — no comparisons needed.

---

### Why the Recursion is Correct: The Invariant

At every call to `merge(arr, lo, mid, hi)`:
- `arr[lo..mid]` is sorted (guaranteed by the recursive call on the left half)
- `arr[mid+1..hi]` is sorted (guaranteed by the recursive call on the right half)
- After the merge, `arr[lo..hi]` is sorted

This invariant holds at every level. By the time the outermost call returns, `arr[0..n-1]` is fully sorted.

---

### Worked Example

Input: `[9, 3, 7, 1]`

```
Divide phase:
[9, 3, 7, 1]  →  [9, 3] | [7, 1]
[9, 3]        →  [9]    | [3]
[7, 1]        →  [7]    | [1]

Merge phase (bottom up):
merge [9] + [3]  =  [3, 9]       (1 comparison: 9 > 3)
merge [7] + [1]  =  [1, 7]       (1 comparison: 7 > 1)
merge [3,9] + [1,7]:
    compare 3 vs 1  →  pick 1    [1]
    compare 3 vs 7  →  pick 3    [1, 3]
    compare 9 vs 7  →  pick 7    [1, 3, 7]
    drain [9]       →  pick 9    [1, 3, 7, 9]

Result: [1, 3, 7, 9]   (4 comparisons total)
```

---

### Recursion Tree Structure

The recursion forms a complete binary tree of height `floor(log2(n)) + 1` for power-of-two inputs. Each **level** of the tree does exactly O(n) work (each element is touched once across all merges at that level). With `log n` levels total, this gives the O(n log n) time complexity.

```
Level 0 (1 merge of n elements):     O(n)
Level 1 (2 merges of n/2 elements):  O(n)
Level 2 (4 merges of n/4 elements):  O(n)
...
Level log n (n merges of 1 element): O(n)

Total: log(n) levels × O(n) per level = O(n log n)
```

---

### Stability

Merge Sort is a **stable sort**. In the merge step, when `left[i] == right[j]`, the algorithm always picks from the left half first (`left[i] <= right[j]`). This preserves the original relative order of equal elements from the input, which is the definition of stability.

---

### Space Usage

Merge Sort requires O(n) auxiliary space. At each merge call, temporary arrays are allocated for the left and right halves. Although many merge calls exist, they are not all live simultaneously — the recursion stack holds at most O(log n) frames at any one time. The total extra memory in use at any single point is bounded by O(n).

---

## Website Implementation (Brief)

The visualizer uses a **pre-compute then replay** approach. Before animation starts, the entire Merge Sort execution is recorded into a flat array of step snapshots — each capturing the array state, operation type (divide / compare / merge), and which pseudocode line is active. The animation engine just walks through this array one step at a time, so playback speed can be changed freely without re-running the algorithm.

| Panel | What it shows |
|---|---|
| Bar chart | Array values as bars; red = dividing, yellow = comparing, green = merged |
| Recursion tree | Live tree built level by level as the algorithm progresses |
| Pseudocode | Active line highlighted in sync with each step |
| Step log | Plain-English description of every operation |
| Stats | Live comparison count vs. theoretical O(n log n) estimate |

Built with plain HTML, CSS, and JavaScript. No libraries.

### 8. Confetti

The completion animation uses the **Canvas API**. 160 rectangular particles are spawned above the viewport with random horizontal velocity, rotation speed, and color. A `requestAnimationFrame` loop updates position and decreases `life` by 0.005 per frame (~200 frames total). When all particles reach `life <= 0` the canvas clears itself.

---

## Complexity Analysis

```
Recurrence relation:  T(n) = 2·T(n/2) + O(n)
```

Solved using the **Master Theorem** with a = 2, b = 2, f(n) = n:

- log_b(a) = log_2(2) = 1
- f(n) = O(n^1), so Case 2 applies: T(n) = O(n log n)

| Case | Time Complexity | Space Complexity |
|---|---|---|
| Best | O(n log n) | O(n) |
| Average | O(n log n) | O(n) |
| Worst | O(n log n) | O(n) |

Unlike Quick Sort, Merge Sort's time complexity does not degrade on already-sorted or reverse-sorted input. The O(n) auxiliary space comes from the temporary `left` and `right` arrays allocated during each merge call. Across all levels of recursion, at most O(n) extra space is live at any one time.

The stats panel counts actual comparisons made during merging and compares them against the theoretical `n * floor(log2(n))` estimate in real time.
