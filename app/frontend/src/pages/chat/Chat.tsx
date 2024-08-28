// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { useRef, useState, useEffect } from "react";
import { Panel, DefaultButton, Separator, Label, PanelType, IGroup } from "@fluentui/react";
import Switch from 'react-switch';
import { GlobeFilled, BuildingMultipleFilled, AddFilled, ChatSparkleFilled } from "@fluentui/react-icons";
import { ITag } from '@fluentui/react/lib/Pickers';

import styles from "./Chat.module.css";
import rlbgstyles from "../../components/ResponseLengthButtonGroup/ResponseLengthButtonGroup.module.css";
import rtbgstyles from "../../components/ResponseTempButtonGroup/ResponseTempButtonGroup.module.css";
import { Dropdown, IDropdownOption, IDropdownStyles } from '@fluentui/react/lib/Dropdown';
import { chatApi, Approaches, ChatResponse, ChatRequest, ChatTurn, ChatMode, getFeatureFlags, GetFeatureFlagsResponse, getCompleteFiles, FILE_ICONS } from "../../api";
import { Answer, AnswerError, AnswerLoading } from "../../components/Answer";
import { QuestionInput } from "../../components/QuestionInput";
// import { ExampleList } from "../../components/Example";
import { UserChatMessage } from "../../components/UserChatMessage";
import { AnalysisPanel, AnalysisPanelTabs } from "../../components/AnalysisPanel";
import { SettingsButton } from "../../components/SettingsButton";
// import { InfoButton } from "../../components/InfoButton";
import { ClearChatButton } from "../../components/ClearChatButton";
import { ResponseLengthButtonGroup } from "../../components/ResponseLengthButtonGroup";
import { ResponseTempButtonGroup } from "../../components/ResponseTempButtonGroup";
import { ChatModeButtonGroup } from "../../components/ChatModeButtonGroup";
// import { InfoContent } from "../../components/InfoContent/InfoContent";
// import { FolderPicker } from "../../components/FolderPicker";
import { TagPickerInline } from "../../components/TagPicker";
// import React from "react";
import DivCore_DkGray from "../../assets/DivCore_DkGray.png";

import { DocumentsDetailList, IDocument } from "../../components/FolderFilePicker/FolderFilePicker";


const dropdownFolderStyles: Partial<IDropdownStyles> = { dropdown: { width: 200 } };

const Chat = () => {

    const defaultChatMode : ChatMode = ChatMode.WorkOnly;
    // interface IResponseTempByChatMode {
    //     [ChatMode.WorkOnly]: number,
    //     [ChatMode.Ungrounded]: number,
    //     [ChatMode.WorkPlusWeb]: number
    // }
    const defaultResponseTempByChatMode = {
        [ChatMode.WorkOnly]: 0,
        [ChatMode.Ungrounded]: 0.6,
        [ChatMode.WorkPlusWeb]: 0
    };
    const defaultResponseLengthByChatMode = {
        [ChatMode.WorkOnly]: 2048,
        [ChatMode.Ungrounded]: 2048,
        [ChatMode.WorkPlusWeb]: 2048
    };
    // let currentResponseTempByChatMode : IResponseTempByChatMode = {
    //     [ChatMode.WorkOnly]: defaultResponseTempByChatMode[ChatMode.WorkOnly],
    //     [ChatMode.Ungrounded]: defaultResponseTempByChatMode[ChatMode.Ungrounded],
    //     [ChatMode.WorkPlusWeb]: defaultResponseTempByChatMode[ChatMode.WorkPlusWeb]
    // }

    const [isConfigPanelOpen, setIsConfigPanelOpen] = useState(false);
    // const [isInfoPanelOpen, setIsInfoPanelOpen] = useState(false);
    // const [retrieveCount] = useState<number>(5);
    const retrieveCount = 5;
    const [useSuggestFollowupQuestions] = useState<boolean>(false);
    const [userPersona] = useState<string>("analyst");
    const [systemPersona] = useState<string>("an Assistant");

    // Setting responseLength to 2048 by default, this will effect the default display of the ResponseLengthButtonGroup below.
    // It must match a valid value of one of the buttons in the ResponseLengthButtonGroup.tsx file. 
    // If you update the default value here, you must also update the default value in the onResponseLengthChange method.
    const [responseLengthByChatMode, setResponseLengthByChatMode] = useState(defaultResponseLengthByChatMode);

    // Setting responseTemp to 0.6 by default, this will effect the default display of the ResponseTempButtonGroup below.
    // It must match a valid value of one of the buttons in the ResponseTempButtonGroup.tsx file.
    // If you update the default value here, you must also update the default value in the onResponseTempChange method.
    const [responseTempByChatMode, setResponseTempByChatMode] = useState(defaultResponseTempByChatMode);

    const [activeChatMode, setChatMode] = useState<ChatMode>(defaultChatMode);
    const [defaultApproach, setDefaultApproach] = useState<number>(Approaches.ReadRetrieveRead);
    const [activeApproach, setActiveApproach] = useState<number>(Approaches.ReadRetrieveRead);
    const [featureFlags, setFeatureFlags] = useState<GetFeatureFlagsResponse | undefined>(undefined);

    const lastQuestionRefByChatMode = useRef({[ChatMode.Ungrounded]: "", [ChatMode.WorkOnly]: "", [ChatMode.WorkPlusWeb]: ""});
    
    interface ICitation { [key: string]: { citation: string; source_path: string; page_number: string }  };

    const lastQuestionWorkCitationRefByChatMode = useRef({ [ChatMode.Ungrounded]: ({} as ICitation), [ChatMode.WorkOnly]: ({} as ICitation), [ChatMode.WorkPlusWeb]: ({} as ICitation) });
    const lastQuestionWebCitiationRefByChatMode = useRef({ [ChatMode.Ungrounded]: ({} as ICitation), [ChatMode.WorkOnly]: ({} as ICitation), [ChatMode.WorkPlusWeb]: ({} as ICitation) });
    const lastQuestionThoughtChainRefByChatMode = useRef({ [ChatMode.Ungrounded]: ({} as { [key: string]: string }), [ChatMode.WorkOnly]: ({} as { [key: string]: string }), [ChatMode.WorkPlusWeb]: ({} as { [key: string]: string }) });
    
    
    const chatMessageStreamEnd = useRef<HTMLDivElement | null>(null);

    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [gettingFilterFiles, setGettingFilterFiles] = useState<boolean>(false);
    const [error, setError] = useState<unknown>();

    const [activeCitation, setActiveCitation] = useState<string>();
    const [activeCitationSourceFile, setActiveCitationSourceFile] = useState<string>();
    const [activeCitationSourceFilePageNumber, setActiveCitationSourceFilePageNumber] = useState<string>();
    const [activeAnalysisPanelTab, setActiveAnalysisPanelTab] = useState<AnalysisPanelTabs | undefined>(undefined);
    // const [selectedFolders, setSelectedFolders] = useState<string[]>([]);
    const [selectedTags, setSelectedTags] = useState<ITag[]>([]);

    const selectedFileKeysChat = useRef<string[]>([]);
    const onSelectedFileKeysChange = async (keys: string[]) => { selectedFileKeysChat.current = keys;  }

    //const [SelectedFolderItem, setSelectedFolderItem] = useState<IDropdownOption>();
    //const [folderOptions, setFolderOptions] = useState<IDropdownOption[]>([]);    

    const [selectedAnswer, setSelectedAnswer] = useState<number>(0);

    const [filterFileItems, setFilterFileItems] = useState<IDocument[]>([]);
    const [filterFileGroups, setFilterFileGroups] = useState<IGroup[]>([]);

    interface IAnswer {user: string, response: ChatResponse};

    const [answersByChatMode, setAnswers] = useState({
        [ChatMode.WorkOnly] : new Array<IAnswer>,
        [ChatMode.WorkPlusWeb] : new Array<IAnswer>,
        [ChatMode.Ungrounded] : new Array<IAnswer>
    });

    const [answerStreamByChatMode, setAnswerStreamByChatMode] = useState({
        [ChatMode.WorkOnly] : undefined,
        [ChatMode.WorkPlusWeb] : undefined,
        [ChatMode.Ungrounded] : undefined
    });

    const [abortControllerByChatMode, setAbortControllerByChatMode] = useState({
        [ChatMode.WorkOnly] : undefined,
        [ChatMode.WorkPlusWeb] : undefined,
        [ChatMode.Ungrounded] : undefined
    });


    async function fetchFeatureFlags() {
        try {
            const fetchedFeatureFlags = await getFeatureFlags();
            setFeatureFlags(fetchedFeatureFlags);
        } catch (error) {
            // Handle the error here
            console.log(error);
        }
    }

    // const onFolderChange = (event: React.FormEvent<HTMLDivElement>, item: IDropdownOption<any> | undefined): void => {
    //     setSelectedFolderItem(item);
    // };    

    const fetchCompleteFiles = async () => {
        setGettingFilterFiles(true);
        try {
            const folders = await getCompleteFiles(); // Await the promise
            // let folderDropdownOptions: IDropdownOption[] = [];
            // let selectedFolder: IDropdownOption | undefined = undefined;
            //items={ [ { key: "dude", name: "dude.docx", fileType: "docx", iconName: "test" }, { key: "dude2", name: "dude2.docx", fileType: "docx", iconName: "test" } ] }
            //groups={ [ { key: 'group1', name: 'msupple@divcowest.com', startIndex: 0, count: 1, level: 0 }, { key: 'group2', name: 'Investor Relations', startIndex: 1, count: 1, level: 0 } ] }
            var fileGroups: IGroup[] = [];
            var fileItems: IDocument[] = [];

            var itemIndex = 0;
            folders.forEach((folder) => {
                fileGroups.push({ key: folder.folder, name: folder.folder, startIndex: itemIndex, count: folder.items.length, level: 0 });

                folder.items.forEach((item) => {
                    let fileExtension = item.file_name.split('.').pop();
                    fileExtension = fileExtension == undefined ? 'Folder' : fileExtension.toUpperCase()
                    fileItems.push({key: item.file_path, name: item.file_name, iconName: FILE_ICONS[fileExtension.toLowerCase()], fileType: fileExtension})
                });
                itemIndex += folder.items.length;
    
            });
            selectedFileKeysChat.current = []; //reset selection
            setFilterFileGroups(fileGroups);
            setFilterFileItems(fileItems);
            //setSelectedFileNamesCSV("");
            // // ({ key: folder.default == true ? "*" : folder.folder, text: folder.folder }));
            // setFolderOptions(folderDropdownOptions);
            // setSelectedFolderItem(selectedFolder);
        }
        catch (e) {
            console.log(e);
        }
        finally {
            setGettingFilterFiles(false);
        }
    }
    
    // const fetchFolders = async () => {
    //     try {
    //         const folders = await getFolders(""); // Await the promise
    //         let folderDropdownOptions: IDropdownOption[] = [];
    //         let selectedFolder: IDropdownOption | undefined = undefined;
    //         folders.forEach((folder) => {
    //             let opt : IDropdownOption = { key: folder.folder, text: folder.folder };
    //             if (folder.default == true) {
    //                 opt.key = "*";
    //                 selectedFolder = opt;
    //             }
    //             folderDropdownOptions.push(opt);
    //         });
    //         // ({ key: folder.default == true ? "*" : folder.folder, text: folder.folder }));
    //         setFolderOptions(folderDropdownOptions);
    //         setSelectedFolderItem(selectedFolder);
    //     }
    //     catch (e) {
    //         console.log(e);
    //     }
    // };


    const makeApiRequest = async (question: string, approach: Approaches, 
                                work_citation_lookup: { [key: string]: { citation: string; source_path: string; page_number: string } },
                                web_citation_lookup: { [key: string]: { citation: string; source_path: string; page_number: string } },
                                thought_chain: { [key: string]: string}) => {

        lastQuestionRefByChatMode.current[activeChatMode] = question;
        //lastQuestionRef.current = question;
        lastQuestionWorkCitationRefByChatMode.current[activeChatMode] = work_citation_lookup;
        lastQuestionWebCitiationRefByChatMode.current[activeChatMode] = web_citation_lookup;
        lastQuestionThoughtChainRefByChatMode.current[activeChatMode] = thought_chain;
        setActiveApproach(approach);

        error && setError(undefined);
        setIsLoading(true);
        setActiveCitation(undefined);
        setActiveAnalysisPanelTab(undefined);

        try {
            const history: ChatTurn[] = answersByChatMode[activeChatMode].map(a => ({ user: a.user, bot: a.response.answer }));
            const request: ChatRequest = {
                history: [...history, { user: question, bot: undefined }],
                approach: approach,
                overrides: {
                    promptTemplate: undefined,
                    excludeCategory: undefined,
                    top: retrieveCount,
                    semanticRanker: true,
                    semanticCaptions: false,
                    suggestFollowupQuestions: useSuggestFollowupQuestions,
                    userPersona: userPersona,
                    systemPersona: systemPersona,
                    aiPersona: "",
                    responseLength: responseLengthByChatMode[activeChatMode],
                    responseTemp: responseTempByChatMode[activeChatMode],
                    //selectedFolders: SelectedFolderItem?.text,
                    selectedTags: selectedTags.map(tag => tag.name).join(","),
                    selectedFiles: selectedFileKeysChat.current.length == 0 ? "" : selectedFileKeysChat.current.join(",")
                },
                citation_lookup: approach == Approaches.CompareWebWithWork ? web_citation_lookup : approach == Approaches.CompareWorkWithWeb ? work_citation_lookup : {},
                thought_chain: thought_chain
            };

            const temp: ChatResponse = {
                answer: "",
                thoughts: "",
                data_points: [],
                approach: approach,
                thought_chain: {
                    "work_response": "",
                    "web_response": ""
                },
                work_citation_lookup: {},
                web_citation_lookup: {}
            };

            setAnswers({...answersByChatMode, [activeChatMode]: [...answersByChatMode[activeChatMode], { user: question, response: temp }]});

            const controller = new AbortController();
            setAbortControllerByChatMode({...abortControllerByChatMode, [activeChatMode]: controller});
            const signal = controller.signal;
            const result = await chatApi(request, signal);
            if (!result.body) {
                throw Error("No response body");
            }

            setAnswerStreamByChatMode({...answerStreamByChatMode, [activeChatMode]: result.body});
            
        } catch (e) {
            setError(e);
        } finally {
            setIsLoading(false);
        }
    };

    const clearChat = () => {
        lastQuestionRefByChatMode.current[activeChatMode] = "";
        lastQuestionWorkCitationRefByChatMode.current[activeChatMode] = {};
        lastQuestionWebCitiationRefByChatMode.current[activeChatMode] = {};
        lastQuestionThoughtChainRefByChatMode.current[activeChatMode] = {};
        error && setError(undefined);
        setActiveCitation(undefined);
        setActiveAnalysisPanelTab(undefined);
        const a = {...answersByChatMode, [activeChatMode]: []};
        setAnswers(a);
    };

    const onResponseLengthChange = (_ev: any) => {
        // for (let node of _ev.target.parentNode.childNodes) {
        //     if (node.value == _ev.target.value) {
        //         switch (node.value) {
        //             case "1024":
        //                 node.className = `${rlbgstyles.buttonleftactive}`;
        //                 break;
        //             case "2048":
        //                 node.className = `${rlbgstyles.buttonmiddleactive}`;
        //                 break;
        //             case "3072":
        //                 node.className = `${rlbgstyles.buttonrightactive}`;
        //                 break;
        //             default:
        //                 //do nothing
        //                 break;
        //         }
        //     }
        //     else {
        //         switch (node.value) {
        //             case "1024":
        //                 node.className = `${rlbgstyles.buttonleft}`;
        //                 break;
        //             case "2048":
        //                 node.className = `${rlbgstyles.buttonmiddle}`;
        //                 break;
        //             case "3072":
        //                 node.className = `${rlbgstyles.buttonright}`;
        //                 break;
        //             default:
        //                 //do nothing
        //                 break;
        //         }
        //     }
        // }
        // the or value here needs to match the default value assigned to responseLength above.
        let v = parseInt(_ev.target.value);
        if (isNaN(v)) v = 2048;
        const nv = { ...responseLengthByChatMode, [activeChatMode] : v};

        setResponseLengthByChatMode(nv)
    };

    // const onFilterFilesSelected = (selectedIndices: number[]) => {
    //     var filePathsCSV = "";
    //     selectedIndices.forEach((i) => {
    //         filePathsCSV += (filePathsCSV.length == 0 ? "" : ",") + filterFileItems[i].key;
    //     });
    //     setSelectedFileNamesCSV(filePathsCSV);
    // }

    const onResponseTempChange = (_ev: any) => {
        // for (let node of _ev.target.parentNode.childNodes) {
        //     if (node.value == _ev.target.value) {
        //         switch (node.value) {
        //             case "1":
        //                 node.className = `${rtbgstyles.buttonleftactive}`;
        //                 break;
        //             case "0.6":
        //                 node.className = `${rtbgstyles.buttonmiddleactive}`;
        //                 break;
        //             case "0":
        //                 node.className = `${rtbgstyles.buttonrightactive}`;
        //                 break;
        //             default:
        //                 //do nothing
        //                 break;
        //         }
        //     }
        //     else {
        //         switch (node.value) {
        //             case "1":
        //                 node.className = `${rtbgstyles.buttonleft}`;
        //                 break;
        //             case "0.6":
        //                 node.className = `${rtbgstyles.buttonmiddle}`;
        //                 break;
        //             case "0":
        //                 node.className = `${rtbgstyles.buttonright}`;
        //                 break;
        //             default:
        //                 //do nothing
        //                 break;
        //         }
        //     }
        //}
        // the or value here needs to match the default value assigned to responseLength above.
        let v = parseFloat(_ev.target.value);
        if (isNaN(v)) v = 0.6;
        const nv = { ...responseTempByChatMode, [activeChatMode] : v};
        setResponseTempByChatMode(nv);
    };

    const onChatModeChange = (_ev: any) => {
        const chatMode = _ev.target.value as ChatMode || ChatMode.WorkOnly;
        setChatMode(chatMode);
        if (chatMode == ChatMode.WorkOnly)
                setDefaultApproach(Approaches.ReadRetrieveRead);
                setActiveApproach(Approaches.ReadRetrieveRead);
        if (chatMode == ChatMode.WorkPlusWeb)
            // if (defaultApproach == Approaches.GPTDirect) 
            setDefaultApproach(Approaches.ChatWebRetrieveRead)
            setActiveApproach(Approaches.ChatWebRetrieveRead);
        if (chatMode == ChatMode.Ungrounded)
            setDefaultApproach(Approaches.GPTDirect)
            setActiveApproach(Approaches.GPTDirect);

        setActiveCitation(undefined);
        setActiveAnalysisPanelTab(undefined);
    
        // clearChat();
    }

    // const handleToggle = () => {
    //     defaultApproach == Approaches.ReadRetrieveRead ? setDefaultApproach(Approaches.ChatWebRetrieveRead) : setDefaultApproach(Approaches.ReadRetrieveRead);
    // }

    useEffect(() => {
        fetchFeatureFlags();
        //fetchFolders();
        fetchCompleteFiles();
    }, []);
    useEffect(() => chatMessageStreamEnd.current?.scrollIntoView({ behavior: "smooth" }), [isLoading]);

    // const onRetrieveCountChange = (_ev?: React.SyntheticEvent<HTMLElement, Event>, newValue?: string) => {
    //     setRetrieveCount(parseInt(newValue || "5"));
    // };

    // const onUserPersonaChange = (_ev?: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>, newValue?: string) => {
    //     setUserPersona(newValue || "");
    // }

    // const onSystemPersonaChange = (_ev?: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>, newValue?: string) => {
    //     setSystemPersona(newValue || "");
    // }

    // const onUseSuggestFollowupQuestionsChange = (_ev?: React.FormEvent<HTMLElement | HTMLInputElement>, checked?: boolean) => {
    //     setUseSuggestFollowupQuestions(!!checked);
    // };

    // const onExampleClicked = (example: string) => {
    //     makeApiRequest(example, defaultApproach, {}, {}, {});
    // };

    const onShowCitation = (citation: string, citationSourceFile: string, citationSourceFilePageNumber: string, index: number) => {
        if (activeCitation === citation && activeAnalysisPanelTab === AnalysisPanelTabs.CitationTab && selectedAnswer === index) {
            setActiveAnalysisPanelTab(undefined);
        } else {
            setActiveCitation(citation);
            setActiveCitationSourceFile(citationSourceFile);
            setActiveCitationSourceFilePageNumber(citationSourceFilePageNumber);
            setActiveAnalysisPanelTab(AnalysisPanelTabs.CitationTab);
        }

        setSelectedAnswer(index);
    };

    const onToggleTab = (tab: AnalysisPanelTabs, index: number) => {
        if (activeAnalysisPanelTab === tab && selectedAnswer === index) {
            setActiveAnalysisPanelTab(undefined);
        } else {
            setActiveAnalysisPanelTab(tab);
        }

        setSelectedAnswer(index);
    };

    // const onSelectedKeyChanged = (selectedFolders: string[]) => {
    //     setSelectedFolders(selectedFolders)
    // };

    const onSelectedTagsChange = (selectedTags: ITag[]) => {
        setSelectedTags(selectedTags)
    }

    useEffect(() => {
        // Hide Scrollbar for this page
        document.body.classList.add('chat-overflow-hidden-body');
        // Do not apply to other pages
        return () => {
            document.body.classList.remove('chat-overflow-hidden-body');
        };
    }, []);


    const updateAnswerAtIndex = (index: number, response: ChatResponse) => {
        const updatedAnswersByChatMode = [...answersByChatMode[activeChatMode]];
        updatedAnswersByChatMode[index].response = response;
        setAnswers({...answersByChatMode, [activeChatMode]: updatedAnswersByChatMode});
    }

    const removeAnswerAtIndex = (index: number) => {
        const updatedAnswersByChatMode = [...answersByChatMode[activeChatMode]];
        const newItems = updatedAnswersByChatMode.filter((item, idx) => idx !== index);
        setAnswers({...answersByChatMode, [activeChatMode]: newItems});
    }

    return (
        <div className={styles.container}>
            <div className={styles.subHeader}>
                <ChatModeButtonGroup disabled={isLoading} className="" defaultValue={activeChatMode} onClick={onChatModeChange} featureFlags={featureFlags} /> 
                <div className={styles.commandsContainer}>
                    <ClearChatButton className={styles.commandButton} onClick={clearChat} disabled={!lastQuestionRefByChatMode.current[activeChatMode] || isLoading} />
                    <SettingsButton className={styles.commandButton} onClick={() => setIsConfigPanelOpen(!isConfigPanelOpen)} />
                    {/* <InfoButton className={styles.commandButton} onClick={() => setIsInfoPanelOpen(!isInfoPanelOpen)} /> */}
                </div>
            </div>
            <div className={styles.chatRoot}>
                <div className={styles.chatContainer}>
                    {!lastQuestionRefByChatMode.current[activeChatMode] ? (
                        <div className={styles.chatEmptyState}>
                            {activeChatMode == ChatMode.WorkOnly ? 
                                <div>
                                    <div className={styles.chatEmptyStateHeader}> 
                                        <img className={styles.chatEmptyStateLogo} src={DivCore_DkGray} alt="Divco Azure OpenAI" />
                                        {/* <BuildingMultipleFilled fontSize={"100px"} primaryFill={"rgba(27, 74, 239, 1)"} aria-hidden="true" aria-label="Chat with your Work Data logo" /> */}
                                        </div>
                                    <h1 className={styles.chatEmptyStateTitle}>Chat with your work data</h1>
                                </div>
                            : activeChatMode == ChatMode.WorkPlusWeb ?
                                <div>
                                    <div className={styles.chatEmptyStateHeader}> 
                                        {/* <GlobeFilled fontSize={"80px"} primaryFill={"rgba(27, 74, 239, 1)"} aria-hidden="true" aria-label="Chat with Web Data logo" /><AddFilled fontSize={"50px"} primaryFill={"rgba(0, 0, 0, 0.7)"} aria-hidden="true" aria-label=""/> */}
                                        <GlobeFilled fontSize={"80px"} primaryFill={"rgba(24, 141, 69, 1)"} aria-hidden="true" aria-label="" />
                                    </div>
                                    <h1 className={styles.chatEmptyStateTitle}>Chat with web data</h1>
                                </div>
                            : //else Ungrounded
                                <div>
                                    <div className={styles.chatEmptyStateHeader}> 
                                        <ChatSparkleFilled fontSize={"80px"} primaryFill={"rgba(0, 0, 0, 0.35)"} aria-hidden="true" aria-label="Chat logo" />
                                    </div>
                                    <h1 className={styles.chatEmptyStateTitle}>Chat directly with a LLM</h1>
                                </div>
                            }
                            <span className={styles.chatEmptyObjectives}>
                                <i>This chat uses AI. Check for mistakes.</i><a href="https://github.com/microsoft/PubSec-Info-Assistant/blob/main/docs/transparency.md" target="_blank" rel="noopener noreferrer">Transparency Note</a>
                                <div>
                                    <a href="https://divcowest.sharepoint.com/Information%20Security%20Document%20Library/DivCore%20GenAI%20-%20Acceptable%20Use%20Policy.pdf" target="_blank" rel="noopener noreferrer">DivCore AI Policy Document</a>
                                </div>
                            </span>
                            {/* {activeChatMode != ChatMode.Ungrounded &&
                                <div>
                                    <h2 className={styles.chatEmptyStateSubtitle}>Ask anything or try an example</h2>
                                    <ExampleList onExampleClicked={onExampleClicked} />
                                </div>
                            } */}
                        </div>
                    ) : (
                        <div className={styles.chatMessageStream}>
                            {answersByChatMode[activeChatMode].map((answer, index) => (
                                <div key={index}>
                                    <UserChatMessage
                                        message={answer.user}
                                        approach={answer.response.approach}
                                    />
                                    <div className={styles.chatMessageGpt}>
                                        <Answer
                                            key={index}
                                            answer={answer.response}
                                            answerStream={answerStreamByChatMode[activeChatMode]}
                                            setError={(error) => {setError(error); removeAnswerAtIndex(index); }}
                                            setAnswer={(response) => updateAnswerAtIndex(index, response)}
                                            isSelected={selectedAnswer === index && activeAnalysisPanelTab !== undefined}
                                            onCitationClicked={(c, s, p) => onShowCitation(c, s, p, index)}
                                            onThoughtProcessClicked={() => onToggleTab(AnalysisPanelTabs.ThoughtProcessTab, index)}
                                            onSupportingContentClicked={() => onToggleTab(AnalysisPanelTabs.SupportingContentTab, index)}
                                            onFollowupQuestionClicked={q => makeApiRequest(q, answer.response.approach, answer.response.work_citation_lookup, answer.response.web_citation_lookup, answer.response.thought_chain)}
                                            showFollowupQuestions={useSuggestFollowupQuestions && answersByChatMode[activeChatMode].length - 1 === index}
                                            onAdjustClick={() => setIsConfigPanelOpen(!isConfigPanelOpen)}
                                            onRegenerateClick={() => makeApiRequest(answersByChatMode[activeChatMode][index].user, answer.response.approach, answer.response.work_citation_lookup, answer.response.web_citation_lookup, answer.response.thought_chain)}
                                            onWebSearchClicked={() => makeApiRequest(answersByChatMode[activeChatMode][index].user, Approaches.ChatWebRetrieveRead, answer.response.work_citation_lookup, answer.response.web_citation_lookup, answer.response.thought_chain)}
                                            onWebCompareClicked={() => makeApiRequest(answersByChatMode[activeChatMode][index].user, Approaches.CompareWorkWithWeb, answer.response.work_citation_lookup, answer.response.web_citation_lookup, answer.response.thought_chain)}
                                            onRagCompareClicked={() => makeApiRequest(answersByChatMode[activeChatMode][index].user, Approaches.CompareWebWithWork, answer.response.work_citation_lookup, answer.response.web_citation_lookup, answer.response.thought_chain)}
                                            onRagSearchClicked={() => makeApiRequest(answersByChatMode[activeChatMode][index].user, Approaches.ReadRetrieveRead, answer.response.work_citation_lookup, answer.response.web_citation_lookup, answer.response.thought_chain)}
                                            chatMode={activeChatMode}
                                        />
                                    </div>
                                </div>
                            ))}
                            {error ? (
                                <>
                                    <UserChatMessage message={lastQuestionRefByChatMode.current[activeChatMode]} approach={activeApproach}/>
                                    <div className={styles.chatMessageGptMinWidth}>
                                        <AnswerError error={error.toString()} onRetry={() => makeApiRequest(lastQuestionRefByChatMode.current[activeChatMode], activeApproach, lastQuestionWorkCitationRefByChatMode.current[activeChatMode], lastQuestionWebCitiationRefByChatMode.current[activeChatMode], lastQuestionThoughtChainRefByChatMode.current[activeChatMode])} />
                                    </div>
                                </>
                            ) : null}
                            <div ref={chatMessageStreamEnd} />
                        </div>
                    )}
                    
                    <div className={styles.chatInput}>
                        {/* {activeChatMode == ChatMode.WorkPlusWeb && (
                            <div className={styles.chatInputWarningMessage}> 
                                {defaultApproach == Approaches.ReadRetrieveRead && 
                                    <div>Questions will be answered by default from Work <BuildingMultipleFilled fontSize={"20px"} primaryFill={"rgba(27, 74, 239, 1)"} aria-hidden="true" aria-label="Work Data" /></div>}
                                {defaultApproach == Approaches.ChatWebRetrieveRead && 
                                    <div>Questions will be answered by default from Web <GlobeFilled fontSize={"20px"} primaryFill={"rgba(24, 141, 69, 1)"} aria-hidden="true" aria-label="Web Data" /></div>
                                }
                            </div> 
                        )} */}
                        <QuestionInput
                            clearOnSend
                            placeholder="Type a new question"
                            disabled={isLoading}
                            onSend={question => makeApiRequest(question, defaultApproach, {}, {}, {})}
                            onAdjustClick={() => setIsConfigPanelOpen(!isConfigPanelOpen)}
                            // onInfoClick={() => setIsInfoPanelOpen(!isInfoPanelOpen)}
                            showClearChat={true}
                            onClearClick={clearChat}
                            onRegenerateClick={() => makeApiRequest(lastQuestionRefByChatMode.current[activeChatMode], defaultApproach, {}, {}, {})}
                        />
                    </div>
                </div>

                {answersByChatMode[activeChatMode].length > 0 && activeAnalysisPanelTab && (
                    <AnalysisPanel
                        className={styles.chatAnalysisPanel}
                        activeCitation={activeCitation}
                        sourceFile={activeCitationSourceFile}
                        pageNumber={activeCitationSourceFilePageNumber}
                        onActiveTabChanged={x => onToggleTab(x, selectedAnswer)}
                        citationHeight="760px"
                        answer={answersByChatMode[activeChatMode][selectedAnswer].response}
                        activeTab={activeAnalysisPanelTab}
                    />
                )}

                <Panel
                    headerText="Configure answer generation"
                    isOpen={isConfigPanelOpen}
                    isBlocking={false}
                    onDismiss={() => setIsConfigPanelOpen(false)}
                    closeButtonAriaLabel="Close"
                    onRenderFooterContent={() => <DefaultButton onClick={() => setIsConfigPanelOpen(false)}>Close</DefaultButton>}
                    isFooterAtBottom={true}
                    type={PanelType.custom}
                    customWidth="600px"
                >
                    {/* {activeChatMode == ChatMode.WorkPlusWeb &&
                        <div>
                            <Label>Use this datasource to answer Questions by default:</Label>
                            <div className={styles.defaultApproachSwitch}>
                                <div className={styles.defaultApproachWebOption} onClick={handleToggle}>Web</div>
                                <Switch onChange={handleToggle} checked={defaultApproach == Approaches.ReadRetrieveRead} uncheckedIcon={true} checkedIcon={true} onColor="#1B4AEF" offColor="#188d45"/>
                                <div className={styles.defaultApproachWorkOption} onClick={handleToggle}>Work</div>
                            </div>
                        </div>
                    } */}
                    {/*{activeChatMode != ChatMode.Ungrounded &&
                        <SpinButton
                            className={styles.chatSettingsSeparator}
                            label="Retrieve this many documents from search:"
                            min={1}
                            max={50}
                            defaultValue={retrieveCount.toString()}
                            onChange={onRetrieveCountChange}
                        />
                    }
                    {activeChatMode != ChatMode.Ungrounded &&
                        <Checkbox
                            className={styles.chatSettingsSeparator}
                            checked={useSuggestFollowupQuestions}
                            label="Suggest follow-up questions"
                            onChange={onUseSuggestFollowupQuestionsChange}
                        />
                    }
                    <TextField className={styles.chatSettingsSeparator} defaultValue={userPersona} label="User Persona" onChange={onUserPersonaChange} />
                    <TextField className={styles.chatSettingsSeparator} defaultValue={systemPersona} label="System Persona" onChange={onSystemPersonaChange} /> */}
                    <ResponseLengthButtonGroup className={styles.chatSettingsSeparator} onClick={onResponseLengthChange} defaultValue={responseLengthByChatMode[activeChatMode]} />
                    <ResponseTempButtonGroup className={styles.chatSettingsSeparator} onClick={onResponseTempChange} defaultValue={responseTempByChatMode[activeChatMode]} />
                    {activeChatMode == ChatMode.WorkOnly &&
                        <div>
                            <Separator className={styles.chatSettingsSeparator}>Filter Search Results by</Separator>
                            {/* <Dropdown
                                label="Folder:"
                                defaultSelectedKey={'*'}
                                onChange={onFolderChange}
                                placeholder="Select folder"
                                options={folderOptions}
                                styles={dropdownFolderStyles}
                                aria-label="folder options for file upload"
                            />  */}
                            
                            <TagPickerInline allowNewTags={false} onSelectedTagsChange={onSelectedTagsChange} preSelectedTags={selectedTags} />
                            {gettingFilterFiles ? (
                                <p className={styles.loadingText}>
                                    Getting files
                                    <span className={styles.loadingdots} />
                                </p>) : (
                                <DocumentsDetailList items={filterFileItems} groups={filterFileGroups} selectedFileKeys={selectedFileKeysChat.current} onSelectedFileKeysChange={onSelectedFileKeysChange} onRefreshClicked={fetchCompleteFiles} />
                            )}

                        </div>
                    }
                </Panel>

                {/* <Panel
                    headerText="Information"
                    isOpen={isInfoPanelOpen}
                    isBlocking={false}
                    onDismiss={() => setIsInfoPanelOpen(false)}
                    closeButtonAriaLabel="Close"
                    onRenderFooterContent={() => <DefaultButton onClick={() => setIsInfoPanelOpen(false)}>Close</DefaultButton>}
                    isFooterAtBottom={true}                >
                    <div className={styles.resultspanel}>
                        <InfoContent />
                    </div>
                </Panel> */}
            </div>
        </div>
    );
};

export default Chat;
