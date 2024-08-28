// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { useState, useEffect } from 'react';
import { Pivot, PivotItem } from "@fluentui/react";
import { Dropdown, IDropdownOption, IDropdownStyles } from '@fluentui/react/lib/Dropdown';
import { ITag } from '@fluentui/react/lib/Pickers';
import { FilePicker } from "../../components/filepicker/file-picker";
import { FileStatus } from "../../components/FileStatus/FileStatus";
import { TagPickerInline } from "../../components/TagPicker/TagPicker"
// import { FolderPicker } from '../../components/FolderPicker/FolderPicker';
import { SparkleFilled, DocumentPdfFilled, DocumentDataFilled, GlobePersonFilled, MailFilled, StoreMicrosoftFilled } from "@fluentui/react-icons";
import styles from "./Content.module.css";
import { IdentityManager } from "../../identity";
import { getFolders } from "../../api";


export interface IButtonExampleProps {
    disabled?: boolean;
    checked?: boolean;
  }
  
  const dropdownFolderStyles: Partial<IDropdownStyles> = { dropdown: { width: 200 } };

const Content = () => {
    //const [selectedKey, setSelectedKey] = useState<string | undefined>(undefined);
    const [selectedTags, setSelectedTags] = useState<string[] | undefined>(undefined);
    const [SelectedFolderItem, setSelectedFolderItem] = useState<IDropdownOption>();
    const [folderOptions, setFolderOptions] = useState<IDropdownOption[]>([]);    

    // const [selectedApproach, setSelectedApproach] = useState<number | undefined>(undefined);

    // const onSelectedKeyChanged = (selectedFolder: string[]) => {
    //     setSelectedKey(selectedFolder[0]);
    // };

    const onSelectedTagsChanged = (selectedTags: ITag[]) => {
        setSelectedTags(selectedTags.map((tag) => tag.name));
    }

    const onFolderChange = (event: React.FormEvent<HTMLDivElement>, item: IDropdownOption<any> | undefined): void => {
        setSelectedFolderItem(item);
    };    

    // const onSelectedApproach = (approach: number) => {
    //     setSelectedApproach(approach);
    //     alert(approach)
    // }

    // const handleLinkClick = (item?: PivotItem) => {
    //     setSelectedKey(undefined);
    // };   

    const fetchFolders = async () => {
        try {

            let folderDropdownOptions: IDropdownOption[] = [];
            let selectedFolder: IDropdownOption | undefined = undefined;

            // Add current user folder on client so not waiting on server
            const user = await IdentityManager.GetCurrentUser(true);
            if (user.Email && user.UserId) {
                const userFolder : IDropdownOption = { key: "*", text: user.UserId, data: { email_recips: [user.Email] } };
                folderDropdownOptions.push(userFolder);
                selectedFolder = userFolder;
                setFolderOptions(folderDropdownOptions);
                setSelectedFolderItem(selectedFolder);
            }

            const folders = await getFolders("canmanage"); // Await the promise
            if (folders.length > 1) {
                folders.forEach((folder) => {
                    if (folder.folder != user.UserId) {
                        let opt : IDropdownOption = { key: folder.folder, text: folder.folder, data: { email_recips: folder.email_recips } };
                        folderDropdownOptions.push(opt);
                    }
                });
                
                setFolderOptions(folderDropdownOptions);
                if (!selectedFolder) {
                    selectedFolder = folderDropdownOptions[0];
                    setSelectedFolderItem(selectedFolder);
                }
            }
        }
        catch (e) {
            console.log(e);
        }
    };
    
    
    useEffect(() => {
        // IdentityManager.GetCurrentUser(true).then((u) => {
        //     setSelectedKey(u.UserId);
        // });
        fetchFolders();
    },[]);

    return (
        <div className={styles.contentArea} >
            <Pivot aria-label="Upload Files Section" className={styles.topPivot}>
                <PivotItem headerText="Upload Files" aria-label="Upload Files Tab">
                    <div className={styles.App} >
                        <div style={{ marginBottom: '20px', marginTop: '20px' }}>
                            <SparkleFilled fontSize={"60px"} primaryFill={"rgba(115, 118, 225, 1)"} aria-hidden="true" aria-label="Supported File Types" />
                            <h1 className={styles.EmptyStateTitle}>Supported file types</h1>
                            <span className={styles.EmptyObjectives}>
                                The Information Assistant Accelerator currently supports the following file types:
                            </span>
                            <span className={styles.EmptyObjectivesList}>
                                <span className={styles.EmptyObjectivesListItem}>
                                    <DocumentDataFilled fontSize={"40px"} primaryFill={"rgba(115, 118, 225, 1)"} aria-hidden="true" aria-label="Data" />
                                    <span className={styles.EmptyObjectivesListItemText}><b>Data</b><br />
                                        xml, json, csv, txt
                                    </span>
                                </span>
                                <span className={styles.EmptyObjectivesListItem}>
                                    <StoreMicrosoftFilled fontSize={"40px"} primaryFill={"rgba(115, 118, 225, 1)"} aria-hidden="true" aria-label="Microsoft 365" />
                                    <span className={styles.EmptyObjectivesListItemText}><b>Productivity Software</b><br />
                                        pptx, docx & xlsx
                                    </span>
                                </span>
                                <span className={styles.EmptyObjectivesListItem}>
                                    <DocumentPdfFilled fontSize={"40px"} primaryFill={"rgba(115, 118, 225, 1)"} aria-hidden="true" aria-label="PDF" />
                                    <span className={styles.EmptyObjectivesListItemText}><b>PDF</b><br />
                                    For page count maximum check documentation  <a href="https://learn.microsoft.com/en-us/azure/ai-services/document-intelligence/concept-layout?view=doc-intel-4.0.0#input-requirements">
                                        here</a> 
                                    </span>
                                </span>
                                <span className={styles.EmptyObjectivesListItem}>
                                    <GlobePersonFilled fontSize={"40px"} primaryFill={"rgba(115, 118, 225, 1)"} aria-hidden="true" aria-label="Web" />
                                    <span className={styles.EmptyObjectivesListItemText}><b>Web</b><br />
                                        htm & html
                                    </span>
                                </span>
                                <span className={styles.EmptyObjectivesListItem}>
                                    <MailFilled fontSize={"40px"} primaryFill={"rgba(115, 118, 225, 1)"} aria-hidden="true" aria-label="Email" />
                                    <span className={styles.EmptyObjectivesListItemText}><b>Email</b><br />
                                        eml & msg
                                    </span>
                                </span>
                            </span>
                        </div>
                        <div className={styles.EmptyObjectivesListItem}>

                            <Dropdown
                                label="Folder:"
                                defaultSelectedKey={'*'}
                                onChange={onFolderChange}
                                placeholder="Select folder"
                                options={folderOptions}
                                styles={dropdownFolderStyles}
                                aria-label="folder options for file upload"
                            /> 
                            
                            <TagPickerInline allowNewTags={true} onSelectedTagsChange={onSelectedTagsChanged}/>
                            <FilePicker folderPath={SelectedFolderItem?.text || ""} tags={selectedTags || []} email_recips={SelectedFolderItem?.data.email_recips} />
                        </div>
                    </div>
                </PivotItem>
                <PivotItem headerText="Upload Status" aria-label="Upload Status Tab">
                    <FileStatus className=""/>
                </PivotItem>
            </Pivot>
        </div>
    );
};
    
export default Content;