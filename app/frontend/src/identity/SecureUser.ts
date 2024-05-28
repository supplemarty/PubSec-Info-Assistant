import { jwtDecode } from "jwt-decode";
import { IdTokenClaims } from "@azure/msal-browser";

interface IClaims extends IdTokenClaims {
    email : string | undefined;
}

export class SecureUser {

    AccessToken: string | undefined;
    UserId: string | undefined;
    Email: string | undefined;

    constructor(token: string) {
        this.AccessToken = token;
        let claims = jwtDecode<IClaims>(token);
        this.UserId = claims.upn;
        this.Email = claims.email;
    }
}
