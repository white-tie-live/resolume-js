import {ResolumeAPI} from "./resolume";
import {components} from "./schema";

type Composition = components["schemas"]["Composition"];

async function interactWithResolume() {

    const hostValue = "127.0.0.1";
    const portValue = 8080;
    const pathValue = "/path/to/local/files";

    const resolume: ResolumeAPI = new ResolumeAPI(hostValue, portValue, pathValue);

    let composition: Composition;
    try {
        composition = await resolume.getComposition();
    } catch (error) {
        console.log("Error connecting to Resolume:", error);
        return;
    }
    console.log("Composition is", composition);

    // Add a column
    await resolume.addColumn().catch((error) => {
        console.log(`Couldn't add column: ${error}`);
    });

    // Import a file into a specific clip
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

}

interactWithResolume().then(() => {
    console.log("Done!");
})
