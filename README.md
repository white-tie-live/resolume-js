
# Resolume Arena/Avenue JavaScript SDK

An SDK to connect your TypeScript application with the REST API of the [Resolume Arena & Avenue](https://resolume.com) media server.




## Badges

Add badges from somewhere like: [shields.io](https://shields.io/)

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](https://choosealicense.com/licenses/mit/)
[![GPLv3 License](https://img.shields.io/badge/License-GPL%20v3-yellow.svg)](https://opensource.org/licenses/)
[![AGPL License](https://img.shields.io/badge/license-AGPL-blue.svg)](http://www.gnu.org/licenses/agpl-3.0)


## Overview

Resolume Arena & Avenue is a live VJ & media server application for Mac and Windows. Versions 7.0 and up include an integrated REST API-compatible web server to allow for remote and automated control of the software while it is running.

This SDK is a library of functions that are compatible with the [officially distributed schema](https://resolume.com/docs/restapi/swagger.yaml). Using this allows you to build software that can interact with this API.
## Run Locally

Clone the project

```bash
  git clone https://github.com/white-tie-live/resolume-js
```

Go to the project directory

```bash
  cd resolume-js
```

Install dependencies

```bash
  npm install
```

1. Either [download](https://resolume.com/download), install & launch Arena or Avenue, or have it running on a host accessible over your network.

2. Make sure the Webserver is enabled from Area > Settings > Webserver.

3. If needed, edit the host or port values in `index.ts`.

4. Run the demo function:

```bash
  npm run demo
```

In your terminal, you should see a long JSON output representing your Arena composition. In addition, it adds a new column to the end of your current composition.


## Example Usage

Look inside the `ResolumeAPI` class inside `resolume.ts` to see all of the currently implemented API calls.

To use them, follow the pattern shown in `index.ts`:

First, establish a connection to the Arena/Avenue webserver:

```tsx
const hostValue = "127.0.0.1";
const portValue = "8081";
const pathValue = "/path/to/local/files";

const resolume: ResolumeAPI = new ResolumeAPI(hostValue, +portValue, pathValue);

let composition: Composition;
try {
    composition = await resolume.getComposition();
} catch (error) {
    console.log("Error connecting to Resolume:", error);
    return;
}
```

Now that you have this connection established, you can use the available functions. For example, adding a new column:

```tsx
await resolume.addColumn().catch((error) => {
    console.log(`Couldn't add column: ${error}`);
});
```

Or to import a specific graphic to a clip based on its index (column 1, layer 1):

```tsx
const path = "clip1.mov"
const layerIndex = 1;
const columnIndex = 1;

await resolume.openClipByIndex(
    layerIndex,
    columnIndex,
    path,
    "file"
).catch((error) => {
    console.log(`Couldn't open file at ${path}: ${error}`);
})
 ```

There are many endpoints available in the REST API, but only the basic ones currently have functions implemented through this SDK. You can add your own by following the established patterns in `resolume.ts`.
## References

- [Resolume Arena REST API Overview](https://resolume.com/support/en/restapi)
- [API Documentation](https://resolume.com/docs/restapi/)



## Used By

This project is used by the following projects:

[**Script Elephant**](https://scriptelephant.com): A web-based scripting and graphics cueing platform.



## Support

This is an unofficial package maintained by enthusiastic users of Resolume Arena.

For support, join the [official Resolume Slack](https://join.slack.com/t/resolumecommunity/shared_invite/zt-kv27u7xj-TGwE~kZBTHKkyh169sbHrg) and join the **#rest-api** channel.


## Authors

- [Allen Ellis](https://www.github.com/allenellis)
- [White Tie Productions](https://whitetielive.com)