import UIComponent from 'sap/ui/core/UIComponent';
import JSONModel from "sap/ui/model/json/JSONModel";
import {createDeviceModel } from "./model/models";
import Router from  "sap/ui/core/routing/Router";

interface SecurityData {
    isAdmin: boolean;
    isEmployee: boolean;
    user: string;
    ID: string;
    name: string;
    role: string;
}

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
        const oUserData : SecurityData = sSavedUser ? JSON.parse(sSavedUser) : {isAdmin: false, isEmployee: false, user: "", ID: "", name: "", role:"" };
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

    private _loadUser(oSecurityModel : JSONModel) : void {
        $.get("/odata/v4/catalog/getUserInfo()")
            .done((data: any) => {
                let oData = data.value ?? data;
                if (typeof oData === "string") {
                    oData = JSON.parse(oData);
                }

                const oFreshData: SecurityData = {
                    isAdmin: oData.isAdmin,
                    isEmployee: oData.isEmployee,
                    user: oData.email,
                    ID: oData.ID,
                    name: oData.name,
                    role: oData.role
                };

                oSecurityModel.setData(oFreshData);
                localStorage.setItem("inventoryUser", JSON.stringify(oFreshData));
            })
            .fail(() => {
                const oRouter: Router = this.getRouter();
                oRouter.navTo("Login");
            });
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