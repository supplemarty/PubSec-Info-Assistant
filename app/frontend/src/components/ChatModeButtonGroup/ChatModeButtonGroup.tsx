// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { Button, ButtonGroup } from "react-bootstrap";
import { ChatMode, GetFeatureFlagsResponse } from "../../api";

import styles from "./ChatModeButtonGroup.module.css";

interface Props {
    className?: string;
    featureFlags?: GetFeatureFlagsResponse;
    onClick: (_ev: any) => void;
    defaultValue?: ChatMode;
    disabled: boolean;
}

export const ChatModeButtonGroup = ({ className, onClick, defaultValue, featureFlags, disabled }: Props) => {
    
    const WorkOnly: string = "Document Chat";
    const Ungrounded_Generative: string = "AI Chat";
    const WorkAndWeb: string = "Web";

    const onClickWrapper = (_ev: any) => {
        if (!disabled) onClick(_ev);
    };

    return (
        <div className={`${styles.container} ${className ?? ""}`}>
            {// The WorkOnly button is always enabled, but WorkPlusWeb and Ungrounded are conditionally enabled based on feature flags
            // If both WorkPlusWeb and Ungrounded are enabled, show all three buttons
            featureFlags?.ENABLE_WEB_CHAT && featureFlags?.ENABLE_UNGROUNDED_CHAT ?
                <ButtonGroup className={`${styles.buttonGroup}`} onClick={onClickWrapper} bsPrefix="ia">
                    <Button disabled={disabled} className={`${defaultValue == ChatMode.WorkOnly? styles.buttonleftactive : styles.buttonleft ?? ""}`} size="sm" value={0} bsPrefix='ia'>{WorkOnly}</Button>
                    <Button disabled={disabled} className={`${defaultValue == ChatMode.WorkPlusWeb? styles.buttonmiddleactive : styles.buttonmiddle ?? ""}`} size="sm" value={1} bsPrefix='ia'>{WorkAndWeb}</Button>
                    <Button disabled={disabled} className={`${defaultValue == ChatMode.Ungrounded? styles.buttonrightactive : styles.buttonright ?? ""}`} size="sm" value={2} bsPrefix='ia'>{Ungrounded_Generative}</Button>
                </ButtonGroup>
            : // If only WorkPlusWeb is enabled, show only WorkPlusWeb and WorkOnly buttons
            featureFlags?.ENABLE_WEB_CHAT && !featureFlags?.ENABLE_UNGROUNDED_CHAT ?
                <ButtonGroup className={`${styles.buttonGroup}`} onClick={onClickWrapper} bsPrefix="ia">
                    <Button disabled={disabled} className={`${defaultValue == ChatMode.WorkOnly? styles.buttonleftactive : styles.buttonleft ?? ""}`} size="sm" value={0} bsPrefix='ia'>{WorkOnly}</Button>
                    <Button disabled={disabled} className={`${defaultValue == ChatMode.WorkPlusWeb? styles.buttonrightactive : styles.buttonright ?? ""}`} size="sm" value={1} bsPrefix='ia'>{WorkAndWeb}</Button>
                </ButtonGroup>
            : // iF ONLY Ungrounded is enabled, show only Ungrounded and WorkOnly buttons
            featureFlags?.ENABLE_UNGROUNDED_CHAT && !featureFlags?.ENABLE_WEB_CHAT ?
                <ButtonGroup className={`${styles.buttonGroup}`} onClick={onClickWrapper} bsPrefix="ia">
                    <Button disabled={disabled} className={`${defaultValue == ChatMode.WorkOnly? styles.buttonleftactive : styles.buttonleft ?? ""}`} size="sm" value={0} bsPrefix='ia'>{WorkOnly}</Button>
                    <Button disabled={disabled} className={`${defaultValue == ChatMode.Ungrounded? styles.buttonrightactive : styles.buttonright ?? ""}`} size="sm" value={2} bsPrefix='ia'>{Ungrounded_Generative}</Button>
                </ButtonGroup>
            : // If neither WorkPlusWeb nor Ungrounded are enabled, show only WorkOnly button
                <ButtonGroup className={`${styles.buttonGroup}`} onClick={onClickWrapper} bsPrefix="ia">
                    <Button disabled={disabled} className={`${defaultValue == ChatMode.WorkOnly? styles.buttonmiddleactive : styles.buttonmiddle ?? ""}`} size="sm" value={0} bsPrefix='ia'>{WorkOnly}</Button>
                </ButtonGroup>
                }
        </div>
    );
};