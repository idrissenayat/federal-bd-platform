# STEER Work Management

A Jira-like operational application built around the STEER Agentic SDLC.

The application provides a persistent backlog, seven-phase Flight Board,
assignment and activity controls, a human decision inbox, and a team authority
map. Its Critic Agent creates persistent, advisory review briefs with significant
findings, risks, dependencies, impact, and prioritized human actions. GitHub
remains the auditable engineering record; Block Buzz remains the communication
layer.

The current hosted application is an experimental single-POD Federal BD reference, not a
production multi-tenant release. Organization installation, multiple PODs, several
projects per POD, specialist plugins, portable configuration, and migration are governed
by `steer/briefs/0004-multi-pod-platform.md` and must pass its exam before this README
may claim those capabilities.

Hosted dogfood instance:

<https://steer-flight-board.idriss-enayat.chatgpt.site/>

## Local development

```bash
npm install
npm run dev
```

The repository includes the small Sites packaging plugin required by the Vite build, so
a clean checkout does not depend on an untracked local file.

Validate with:

```bash
npm test
```
