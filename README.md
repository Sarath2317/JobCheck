# JobCheck

Job-offer safety checker for students and job seekers. **Working educational prototype, not a verified fraud detector.**

[Public demo](https://sarath2317.github.io/JobCheck/)

## Features

- Paste job text, sender email, or a listing URL for rule-based warning signals.
- Read explanations, a warning-signal score, and suggested verification steps.
- Short submissions with few signals receive an insufficient-evidence result.
- Save reports on your device only if you opt in; copy reports or clear saved history.
- Chrome/Edge Manifest V3 extension: right-click selected text to open a local check.

## Run the website

The `web/` directory is a standalone HTML/CSS/JavaScript application. Open `web/index.html` in a browser, or serve `web/` with your preferred static development server. There is no build step, account, backend, or API key.

## Load the extension

1. Open `chrome://extensions` in desktop Chrome or `edge://extensions` in Edge.
2. Enable Developer mode, choose **Load unpacked**, and select `extension/`.
3. Select a job message on a normal website, right-click, and choose **Check selected text with JobCheck**.
4. Alternatively, click the extension toolbar button and paste evidence manually.

This package is not listed in either browser's extension store. See `extension/INSTALL.txt` for details.

## Tests

With Node.js 20 or later installed, run:

```sh
node --test tests/*.test.cjs
```

The tests cover scoring regressions and simulated browser-extension events. They do not establish Chrome/Edge installation compatibility, visual correctness, or real-world detection accuracy.

## Layout

| Directory | Contents |
| --- | --- |
| `web/` | Standalone website |
| `extension/` | Manifest V3 extension with bundled checker |
| `tests/` | Dependency-free automated regression tests |
| `PENDING.md` | Remaining validation and issue drafts |

The checker script and stylesheet are currently duplicated for packaging; tests check that they stay identical. The website source is recovered from the matching v1.1 extension bundle. Hosted deployment settings and Git credentials are intentionally excluded.

## Privacy and limitations

Analysis runs locally. Selected text is passed to the extension's local page, not an external analysis service. Saved reports contain the submitted material and stay in browser storage until cleared. Website and extension history are separate. Do not submit OTPs, passwords, or actual bank credentials.

English keyword rules have limited context and negation handling. False alarms and missed scams are possible. The score is not a probability. Low signals do not verify an employer. URL checks do not fetch websites, inspect domain ownership, or use a reputation service. Domain differences are informational, and look-alike checks are basic. Always verify offers independently.

Real browser installation tests and representative dataset evaluation remain pending. Screenshots should be added after browser validation; none are fabricated here.

## License

No open-source license has been selected yet. Public visibility alone does not grant an open-source license.
