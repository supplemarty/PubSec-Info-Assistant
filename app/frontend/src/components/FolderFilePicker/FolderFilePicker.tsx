import React, { useState, useEffect, useRef, useLayoutEffect } from "react";

import { DetailsList, 
    DetailsListLayoutMode, 
    SelectionMode, 
    IColumn, 
    IGroup,
    Selection, 
    TooltipHost,
    TextField
    } from "@fluentui/react";
import styles from "./DocumentsDetailList.module.css";
import { Delete24Regular,
    Send24Regular,
    ArrowClockwise24Regular,
    ImageBorderRegular,
    DocumentFolderFilled,
    ImageBorderFilled
    } from "@fluentui/react-icons";

export interface IDocument {
    key: string;
    name: string;
    //value: string;
    iconName: string;
    fileType: string;
    //filePath: string;
    // fileFolder: string;
    // state: string;
    // state_description: string;
    // upload_timestamp: string;
    // modified_timestamp: string;
    // status_updates: Array<{
    //     status: string;
    //     status_timestamp: string;
    //     status_classification: string;
    // }>;
    //isSelected?: boolean; // Optional property to track selection state
    //tags: string;
}


interface Props {
    items: IDocument[];
    //onFilesSorted?: (items: IDocument[]) => void;
    //onFilesSelected: (selectedIndices: number[]) => void;
    onRefreshClicked: () => void;
    selectedFileKeys: string[];
    onSelectedFileKeysChange: (keys: string[]) => void;
    groups: IGroup[]
}

export const DocumentsDetailList = ({ items, onRefreshClicked, selectedFileKeys, onSelectedFileKeysChange, groups }: Props) => {

    //const itemsRef = useRef(items);

    function getKey(item: any, index?: number): string {
        return item.key;
    }

    //const [itemList, setItems] = useState<IDocument[]>(items);

    const [columns] = useState<IColumn[]> ([
        {
            key: 'file_type',
            name: 'File Type',
            className: styles.fileIconCell,
            iconClassName: styles.fileIconHeaderIcon,
            ariaLabel: 'Column operations for File type, Press to sort on File type',
            iconName: 'Page',
            isIconOnly: true,
            fieldName: 'name',
            minWidth: 16,
            maxWidth: 16,
            onRender: (item: IDocument) => {
                let src;
                const supportedFileTypes = ['XML', 'JSON', 'CSV', 'PPTX', 'DOCX', 'PDF', 'TXT', 'XLSX', 'HTM', 'HTML', 'EML', 'MSG'];
                if (item.fileType === 'PNG' || item.fileType === 'JPEG' || item.fileType === 'JPG') {
                    return (
                        <TooltipHost content={`${item.fileType} file`}>
                            <ImageBorderFilled className={styles.fileIconImg} aria-label={`${item.fileType} file icon`} fontSize="16px" />
                        </TooltipHost>
                    );   
                } else if (supportedFileTypes.includes(item.fileType)) {
                    src = `https://res-1.cdn.office.net/files/fabric-cdn-prod_20221209.001/assets/item-types/16/${item.iconName}.svg`;
                    return (
                        <TooltipHost content={`${item.fileType} file`}>
                            <img src={src} className={styles.fileIconImg} alt={`${item.fileType} file icon`} />
                        </TooltipHost>
                    );
                } else {
                    // The file type is not supported, return a default icon
                    return (
                        <TooltipHost content={`${item.fileType} file`}>
                            <DocumentFolderFilled className={styles.fileIconImg} aria-label={`${item.fileType} file icon`} fontSize="16px"/>
                        </TooltipHost>
                    );
                }
            }
        },
        {
            key: 'name',
            name: 'Name',
            fieldName: 'name',
            minWidth: 210,
            maxWidth: 350,
            isRowHeader: true,
            isResizable: true,
            data: 'string',
            isPadded: true,
            onRender: (item: IDocument) => {
                return (
                <TooltipHost content={item.name}>
                    <span>{item.name}</span>
                </TooltipHost>)
            }
        }
    ]);

    //
    const [, setRefresh] = useState(true);
    const [selection] = useState(
      new Selection({
        onSelectionChanged: () => selectionChangedHandler(),
        onItemsChanged: () => itemsChangedHandler()
      })
    );
    const [textValue, setTextValue] = useState("");
  
    const selectedKeys = useRef(selectedFileKeys);
  
    const selectionChangedHandler = () => {
      const previousSelectedKeys = selectedKeys.current;
      const keysInSelection = selection.getItems().map(({ key }) => key);
      const currentSelectedKeys = selection.getSelection().map(({ key }) => key);
  
      const newSelectedKeys = [
        ...currentSelectedKeys,
        ...previousSelectedKeys.filter(
          (
            key // keep previously selected keys if
          ) =>
            !keysInSelection.includes(key) || // not in current selection
            (keysInSelection.includes(key) && currentSelectedKeys.includes(key)) // or in current selection and is selected
        )
      ];
      const newUniqueKeys = [...new Set(newSelectedKeys)];
  
      selectedKeys.current = newUniqueKeys as never[];

      onSelectedFileKeysChange(selectedKeys.current);

      setRefresh((prevValue) => !prevValue);
    };
  
    const itemsChangedHandler = () => {
      for (const { key } of selection.getItems()) {
        selection.setKeySelected(key as string, selectedKeys.current.includes(key as never), false);
      }
    };
  
    let filteredItems;
  
    if (textValue) {
      filteredItems = items.filter(({ name }) => name.toLowerCase().includes(textValue.toLowerCase()));
    }    
    //

    return (
        <div>
            <div className={styles.buttonsContainer}>
                <div className={`${styles.refresharea} ${styles.button} ${styles.divSpacing}`} onClick={onRefreshClicked} aria-label=" Refresh">
                    <ArrowClockwise24Regular className={styles.refreshicon} />
                    <span className={`${styles.refreshtext} ${styles.centeredText}`}>Refresh</span>
                </div>        
                <div style={{width:"100%"}}>
                <TextField 
                    value={textValue}
                    onChange={(event, newValue) => {
                    setTextValue(newValue ?? "");
                    }}
                    placeholder="Search"
                />
                </div>
                <span className={styles.right}>
                    Selected {selectedKeys.current.length} of {items.length} Files.
                </span>
            </div>
            <DetailsList
                items={filteredItems || items}
                compact={true}
                columns={columns}
                selection={selection}
                selectionMode={SelectionMode.multiple} // Allow multiple selection
                getKey={getKey}
                setKey="none"
                layoutMode={DetailsListLayoutMode.justified}
                isHeaderVisible={true}
                groups={groups}
            />
        </div>
    );
}
