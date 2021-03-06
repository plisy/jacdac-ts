import { JDDevice } from "./device";
import { Packet } from "./packet";
import { serviceName } from "./pretty";
import { JDRegister } from "./register";
import { CMD_REG_MASK, PACKET_RECEIVE, PACKET_SEND, CMD_GET_REG, SERVICE_NODE_NAME, REPORT_RECEIVE } from "./constants";
import { JDNode } from "./node";
import { serviceSpecificationFromClassIdentifier, isRegister, isInstanceOf, isReading, isEvent } from "./spec";
import { JDEvent } from "./event";
import { delay, strcmp } from "./utils";

export class JDService extends JDNode {
    private _registers: JDRegister[];
    private _events: JDEvent[];
    private _specification: jdspec.ServiceSpec = null;
    public registersUseAcks = false;

    constructor(
        public readonly device: JDDevice,
        public readonly service_number: number
    ) {
        super()
    }

    get id() {
        return `${this.nodeKind}:${this.device.deviceId}:${this.service_number.toString(16)}`
    }

    get nodeKind() {
        return SERVICE_NODE_NAME
    }

    get serviceClass() {
        return this.device.serviceClassAt(this.service_number);
    }

    get name() {
        return serviceName(this.serviceClass)
    }

    get friendlyName() {
        const parts = [this.device.friendlyName]
        if (this.device.services({ serviceClass: this.serviceClass }).length > 1)
            parts.push(`[${this.service_number.toString(16)}]`)
        return parts.join('.')
    }

    get qualifiedName() {
        return `${this.device.qualifiedName}[${this.service_number.toString(16)}]`
    }

    get parent(): JDNode {
        return this.device
    }

    get readingRegister(): JDRegister {
        const pkt = this.specification?.packets.find(pkt => isReading(pkt))
        return pkt && this.register(pkt.identifier)
    }

    /**
     * Gets the specification of the service. Undefined if unknown
     */
    get specification() {
        if (this._specification === null)
            this._specification = serviceSpecificationFromClassIdentifier(this.serviceClass)
        return this._specification;
    }

    get events() {
        return this.specification?.packets.filter(isEvent).map(info => this.event(info.identifier)) || [];
    }

    registers() {
        if (!this._registers) {
            const spec = this.specification;
            this._registers = (spec?.packets || []).filter(isRegister).map(pkt => new JDRegister(this, pkt.identifier));
        }
        return this._registers.slice(0);
    }

    register(address: number | { address: number }): JDRegister {
        let a = (typeof address == "number" ? address : address?.address);
        if (a === undefined)
            return undefined;
        a |= 0

        // cache known registers
        this.registers()
        let register = this._registers.find(reg => reg.address === a);
        // we may not have a spec
        if (!register) {
            const spec = this.specification;
            if (spec && !spec.packets.some(pkt => isRegister(pkt) && pkt.identifier === a)) {
                this.log(`debug`, `attempting to access register 0x${a.toString(16)}`)
                return undefined;
            }
            this._registers.push(register = new JDRegister(this, a));
        }
        return register;
    }

    event(address: number | { address: number }): JDEvent {
        let a = (typeof address == "number" ? address : address?.address);
        if (a === undefined)
            return undefined;
        a |= 0

        if (!this._events)
            this._events = [];
        let event = this._events.find(ev => ev.address === a);
        if (!event) {
            const spec = this.specification;
            if (spec && !spec.packets.some(pkt => isEvent(pkt) && pkt.identifier === a)) {
                this.log(`warn`, `attempting to access event 0x${a.toString(16)}`)
                return undefined;
            }
            this._events.push(event = new JDEvent(this, a));
        }
        return event;
    }

    sendPacketAsync(pkt: Packet, ack?: boolean) {
        pkt.device = this.device;
        pkt.service_number = this.service_number;
        if (ack !== undefined)
            pkt.requires_ack = !!ack
        this.emit(PACKET_SEND, pkt)
        if (pkt.requires_ack)
            return this.device.sendPktWithAck(pkt)
        else
            return pkt.sendCmdAsync(this.device);
    }

    sendCmdAsync(cmd: number, ack?: boolean) {
        const pkt = Packet.onlyHeader(cmd);
        return this.sendPacketAsync(pkt, ack)
    }

    sendCmdAwaitResponseAsync(pkt: Packet, timeout = 500) {
        return new Promise<Packet>((resolve, reject) => {
            const handleRes = (resp: Packet) => {
                if (resp.service_command == pkt.service_command) {
                    this.off(REPORT_RECEIVE, handleRes)
                    if (resolve)
                        resolve(resp)
                    resolve = null
                }
            }
            delay(timeout).then(() => {
                if (!resolve) return
                resolve = null
                this.off(REPORT_RECEIVE, handleRes)
                reject(new Error(`timeout (${timeout}ms) waiting for response to ${pkt}`))
            })
            this.sendPacketAsync(pkt)
                .then(() => {
                    this.on(REPORT_RECEIVE, handleRes)
                })
                // the handler remove either upon timeout, or on first invocation of handleRes()
        })
    }

    processPacket(pkt: Packet) {
        this.emit(PACKET_RECEIVE, pkt)
        if (pkt.is_report) {
            this.emit(REPORT_RECEIVE, pkt)
            if (pkt.service_command & CMD_GET_REG) {
                const address = pkt.service_command & CMD_REG_MASK
                const reg = this.register({ address })
                if (reg)
                    reg.processReport(pkt);
            } else if (pkt.is_event) {
                const address = pkt.intData
                const ev = this.event(address)
                if (ev)
                    ev.processEvent(pkt);
            }
        }
    }

    compareTo(b: JDService): number {
        const a = this;
        return a.serviceClass - b.serviceClass ||
            strcmp(a.device.deviceId, b.device.deviceId) ||
            a.service_number - b.service_number;
    }
}

export function stableSortServices(services: JDService[]): JDService[] {
    return services?.sort((a, b) => a.compareTo(b))
}