// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { //ChatResponse, 
    ChatRequest, 
    BlobClientUrlResponse, 
    AllFilesUploadStatus, 
    GetUploadStatusRequest, 
    GetInfoResponse, 
    ActiveCitation, 
    GetWarningBanner, 
    StatusLogEntry, 
    StatusLogResponse, 
    // ApplicationTitle, 
    //GetTagsResponse,
    DeleteItemRequest,
    ResubmitItemRequest,
    GetFeatureFlagsResponse,
    getMaxCSVFileSizeType,
    GetAppIdentityResponse,
    ContentFolder,
    FileUploadFolder,
    DataPipeline,
    DataPipelineImportRequest,
    DataPipelineImportResponse
    } from "./models";


import { IdentityManager } from "../identity";

async function httpHeaders() : Promise<HeadersInit> {
    const u = await IdentityManager.GetCurrentUser(true);
    const h =
    {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${u.AccessToken}`
    };
    return h;
}

async function authFetch(url :string, init: RequestInit) : Promise<Response> {

    init.headers = await httpHeaders();
    let resp = await fetch(url, init);
    if (resp.status == 401) {
        IdentityManager.ResetAccessToken()
        init.headers = await httpHeaders();
        resp = await fetch(url, init);
    }
    return resp;
}

export async function getAppIdentity() : Promise<GetAppIdentityResponse> {
    const response = await fetch("/getAppIdentity", {
        method: "GET",
        headers: {
            "Content-Type": "application/json"
        }
    });
    const parsedResponse: GetAppIdentityResponse = await response.json();
    if (response.status > 299 || !response.ok) {
        console.log(response);
        throw Error(parsedResponse.error || "Unknown error");
    }
    console.log(parsedResponse);
    return parsedResponse;
}

export async function dataPiplineImportData(req: DataPipelineImportRequest): Promise<DataPipelineImportResponse> {
    
    const response = await authFetch("/dataPipelineProcessData", {
        method: "POST",
        body: JSON.stringify(req)
    });
    const parsedResponse: DataPipelineImportResponse = await response.json();
    if (response.status > 299 || !response.ok) {
        throw Error("Unknown error");
    }

    return parsedResponse;
}

export async function chatApi(options: ChatRequest, signal: AbortSignal): Promise<Response> {

    const response = await authFetch("/chat", {
        method: "POST",
        body: JSON.stringify({
            history: options.history,
            approach: options.approach,
            overrides: {
                semantic_ranker: options.overrides?.semanticRanker,
                semantic_captions: options.overrides?.semanticCaptions,
                top: options.overrides?.top,
                temperature: options.overrides?.temperature,
                prompt_template: options.overrides?.promptTemplate,
                prompt_template_prefix: options.overrides?.promptTemplatePrefix,
                prompt_template_suffix: options.overrides?.promptTemplateSuffix,
                exclude_category: options.overrides?.excludeCategory,
                suggest_followup_questions: options.overrides?.suggestFollowupQuestions,
                byPassRAG: options.overrides?.byPassRAG,
                user_persona: options.overrides?.userPersona,
                system_persona: options.overrides?.systemPersona,
                ai_persona: options.overrides?.aiPersona,
                response_length: options.overrides?.responseLength,
                response_temp: options.overrides?.responseTemp,
                selected_folders: options.overrides?.selectedFolders,
                selected_tags: options.overrides?.selectedTags,
                selected_files: options.overrides?.selectedFiles
            },
            citation_lookup: options.citation_lookup,
            thought_chain: options.thought_chain
        }),
        signal: signal
    });

    if (response.status > 299 || !response.ok) {
        throw Error("Unknown error");
    }
   
    return response;
}

export function getCitationFilePath(citation: string): string {
    return `${encodeURIComponent(citation)}`;
}

export async function getBlobClientUrl(): Promise<string> {
    const response = await fetch("/getblobclienturl", {
        method: "GET",
        headers: {
            "Content-Type": "application/json"
        }
    });

    const parsedResponse: BlobClientUrlResponse = await response.json();
    if (response.status > 299 || !response.ok) {
        throw Error(parsedResponse.error || "Unknown error");
    }

    return parsedResponse.url;
}

export async function getCompleteFiles(): Promise<FileUploadFolder[]> {

    const response = await authFetch("/getcompletefiles", {
        method: "POST",
        body: JSON.stringify({})
        });
    
    const parsedResponse: any = await response.json();
    if (response.status > 299 || !response.ok) {
        throw Error(parsedResponse.error || "Unknown error");
    }
    
    return parsedResponse;
}


export async function getAllUploadStatus(options: GetUploadStatusRequest): Promise<AllFilesUploadStatus> {

    const response = await authFetch("/getalluploadstatus", {
        method: "POST",
        body: JSON.stringify({
            timeframe: options.timeframe,
            state: options.state as string,
            folder: options.folder as string,
            tag: options.tag as string
            })
        });
    
    const parsedResponse: any = await response.json();
    if (response.status > 299 || !response.ok) {
        throw Error(parsedResponse.error || "Unknown error");
    }
    const results: AllFilesUploadStatus = {statuses: parsedResponse};
    return results;
}

export async function deleteItem(options: DeleteItemRequest): Promise<boolean> {
    try {
        const response = await fetch("/deleteItems", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                path: options.path
            })
        });
        if (!response.ok) {
            // If the response is not ok, throw an error
            const errorResponse = await response.json();
            throw new Error(errorResponse.error || "Unknown error");
        }
        // If the response is ok, return true
        return true;
    } catch (error) {
        console.error("Error during deleteItem:", error);
        return false;
    }
}


export async function resubmitItem(options: ResubmitItemRequest): Promise<boolean> {
    try {
        const response = await fetch("/resubmitItems", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                path: options.path
            })
        });
        if (!response.ok) {
            // If the response is not ok, throw an error
            const errorResponse = await response.json();
            throw new Error(errorResponse.error || "Unknown error");
        }
        // If the response is ok, return true
        return true;
    } catch (error) {
        console.error("Error during deleteItem:", error);
        return false;
    }
}

export async function getDataPipelines(): Promise<DataPipeline[]> {
    const response = await authFetch("/getDataPipelines", { method: "GET"})
    return await response.json()
}

export async function getFolders(filter: string): Promise<ContentFolder[]> {
    const response = await authFetch("/getfolders", {
        method: "POST",
        body: JSON.stringify({filter})
        });
    
    const parsedResponse: ContentFolder[] = await response.json();
    if (response.status > 299 || !response.ok) {
        throw Error("Unknown error");
    }
    // Assuming parsedResponse is the array of strings (folder names) we want
    // Check if it's actually an array and contains strings
    //if (Array.isArray(parsedResponse) && parsedResponse.every(item => typeof item === 'string')) {
        return parsedResponse;
    //} else {
      //  throw new Error("Invalid response format");
    //}
}


export async function getTags(): Promise<string[]> {
    const response = await authFetch("/gettags", {
        method: "POST",
        body: JSON.stringify({
            })
        });
    
    const parsedResponse: any = await response.json();
    if (response.status > 299 || !response.ok) {
        throw Error(parsedResponse.error || "Unknown error");
    }
    // Assuming parsedResponse is the array of strings (folder names) we want
    // Check if it's actually an array and contains strings
    if (Array.isArray(parsedResponse) && parsedResponse.every(item => typeof item === 'string')) {
        return parsedResponse;
    } else {
        throw new Error("Invalid response format");
    }
}


export async function getHint(question: string): Promise<String> {
    const response = await fetch(`/getHint?question=${encodeURIComponent(question)}`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json"
        }
    });
    
    const parsedResponse: String = await response.json();
    if (response.status > 299 || !response.ok) {
        throw Error("Unknown error");
    }

    return parsedResponse;
}


export function streamData(question: string): EventSource {
    const encodedQuestion = encodeURIComponent(question);
    const eventSource = new EventSource(`/stream?question=${encodedQuestion}`);
    return eventSource;
}


export async function streamTdData(question: string, file: File): Promise<EventSource> {
    let lastError;
    const formData = new FormData();
    formData.append('csv', file);

    const response = await fetch('/posttd', {
        method: 'POST',
        body: formData,
    });

    const parsedResponse: String = await response.text();
    if (response.status > 299 || !response.ok) {
        throw Error("Unknown error");
    }
    
    const encodedQuestion = encodeURIComponent(question);
    const eventSource = new EventSource(`/tdstream?question=${encodedQuestion}`);

    return eventSource;
}

// export async function getSolve(question: string): Promise<String[]> {
//     const response = await fetch(`/getSolve?question=${encodeURIComponent(question)}`, {
//         method: "GET",
//         headers: {
//             "Content-Type": "application/json"
//         }
//     });
    
//     const parsedResponse: String[] = await response.json();
//     if (response.status > 299 || !response.ok) {
//         throw Error("Unknown error");
//     }

//     return parsedResponse;
// }
export async function refresh(): Promise<String[]> {
    const response = await fetch(`/refresh?`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        }
    });
    
    const parsedResponse: String[] = await response.json();
    if (response.status > 299 || !response.ok) {
        throw Error("Unknown error");
    }

    return parsedResponse;
}

export async function getTempImages(): Promise<string[]> {
    const response = await fetch(`/getTempImages`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json"
        }
    });
    
    const parsedResponse: { images: string[] } = await response.json();
    if (response.status > 299 || !response.ok) {
        throw Error("Unknown error");
    }
    const imgs = parsedResponse.images;
    return imgs;
}

export async function postTd(file: File): Promise<String> {
    const formData = new FormData();
    formData.append('csv', file);

    const response = await fetch('/posttd', {
        method: 'POST',
        body: formData,
    });

    const parsedResponse: String = await response.text();
    if (response.status > 299 || !response.ok) {
        throw Error("Unknown error");
    }

    return parsedResponse;
}

export async function processCsvAgentResponse(question: string, file: File, retries: number = 3): Promise<String> {
    let lastError;

    const formData = new FormData();
    formData.append('csv', file);

    const response = await fetch('/posttd', {
        method: 'POST',
        body: formData,
    });

    const parsedResponse: String = await response.text();
    if (response.status > 299 || !response.ok) {
        throw Error("Unknown error");
    }
    for (let i = 0; i < retries; i++) {
        try {
            const response = await fetch(`/process_td_agent_response?question=${encodeURIComponent(question)}`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json"
                }
            });

            const parsedResponse: String = await response.json();
            if (response.status > 299 || !response.ok) {
                throw Error("Unknown error");
            }

            return parsedResponse;
        } catch (error) {
            lastError = error;
        }
    }

    throw lastError;
}

export async function processAgentResponse(question: string): Promise<String> {
    const response = await fetch(`/process_agent_response?question=${encodeURIComponent(question)}`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json"
        }
    });
    
    const parsedResponse: String = await response.json();
    if (response.status > 299 || !response.ok) {
        throw Error("Unknown error");
    }

    return parsedResponse;    
}

export async function logStatus(status_log_entry: StatusLogEntry): Promise<StatusLogResponse> {
    var response = await fetch("/logstatus", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            "path": status_log_entry.path,
            "status": status_log_entry.status,
            "status_classification": status_log_entry.status_classification,
            "state": status_log_entry.state
            })
    });

    var parsedResponse: StatusLogResponse = await response.json();
    if (response.status > 299 || !response.ok) {
        throw Error(parsedResponse.error || "Unknown error");
    }

    var results: StatusLogResponse = {status: parsedResponse.status};
    return results;
}

export async function getInfoData(): Promise<GetInfoResponse> {
    const response = await fetch("/getInfoData", {
        method: "GET",
        headers: {
            "Content-Type": "application/json"
        }
    });
    const parsedResponse: GetInfoResponse = await response.json();
    if (response.status > 299 || !response.ok) {
        console.log(response);
        throw Error(parsedResponse.error || "Unknown error");
    }
    console.log(parsedResponse);
    return parsedResponse;
}

export async function getWarningBanner(): Promise<GetWarningBanner> {
    const response = await fetch("/getWarningBanner", {
        method: "GET",
        headers: {
            "Content-Type": "application/json"
        }
    });
    const parsedResponse: GetWarningBanner = await response.json();
    if (response.status > 299 || !response.ok) {
        console.log(response);
        throw Error(parsedResponse.error || "Unknown error");
    }
    console.log(parsedResponse);
    return parsedResponse;
}

export async function getMaxCSVFileSize(): Promise<getMaxCSVFileSizeType> {
    const response = await fetch("/getMaxCSVFileSize", {
        method: "GET",
        headers: {
            "Content-Type": "application/json"
        }
    });
    const parsedResponse: getMaxCSVFileSizeType = await response.json();
    if (response.status > 299 || !response.ok) {
        console.log(response);
        throw Error(parsedResponse.error || "Unknown error");
    }
    console.log(parsedResponse);
    return parsedResponse;
}

export async function getCitationObj(citation: string): Promise<ActiveCitation> {
    const response = await fetch(`/getcitation`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            citation: citation
        })
    });
    const parsedResponse: ActiveCitation = await response.json();
    if (response.status > 299 || !response.ok) {
        console.log(response);
        throw Error(parsedResponse.error || "Unknown error");
    }
    return parsedResponse;
}

// export async function getApplicationTitle(): Promise<ApplicationTitle> {
//     console.log("fetch Application Titless");
//     const response = await fetch("/getApplicationTitle", {
//         method: "GET",
//         headers: {
//             "Content-Type": "application/json"
//         }
//     });

//     const parsedResponse: ApplicationTitle = await response.json();
//     if (response.status > 299 || !response.ok) {
//         console.log(response);
//         throw Error(parsedResponse.error || "Unknown error");
//     }
//     console.log(parsedResponse);
//     return parsedResponse;
// }

// export async function getAllTags(): Promise<GetTagsResponse> {
//     const response = await authFetch("/getalltags", {
//         method: "GET"
//     });

//     const parsedResponse: any = await response.json();
//     if (response.status > 299 || !response.ok) {
//         console.log(response);
//         throw Error(parsedResponse.error || "Unknown error");
//     }
//     var results: GetTagsResponse = {tags: parsedResponse};
//     return results;
//}

export async function getFeatureFlags(): Promise<GetFeatureFlagsResponse> {
    const response = await fetch("/getFeatureFlags", {
        method: "GET",
        headers: {
            "Content-Type": "application/json"
        }
    });
    const parsedResponse: GetFeatureFlagsResponse = await response.json();
    if (response.status > 299 || !response.ok) {
        console.log(response);
        throw Error(parsedResponse.error || "Unknown error");
    }
    console.log(parsedResponse);
    return parsedResponse;
}