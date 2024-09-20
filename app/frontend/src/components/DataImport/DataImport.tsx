import { useState } from 'react';
import { Dropdown, IDropdownOption, IDropdownStyles } from '@fluentui/react/lib/Dropdown';
import { dataPiplineImportData, DataPipelineImportRequest, DataPipeline } from "../../api";
import { QuestionInput } from "../../components/QuestionInput";
import { array } from 'prop-types';
import styles from "./DataImport.module.css";
  
const dropdownFolderStyles: Partial<IDropdownStyles> = { dropdown: { width: 200 } };

interface Props {
    pipelines: Array<DataPipeline>;
}

export const DataImport = ({ pipelines }: Props) => {


    const pipelineOptions = pipelines.map<IDropdownOption>((p,i) => ( { key: p.name, text: p.name, data: p} ) );
    
    const selOpt = pipelineOptions[0];
    const selKey = selOpt.key;

    const [selecteddataPipeline, setSelectedDataPipeline] = useState<IDropdownOption<DataPipeline>>(selOpt);
    const [isBusy, setIsBusy] = useState<boolean>(false);
    const [history, setHistory] = useState<string[]>([]);
    const [dataColumnHeaders, setDataColumnHeaders] = useState<string[]>([]);
    const [dataRows, setDataRows] = useState<any[][]>([]);

    const onDataAbstractEntered = async (prompt: string) => {
        setIsBusy(true);
        const req: DataPipelineImportRequest = { prompt: prompt, pipeline: selecteddataPipeline!.data! };
        const newhist = [...history, prompt];
        setHistory(newhist);
        try
        {
            const resp = await dataPiplineImportData(req);
            if (resp.items.length > 0)
            {
                if (dataColumnHeaders.length == 0) setDataColumnHeaders(resp.excel_column_names);
                const newRows =  [...dataRows].concat(resp.excel_row_values);
                setDataRows(newRows);
            }
        }
        finally {
            setIsBusy(false);
        }
    }

    const onDataPipelineChange = (event: React.FormEvent<HTMLDivElement>, item: IDropdownOption<any> | undefined): void => {
        setSelectedDataPipeline(item!);
    };

    return (
        <div>
            <div>
                <Dropdown
                    label="Data Pipeline:"
                    defaultSelectedKey={selKey}
                    onChange={onDataPipelineChange}
                    placeholder="Select Pipeline"
                    options={pipelineOptions}
                    styles={dropdownFolderStyles}
                    aria-label="pipeline options for data import"
                /> 
            </div>
            <div>
                <QuestionInput
                    clearOnSend
                    placeholder="Enter Data Abstract"
                    disabled={isBusy}
                    onSend={onDataAbstractEntered}
                    showClearChat={false}
                    showRAIPanel={false}
                />
            </div>
            <div>
            {history.map((h, index) => (
                <div key={index}>{h}</div>))}
            </div>
            <div>
                <table className={styles.dataTable}>
                    <thead>
                        <tr>
                            {dataColumnHeaders.map((h, i) => <th key={i}>{h}</th>)}
                        </tr>
                    </thead>
                    <tbody>
                        {dataRows.map((row, index) => (
                            <tr key={index}>
                                {row.map((cell, index) => (
                                    <td key={index}>{cell}</td>
                                    ))}
                            </tr>
                            ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
