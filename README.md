# TalkingStickies

A holochain hApp for collaborative sticky-note boards.  Use it to run your retrospectives or group brainstorming sessions! 

Real-time colloaboration delivered by [syn](https://github.com/holochain/syn).  Inspired by [Ideaboards](https://ideaboardz.com)

## Install

1. Install and run the [Holochain Launcher](https://github.com/holochain/launcher/releases)
2. Go to [https://github.com/Holo-Host/talking-stickies/releases] and download the *webapp* file under assets
3. In the Holochain Launcher click *Install New App* and *Select From Filesystem* and then choose the *webapp* file you downloaded.
4. Enjoy!

## Dev Environment Setup

1. Install the holochain dev environment (only nix-shell is required): https://developer.holochain.org/docs/install/
2. Enable Holochain cachix with:

```bash
nix-env -iA cachix -f https://cachix.org/api/v1/install
cachix use holochain-ci
```

3. Clone this repo and `cd` inside of it.
4. Enter the nix shell by running this in the root folder of the repository: 

```bash
nix-shell
npm install
```

## Dev mode

1. Run the app
  ```bash
  npm run start
  ```

2. Navigate to [localhost:5000](http://localhost:5000) in your browser. You should see the UI running.


## Releasing (manual)

### For Launcher

`npm run package`
the `*.webhapp` file will be available in the `/workdir` folder.
