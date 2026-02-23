import BaseComponent from "sap/ui/core/UIComponent";
import { createDeviceModel } from "./model/models";
import Router from  "sap/ui/core/routing/Router";
import JSONModel from "sap/ui/model/json/JSONModel";

/**
 * @namespace imsts
 */

export default class Component extends BaseComponent {

	public static metadata = {
		manifest: "json",
        interfaces: [
            "sap.ui.core.IAsyncContentCreation"
        ]
	};

    private countdown: number = 120000;
    private _iTimerId?: number;
  
	public init() : void {
		// call the base component's init function
		super.init();

        // set the device model
        this.setModel(createDeviceModel(), "device");

        sap.ui.getCore().getMessageManager().registerObject(this, true);
        this.setModel(sap.ui.getCore().getMessageManager().getMessageModel(), "message");

        const sSavedUser = localStorage.getItem("inventoryUser");
        const oUserData : JSONModel = sSavedUser ? JSON.parse(sSavedUser) : {isAdmin: false, isEmployee: false, user: "", ID: "", name: "", role:"" };
        const oSecurityModel = new JSONModel(oUserData);
        this.setModel(oSecurityModel, "security");

        this._loadUser(oSecurityModel);

        const oCartModel = new JSONModel({
            items: [],
            count: 0
        });
        this.setModel(oCartModel, "cart");

        // this._startInactivityTimer();
        // this._setupActivityListeners();

        // enable routing
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

            console.log(oFreshData)
        
            oSecurityModel.setData(oFreshData);
            localStorage.setItem("inventoryUser", JSON.stringify(oFreshData));

            this._startInactivityTimer();
            this._setupActivityListeners();
        
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
        // console.log("Resetting inactivity timer")
        this._startInactivityTimer();
    }

    private _startInactivityTimer(): void {

        // console.log("Staring inactivity timer")
        if (this._iTimerId) {
            clearTimeout(this._iTimerId);
        }

        this._iTimerId = window.setTimeout(() => {
            console.log("Enough, get out")
            window.location.href = "/app-logout";
        }, this.countdown);
    }

    public exit(): void {
    if (this._iTimerId) {
        clearTimeout(this._iTimerId);
    }
}
}
