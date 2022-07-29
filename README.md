# TalkingSticies

A [syn](https://github.com/holochain/syn) sample app for collaborative sticky-notes!

This is UI is built using [Svelte](https://svelte.dev) from the [standard template for Svelte apps](https://github.com/sveltejs/template).

## Environment Setup

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
