import { jwtDecode } from "jwt-decode";
import { IdTokenClaims } from "@azure/msal-browser";

export class SecureUser {

    AccessToken: string | undefined;
    UserId: string | undefined;

    constructor(token: string) {
        this.AccessToken = token;
        let claims = jwtDecode<IdTokenClaims>(token);
        this.UserId = claims.upn;
    }
}
