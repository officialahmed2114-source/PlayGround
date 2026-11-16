# TOUCHLINE — Football Club

An original, browser-playable 3D football prototype. The match is rendered in Three.js with an authored stadium, pitch markings, stands/crowd, simple animated player models, ball physics, AI positioning, goals, a broadcast scoreboard and keyboard/touch controls.

## Run locally

Requires Node.js 18+ and an internet connection for the Three.js CDN module and Google Fonts.

```sh
npm start
```

Open [http://localhost:3000](http://localhost:3000). No install step or build is required.

## Play

- Select **PLAY MATCH** to enter a live match.
- Desktop: **WASD / arrow keys** move, **Shift** sprint, **F** shoot, **Space** pass, **G** through-pass, **E** switch player, **Q** tackle, **C** skill move, **Esc** pause.
- Mobile: left virtual joystick and right-side action buttons.
- The Clubs, Career, Training and Settings menu tabs provide prototype flows; Settings includes weather/day-night variants, and Clubs includes an original club plus inspired club-name placeholders.
- The match runs to six in-game minutes, tracks goals/shots and shows a full-time event.

## Scope

This is a fully playable small-scope prototype, not a commercial eFootball-scale production. It uses original Touchline branding and generated geometry, with no licensed player likenesses, club crests, commentary, external audio or downloaded assets. Teams, formations, online/local multiplayer, career progression, authentic professional animations, and advanced replay/stat systems are not implemented. The included player and crowd models are lightweight procedural stand-ins; visual quality depends on device/GPU. Three.js is loaded from jsDelivr.
