/**
 * Layout component that queries for data
 * with Gatsby's useStaticQuery component
 *
 * See: https://www.gatsbyjs.org/docs/use-static-query/
 */

import React, { useState, useContext } from "react"
import clsx from 'clsx';
import { makeStyles, useTheme, Switch, FormControlLabel, FormGroup, Container, Icon } from '@material-ui/core';
// tslint:disable-next-line: no-submodule-imports
import { Link, IconButton, Button } from 'gatsby-theme-material-ui';
// tslint:disable-next-line: no-submodule-imports
import CssBaseline from '@material-ui/core/CssBaseline';
// tslint:disable-next-line: no-submodule-imports
import AppBar from '@material-ui/core/AppBar';
// tslint:disable-next-line: no-submodule-imports
import Toolbar from '@material-ui/core/Toolbar';
// tslint:disable-next-line: no-submodule-imports
import Typography from '@material-ui/core/Typography';
import ConnectButton from '../jacdac/ConnectButton';
// tslint:disable-next-line: no-submodule-imports match-default-export-name
import HistoryIcon from '@material-ui/icons/History';
// tslint:disable-next-line: no-submodule-imports match-default-export-name
import MenuIcon from '@material-ui/icons/Menu';
// tslint:disable-next-line: no-submodule-imports match-default-export-name
import AccountTreeIcon from '@material-ui/icons/AccountTree';
// tslint:disable-next-line: no-submodule-imports match-default-export-name
import FiberManualRecordIcon from '@material-ui/icons/FiberManualRecord';
import { useStaticQuery, graphql } from "gatsby"
import JacdacProvider from "../jacdac/Provider"
import ErrorSnackbar from "./ErrorSnackbar"
import { serviceSpecificationFromClassIdentifier } from "../../../src/dom/spec"
// tslint:disable-next-line: no-import-side-effect
import "./layout.css"
import { PacketFilterProvider } from "./PacketFilterContext";
import SEO from "./seo";
import { DbProvider, useFirmwareBlobs } from "./DbContext";
import FlashButton from "./FlashButton";
// tslint:disable-next-line: no-submodule-imports
import { createMuiTheme, responsiveFontSizes, ThemeProvider, createStyles } from '@material-ui/core/styles';
import DrawerContext, { DrawerProvider, DrawerType } from "./DrawerContext";
import AppDrawer from "./AppDrawer";

export const DRAWER_WIDTH = `${40}rem`;

const useStyles = makeStyles((theme) => createStyles({
  root: {
    display: 'flex',
    flexGrow: 1
  },
  grow: {
    flexGrow: 1,
  },
  appBar: {
    transition: theme.transitions.create(['margin', 'width'], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
  },
  appBarShift: {
    width: `calc(100% - ${DRAWER_WIDTH})`,
    marginLeft: DRAWER_WIDTH,
    transition: theme.transitions.create(['margin', 'width'], {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.enteringScreen,
    }),
  },
  menuButton: {
    marginRight: theme.spacing(1),
  },
  hide: {
    display: 'none',
  },
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
  content: {
    display: 'flex',
    minHeight: '100vh',
    flexDirection: 'column',
    padding: theme.spacing(3),
    transition: theme.transitions.create('margin', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
    marginLeft: `-${DRAWER_WIDTH}`,
  },
  mainContent: {
    flexGrow: 1
  },
  contentShift: {
    transition: theme.transitions.create('margin', {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.enteringScreen,
    }),
    marginLeft: 0,
  },
  footer: {
    marginTop: theme.spacing(3)
  },
  footerLink: {
    marginRight: theme.spacing(0.5)
  }
}));

export default function Layout(props: { pageContext?: any; children: any; }) {
  const theme = responsiveFontSizes(createMuiTheme());

  return (
    <ThemeProvider theme={theme}>
      <JacdacProvider>
        <PacketFilterProvider>
          <DbProvider>
            <DrawerProvider>
              <LayoutWithContext {...props} />
            </DrawerProvider>
          </DbProvider>
        </PacketFilterProvider>
      </JacdacProvider>
    </ThemeProvider>
  )
}


function LayoutWithContext(props: { pageContext?: any; children: any; }) {
  const { pageContext, children } = props;
  const classes = useStyles();
  const { type: drawerType, setType: setDrawerType } = useContext(DrawerContext)
  const open = drawerType !== DrawerType.None
  const serviceClass = pageContext?.node?.classIdentifier;
  const service = serviceClass !== undefined && serviceSpecificationFromClassIdentifier(serviceClass)
  useFirmwareBlobs()

  const handleDrawerToc = () => {
    setDrawerType(DrawerType.Toc)
  }
  const handleDrawerConsole = () => {
    setDrawerType(DrawerType.Packets);
  }
  const handleDrawerDom = () => {
    setDrawerType(DrawerType.Dom);
  }

  const data = useStaticQuery(graphql`
    query {
      site {
        siteMetadata {
          title
        }
      }
      allJacdacTsJson {
        nodes {
          version
        }
      }
    }
  `)

  return (
    <div className={classes.root}>
      <SEO />
      <CssBaseline />
      <AppBar position="fixed"
        className={clsx(classes.appBar, {
          [classes.appBarShift]: open,
        })}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open table of contents"
            onClick={handleDrawerToc}
            edge="start"
            className={clsx(classes.menuButton, open && classes.hide)}
          > <MenuIcon />
          </IconButton>
          <IconButton
            color="inherit"
            aria-label="open DOM tree"
            onClick={handleDrawerDom}
            edge="start"
            className={clsx(classes.menuButton, open && classes.hide)}
          > <AccountTreeIcon />
          </IconButton>
          <IconButton
            color="inherit"
            aria-label="open console"
            onClick={handleDrawerConsole}
            edge="start"
            className={clsx(classes.menuButton, open && classes.hide)}
          > <HistoryIcon />
          </IconButton>
          <Typography variant="h6">
            <Link className={classes.menuButton} href="/jacdac-ts" color="inherit">{data.site.siteMetadata.title}</Link>
          </Typography>
          <div className={classes.grow} />
          <div className={clsx(classes.menuButton)}><ConnectButton /></div>
          <IconButton color="inherit" className={clsx(classes.menuButton, open && classes.hide)} to="/tools/collector" aria-label="Data collection">
            <FiberManualRecordIcon />
          </IconButton>
          <div className={clsx(classes.menuButton, open && classes.hide)}><FlashButton /></div>
        </Toolbar>
      </AppBar>
      <AppDrawer pagePath={pageContext?.frontmatter?.path} serviceClass={serviceClass} />
      <Container maxWidth={open ? "lg" : "sm"}>
        <main
          className={clsx(classes.content, {
            [classes.contentShift]: open,
          })}
        >
          <div className={classes.mainContent}>
            <div className={classes.drawerHeader} />
            <Typography component="span">
              {children}
            </Typography>
          </div>
          <footer className={classes.footer}>
            <Link className={classes.footerLink} target="_blank" to={`https://github.com/microsoft/jacdac-ts/tree/v${data.allJacdacTsJson.nodes[0].version}`}>JACDAC-TS v{data.allJacdacTsJson.nodes[0].version}</Link>
            <Link className={classes.footerLink} to="https://makecode.com/privacy" target="_blank" rel="noopener">Privacy &amp; Cookies</Link>
            <Link className={classes.footerLink} to="https://makecode.com/termsofuse" target="_blank" rel="noopener">Terms Of Use</Link>
            <Link className={classes.footerLink} to="https://makecode.com/trademarks" target="_blank" rel="noopener">Trademarks</Link>
          © {new Date().getFullYear()} Microsoft Corporation
        </footer>
        </main>
      </Container>
      <ErrorSnackbar />
    </div>
  )
}
