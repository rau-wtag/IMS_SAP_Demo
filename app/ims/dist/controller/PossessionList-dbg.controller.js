sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/core/routing/History",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "sap/ui/model/json/JSONModel",
    "sap/ui/core/Fragment",
], function (Controller, Filter, FilterOperator, History, MessageToast, MessageBox, JSONModel, Fragment) {
    "use strict";

    return Controller.extend("ims.controller.RequestList", {
        onInit: function () {
            var oRouter = this.getOwnerComponent().getRouter();
            oRouter.getRoute("PossessionList").attachPatternMatched(this._onObjectMatched, this);
            var oActionModel = new JSONModel({
                items: [],
                count: 0,
                actionType: "",
                title: ""

            });
            this.getView().setModel(oActionModel, "actionContext");
          
           
        },

        _onObjectMatched: function () {
            var sUserID = this.getOwnerComponent().getModel("security").getProperty("/ID");
            var oPossessionTable = this.byId("possessionsTable")
            var oHistoryTable = this.byId("historyTable")
        

            if (oPossessionTable) {
                var oBinding = oPossessionTable.getBinding("items");
                if (oBinding) {
                    oBinding.filter([
                        new Filter("currentPossession/ID", FilterOperator.EQ, sUserID),
                    ]);
                }
            }

            if (oHistoryTable) {
                var oHistoryBinding = oHistoryTable.getBinding("items");
                if (oHistoryBinding) {
                    oHistoryBinding.filter([
                        new Filter("request/requestedBy_ID", FilterOperator.EQ, sUserID)
                    ]);
                }
            }
        },

        onSelectionChange: function (oEvent) {
        
            this.byId("btnReturn").setEnabled(oEvent.getSource().getSelectedItems().length > 0);
            this.byId("btnRepair").setEnabled(oEvent.getSource().getSelectedItems().length > 0);

        },

        onNavBack: function () {
            var oHistory = History.getInstance();
            var sPreviousHash = oHistory.getPreviousHash();

            if (sPreviousHash !== undefined) {
                window.history.go(-1);
            } else {
                this.getOwnerComponent().getRouter().navTo("Routehome", {}, true);
            }
        },

        // onNavToDetails: function (oEvent) {
        //     var oItem = oEvent.getSource();
        //     var sPath = oItem.getBindingContext().getPath();
        //     var sID = sPath.split("(")[1].replace(")", "");
        //     console.log(sID)
        //     this.getOwnerComponent().getRouter().navTo("RequestObjectPage", {
        //         ID: sID
        //     });
        // }
        onOpenActionDialog: function (sAction) {
            var oTable = this.byId("possessionsTable");
            var aSelectedContexts = oTable.getSelectedContexts();
            
            var aItems = aSelectedContexts.map(function (oContext) {
                return {
                    ID:   oContext.getProperty("ID"),
                    code: oContext.getProperty("code"),
                    name: oContext.getProperty("details/name")
                };
            });

            var oActionModel = this.getView().getModel("actionContext");
            oActionModel.setProperty("/items", aItems);
            oActionModel.setProperty("/count", aItems.length);
            oActionModel.setProperty("/actionType", sAction);
            oActionModel.setProperty("/title", sAction === "return" ? "Confirm Return" : "Request Repair");

            if (!this._pActionDialog) {
                this._pActionDialog = Fragment.load({
                    id: this.getView().getId(),
                    name: "ims.view.fragments.ActionReview",
                    controller: this
                }).then(function (oDialog) {
                    this.getView().addDependent(oDialog);
                    return oDialog;
                }.bind(this));
            }
            this._pActionDialog.then(function (oDialog) {
                oDialog.open();
            });
        },

        onRemoveItemFromAction: function (oEvent) {
            var oItem = oEvent.getSource().getBindingContext("actionContext").getObject();
            var oModel = this.getView().getModel("actionContext");
            var aItems = oModel.getProperty("/items").filter(i => i.ID !== oItem.ID);
            oModel.setProperty("/items", aItems);
            oModel.setProperty("/count", aItems.length);
        },

        onCloseActionDialog: function () {
            this.byId("actionReviewDialog").close();
        },

        onConfirmAction: function () {
            var oModel = this.getOwnerComponent().getModel();
            var oActionData = this.getView().getModel("actionContext").getData();
            var sUserID = this.getOwnerComponent().getModel("security").getProperty("/ID");
            var sCause = this.byId("actionCause").getValue();

            this.getView().setBusy(true);
            var sGroupId = "bulkActionGroup";


            var oRequestBinding = oModel.bindList("/Requests", null, null, null, { $$updateGroupId: sGroupId });
            var oNewRequest = oRequestBinding.create({
                requestNo: "REQ-" + Math.floor(1000 + Math.random() * 9000),
                requestedBy_ID: sUserID,
                type: oActionData.actionType, 
                cause: sCause,
                status: 'PENDING'
            });

            oModel.submitBatch(sGroupId).then(function () {
                return oNewRequest.created();
            }).then(function () {
                var sReqID = oNewRequest.getProperty("ID");
                var oItemBinding = oModel.bindList("/RequestItems", null, null, null, { $$updateGroupId: sGroupId });

                oActionData.items.forEach(function (item) {
                    oItemBinding.create({
                        parent_ID: sReqID,
                        product_ID: item.ID,
                        status: 'PENDING'
                    });
                });

                return oModel.submitBatch(sGroupId);
            }.bind(this)).then(function () {
                this.getView().setBusy(false);
                MessageToast.show("Request Submitted!Check Message Popover in the footer. If there is no popover, then the operation was successful!");
                this.byId("actionReviewDialog").close();
                this.byId("possessionsTable").removeSelections();
            }.bind(this));
        },

        onSearch: function () {
            var aFilters = [];
            var sUserID = this.getOwnerComponent().getModel("security").getProperty("/ID");
            var oUserContextFilter = new Filter("currentPossession/ID", FilterOperator.EQ, sUserID);
            var sProductID = this.byId("filterPossProduct_ID").getSelectedKeys();
            var sCategory = this.byId("filterPossProduct_category").getSelectedKeys();
            var sModel = this.byId("filterPossProduct_model").getSelectedKeys();
            var sApprover = this.byId("filterPossProduct_approver").getSelectedKeys();
            var sReqNo = this.byId("filterPossRequestNo").getSelectedKeys();

            if (sProductID.length > 0) {
                var sSelectedFilters = sProductID.map(function(aKey) {
                    return new Filter("code", FilterOperator.EQ, aKey)
            });
                aFilters.push(new Filter({filters: sSelectedFilters, and: false}));
            
            }

            if (sCategory.length > 0) {
                var sSelectedFilters = sCategory.map(function(aKey) {
                    return new Filter("details/unit_type", FilterOperator.EQ, aKey)
                });
                aFilters.push(new Filter({filters: sSelectedFilters, and: false}));
            }

            if (sModel.length > 0) {
                var sSelectedFilters = sModel.map(function(aKey) {
                    return new Filter("details/name", FilterOperator.EQ, aKey)
                });
                aFilters.push(new Filter({filters: sSelectedFilters, and: false}));
            }

            if (sApprover.length > 0) {
                var sSelectedFilters = sApprover.map(function(aKey) {
                    return new Filter("ID", FilterOperator.EQ, aKey)
                });
                aFilters.push(new Filter({filters: sSelectedFilters, and: false}));
            }

            if (sReqNo.length > 0) {
                var sSelectedFilters = sReqNo.map(function(aKey) {
                    return new Filter("requestNo", FilterOperator.EQ, aKey)
                });
                aFilters.push(new Filter({filters: sSelectedFilters, and: false}));
            }

            var oDateRange = this.byId("filterPossDateRange");
    
            var oStartDate = oDateRange.getDateValue();
            var oEndDate = oDateRange.getSecondDateValue();

            if (oStartDate) {
                var oStart = new Date(oStartDate.getTime());
                oStart.setHours(0, 0, 0, 0); // Start of day

                var oEnd = oEndDate ? new Date(oEndDate.getTime()) : new Date(oStartDate.getTime());
                oEnd.setHours(23, 59, 59, 999); // End of day

                // Fix: Use a Lambda Filter to prevent "Duplicate Key Predicate"
                // We filter for products that have AT LEAST ONE log in this range
                aFilters.push(new Filter({
                    path: "requests",
                    operator: FilterOperator.Any,
                    variable: "r",
                    condition: new Filter({
                        path: "r/parent/logs/timestamp",
                        operator: FilterOperator.BT,
                        value1: oStart.toISOString(),
                        value2: oEnd.toISOString()
                    })
                }));
            }

            var oFinalFilter = new Filter({
                filters: [oUserContextFilter].concat(aFilters),
                and: true
            });

            console.log(aFilters)
            this.byId("possessionsTable").getBinding("items").filter(oFinalFilter);
        }

        
    });
});