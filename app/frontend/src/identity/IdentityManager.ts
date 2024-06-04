import { PublicClientApplication, InteractionRequiredAuthError, RedirectRequest, Configuration } from "@azure/msal-browser";
import { authentication as teamsAuth} from "@microsoft/teams-js";
// import { inTeams } from "./TeamsHelper";
import { SecureUser } from "./SecureUser";
import { getAppIdentity } from "../api";

// MSAL request object to use over and over
const msalRequest : RedirectRequest = {
    //scopes: [`${APP_ID_URI}/${CLIENT_ID}/.default`]
    //scopes: [`${CLIENT_ID}/.default`]
    scopes: ["api://infoasst-korzd/access_as_user"]
    
}

export class IdentityManager {

    private static _intialized: boolean = false;
    private static _msalClient: PublicClientApplication | undefined;
    

    protected static async verifyInitialized() : Promise<void> {
        if (!IdentityManager._intialized) {
            const appId = await getAppIdentity();
            const msalConfig = {
                auth: {
                    clientId: appId.AZURE_WEBAPP_CLIENT_ID,
                    authority: `https://login.microsoftonline.com/${appId.AZURE_TENANT_ID}`,
                    redirectUri: `${window.location.origin}/authreturn.html` 
                }
            };
            IdentityManager._msalClient = new PublicClientApplication(msalConfig);
            await IdentityManager._msalClient.initialize();
            IdentityManager._intialized = true;
        }
    }

    public static async HandleRedirect() : Promise<void>
    {
        await IdentityManager.verifyInitialized();
        const msalClient = IdentityManager._msalClient!;
        await msalClient?.handleRedirectPromise();
    }

    public static async GetCurrentUser(login: boolean = true) : Promise<SecureUser>
    {
        let token: string | undefined;

        // if (await inTeams()) {        
            
        //     token = await teamsAuth.getAuthToken();  
        // }
        // else
        // {        
            await IdentityManager.verifyInitialized();
            token = await IdentityManager.__getAccessToken(login);
        // }

        if (token) {
            return new SecureUser(token);
        } else {
            throw new Error("No Token Found!");
        }

    }

    private static getAccessTokenPromise : Promise<string | undefined>;        // Cache the promise so we only do the work once on this page
    private static async __getAccessToken(login: boolean) : Promise<string | undefined> {
     if (!IdentityManager.getAccessTokenPromise) {
        IdentityManager.getAccessTokenPromise = IdentityManager._getAccessToken(login);
     }
     return IdentityManager.getAccessTokenPromise;
    }    

    private static async _getAccessToken(login: boolean) : Promise<string | undefined> {
        
        const msalClient = IdentityManager._msalClient!;

        try {
            await msalClient.ssoSilent(msalRequest);
        } catch (error: any) {
            if (login)
                await msalClient.loginRedirect(msalRequest);
            else
                throw error;
        }

        const accounts = msalClient.getAllAccounts();
        if (accounts.length === 1) {
            msalRequest.account = accounts[0];
        } else {
            throw ("Error: Too many or no accounts logged in");
        }

        let accessToken;
        try {
            const tokenResponse = await msalClient.acquireTokenSilent(msalRequest);
            accessToken = tokenResponse.accessToken;
            return accessToken;
        } catch (error: any) {
            if ((error instanceof InteractionRequiredAuthError) && (login)) {
                console.warn("Silent token acquisition failed; acquiring token using redirect");
                msalClient.acquireTokenRedirect(msalRequest);
            } else {
                throw (error.message);
            }
        }
    }

}





// const msalClient = new PublicClientApplication(msalConfig);
// let init = false;

// let getAccessTokenPromise : Promise<string | undefined>;        // Cache the promise so we only do the work once on this page
// export function getAccessToken() : Promise<string | undefined> {
//     if (!getAccessTokenPromise) {
//         getAccessTokenPromise = getAccessToken2();
//     }
//     return getAccessTokenPromise;
// }

// async function getAccessToken2() : Promise<string | undefined> {
//     // If we were waiting for a redirect with an auth code, handle it here
//     if (!init) {
//         await msalClient.initialize();
//         init = true;
//     }
//     await msalClient.handleRedirectPromise();

//     try {
//         await msalClient.ssoSilent(msalRequest);
//     } catch (error) {
//         await msalClient.loginRedirect(msalRequest);
//     }

//     const accounts = msalClient.getAllAccounts();
//     if (accounts.length === 1) {
//         msalRequest.account = accounts[0];
//     } else {
//         throw ("Error: Too many or no accounts logged in");
//     }

//     let accessToken;
//     try {
//         const tokenResponse = await msalClient.acquireTokenSilent(msalRequest);
//         accessToken = tokenResponse.accessToken;
//         return accessToken;
//     } catch (error: any) {
//         if (error instanceof InteractionRequiredAuthError) {
//             console.warn("Silent token acquisition failed; acquiring token using redirect");
//             msalClient.acquireTokenRedirect(msalRequest);
//         } else {
//             throw (error.message);
//         }
//     }
// }