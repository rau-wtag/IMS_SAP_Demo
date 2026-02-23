import Controller from "sap/ui/core/mvc/Controller";
import JSONModel from "sap/ui/model/json/JSONModel";
import UIComponent from "sap/ui/core/UIComponent";
import VizFrame from "sap/viz/ui5/controls/VizFrame";
import Event from "sap/ui/base/Event";
import FilterOperator from "sap/ui/model/FilterOperator";
import Filter from "sap/ui/model/Filter";
import ListBinding from "sap/ui/model/ListBinding";
import Context from "sap/ui/model/Context";
import ODataListBinding from "sap/ui/model/odata/v4/ODataListBinding";
import { SearchField$SearchEventParameters } from "sap/m/SearchField";
import Control from "sap/ui/core/Control";
import Fragment from "sap/ui/core/Fragment";
import Dialog from "sap/m/Dialog";
import Input from "sap/m/Input";
import ComboBox from "sap/m/ComboBox";
import MessageBox from "sap/m/MessageBox";
import BusyIndicator from "sap/ui/core/BusyIndicator";
import MessageToast from "sap/m/MessageToast";
import ODataModel from "sap/ui/model/odata/v4/ODataModel";

/**
 * @namespace ims.controller
 */
export default class home extends Controller {

    private _popovers: Record<string, any> = {};
    private _pDialog?: Promise<Dialog>;

    /*eslint-disable @typescript-eslint/no-empty-function*/
    public onInit(): void {
        var oUiModel = new JSONModel({
            totalRestockCost: 0,
            totalRepairCost: 0,
            totalEvalCost: 0
        });
        var secModel = this.getOwnerComponent()!.getModel("security");
        console.log("here i am:");
        console.log((secModel as JSONModel).getData());
        this.getView()!.setModel(oUiModel, "ui");
        var oVizFrame = this.byId("idVizFramePie");
        var oVizFrame1 = this.byId("idVizFramePie1"); 
        (oVizFrame as VizFrame)!.setVizProperties({
            legend: { title: { visible: true } },
            title: { visible: true, text: 'Asset Status Distribution' },
            plotArea: {
                dataLabel: {
                    visible: true,
                    type: 'percentage'
                },
                colorPalette: ['#2b7d2b', '#bb0000', '#e69a00', '#5d66d4'] // Custom Colors
            }
        });  
        (oVizFrame1 as VizFrame)!.setVizProperties({
            legend: { title: { visible: true } },
            plotArea: {
                dataLabel: {
                    visible: true,
                    type: 'percentage'
                },
                //colorPalette: ['#89d089ff', '#e3a5a5ff', '#d9b671ff', '#aeb2dfff'] // Custom Colors
            }
        }); 
        var oMessageManager = sap.ui.getCore().getMessageManager();
        this.getView()!.setModel(oMessageManager.getMessageModel(), "message");
        oMessageManager.registerObject(this.getView()!, true); 
        var oRouter = (this.getOwnerComponent()! as UIComponent).getRouter();
        oRouter.getRoute("Routehome")!.attachPatternMatched(this._onObjectMatched, this);

    }

    public _onObjectMatched() : void {
        this.getView()!.setBusy(true);
        this.getView()!.getModel()!.refresh();
        this._loadAnalyticalData();
        //this._applyFilters();
        this._applyDistributionFilter("available");
    }

    public onToggleDistribution(oEvent:Event) : void {
        var iIndex = oEvent.getParameter("selectedIndex" as never);
        var sStatus = (iIndex === 0) ? "available" : null;
        this._applyDistributionFilter(sStatus);
    }
    
    private _applyDistributionFilter(sStatus: string | null) : void {
        var oVizFrame = this.byId("idVizFramePie1")! as VizFrame;
        var oBinding = oVizFrame.getDataset().getBinding("data") as ListBinding; 
        if (oBinding) {
            oBinding.attachEventOnce("dataReceived",  () => {
                this.getView()!.setBusy(false);
            });
            oBinding.filter([
                new Filter("unit_type", FilterOperator.NE, null), // Basic data check
                new Filter("status", FilterOperator.EQ, sStatus)
            ]);
        } else {
            oVizFrame.addEventDelegate({
                onAfterRendering:  () => {
                    this._applyDistributionFilter(sStatus);
                }
            });
        }
    }

    private _loadAnalyticalData() : void {
        var oModel = this.getOwnerComponent()!.getModel()!;
        var oUiModel = this.getView()!.getModel("ui")! as JSONModel;
        (oModel.bindList("/StockAlerts") as ODataListBinding).requestContexts().then(function (aCtx : Context []) {
            var total = aCtx.reduce((acc: number, c: Context) => acc + (parseFloat(c.getProperty("estimatedCost")) || 0), 0);
            oUiModel.setProperty("/totalRestockCost", total);
        });
        (oModel.bindList("/MaintenanceAlerts") as ODataListBinding).requestContexts().then(function (aCtx : Context []) {
            var total = aCtx.reduce((acc: number, c: Context) => acc + (parseFloat(c.getProperty("estRepairCost")) || 0), 0);
            oUiModel.setProperty("/totalRepairCost", total);
        });
        (oModel.bindList("/TotalValuation") as ODataListBinding).requestContexts().then(function (aCtx : Context []) {
            var total = aCtx.reduce((acc: number, c: Context) => acc + (parseFloat(c.getProperty("total_value")) || 0), 0);
            oUiModel.setProperty("/totalEvalCost", total);
        });
    }

    public onSearchCategory(oEvent : Event<SearchField$SearchEventParameters>) : void {
        var sQuery = oEvent.getParameter("query");
        var oBinding = this.byId("categoryHBox")!.getBinding("items")! as ListBinding;
        if (sQuery && sQuery.length > 0) {
            var oFilter = new Filter("unit_type", FilterOperator.Contains, sQuery);
            oBinding.filter([oFilter]);
        } else {
            oBinding.filter([]);
        }
    }

    public onShowRestockPopover(oEvent: Event): void {
        this._openPopover(oEvent.getSource() as Control, "ims.view.fragments.RestockBreakdown");
    }

    public onShowRepairPopover(oEvent: Event): void {
        this._openPopover(oEvent.getSource() as Control, "ims.view.fragments.RepairBreakdown");
    }

    public onShowValuationPopover(oEvent: Event): void {
        this._openPopover(oEvent.getSource() as Control, "ims.view.fragments.ValuationBreakdown");
    }

    private _openPopover(oControl : Control, sFragmentName: string) : void {
        if (!this._popovers) { this._popovers = {}; }

        if (!this._popovers[sFragmentName]) {
            Fragment.load({
                id: this.getView()!.getId(),
                name: sFragmentName,
                controller: this
            }).then((oPopover) => {
                this.getView()!.addDependent(oPopover as any);
                this._popovers[sFragmentName] = oPopover;
                (oPopover as any).openBy(oControl);
            });
        } else {
            (this._popovers[sFragmentName] as any).openBy(oControl);
        }
    }

    public onCardPress(oEvent: Event) : void {
        const oContext = (oEvent.getSource() as Control).getBindingContext() as Context;        
        const sCategory = oContext.getProperty("unit_type") as string;
        console.log("Navigating for Category: " + sCategory);
        var oRouter = (this.getOwnerComponent() as UIComponent).getRouter();
        oRouter.navTo("ProductsList", {
            unitType: sCategory
        });
    }

    public onNavToRequests(): void {
        (this.getOwnerComponent() as UIComponent).getRouter().navTo("RequestList");
    }

    public onNavToLogs(): void {
        (this.getOwnerComponent() as UIComponent).getRouter().navTo("LogList");
    }

    public onNavToPossessions(): void {

        const sUserID = (this.getOwnerComponent() as UIComponent)
            .getModel("security")!
            .getProperty("/ID") as string;

        (this.getOwnerComponent() as UIComponent).getRouter().navTo("PossessionList", {
            userID: sUserID
        });
    }

    public onCategorySelectionChange(oEvent: Event): void {

        const sSelected = oEvent.getParameter("newValue" as never) as string;
        
        const oCustomInput = this.byId("customCategory") as Input;
        
        if (sSelected) {
            oCustomInput.setValue("");
            oCustomInput.setEnabled(false);
        } else {
            oCustomInput.setEnabled(true);
        }
    }

    public onCustomCategoryChange(oEvent: Event): void {

        const sValue = oEvent.getParameter("newValue" as never) as string;
        
        const oCombo = this.byId("newCategoryCombo") as ComboBox;
        
        if (sValue && sValue.trim().length > 0) {
            oCombo.setSelectedKey("");
            oCombo.setEnabled(false);
        } else {
            oCombo.setEnabled(true);
        }
    }

    public onOpenCreateDialog(): void {

        const oView = this.getView()!;
        
        if (!this._pDialog) {
        
            this._pDialog = Fragment.load({
                id: oView.getId(),
                name: "ims.view.fragments.CreateModel",
                controller: this
            }).then((oDialog) => {
            
                oView.addDependent(oDialog as any);
                return oDialog as Dialog;
            });
        }
    
        this._pDialog.then((oDialog) => oDialog.open());
    }

    public onCloseDialog(): void {
        (this.byId("createModelDialog") as Dialog).close();
    }

    public onSaveNewModel() :void {
        var oModel = this.getView()!.getModel()! as ODataModel;
        var oCombo = this.byId("newCategoryCombo") as ComboBox;
        var oCustomInput = this.byId("customCategory") as Input;
        var sExistingKey = oCombo!.getSelectedKey();
        var sCustomValue = oCustomInput!.getValue().trim();
        var sFinalCategory = "";
        if (sExistingKey) {
            sFinalCategory = sExistingKey;
        } else if (sCustomValue) {
            sFinalCategory = sCustomValue.charAt(0).toUpperCase() + sCustomValue.slice(1).toLowerCase();
            var aExistingCategories = (oCombo.getBinding("items")! as ListBinding).getContexts().map(function(oCtx) {
                return oCtx.getProperty("unit_type").toUpperCase(); 
            });
        
            if (aExistingCategories.indexOf(sFinalCategory.toUpperCase()) !== -1) {
                MessageBox.error("This category already exists. Please select '" + sFinalCategory + "' from the dropdown instead.");
                return;
            }
        }
    
        if (!sFinalCategory) {
            MessageBox.error("Please select or enter a category.");
            return;
        }
        var sGroupId = "createDetailGroup";
        var oListBinding = oModel.bindList("/Details", undefined, undefined, undefined, {
            $$updateGroupId: sGroupId
        }) as ODataListBinding;
        var oNewContext = oListBinding.create({
            name: (this.byId("newName") as Input).getValue(),
            unit_type: sFinalCategory,
            unit_price: parseFloat((this.byId("newPrice") as Input).getValue()) || 0,
            reorder_level: parseInt((this.byId("newReorder") as Input).getValue()) || 2
        });
        var oDialog = this.byId("createModelDialog");
        BusyIndicator.show(0)
        oModel.submitBatch(sGroupId)
        .then(() => {

            (oDialog as Dialog).close();

            MessageToast.show(
                "Creation attempted. Check Message Popover in the footer."
            );

            (this.getView()!.getModel()! as ODataModel)
                .getAllBindings()
                .forEach((oBinding) => {
                    if (oBinding.getPath() === "/DashboardCards") {
                        oBinding.refresh();
                    }
                });
        })
        .catch(() => {
            console.log("Request failed, check Message Popover");
        })
        .finally(() => {
            BusyIndicator.hide();
        });
    }

    public formatCurrencyShort(fValue : string) : string {
        if(!fValue) return "0";

        var fNum : number = parseFloat(fValue)
        if (fNum >= 1000000) {
                return (fNum / 1000000).toFixed(1); // Returns 1.2 for 1,200,000
            } else if (fNum >= 1000) {
                return (fNum / 1000).toFixed(1); // Returns 150.5 for 150,500
            }

        return fNum.toFixed(0);    
    }

    public formatScale(fValue:string) : string {
        if (!fValue) return "BDT";
        var fNum : number = parseFloat(fValue)   
        if (fNum >= 1000000) {
            return "M BDT"; // Million
        } else if (fNum >= 1000) {
            return "K BDT"; // Thousand
        }
        return "BDT";
    }

        
}