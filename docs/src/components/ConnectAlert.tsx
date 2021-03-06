// tslint:disable-next-line: no-submodule-imports
import { createStyles, makeStyles } from "@material-ui/core";
// tslint:disable-next-line: no-submodule-imports
import Alert from "./Alert";
import React, { useContext } from "react";
import { BusState } from "../../../src/dom/bus";
import { serviceSpecificationFromClassIdentifier } from "../../../src/dom/spec";
import JACDACContext, { JDContextProps } from "../../../src/react/Context";
import ConnectButton from "../jacdac/ConnectButton";
import { isWebUSBSupported } from "../../../src/dom/usb"
import { NoSsr } from '@material-ui/core';

const useStyles = makeStyles((theme) => createStyles({
    button: {
        marginLeft: theme.spacing(2)
    }
}))

function NoSsrConnectAlert(props: { serviceClass?: number }) {
    const classes = useStyles()
    const { connectionState } = useContext<JDContextProps>(JACDACContext)
    const { serviceClass } = props
    const spec = serviceSpecificationFromClassIdentifier(serviceClass)
    const supported = isWebUSBSupported()

    if (!supported)
        return <></>

    if (connectionState === BusState.Disconnected)
        return <Alert severity="info" >
            {!spec && <span>Don't forget to connect!</span>}
            {spec && <span>Don't forget to connect some {spec.name} devices!</span>}
            <ConnectButton className={classes.button} full={true} />
        </Alert>

    return <></>
}

export default function ConnectAlert(props: { serviceClass?: number }) {
    return <NoSsr>
        <NoSsrConnectAlert {...props} />
    </NoSsr>
}