import { IdentityManager } from "./IdentityManager";

IdentityManager.HandleRedirect().then(() => {
    window.location.href = '/index.html';
});
    
