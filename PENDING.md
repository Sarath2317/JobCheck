# Pending validation and issue drafts

These are local drafts, not issues already created on GitHub.

## 1. Validate desktop Chrome and Edge installation

- Load the unpacked extension in each browser and record versions.
- Check toolbar launch, selected-text menu, Unicode handoff and long selections.
- Verify reset, copy, opt-in saving, deletion and disabled-storage behavior.
- Check responsive layout and keyboard navigation; add genuine screenshots.
- Report test failures before calling the prototype production-ready.

## 2. Evaluate detection with labeled examples

- Use synthetic or appropriately anonymized genuine and scam messages.
- Include negations, mixed benign/malicious clauses, multilingual input, indirect payment requests, and vague long text.
- Measure false positives and false negatives; do not claim an accuracy percentage without evidence.
- Improve evidence sufficiency beyond the current text-length heuristic.

## 3. Improve domain analysis

- Test internationalized domains, redirects and shared recruiting platforms.
- Keep structural suspicion separate from independently verified reputation.
- Consider a maintained Public Suffix List if registrable-domain comparison is added.

## 4. Optional live reputation service

- Select a service and assess cost, privacy, quotas and reliability.
- Disclose data transmission and obtain consent before sending URLs or other data.
- Keep service secrets server-side; show unavailable results honestly.

## 5. Repository and store release

- Choose a license with the project owner.
- After desktop validation, prepare store icons, screenshots, privacy disclosures and listing.
- Publish through the owner's developer account when authorized.
