const cds = require('@sap/cds');
const { executeHttpRequest } = require('@sap-cloud-sdk/http-client');

module.exports = async function () {
    const dest = { destinationName: 'XSUAA-API' };

    // ========================================================================
    // 1. READ USERS (The Main List)
    // ========================================================================
    this.on('READ', 'User', async (req) => {
        try {
            let scimUrl = '/Users?attributes=id,userName,emails,active,origin,groups,name';
            
            // --- SMART FILTERING START ---
            // If the UI is asking for a specific user (Object Page), 
            // req.data will contain the keys (userName and originKey).
            // We append a SCIM filter to the BTP URL to get ONLY that user.
            
            if (req.data.userName && req.data.originKey) {
                // Construct SCIM Filter: userName eq "..." and origin eq "..."
                // encodeURIComponent ensures special chars like '@' don't break the URL
                const filter = `userName eq "${encodeURIComponent(req.data.userName)}" and origin eq "${req.data.originKey}"`;
                scimUrl += `&filter=${filter}`;
            }
            // --- SMART FILTERING END ---

            // 1. Fetch from BTP
            const response = await executeHttpRequest(dest, {
                method: 'GET',
                url: scimUrl
            });

            // 2. Map the data (Same logic as before)
            // Note: If we filtered, 'resources' will contain just 1 user.
            const users = response.data.resources.map(u => {
                const userOrigin = u.origin; 
                
                return {
                    userName: u.userName,
                    originKey: userOrigin,
                    btpId: u.id,
                    externalId: u.externalId || "",
                    firstName: u.name ? u.name.givenName : "",
                    lastName: u.name ? u.name.familyName : "",
                    displayName: u.name ? `${u.name.givenName} ${u.name.familyName}` : u.userName,
                    eMail: u.emails?.[0]?.value || "",
                    isActive: u.active,
                    isVerified: true,

                    // Fix for Object Page Header
                    origin: {
                        originKey: userOrigin,
                        name: (userOrigin === "sap.default" ? "SAP ID Service" : userOrigin)
                    },

                    // Fix for Object Page Tables
                    authorizations: u.groups ? u.groups.map(g => ({
                        parent_userName: u.userName,
                        parent_originKey: userOrigin,
                        authorization_ID: g.value,
                        authorization: {
                            ID: g.value,
                            name: g.display,
                            description: "Assigned via BTP"
                        }
                    })) : []
                };
            });

            return users;

        } catch (error) {
            console.error("User Read Error:", error.message);
            req.error(500, "Failed to fetch BTP Users");
        }
    });

    // ========================================================================
    // 2. READ USER AUTHORIZATIONS (The Table of Roles)
    // ========================================================================
    // This is the handler that was MISSING. It catches the separate request.
    this.on('READ', 'UserAuthorization', async (req) => {
        try {
            // We fetch ALL users again (or you could filter if req.query has keys)
            // Ideally, we'd check req.query.parent_userName to filter the API call, 
            // but fetching all is safer for this small list.
            const response = await executeHttpRequest(dest, {
                method: 'GET',
                url: '/Users?attributes=id,userName,origin,groups'
            });

            const allAssignments = [];

            // We loop through every user and extract their roles into a flat list
            response.data.resources.forEach(u => {
                if (u.groups) {
                    u.groups.forEach(g => {
                        allAssignments.push({
                            // The Composite Keys (Must match schema exactly)
                            parent_userName: u.userName,
                            parent_originKey: u.origin,
                            authorization_ID: g.value, // The Role Name

                            // The Expanded Object (So CAP doesn't query 'Authorization' table)
                            authorization: {
                                ID: g.value,
                                name: g.display,
                                description: "Assigned via BTP"
                            }
                        });
                    });
                }
            });

            return allAssignments;

        } catch (error) {
            console.error("UserAuth Read Error:", error.message);
            req.error(500, "Failed to fetch User Roles");
        }
    });

    // ========================================================================
    // 3. READ AVAILABLE ROLES (The Dropdown)
    // ========================================================================
    this.on('READ', 'Authorization', async (req) => {
        try {
            const response = await executeHttpRequest(dest, { method: 'GET', url: '/Groups' });
            return response.data.resources.map(g => ({
                ID: g.displayName, // Mapping Name to ID string
                name: g.displayName,
                description: g.description || ""
            }));
        } catch (error) {
            console.error("Roles Read Error:", error.message);
            return []; // Return empty if fails, prevents crash
        }
    });

    // ========================================================================
    // 4. READ IDP (The Origin Dropdown)
    // ========================================================================
    this.on('READ', 'IdP', async (req) => {
        return [
            { originKey: "sap.default", name: "SAP ID Service" },
            { originKey: "sap.custom", name: "Custom Identity Provider" } // Add yours here
        ];
    });
};