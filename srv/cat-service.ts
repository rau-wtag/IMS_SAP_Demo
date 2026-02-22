import cds, {ApplicationService, Request} from '@sap/cds';

import {Details, Products, Requests, RequestItems, Logs, Users} from '#cds-models/my/inventory';

export class CatalogService extends ApplicationService {
    async init() {
        this.on('getUserInfo', async (req : Request) => {
            try {
                console.log('>>> Method:', req.method);
                console.log('>>> User:', req.user.id);
                console.log('>>> Roles:', req.user.roles);
    
                const userEmail = req.user.id;
                const firstName = req.user.attr.givenName || "";
                const lastName = req.user.attr.familyName || "";
                const fullName = `${firstName} ${lastName}`.trim() || userEmail;
                const bIsAdmin = req.user.is('Admin_Role');
                const bIsEmployee = req.user.is('Employee_Role');
    
                if (!bIsAdmin && !bIsEmployee) {
                        return req.error(403, "Sorry, no roles have been assigned to you in BTP. You cannot enter.");
                }
    
                const hanaRole = bIsAdmin ? 'admin' : 'user';
                let userProfile = await SELECT.one.from(Users).where({email: userEmail});
    
                if (!userProfile) {
                    console.log(`>>> User ${userEmail} not found. Auto-creating...`);
    
                    await INSERT.into(Users).entries({
                        ID: userEmail,
                        name: fullName,
                        email: userEmail,
                        role: hanaRole 
                    });
                    userProfile = { ID: userEmail, name: fullName, email: userEmail, role: hanaRole };
                }
    
                return {
                        ID: userProfile.ID,
                        name: userProfile.name,
                        email: userProfile.email,
                        role: userProfile.role,
                        isAdmin: bIsAdmin,       
                        isEmployee: bIsEmployee  
                    };
            } catch (error) {
                console.error("Error in getUserInfo:", error);
                return req.error(500, "User validation failed");
            }
        });

        this.before('CREATE', Details, async (req) => {
            const { name } = req.data;
            if (!name) return req.error(400, "Product Name is required");
            const existing = await SELECT.one.from(Details)
                .where({ name: name });
    
            if (existing) {
                return req.error(409, `Product "${name}" already exists. Please use a unique name.`);
            }
        });

        this.after('CREATE', RequestItems, async (data) => {
            await UPDATE(Products).set({ status: 'requested' }).where({ ID: data?.product_ID });
        });

        this.after('UPDATE', RequestItems, async (data, req : Request) => {
            const this_item = await SELECT.one.from(RequestItems).where({ID: data?.ID});
            if(!this_item) return;

            const items = await SELECT.from(RequestItems).where({ parent_ID: this_item.parent_ID });            
            const total = items.length;
            console.log("All items for this request:", JSON.stringify(items, null, 2));
            const approved = items.filter(i => i.status === 'APPROVED').length;
            const rejected = items.filter(i => i.status === 'REJECTED').length;
            console.log("approved: " + approved + " rejected: " + rejected)

            let finalStatus: 'PENDING' | 'APPROVED' | 'REJECTED' | 'PARTIAL' = 'PENDING'
            if (approved === total) finalStatus = 'APPROVED';
            else if (rejected === total) finalStatus = 'REJECTED';
            else if (approved > 0 || rejected > 0) finalStatus = 'PARTIAL';
    
            await UPDATE(Requests).set({ status: finalStatus }).where({ ID: this_item.parent_ID });
        });

        this.before('DELETE', RequestItems, async (req: Request & {cleanupParentID? : string}) => {
            
            console.log("[DATA]", req.data.ID)
            const this_item = await SELECT.one.from(RequestItems).where({ID: req.data.ID});
            if(!this_item) return;

            const this_parent = await SELECT.one.from(Requests).where({ID: this_item.parent_ID});
            var this_product = await SELECT.one.from(Products).where({ID: this_item.product_ID});
            if(!this_parent || !this_product) return;
    
        
            req.cleanupParentID = this_parent.ID
            let finalStatus : 'available' | 'request' | 'repair' | null = null
    
            if(this_parent.type === 'request')
            {
                finalStatus = 'available'
            }
            else if (this_parent.type === 'repair')
            {
                if(!this_product.currentPossession_ID)
                {
                    finalStatus = 'available'
                }
                else finalStatus = null
            }
    
            await UPDATE(Products).set({ status: finalStatus }).where({ ID: this_product.ID });
        
        });

        this.after('DELETE', RequestItems, async (res, req: Request & {cleanupParentID? : string} ) => {
            if(req.cleanupParentID) {
                const items = await SELECT.from(RequestItems).where({ parent_ID: req.cleanupParentID })
    
                if (items.length === 0) {
                    console.log("Auto-deleting empty request:", req.cleanupParentID);
                    await DELETE.from(Requests).where({ ID: req.cleanupParentID });
                }
            }
        });

        this.after('CREATE', Products, async (data, req : Request) => {
            const ID = data?.ID;
            try {
                if(!req.user.id)
                {
                    console.error(`[ERROR] User ${req.user.id} not found/authenticated`, Error)
                }
                await INSERT.into(Logs).entries({
                    action: 'RESTOCKED',
                    product_ID: ID,
                    performedBy_ID: req.user.id,
                    timestamp: new Date().toISOString()
                })
                console.log(`[Log] Created Product ${ID} successfully by ${req.user.id}`)
            } catch (error) {
                console.error(`[ERROR] Failed to create product for product ${ID}: `, error);
            }
        });

        return super.init();
    }
}