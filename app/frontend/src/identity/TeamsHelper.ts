import { app, HostName } from "@microsoft/teams-js";

let teamsInitPromise : Promise<void>;
export function ensureTeamsSdkInitialized(): Promise<void> {
    if (!teamsInitPromise) {
        teamsInitPromise = app.initialize();
    }
    return teamsInitPromise;
}

// async function returns true if we're running in Teams
export async function inTeams() : Promise<boolean> {
    try {
        await ensureTeamsSdkInitialized();
        const context = await app.getContext();
        return (context.app.host.name === HostName.teams);
    }
    catch (e) {
        console.log(`${e} from Teams SDK, may be running outside of Teams`);    
        return false;
    }
}