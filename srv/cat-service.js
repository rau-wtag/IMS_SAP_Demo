const cds = require('@sap/cds');
const { UPDATE, INSERT } = require('@sap/cds/lib/ql/cds-ql');
const { executeHttpRequest } = require('@sap-cloud-sdk/http-client');

module.exports = cds.service.impl(async function() {
    const { Details, Products, RequestItems, Requests, Logs, Users } = this.entities;

    // this.before(['CREATE', 'UPDATE', 'DELETE'], [Details, Products], async (req) => {
    
    //     const userRole = req.headers['x-user-role']; 
    //     console.log("userRole: " + userRole)
    //     if (userRole !== 'admin') {
    //         req.error(403, "Forbidden: Only administrators can modify inventory data.");
    //     }
    // });

    this.before('*', async (req) => {
        console.log('>>> Method:', req.method);
        console.log('>>> User:', req.user.id);
        console.log('>>> Roles:', req.user.roles);

        try {
            // This automatically looks up the 'XSUAA-API' destination 
            // and handles the OAuth token fetch for you.
            const response = await executeHttpRequest(
                { destinationName: 'XSUAA-API' },
                {
                    method: 'GET',
                    url: '/Users' // SCIM Endpoint for Users
                }
            );

            console.log(response.data.resources)

            return response.data.resources; // The list of users
        } catch (error) {
            console.error("Error fetching users:", error.message);
            req.error(500, "Could not fetch users from BTP");
        }
    
    });     
    this.on('getUserInfo', async (req) => {

        const loginEmail = req.user.id;

        const userProfile = await SELECT.one.from(Users).where({email: loginEmail});

        if (!userProfile) {
            return JSON.stringify({ error: "User not found in database" });
        }

        return JSON.stringify({
            email: userProfile.email,
            name: userProfile.name,
            id: userProfile.ID,
            isAdmin: req.user.is('Admin_Role'),
            isEmployee: req.user.is('Employee_Role')
        });
    });

    this.after('CREATE', 'RequestItems', async (data) => {
        await UPDATE(Products).set({ status: 'requested' }).where({ ID: data.product_ID });
    });

    this.after('UPDATE', 'RequestItems', async (data,req) => {
        const this_item = await SELECT.one.from(RequestItems).where({ID: data.ID});
        const items = await SELECT.from(RequestItems).where({ parent_ID: this_item.parent_ID });
        const this_parent = await SELECT.one.from(Requests).where({ID: this_item.parent_ID});
        
        const total = items.length;
        console.log("All items for this request:", JSON.stringify(items, null, 2));
        const approved = items.filter(i => i.status === 'APPROVED').length;
        const rejected = items.filter(i => i.status === 'REJECTED').length;
        console.log("approved: " + approved + " rejected: " + rejected)
        let finalStatus = 'PENDING';
        if (approved === total) finalStatus = 'APPROVED';
        else if (rejected === total) finalStatus = 'REJECTED';
        else if (approved > 0 || rejected > 0) finalStatus = 'PARTIAL';

        await UPDATE(Requests).set({ status: finalStatus }).where({ ID: this_item.parent_ID });
        return finalStatus;
    });

    this.after('CREATE', 'Products', async (data, req) => {
        const ID = data.ID;
        try {
            await INSERT.into(Logs).entries({
                action: 'RESTOCKED',
                product_ID: ID,
                performedBy_ID: data.adminInCharge_ID,
                timestamp: new Date().toISOString()
            })
            console.log(`[Log] Created Product ${ID} successfully`)
        } catch (error) {
            console.error(`[ERROR] Failed to create product for product ${ID}: `, error);
        }
    });
});