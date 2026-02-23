import Dialog from "sap/m/Dialog";
import MessageBox from "sap/m/MessageBox";
import MessageToast from "sap/m/MessageToast";
import Event from "sap/ui/base/Event";
import Control from "sap/ui/core/Control";
import Fragment from "sap/ui/core/Fragment";
import Controller from "sap/ui/core/mvc/Controller";
import UIComponent from "sap/ui/core/UIComponent";
import JSONModel from "sap/ui/model/json/JSONModel";
import ODataModel from "sap/ui/model/odata/v4/ODataModel";

/**
 * @namespace ims.controller
 */
interface CartItem {
    ID: string;
    [key: string]: any;
}

export default class App extends Controller {

    private _pCartDialog?: Promise<Dialog>;

    /*eslint-disable @typescript-eslint/no-empty-function*/
    public onInit(): void {

        var oLoginModel = new JSONModel({
            isLoggedIn: false
        });

        this.getView()?.setModel(oLoginModel, "isLogin");

        var oRouter = (this.getOwnerComponent() as UIComponent).getRouter();
        oRouter.attachRoutePatternMatched(this._onRouteMatched, this);

    }

    private _onRouteMatched(oEvent:Event) : void {
        var sRouteName = oEvent.getParameter("name" as never);
        var oUIModel = this.getView()?.getModel("isLogin") as JSONModel;

        if (sRouteName === "Login") {
            oUIModel!.setProperty("/isLoggedIn", false);
        } else {
            oUIModel!.setProperty("/isLoggedIn", true);
        }
    }

    public onOpenCart(): void {
        const oView = this.getView();

        if (!this._pCartDialog) {
            this._pCartDialog = Fragment.load({
                id: oView!.getId(),
                name: "ims.view.fragments.Cart",
                controller: this
            }).then((oControl) => {
                const oDialog = oControl as Dialog;
                oView!.addDependent(oDialog);
                return oDialog;
            });
}

        this._pCartDialog!.then((oDialog: Dialog) => {
            oDialog.open();
        });
    }

    public onCloseCart(): void {
        (this.byId("cartDialog") as Dialog).close();
    }

    public onDeleteCartItem(oEvent: Event): void {

        const oCartModel = (this.getOwnerComponent() as UIComponent).getModel("cart") as JSONModel;
        const aItems = oCartModel.getProperty("/items") as CartItem[];

        const oButton = oEvent.getSource();
        const oBindingContext = (oButton as any).getBindingContext("cart");

        const sIdToRemove = oBindingContext.getProperty("ID");

        const aNewItems = aItems.filter(item => item.ID !== sIdToRemove);

        oCartModel.setProperty("/items", aNewItems);
        oCartModel.setProperty("/count", aNewItems.length);

        MessageToast.show("Removed from cart");
    }

    public onConfirmCart(): void {

        const oModel = (this.getOwnerComponent() as UIComponent).getModel() as ODataModel;
        const oCartModel = (this.getOwnerComponent() as UIComponent).getModel("cart") as JSONModel;

        const aItems = oCartModel.getProperty("/items") as CartItem[];
        const sCause = (this.byId("requestCause") as any).getValue();
        const sUser = ((this.getOwnerComponent() as UIComponent)
            .getModel("security") as JSONModel)
            .getProperty("/ID") as string;

        if (!sCause) {
            MessageToast.show("Please provide a reason for your request.");
            return;
        }

        this.getView()!.setBusy(true);

        const sGroupId = "requestGroup";

        const oRequestBinding = oModel.bindList("/Requests", undefined, undefined, undefined, {
            $$updateGroupId: sGroupId
        });

        const oNewRequest = oRequestBinding.create({
            requestNo: "REQ-" + Math.floor(1000 + Math.random() * 9000),
            requestedBy_ID: sUser,
            type: "request",
            cause: sCause,
            status: "PENDING"
        });

        oModel.submitBatch(sGroupId)
            .then(() => oNewRequest.created())
            .then(() => {

                const sReqID = oNewRequest.getProperty("ID");

                const oItemBinding = oModel.bindList("/RequestItems", undefined, undefined, undefined, {
                    $$updateGroupId: sGroupId
                });

                aItems.forEach(item => {
                    oItemBinding.create({
                        parent_ID: sReqID,
                        product_ID: item.ID,
                        status: "PENDING"
                    });
                });

                return oModel.submitBatch(sGroupId);

            })
            .then(() => {

                this.getView()!.setBusy(false);

                MessageToast.show(
                    "Request Submitted! Check Message Popover in the footer. If there is no popover, then the operation was successful!"
                );

                oCartModel.setProperty("/items", []);
                oCartModel.setProperty("/count", 0);

                this.onCloseCart();

            })
            .catch((oError: Error) => {

                this.getView()!.setBusy(false);

                MessageBox.error("Submission failed: " + oError.message);
            });
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