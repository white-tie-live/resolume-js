import {components} from "./schema";
import WebSocket = require('isomorphic-ws');
import {
    Action,
    ActionType,
    Effect,
    isCompositionMessage,
    isEffectMessage,
    isParameterMessage,
    isSourcesMessage,
    ParameterCallback
} from "./ws";

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

type CompositionCallback = (comp: Composition) => void

export class WebSocketAPI {
    ws: WebSocket;
    events=  new Map<string | number, ParameterCallback[]>();
    sources: components["schemas"]["Sources"];
    effects: {
        Video: Effect[],
        Audio: Effect[],
    }
    compListeners = new Array<(data: Composition) => void>()

    constructor(host: string, port: number, protocol?: "ws" | "wss") {
        this.ws = new WebSocket(`${protocol ? protocol : "ws" }://${host}:${port}/api/v1`);
        this.ws.onmessage = (event) => {
            this.onMessage(event.data);
        };
    }

    addEventListener(parameter: string | number | "composition", cb: ParameterCallback | CompositionCallback){
        if (parameter === "composition") {
            this.compListeners.push(cb as CompositionCallback);
            return
        }

        const param = paramToString(parameter);
        if (!this.events.has(param)) {
            this.events.set(param, new Array<ParameterCallback>());
        }
        const id = Math.random().toString(36).substring(7);
        this.subscribe(param);

        this.events.get(param).push(cb as ParameterCallback);
    }

    removeEventListener(parameter: string | number, cb: ParameterCallback) {
        const param = paramToString(parameter);
        if (this.events.has(param)) {
            const index = this.events.get(param).indexOf(cb);
            if (index !== -1) {
                this.events.get(param).splice(index, 1);
            }
            if (this.events.get(param).length === 0) {
                this.unsubscribe(param);
            }
        }
    }


    private subscribe(parameter: string) {
        this.send({
            action: ActionType.Subscribe,
            parameter: parameter
        });
    }

    private unsubscribe(parameter: string) {
        this.send({
            action: ActionType.Unsubscribe,
            parameter: parameter
        });
    }

    send(action: Action) {
        this.ws?.send(JSON.stringify(action))
    }

    private onMessage(data: any) {
        const message = JSON.parse(data);
        if (isParameterMessage(message)) {
            const param = paramToString(message.id || message.path);
            if (this.events.has(param)) {
                this.events.get(param).forEach((cb) => {
                    cb(message);
                });
            }
        } else if (isSourcesMessage(message)) {
            this.sources = message.value;
            console.log(message.value);
        } else if (isEffectMessage(message)) {
            this.effects = message.value;
        } else if (isCompositionMessage(message)) {
            this.compListeners.forEach((cb) => {
                cb(message);
            });
        }
    }
}

function paramToString(param: string | number) {
    return typeof param === 'string' ? param : `/parameter/by-id/${param}`;
}