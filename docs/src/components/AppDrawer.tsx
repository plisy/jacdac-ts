import React, { useContext } from "react";
import { Drawer, Typography, Divider, makeStyles, createStyles } from "@material-ui/core";
import TocBreadcrumbs from "./TocBreadcrums";
import { IconButton } from "gatsby-theme-material-ui";
import Alert from "@material-ui/lab/Alert";
import PacketList from "./PacketList";
import Toc from "./Toc";
import DomTreeView from "./DomTreeView";
import { DRAWER_WIDTH } from "./layout";
// tslint:disable-next-line: no-submodule-imports match-default-export-name
import ChevronLeftIcon from '@material-ui/icons/ChevronLeft';
import DrawerContext, { drawerTitle, DrawerType } from "./DrawerContext";
import JacdacContext from "../../../src/react/Context";
import { BusState } from "../../../src/dom/bus";
import ConnectButton from "../jacdac/ConnectButton";
import { JDService } from "../../../src/dom/service";

const useStyles = makeStyles((theme) => createStyles({
    drawer: {
        width: DRAWER_WIDTH,
        flexShrink: 0,
    },
    drawerPaper: {
        width: DRAWER_WIDTH,
    },
    drawerHeader: {
        display: 'flex',
        alignItems: 'center',
        padding: theme.spacing(0, 1),
        // necessary for content to be below app bar
        ...theme.mixins.toolbar,
        justifyContent: 'flex-end',
    },
    alertButton: {
        marginLeft: theme.spacing(2)
    }
}));

export default function AppDrawer(props: { pagePath: string, service?: JDService }) {
    const { pagePath, service } = props
    const classes = useStyles()
    const serviceClass = service?.serviceClass
    const { type: drawerType, setType: setDrawerType } = useContext(DrawerContext)
    const { connectionState } = useContext(JacdacContext)
    const open = drawerType !== DrawerType.None
    const connected = connectionState == BusState.Connected

    const handleDrawerClose = () => {
        setDrawerType(DrawerType.None)
    }

    return <Drawer
        className={classes.drawer}
        variant="persistent"
        anchor="left"
        open={open}
        classes={{
            paper: classes.drawerPaper,
        }}
    >
        <div className={classes.drawerHeader}>
            {<Typography variant="h6">{drawerTitle(drawerType)}</Typography>}
            <TocBreadcrumbs path={pagePath} />
            {drawerType === DrawerType.Packets && serviceClass !== undefined 
                && <Alert severity="info">{`Filtered for ${service?.name || serviceClass.toString(16)}`}</Alert>}
            <IconButton onClick={handleDrawerClose}>
                <ChevronLeftIcon />
            </IconButton>
        </div>
        <Divider />
        {drawerType === DrawerType.Toc && <Toc />}
        {!connected && <Alert severity={"info"}>Connect to a JACDAC device to inspect the bus.
        <ConnectButton className={classes.alertButton} full={true} /></Alert>}
        {connected && drawerType === DrawerType.Packets 
            ? <PacketList serviceClass={serviceClass} />
                : drawerType === DrawerType.Dom ? <DomTreeView /> : undefined}
    </Drawer>
}