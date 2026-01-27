sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/Fragment",
    "sap/m/MessageToast",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageBox",
    "sap/m/MessagePopover",
    "sap/m/MessageItem",
    "inventorysample/controller/ErrorHandler"
], function (Controller, Fragment, MessageToast, Filter, FilterOperator, JSONModel, MessageBox, MessagePopover, MessageItem, ErrorHandler) {
    "use strict";

    return ErrorHandler.extend("inventorysample.controller.home", {
        onInit: function () {

            var oUiModel = new JSONModel({
                totalRestockCost: 0,
                totalRepairCost: 0,
                totalEvalCost: 0
            });
            var secModel = this.getOwnerComponent().getModel("security");
            console.log("here i am:")
            console.log(secModel.getData())
            this.getView().setModel(oUiModel, "ui");
            var oVizFrame = this.byId("idVizFramePie");
            var oVizFrame1 = this.byId("idVizFramePie1")

            oVizFrame.setVizProperties({
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

            oVizFrame1.setVizProperties({
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
            this.getView().setModel(oMessageManager.getMessageModel(), "message");
            oMessageManager.registerObject(this.getView(), true);

            var oRouter = this.getOwnerComponent().getRouter();
            oRouter.getRoute("Routehome").attachPatternMatched(this._onObjectMatched, this);

        },

        _onObjectMatched: function () {
            this.getView().setBusy(true);
            this.getView().getModel().refresh();
            this._loadAnalyticalData();
            //this._applyFilters();
            this._applyDistributionFilter("available");

        },

        onToggleDistribution: function (oEvent) {
            var iIndex = oEvent.getParameter("selectedIndex");
            var sStatus = (iIndex === 0) ? "available" : null;
            this._applyDistributionFilter(sStatus);
        },

        _applyDistributionFilter: function (sStatus) {
            var oVizFrame = this.byId("idVizFramePie1");
            var oBinding = oVizFrame.getDataset().getBinding("data");


            if (oBinding) {
                oBinding.attachEventOnce("dataReceived", function () {
                    this.getView().setBusy(false);
                }.bind(this));

                oBinding.filter([
                    new Filter("unit_type", FilterOperator.NE, null), // Basic data check
                    new Filter("status", FilterOperator.EQ, sStatus)
                ]);
            } else {
                oVizFrame.addEventDelegate({
                    onAfterRendering: function () {
                        this._applyDistributionFilter(sStatus);
                    }.bind(this)
                });
            }
        },

        _applyFilters: function () {
            var oTable = this.byId("possDashboard")
            var oBinding = oTable.getBinding("items")
            if (oBinding) {
                oBinding.filter(new Filter("currentPossession_ID", FilterOperator.NE, null));
            } else {
                oTable.attachEventOnce("updateFinished", function () {
                    oTable.getBinding("items").filter(
                        new Filter("currentPossession_ID", FilterOperator.NE, null)
                    );
                });
            }
        },

        _loadAnalyticalData: function () {
            var oModel = this.getOwnerComponent().getModel();
            var oUiModel = this.getView().getModel("ui");

            oModel.bindList("/StockAlerts").requestContexts().then(function (aCtx) {
                var total = aCtx.reduce((acc, c) => acc + (parseFloat(c.getProperty("estimatedCost")) || 0), 0);
                oUiModel.setProperty("/totalRestockCost", total);
            });

            oModel.bindList("/MaintenanceAlerts").requestContexts().then(function (aCtx) {
                var total = aCtx.reduce((acc, c) => acc + (parseFloat(c.getProperty("estRepairCost")) || 0), 0);
                oUiModel.setProperty("/totalRepairCost", total);
            });
            oModel.bindList("/TotalValuation").requestContexts().then(function (aCtx) {
                var total = aCtx.reduce((acc, c) => acc + (parseFloat(c.getProperty("total_value")) || 0), 0);
                oUiModel.setProperty("/totalEvalCost", total);
            });
        },

        onSearchCategory: function (oEvent) {
            var sQuery = oEvent.getParameter("query");
            var oBinding = this.byId("categoryHBox").getBinding("items");

            if (sQuery && sQuery.length > 0) {
                var oFilter = new sap.ui.model.Filter("unit_type", FilterOperator.Contains, sQuery);
                oBinding.filter([oFilter]);
            } else {
                oBinding.filter([]);
            }
        },
        onShowRestockPopover: function (oEvent) {
            this._openPopover(oEvent.getSource(), "inventorysample.view.fragments.RestockBreakdown");
        },

        onShowRepairPopover: function (oEvent) {
            this._openPopover(oEvent.getSource(), "inventorysample.view.fragments.RepairBreakdown");
        },

        onShowValuationPopover: function (oEvent) {
            this._openPopover(oEvent.getSource(), "inventorysample.view.fragments.ValuationBreakdown");
        },

        _openPopover: function (oControl, sFragmentName) {
            if (!this._popovers) { this._popovers = {}; }

            if (!this._popovers[sFragmentName]) {
                Fragment.load({
                    id: this.getView().getId(),
                    name: sFragmentName,
                    controller: this
                }).then(function (oPopover) {
                    this.getView().addDependent(oPopover);
                    this._popovers[sFragmentName] = oPopover;
                    oPopover.openBy(oControl);
                }.bind(this));
            } else {
                this._popovers[sFragmentName].openBy(oControl);
            }
        },

        onCardPress: function (oEvent) {

            const oContext = oEvent.getSource().getBindingContext();
            const sCategory = oContext.getProperty("unit_type");
            console.log("Pressed" + sCategory)

            console.log("Navigating for Category: " + sCategory);

            var oRouter = this.getOwnerComponent().getRouter();

            oRouter.navTo("ProductsList", {
                unitType: sCategory
            });

        },

        onNavToRequests: function (oEvent) {
            var oRouter = this.getOwnerComponent().getRouter();

            oRouter.navTo("RequestList");
        },

        onNavToLogs: function () {
            var oRouter = this.getOwnerComponent().getRouter();
            oRouter.navTo("LogList");
        },

        onNavToPossessions: function () {
            var sUserID = this.getOwnerComponent().getModel("security").getProperty("/ID");
            var oRouter = this.getOwnerComponent().getRouter();
            oRouter.navTo("PossessionList", { userID: sUserID });
        },

        onCategorySelectionChange: function (oEvent) {
            var sSelected = oEvent.getParameter("newValue");
            var oCustomInput = this.byId("customCategory");

            if (sSelected) {
                oCustomInput.setValue("");
                oCustomInput.setEnabled(false);
            } else {
                oCustomInput.setEnabled(true);
            }
        },

        onCustomCategoryChange: function (oEvent) {
            var sValue = oEvent.getParameter("newValue");
            var oCombo = this.byId("newCategoryCombo");

            if (sValue && sValue.trim().length > 0) {
                oCombo.setSelectedKey("");
                oCombo.setEnabled(false);
            } else {
                oCombo.setEnabled(true);
            }
        },

        onOpenCreateDialog: function () {
            var oView = this.getView();
            if (!this._pDialog) {
                this._pDialog = Fragment.load({
                    id: oView.getId(),
                    name: "inventorysample.view.fragments.CreateModel",
                    controller: this
                }).then(function (oDialog) {
                    oView.addDependent(oDialog);
                    return oDialog;
                });
            }
            this._pDialog.then(function (oDialog) { oDialog.open(); });
        },

        onCloseDialog: function () {
            this.byId("createModelDialog").close();
        },

        onSaveNewModel: function () {
            var oModel = this.getView().getModel();
            var oCombo = this.byId("newCategoryCombo");
            var oCustomInput = this.byId("customCategory");

            var sExistingKey = oCombo.getSelectedKey();
            var sCustomValue = oCustomInput.getValue().trim();
            var sFinalCategory = "";

            if (sExistingKey) {
                sFinalCategory = sExistingKey;
            } else if (sCustomValue) {
                sFinalCategory = sCustomValue.charAt(0).toUpperCase() + sCustomValue.slice(1).toLowerCase();

                var aExistingCategories = oCombo.getBinding("items").getContexts().map(function(oCtx) {
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
            var oListBinding = oModel.bindList("/Details", null, null, null, {
                $$updateGroupId: sGroupId
            });

            var oNewContext = oListBinding.create({
                name: this.byId("newName").getValue(),
                unit_type: sFinalCategory,
                unit_price: parseFloat(this.byId("newPrice").getValue()) || 0,
                reorder_level: this.byId("newReorder").getValue() || 2
            });

            var oDialog = this.byId("createModelDialog");

            sap.ui.core.BusyIndicator.show(0);

            oModel.submitBatch(sGroupId)
                .then(function (oError) {
                    // If we get here, the HTTP request was sent.
                    // Now we check if the backend actually created it.
                    console.log(oError)
                    oDialog.close();
                    MessageToast.show("Creation attempted. Check Message Popover in the footer. If there is no popover, then the operation was successful!");
                    this.getView().getModel().getBindings().forEach(function (oBinding) {
                    if (oBinding.getPath() === "/DashboardCards") {
                        oBinding.refresh();
                    }
                });
                    
                })
                .catch(function (oError) {
                    // We leave this empty or just log it. 
                    // The MessageManager ALREADY caught the error and put it in the model.
                    console.log("Request failed, check Message Popover");
                })
                .finally(function () {
                    // --- NUCLEAR UN-FREEZE ---
                    // This runs 100% of the time. Success or Fail.
                    sap.ui.core.BusyIndicator.hide();
                });
        },
        // onMessagePopoverPress: function (oEvent) {
        //     var oSource = oEvent.getSource();
        //     if (!this._oMessagePopover) {
        //         this._oMessagePopover = new MessagePopover({
        //             activeTitlePress: function (oEvent) {
        //                 var oItem = oEvent.getParameter("item");
        //                 // You can add logic here to navigate to the error field
        //             },
        //             headerButton: new sap.m.Button({
        //                 icon: "sap-icon://delete",
        //                 text: "Clear",
        //                 type: "Transparent",
        //                 press: function () {
        //                     oMessageManager.removeAllMessages();
        //                     this._oMessagePopover.close();
        //                 }.bind(this)
        //             }),
        //             items: {
        //                 path: "message>/",
        //                 template: new MessageItem({
        //                     title: "{message>message}",
        //                     subtitle: "{message>additionalText}",
        //                     groupName: "{message>target}",
        //                     type: "{message>type}",
        //                     description: "{message>description}"
        //                 })
        //             }
        //         });
        //         this.getView().addDependent(this._oMessagePopover);
        //     }
        //     this._oMessagePopover.toggle(oSource);
        // },

        // In your controller or a separate formatter.js
        formatCurrencyShort: function (fValue) {
            if (!fValue) {
                return "0";
            }

            var fNum = parseFloat(fValue);

            if (fNum >= 1000000) {
                return (fNum / 1000000).toFixed(1); // Returns 1.2 for 1,200,000
            } else if (fNum >= 1000) {
                return (fNum / 1000).toFixed(1); // Returns 150.5 for 150,500
            }

            return fNum.toFixed(0);
        },

        formatScale: function (fValue) {
            if (!fValue) return "BDT";
            var fNum = parseFloat(fValue);

            if (fNum >= 1000000) {
                return "M BDT"; // Million
            } else if (fNum >= 1000) {
                return "K BDT"; // Thousand
            }

            return "BDT";
        }

    });
});