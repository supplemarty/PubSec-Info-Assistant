import React, { useState, useEffect, PropsWithChildren } from "react";
// import { useNavigate, useNavigation } from "react-router-dom";
import { IdentityManager } from "./IdentityManager";
import { SecureUser  } from "./SecureUser";
import { jsx } from "react/jsx-runtime";

//  interface Props {
//     postAuthUrl: string;
// }

export const SecureLanding = ({ children }: PropsWithChildren) => {
    
    const [user, setUser] = useState<SecureUser | undefined>()
    // const nav = useNavigate();
    // const nn = useNavigation();
    // var l = nn.location;

    //const su = await im.TryGetCurrentUser(true);

    useEffect(() => {
        IdentityManager.GetCurrentUser(true).then((u) => {
            setUser(u);
            // nav(postAuthUrl)
            }
        );
    }, []);

     if (user)
        return (<>{children}</>);
     else
        return (
            <div>
                <p>Authenticating...</p>
            </div>
        );
};


