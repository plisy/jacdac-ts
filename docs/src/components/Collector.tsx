import React, { useState, useContext, useEffect } from 'react';
// tslint:disable-next-line: no-submodule-imports
import { makeStyles, Theme } from '@material-ui/core/styles';
// tslint:disable-next-line: no-submodule-imports
import Tabs from '@material-ui/core/Tabs';
// tslint:disable-next-line: no-submodule-imports
import Tab from '@material-ui/core/Tab';
import { Paper, Grid, ButtonGroup, Button, ListItem, List, ListItemText, ListItemSecondaryAction, TextField, InputAdornment, createStyles, FormControl } from '@material-ui/core';
import TabPanel, { a11yProps } from './TabPanel';
import DomTreeView from './DomTreeView';
import { JDRegister } from '../../../src/dom/register';
import JacdacContext from '../../../src/react/Context';
import RegisterInput from './RegisterInput'
import { IconButton } from 'gatsby-theme-material-ui';
// tslint:disable-next-line: no-submodule-imports match-default-export-name
import PlayArrowIcon from '@material-ui/icons/PlayArrow';
// tslint:disable-next-line: no-submodule-imports match-default-export-name
import StopIcon from '@material-ui/icons/Stop';
// tslint:disable-next-line: no-submodule-imports match-default-export-name
import SaveAltIcon from '@material-ui/icons/SaveAlt';
// tslint:disable-next-line: no-submodule-imports match-default-export-name
import DeleteIcon from '@material-ui/icons/Delete';
import { SensorReg } from '../../../jacdac-spec/dist/specconstants';

const useStyles = makeStyles((theme: Theme) => createStyles({
    root: {
        flexGrow: 1,
        backgroundColor: theme.palette.background.paper,
        marginBottom: theme.spacing(1)
    },
    field: {
        marginLeft: theme.spacing(1)
    }
}));

interface Table {
    id: number;
    name: string;
    headers: string[];
    startTimestamp: number;
    rows: number[][];
}

function downloadUrl(url: string, name: string) {
    const a = document.createElement("a") as HTMLAnchorElement;
    document.body.appendChild(a);
    a.style.display = "none";
    a.href = url;
    a.download = name;
    a.click();
}

function downloadCSV(table: Table, sep: string) {
    console.log(table)
    let csv = [table.headers.join(sep)]
    table.rows.forEach(row => csv.push(row.map(row => row.toString()).join(sep)))

    const url = `data:text/plain;charset=utf-8,${encodeURI(csv.join('\n'))}`
    downloadUrl(url, `${table.name}.csv`)
}

export default function Collector(props: {}) {
    const { } = props;
    const { bus } = useContext(JacdacContext)
    const classes = useStyles();
    const [tab, setTab] = useState(0);
    const [expanded, setExpanded] = useState<string[]>([])
    const [checked, setChecked] = useState<string[]>([])
    const [recording, setRecording] = useState(false)
    const [tables, setTables] = useState<Table[]>([])
    const [recordingLength, setRecordingLength] = useState(0)
    const [prefix, setPrefix] = useState("data")
    const [samplingIntervalDelay, setSamplingIntervalDelay] = useState("100")
    const registers = checked.map(id => bus.node(id) as JDRegister)
    const samplingIntervalDelayi = parseInt(samplingIntervalDelay)
    const error = isNaN(samplingIntervalDelayi) || !/\d+/.test(samplingIntervalDelay)

    const handleTabChange = (event: React.ChangeEvent<{}>, newValue: number) => setTab(newValue);
    const handleToggle = (ids) => setExpanded(ids)
    const handleCheck = (ids) => setChecked(ids)
    const handleRecording = () => {
        if (recording) {
            // finalize recording
            setRecording(false)
        } else {
            const newTable: Table = {
                id: Math.random(),
                name: `${prefix}${tables.length}`,
                startTimestamp: undefined,
                headers: ["timestamp"].concat(registers.map(register => `${register.service.device.name}/${register.service.name}`)),
                rows: []
            }
            setTables([newTable, ...tables])
            setRecording(true)
        }
    }
    const handleSamplingIntervalChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSamplingIntervalDelay(event.target.value.trim())
    }
    const handleDownload = (table: Table) => {
        downloadCSV(table, ",")
    }
    const handleDeleteTable = (table: Table) => {
        const i = tables.indexOf(table)
        if (i > -1) {
            tables.splice(i, 1)
            setTables([...tables])
        }
    }

    // data collection
    // interval add dataentry
    const addRow = () => {
        if (!recording) return; // already done

        const table = tables[0]
        if (table.startTimestamp === undefined)
            table.startTimestamp = bus.timestamp
        const row: number[] = [bus.timestamp - table.startTimestamp];
        registers.forEach(register => {
            const values = register.numValues;
            values.forEach(value => row.push(value))
        })
        table.rows.push(row)
        setTables(tables);
        setRecordingLength(table.rows.length)
    }
    // setting interval
    useEffect(() => {
        if (!error)
            registers.forEach(register => register.service
                .register(SensorReg.StreamingInterval)
                .sendSetIntAsync(samplingIntervalDelayi)
            )
    }, [samplingIntervalDelayi, checked, error])
    // collecting
    useEffect(() => {
        if (error) return undefined;
        const interval = setInterval(() => addRow(), samplingIntervalDelayi);
        return () => clearInterval(interval);
    }, [recording, samplingIntervalDelayi, checked]);

    return (
        <div className={classes.root}>
            <Paper square>
                <Tabs value={tab} onChange={handleTabChange} aria-label="Configure data source, record data">
                    <Tab label="Data Sources" {...a11yProps(0)} />
                    <Tab label="Recorder" {...a11yProps(1)} />
                </Tabs>
                <TabPanel value={tab} index={0}>
                    <DomTreeView
                        checkboxes={["register"]}
                        serviceFilter={srv => !!srv.readingRegister}
                        eventFilter={ev => false}
                        registerFilter={reg => reg.isReading}
                        defaultExpanded={expanded}
                        defaultChecked={checked}
                        onToggle={handleToggle}
                        onChecked={handleCheck}
                    />
                </TabPanel>
                <TabPanel value={tab} index={1}>
                    <Grid container
                        spacing={2}>
                        {registers.map(register =>
                            <Grid item key={register.id}>
                                <RegisterInput register={register} showDeviceName={true} showName={true} />
                            </Grid>)}
                    </Grid>
                    <FormControl>
                        <Button
                            title="start/stop recording"
                            onClick={handleRecording}
                            startIcon={recording ? <StopIcon /> : <PlayArrowIcon />}
                            disabled={!registers?.length}
                        >{recording ? "Stop" : "Start"}</Button>
                    </FormControl>
                    <TextField
                        className={classes.field}
                        error={error}
                        disabled={recording}
                        label="Sampling interval"
                        value={samplingIntervalDelay}
                        InputProps={{
                            startAdornment: <InputAdornment position="start">ms</InputAdornment>,
                        }}
                        onChange={handleSamplingIntervalChange} />
                    <List>
                        {tables.map((table, index) => <ListItem key={table.id}>
                            <ListItemText primary={table.name} secondary={`${(recording && !index) ? recordingLength : table.rows.length} rows`} />
                            <ListItemSecondaryAction>
                                {(!recording || !!index) && !!table.rows.length && <IconButton onClick={() => handleDownload(table)}>
                                    <SaveAltIcon />
                                </IconButton>}
                                {(!recording || !!index) && <IconButton onClick={() => handleDeleteTable(table)}>
                                    <DeleteIcon />
                                </IconButton>}
                            </ListItemSecondaryAction>
                        </ListItem>)}
                    </List>
                </TabPanel>
            </Paper>
        </div>
    );
}
