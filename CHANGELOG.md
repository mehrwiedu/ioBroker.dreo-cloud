# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

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
