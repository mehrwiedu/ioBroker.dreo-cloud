# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added

- Writable child-lock state
- Writable fan modes
- Directional oscillation mode and independent angle states for `DR-HPF002S`
- Humidifier mode, fog level and target-humidity controls
- Humidifier filter confirmation
- Filter-life and operating-hours information
- Sleep-light and power-timer friendly states
- Runtime raw-key discovery logging
- Central friendly-state write reconciliation
- `DR-HHM003S` warm-mist, indicator-level and humidity-threshold controls
- `DR-HAP009S` air-purifier mode, fan-level, mood-light, display and power-recovery controls
- `DR-HAP009S` PM2.5, air-quality and filter-life information
- Runtime hot-add validation with newly added devices

### Changed

- Failed SDK writes restore the last confirmed friendly value.
- Identical successful writes are acknowledged immediately.
- Device-specific light and display mappings avoid false main-light states.
- Runtime device initialization is incremental and FamilyTree-backed.
- Documentation now covers eight real devices across six tested models and current controls.
- Friendly-State writes with overlapping paths are resolved against the concrete device before routing.
- Humidifier humidity-threshold writes preserve the unchanged counterpart threshold.

### Removed

- Writable ceiling-fan favorite state based on `predefine`.
- `raw.predefine` remains read-only because direct writes do not execute the stored DREO scene.

### Fixed

- Failed WebSocket `control-reply` messages are no longer treated as successful adapter writes after the SDK fix.
- Overlapping mood-light Friendly-State paths no longer route writes to the wrong device-family implementation.

### Tested

- `DR-HCF007S` ×3
- `DR-HCF001S` ×1
- `DR-HPF002S` ×1
- `DR-HHM001S` ×1
- `DR-HHM003S` ×1
- `DR-HAP009S` ×1
- Real runtime hot-add without adapter restart
- `DR-HHM003S` humidity-threshold write with counterpart preservation
- `DR-HAP009S` model-aware mood-light write routing
- Successful normal write after control-reply error handling
- Rejected error `500003 / instruction validate failed`

## [0.1.1] - 2026-07-17

### Changed

- Added the official DREO Cloud adapter logo
- Moved full device serial numbers from info logs to debug logs
- Enabled GitHub Actions trusted publishing for future npm releases

## [0.1.0] - 2026-07-17

### Added

- Creator-based ioBroker adapter structure
- DREO account configuration for EU and US regions
- FamilyTree-based device discovery
- Runtime discovery of newly available devices
- Automatic creation of device, information, raw, and friendly states
- Live raw and friendly state updates through the DREO WebSocket connection
- Bidirectional control of supported power, fan, speed, and light functions
- Dynamic read-only creation of previously unknown raw states
- Automatic re-login and WebSocket reconnect after renewed DREO sessions
- Effective friendly on/off states while preserving original raw device values
- Public adapter documentation and GitHub repository setup

### Tested

- DREO DR-HCF007S ceiling fan
- DREO DR-HPF002S stand fan
- DREO DR-HHM001S humidifier
