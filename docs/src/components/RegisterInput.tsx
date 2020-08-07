import React, { useState, useEffect } from "react";
import { JDRegister } from "../../../src/dom/register";
import { Slider, Typography, Switch, TextField, Select, MenuItem } from "@material-ui/core";
import { REPORT_UPDATE } from "../../../src/dom/constants";
import { DecodedMember, valueToFlags, flagsToValue } from "../../../src/dom/pretty";
import { debouncedPollAsync } from "../../../src/dom/utils";
import IDChip from "./IDChip"

function MemberInput(props: { register: JDRegister, member: DecodedMember, labelledby: string }) {
    const { register, member, labelledby } = props;
    const { specification } = register
    const serviceSpecifiction = register.service.specification
    const { info } = member;
    const mod = specification.kind == "rw";
    const enumInfo = serviceSpecifiction.enums[info.type]

    const handleSwitch = () => register.sendSetBoolAsync(!register.boolValue, true)
    const handleNumChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const v = parseInt(event.target.value.replace(/[^\d]+$/, ''));
        if (!isNaN(v))
            register.sendSetIntAsync(parseInt(event.target.value), true);
    }
    const handleEnumChange = (event: React.ChangeEvent<{ value: any }>) => {
        const v = enumInfo.isFlags ? flagsToValue(event.target.value) : event.target.value
        console.log(v)
        register.sendSetIntAsync(v, true);
    };

    if (info.type == "bool") {
        return <Switch checked={member.value} onClick={mod && handleSwitch} />
    }
    else if (enumInfo !== undefined && member.numValue !== undefined) {
        return <Select
            multiple={enumInfo.isFlags}
            value={enumInfo.isFlags ? valueToFlags(enumInfo, member.numValue) : member.numValue}
            onChange={handleEnumChange}>
            {Object.keys(enumInfo.members).map(n => <MenuItem value={enumInfo.members[n]}>{n} <IDChip id={enumInfo.members[n]} /></MenuItem>)}
        </Select>
    }
    else if (member.scaledValue !== undefined && info.unit == "frac") {
        return <Slider value={member.scaledValue}
            aria-labelledby={labelledby}
            min={0} max={1}
        />
    }

    if (member.numValue !== undefined && mod)
        return <TextField type="number" label={member.numValue} onChange={handleNumChange} />

    return <Typography variant="h5">{member.humanValue}</Typography>
}

function Decoded(props: { member: DecodedMember, showName?: boolean, register: JDRegister }) {
    const { member, showName, register } = props;
    const { info } = member;
    return <React.Fragment>
        {info.name !== "_" && <Typography id="slider" gutterBottom>
            {info.name}
        </Typography>}
        <MemberInput member={member} labelledby={"slider"} register={register} />
    </React.Fragment>
}

export default function RegisterInput(props: { register: JDRegister, showDeviceName?: boolean, showName?: boolean, showMemberName?: boolean }) {
    const { register, showName, showMemberName, showDeviceName } = props;
    const [decoded, setDecoded] = useState(register.decode())

    // keep reading
    useEffect(() => debouncedPollAsync(() => register.sendGetAsync()))

    // decode...
    useEffect(() => register.subscribe(REPORT_UPDATE, () => {
        setDecoded(register.decode())
    }))

    return <React.Fragment>
        {showDeviceName && <Typography>
            {register.service.device.name}/
        </Typography>}
        {showName && !!decoded && <Typography gutterBottom>
            {decoded.info.name}
        </Typography>}
        {decoded && decoded.decoded.map(member =>
            <Decoded register={register} member={member} showName={showMemberName} />)}
    </React.Fragment>
}