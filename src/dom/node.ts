import { JDEventSource } from "./eventsource";

export type LogLevel = 'error' | 'warn' | 'log' | 'info' | 'debug'
export type Log = (level: LogLevel, message: any, optionalArgs?: any[]) => void;

let nextNodeId = 0
export abstract class JDNode extends JDEventSource {
    public readonly nodeId = nextNodeId++ // debugging

    constructor() {
        super()
    }

    /**
     * Globally unique identifier per GraphQL spec
     */
    abstract get id(): string;

    /**
     * Gets a kind identifier useful for UI descriptions
     */
    abstract get nodeKind(): string;

    /**
     * Gets the local name
     */
    abstract get name(): string;

    /**
     * A human friendly name
     */
    abstract get friendlyName(): string;

    /**
     * Gets the name including parents
     */
    abstract get qualifiedName(): string;

    /**
     * Gets the parent node in the JACDAC dom
     */
    abstract get parent(): JDNode;

    /**
     * Gets the logger function
     */
    protected get logger(): Log {
        return this.parent?.logger;
    }

    protected log(level: LogLevel, msg: any) {
        const l = this.logger;
        if (l)
            l(level, `${this}: ${msg}`)
    }

    toString() {
        return this.friendlyName;
    }
}
