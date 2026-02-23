import Controller from "sap/ui/core/mvc/Controller";
import UIComponent from "sap/ui/core/UIComponent";
import JSONModel from "sap/ui/model/json/JSONModel";

/**
 * @namespace imsts.controller
 */
export default class App extends Controller {

    /*eslint-disable @typescript-eslint/no-empty-function*/
    public onInit(): void {

    }

    public onLogout() : void {
        var oSecurityModel = (this.getOwnerComponent() as UIComponent).getModel("security") as JSONModel;
        oSecurityModel.setData({
            isAdmin: false,
            isLoggedIn: false,
            user: "",
            name:"",
            ID:"",
            role:""
        })
        
        window.location.href = "/app-logout"
    
    }
}