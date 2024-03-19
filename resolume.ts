import {components} from "./schema";

type APIResponse = components["schemas"]["ProductInfo"];
type Deck = components["schemas"]["Deck"];
type Composition = components["schemas"]["Composition"];
type Column = components["schemas"]["Column"];
type Clip = components["schemas"]["Clip"];
type TransportTimeline = components["schemas"]["TransportTimeline"];
type Layer = components["schemas"]["Layer"];
type ProductInfo = components["schemas"]["ProductInfo"];
type VideoEffect = components["schemas"]["VideoEffect"];
type VideoTrackClip = components["schemas"]["VideoTrackClip"];

type StringParameter = components["schemas"]["StringParameter"];
type ColorParameter = components["schemas"]["ColorParameter"];
type ChoiceParameter = components["schemas"]["ChoiceParameter"];
type ParameterCollection = components["schemas"]["ParameterCollection"];
type TextParameter = components["schemas"]["TextParameter"];


export class ResolumeAPI {
    host: string;
    port: number;
    filePath?: string;
    protocol?: string;


    constructor(host: string, port: number, filePath?: string, protocol?: string) {
        this.host = host;
        this.port = port;
        this.filePath = filePath || "";
        this.protocol = protocol || "http";
    }

    url() {
        return `${this.protocol}://${this.host}:${this.port}/api/v1`;
    }

    static errorOpeningClip = class extends Error {
        constructor(message: string) {
            super(message);
            this.name = "errorOpeningClip";
        }
    }

    async getProduct(): Promise<ProductInfo> {
        return await fetch(this.url() + `/product`).then((response) => response.json())
    }

    async getComposition(): Promise<Composition> {
        return await fetch(this.url() + `/composition`).then((response) => response.json())
    }


    async putDeck(deck: Deck): Promise<any> {
        return await fetch(
            this.url() + `/composition/decks/by-id/${deck.id}`,
            {method: 'PUT', body: JSON.stringify(deck)}
        ).then((response) => response)
    }

    async selectDeck(deck: Deck): Promise<any> {
        return await fetch(
            this.url() + `/composition/decks/by-id/${deck.id}/select`,
            {method: 'POST', body: JSON.stringify(deck)}
        ).then((response) => response)
    }

    async getDeck(deck: Deck): Promise<any> {
        return await fetch(
            this.url() + `/composition/decks/by-id/${deck.id}`,
            {method: 'GET', body: JSON.stringify(deck)}
        ).then((response) => response)
    }

    async addColumn(): Promise<any> {
        return await fetch(
            this.url() + `/composition/columns/add`,
            {method: 'POST'}
        ).then((response) => response)
    }

    async replaceColumn(index: number, column: Column): Promise<any> {
        return await fetch(
            this.url() + `/composition/columns/${index}`,
            {method: 'PUT', body: JSON.stringify(column)}
        ).then((response) => response)
    }

    async addLayer(): Promise<any> {
        return await fetch(
            this.url() + `/composition/layers/add`,
            {method: 'POST'}
        ).then((response) => response)
    }

    async replaceLayer(index: number, layer: Layer): Promise<any> {
        return await fetch(
            this.url() + `/composition/layers/${index}`,
            {method: 'PUT', body: JSON.stringify(layer)}
        ).then((response) => response)
    }

    async getClipByIndex(layerIndex: number, clipIndex: number): Promise<Clip> {
        console.log("Trying URL:", this.url() + `/composition/layers/${layerIndex}/clips/${clipIndex}`);
        return await fetch(
            this.url() + `/composition/layers/${layerIndex}/clips/${clipIndex}`,
            {method: 'GET'}
        ).then((response) => response.json())
    }

    async replaceClip(layerIndex: number, clipIndex: number, clip: Clip): Promise<any> {
        return await fetch(
            this.url() + `/composition/layers/${layerIndex}/clips/${clipIndex}`,
            {method: 'PUT', body: JSON.stringify(clip)}
        ).then((response) => response)
    }

    async addVideoEffect(layerIndex: number, clipIndex: number, effectName: string): Promise<any> {
        return await fetch(
            this.url() + `/composition/layers/${layerIndex}/clips/${clipIndex}/effects/video/add`,
            {method: 'POST', body: "effect:///video/" + encodeURI(effectName)}
        ).then((response) => response)
    }

    async addVideoSource(layerIndex: number, clipIndex: number, effectName: string): Promise<any> {
        return await fetch(
            this.url() + `/composition/layers/${layerIndex}/clips/${clipIndex}/open`,
            {method: 'POST', body: "source:///video/" + encodeURI(effectName)}
        ).then((response) => response)
    }


    async openClipByIndex(
        layerIndex: number,
        clipIndex: number,
        path: string,
        encoding: "file" | "source" | "raw" = "file"
    ): Promise<any> {
        let data: string
        if (encoding === "file") {
            data = "file://" + encodeURI(path);
        } else if (encoding === "source") {
            data = "source://" + encodeURI(path);
        } else {
            data = path;
        }

        console.log("Trying URL", this.url() + `/composition/layers/${layerIndex}/clips/${clipIndex}/open`)

        // @ts-ignore
        const response: Response | undefined = await Promise.race([
            fetch(
                this.url() + `/composition/layers/${layerIndex}/clips/${clipIndex}/open`,
                {method: 'POST', body: data}
            ),
            new Promise((_, reject) =>
                setTimeout(() => reject(new ResolumeAPI.errorOpeningClip("Timeout after 5000ms")), 5000)
            ),
        ]);

        if (!response) {
            throw new ResolumeAPI.errorOpeningClip("Response not received");
        }

        if (response.status >= 300) {
            throw new ResolumeAPI.errorOpeningClip(response.statusText);
        }
    }

}