# Contributing

Thank you for your interest in improving ioBroker.dreo-cloud.

This project is an independent ioBroker adapter for DREO cloud-connected smart home devices. Contributions are welcome for bug fixes, additional tested devices, verified state mappings, documentation, and tests.

## Before opening an issue

Please check whether an existing issue already describes the same problem or request.

For bug reports, include:

- adapter version
- ioBroker js-controller version
- Node.js version
- DREO device model
- configured cloud region
- a clear description of the expected and actual behavior
- relevant log lines with sensitive information removed
- steps that reliably reproduce the problem

Do not publish:

- DREO email addresses or passwords
- access or refresh tokens
- device serial numbers
- family, room, account, or user identifiers
- complete unredacted WebSocket captures
- private network addresses unless they are necessary and anonymized

## Device support requests

For a new device or function, provide verified observations wherever possible:

- exact device model
- device category
- raw state keys observed
- state values before and after changing one function in the DREO app
- available constraints such as minimum, maximum, step, or allowed values
- whether the change was confirmed through a WebSocket report
- whether the function can safely be controlled

Unknown states are not made writable based on their name alone. Command behavior must be observed and validated first.

## Architecture

The project follows an SDK-first architecture.

DREO-specific business logic belongs in the reusable SDK:

```text
@mehrwiedu/dreo-api
```

This includes:

- authentication
- token handling
- HTTP retry behavior
- WebSocket handling
- device discovery
- capability resolution
- constraints
- DREO state relationships
- command generation

The ioBroker adapter should remain the integration layer and mainly:

- read adapter configuration
- initialize the SDK
- create ioBroker objects and states
- mirror SDK events into ioBroker
- pass supported writes to public SDK methods

Please do not duplicate DREO command or dependency logic inside the adapter.

## Development setup

Requirements:

- Node.js 22 or newer
- npm

Install dependencies:

```bash
npm install
```

Run the checks:

```bash
npm run check
npm run build
npm test
npm run lint
```

All checks must pass before opening a pull request.

## Pull requests

Keep pull requests focused and small.

A pull request should:

- explain the problem being solved
- describe the chosen implementation
- avoid unrelated refactoring
- preserve FamilyTree as the primary discovery source
- preserve the distinction between raw and friendly states
- include or update tests where practical
- update the changelog when behavior changes
- avoid committing generated archives, credentials, logs, or local development files

For behavior involving a real DREO device, describe how the change was verified.

## Raw and friendly states

Raw states mirror DREO values as closely as possible and remain read-only.

Friendly states provide user-oriented paths and effective operating values.

Do not:

- remove unknown raw states because their meaning is unclear
- guess a friendly mapping without evidence
- mark a state writable without a validated command path
- reset stored raw sub-states when only the device power changes

## Commit messages

Use short, descriptive commit messages written in the imperative mood.

Examples:

```text
Add purifier filter state mapping
Fix runtime device initialization race
Document shared-home account setup
```

## License

By contributing, you agree that your contribution will be licensed under the MIT License used by this repository.
