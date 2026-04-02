# Barcode Scanner Refactor Checklist

This checklist covers the barcode-only scanner migration from the current ZXing-based hook to `html5-qrcode` in the frontend app.

## Goals

- Replace the manual ZXing scanner implementation with `html5-qrcode`
- Keep the existing `ScanPage` UX and route behavior intact
- Optimize for grocery barcodes only
- Cap requested camera resolution at 720p max
- Use a limited barcode scan region instead of full-frame scanning
- Apply continuous autofocus as a best-effort enhancement when supported
- Preserve deterministic tests and fallback behavior

## Constraints

- Keep the scan flow explicit: camera stays off until the user taps to scan
- Preserve current search flow and status/error messaging on `/scan`
- Keep frontend code secret-free
- Avoid broad visual regressions on the mobile scanner screen
- Preserve test-only barcode injection via `window.__SAFE_SCAN_TEST_BARCODE__`

## Target Files

- `src/frontend/package.json`
- `src/frontend/package-lock.json`
- `src/frontend/src/features/scanner/useBarcodeScanner.ts`
- `src/frontend/src/features/scanner/ScanPage.tsx`
- `src/frontend/src/features/scanner/ScanPage.test.tsx`
- `src/frontend/src/index.css`
- `src/frontend/e2e/*` if test selectors or snapshots need updates

## Execution Checklist

### 1. Add the new scanner dependency

- [ ] Add `html5-qrcode` to `src/frontend/package.json`
- [ ] Install dependencies and update `package-lock.json`
- [ ] Keep `@zxing/browser` and `@zxing/library` temporarily until migration is verified

### 2. Refactor the scanner hook around `Html5Qrcode`

- [ ] Keep the public hook name as `useBarcodeScanner`
- [ ] Replace the current manual `getUserMedia()` + ZXing startup logic
- [ ] Replace `videoRef` with a scanner container ref or equivalent mount target
- [ ] Preserve the `status` state values already used by the page
- [ ] Preserve `errorMessage` behavior for unsupported/denied cases
- [ ] Preserve duplicate barcode suppression before `onDetected`
- [ ] Preserve the `__SAFE_SCAN_TEST_BARCODE__` short-circuit path

### 3. Configure barcode-only scanning

- [ ] Use `Html5Qrcode`, not `Html5QrcodeScanner`
- [ ] Restrict formats to:
- [ ] `EAN_13`
- [ ] `EAN_8`
- [ ] `UPC_A`
- [ ] `UPC_E`
- [ ] `CODE_128`
- [ ] Exclude QR and other unused formats

### 4. Tune camera startup for performance

- [ ] Start with rear-camera preference using `facingMode: { ideal: 'environment' }`
- [ ] Cap resolution using video constraints:
- [ ] `width: { ideal: 1280, max: 1280 }`
- [ ] `height: { ideal: 720, max: 720 }`
- [ ] Consider `frameRate: { ideal: 24, max: 30 }`
- [ ] Consider `resizeMode: 'crop-and-scale'` when supported
- [ ] Use scanner `fps` around `8` to `10`
- [ ] Set `disableFlip: true`

### 5. Limit the scan region

- [ ] Configure a barcode-focused `qrbox`
- [ ] Use a dynamic `qrbox` function based on viewfinder size
- [ ] Prefer a wide rectangle over a square scan area
- [ ] Target roughly `82%` to `88%` of width and `22%` to `28%` of height
- [ ] Clamp dimensions so the scan region remains usable across mobile sizes

### 6. Rebuild camera controls on top of `html5-qrcode`

- [ ] Recreate `stop()` behavior through the new scanner instance
- [ ] Recreate `toggleTorch()` as a best-effort capability-based action
- [ ] Recreate `setZoom()` as a best-effort capability-based action
- [ ] Recreate `getCapabilities()` for UI-driven zoom/torch rendering
- [ ] Confirm controls safely no-op on unsupported browsers/devices

### 7. Apply autofocus as a best-effort enhancement

- [ ] Inspect running track capabilities/settings after scanner start
- [ ] Attempt `focusMode: 'continuous'` via video constraints
- [ ] Catch and ignore unsupported or rejected autofocus constraints
- [ ] Do not block scanning if autofocus cannot be applied

### 8. Update `ScanPage` integration

- [ ] Replace the `<video>` element inside `.scanner-frame` with a scanner mount node
- [ ] Keep the existing scanner shell, corners, and status copy
- [ ] Keep the current stop, torch, and zoom controls wired to the hook
- [ ] Ensure the page remains accessible and mobile-first

### 9. Normalize scanner DOM styling

- [ ] Update CSS to support the DOM injected by `html5-qrcode`
- [ ] Ensure the camera preview fills `.scanner-frame`
- [ ] Preserve rounding, clipping, and overlay corners
- [ ] Remove or override any unwanted library UI/chrome if necessary
- [ ] Re-check small viewport layout stability on `/scan`

### 10. Update tests

- [ ] Keep `ScanPage.test.tsx` passing after the hook/ref changes
- [ ] Preserve deterministic fake-barcode behavior for automated tests
- [ ] Update Playwright expectations only where scanner DOM changes require it
- [ ] Re-run Samsung S23 mobile coverage for `/scan`

### 11. Validate behavior

- [ ] Run frontend unit tests: `npm test`
- [ ] Run frontend build: `npm run build`
- [ ] Run Playwright E2E: `npx playwright test`
- [ ] Manually test on a real mobile device if available
- [ ] Verify startup speed, first-detect speed, torch, zoom, and scan-box usability

### 12. Remove old scanner dependencies

- [ ] Remove `@zxing/browser` from frontend dependencies
- [ ] Remove `@zxing/library` from frontend dependencies
- [ ] Reinstall and verify lockfile cleanup
- [ ] Re-run tests/build after dependency removal

## Suggested Implementation Order

1. Add `html5-qrcode`
2. Refactor `useBarcodeScanner.ts`
3. Update `ScanPage.tsx` mount structure
4. Add barcode-only formats and scan-box tuning
5. Rebuild torch/zoom/autofocus capability handling
6. Adjust CSS for injected scanner DOM
7. Run tests and validate mobile layout
8. Remove old ZXing dependencies

## Notes

- `html5-qrcode` still relies on ZXing in many environments, so the expected gains come primarily from lower resolution, smaller scan region, fewer formats, and cleaner camera handling rather than a fundamentally different decode engine.
- Continuous autofocus is device- and browser-dependent and must remain best-effort.
- The visual scanner frame can remain square even if the actual barcode scan region is a horizontal rectangle inside it.
