# TalkingStickies & KanDo!

Holochain hApps for collaborative boards: sticky-notes and KanBan.

Real-time colloaboration delivered by [syn](https://github.com/holochain/syn).  Inspired by [Ideaboards](https://ideaboardz.com)

## Install

1. Install and run the [Holochain Launcher](https://github.com/holochain/launcher/releases)
2. Click on *Install New App* and you should see TalkingStickies available for install

or, to install manually with a webhapp file:

2. Go to [https://github.com/Holo-Host/talking-stickies/releases] and download the *webapp* file under assets
3. In the Holochain Launcher click *Install New App* and *Select From Filesystem* and then choose the *webapp* file you downloaded.
4. Enjoy!

## Dev Environment Setup

1. Install the nix package manager following the first step of the [instructions here](https://developer.holochain.org/quick-start/)
2. Clone this repo and `cd` inside of it.
3. Enter the nix shell by running this in the root folder of the repository: 

```bash
nix develop
npm install
```

## Dev mode

1. Run the app with
  ```bash
  npm run start:ts
  ```
for TalkingStickies or:
  ```bash
  npm run start:kd
  ```
for KanDo!

This will open the hApp in your default browser.  To open them with `hc-launch` type:
```bash
npm run launch:ts
```
or
```bash
npm run launch:kd
```

1. Navigate to [localhost:5000](http://localhost:5000) in your browser. You should see the UI running.


## Releasing (manual)

### For Launcher

`npm run package:launcher:ts`
or
`npm run package:launcher:kd`

the `*.webhapp` file will be available in the `apps/launcher/workdir` folder.
