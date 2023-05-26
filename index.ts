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

}

interactWithResolume().then(() => {
    console.log("Done!");
})
