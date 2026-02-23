import UIComponent from 'sap/ui/core/UIComponent';
import JSONModel from "sap/ui/model/json/JSONModel";
import {createDeviceModel } from "./model/models";
import Router from  "sap/ui/core/routing/Router";


export default class Component extends UIComponent {
    public static metadata = {
        manifest: "json",
        interfaces: [
            "sap.ui.core.IAsyncContentCreation"
        ]
    }

    private countdown: number = 240000;
    private _iTimerId?: number;

    public init() : void {
        super.init();

        this.setModel(createDeviceModel(), "device");

        const sSavedUser = localStorage.getItem("inventoryUser");
        const oUserData = sSavedUser ? JSON.parse(sSavedUser) : {isAdmin: false, isEmployee: false, user: "", ID: "", name: "", role:"" };
        const oSecurityModel = new JSONModel(oUserData);
        this.setModel(oSecurityModel, "security");

        this._loadUser(oSecurityModel);

        const oCartModel = new JSONModel({
            items: [],
            count: 0
        });
        this.setModel(oCartModel, "cart");

        this._startInactivityTimer();
        this._setupActivityListeners();

        this.getRouter().initialize();


    }

    private async _loadUser(oSecurityModel : JSONModel) : Promise<void> {
        const oModel = this.getModel() as any;

        try {
            const oContext = oModel.bindContext("/getUserInfo()");
            const oResult = await oContext.requestObject();
        
            const oFreshData = {
                isAdmin: oResult.isAdmin,
                isEmployee: oResult.isEmployee,
                user: oResult.email,
                ID: oResult.ID,
                name: oResult.name,
                role: oResult.role
            };
        
            oSecurityModel.setData(oFreshData);
            localStorage.setItem("inventoryUser", JSON.stringify(oFreshData));
        
        } catch (error) {
        
            this.getRouter().navTo("Login");
        }
    }

    private _setupActivityListeners(): void {
        const aEvents: string[] = ["mousemove", "keydown", "click", "touchstart", "scroll"];
        const fnReset = this._resetInactivityTimer.bind(this);

        aEvents.forEach((sEvent: string) => {
            document.addEventListener(sEvent, fnReset);
        });
    }

    private _resetInactivityTimer(): void {
        if (this._iTimerId) {
            clearTimeout(this._iTimerId);
        }
        this._startInactivityTimer();
    }

    private _startInactivityTimer(): void {
        this._iTimerId = window.setTimeout(() => {
            window.location.replace("/app-logout");
        }, this.countdown);
    }
}