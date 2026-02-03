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

    return Controller.extend("inventorysample.controller.RequestList", {
        onInit: function () {
            var oRouter = this.getOwnerComponent().getRouter();
            oRouter.getRoute("LogList").attachPatternMatched(this._onObjectMatched, this);
           
        },

        _onObjectMatched: function () {

            var oTable = this.byId("logTable");
            var oBinding = oTable.getBinding("items");
            if (oBinding) {
                oBinding.refresh();
            }
            var aFilters = [];
            oBinding.filter(aFilters);
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

        onSearch: function () {
            var aFilters = [];
            var sUserID = this.getOwnerComponent().getModel("security").getProperty("/ID");
            var sProductID = this.byId("filterLogProduct_ID").getSelectedKeys();
            var sCategory = this.byId("filterLogProduct_category").getSelectedKeys();
            var sModel = this.byId("filterLogProduct_model").getSelectedKeys();
            var sApprover = this.byId("filterLogProduct_approver").getSelectedKeys();
            var sRequester = this.byId("filterLogProduct_requester").getSelectedKeys();
            var sAction = this.byId("filterLogProduct_action").getSelectedKeys();
            var sReqNo = this.byId("filterLogRequestNo").getSelectedKeys();

            if (sProductID.length > 0) {
                var sSelectedFilters = sProductID.map(function(aKey) {
                    return new Filter("product/code", FilterOperator.EQ, aKey)
            });
                aFilters.push(new Filter({filters: sSelectedFilters, and: false}));
            
            }

            if (sCategory.length > 0) {
                var sSelectedFilters = sCategory.map(function(aKey) {
                    return new Filter("product/details/unit_type", FilterOperator.EQ, aKey)
                });
                aFilters.push(new Filter({filters: sSelectedFilters, and: false}));
            }

            if (sModel.length > 0) {
                var sSelectedFilters = sModel.map(function(aKey) {
                    return new Filter("product/details/name", FilterOperator.EQ, aKey)
                });
                aFilters.push(new Filter({filters: sSelectedFilters, and: false}));
            }

            if (sApprover.length > 0) {
                var sSelectedFilters = sApprover.map(function(aKey) {
                    return new Filter("performedBy/ID", FilterOperator.EQ, aKey)
                });
                aFilters.push(new Filter({filters: sSelectedFilters, and: false}));
            }

            if (sReqNo.length > 0) {
                var sSelectedFilters = sReqNo.map(function(aKey) {
                    return new Filter("request/requestNo", FilterOperator.EQ, aKey)
                });
                aFilters.push(new Filter({filters: sSelectedFilters, and: false}));
            }

            if (sRequester.length > 0) {
                var sSelectedFilters = sRequester.map(function(aKey) {
                    return new Filter("request/requestedBy/ID", FilterOperator.EQ, aKey)
                });
                aFilters.push(new Filter({filters: sSelectedFilters, and: false}));
            }

            if (sAction.length > 0) {
                var sSelectedFilters = sAction.map(function(aKey) {
                    return new Filter("action", FilterOperator.EQ, aKey)
                });
                aFilters.push(new Filter({filters: sSelectedFilters, and: false}));
            }

            var oDateRange = this.byId("filterLogDateRange");
    
            var oStartDate = oDateRange.getDateValue();
            var oEndDate = oDateRange.getSecondDateValue();

            if (oStartDate) {
                var oStart = new Date(oStartDate.getTime());
                oStart.setHours(0, 0, 0, 0); 

                var oEnd = oEndDate ? new Date(oEndDate.getTime()) : new Date(oStartDate.getTime());
                oEnd.setHours(23, 59, 59, 999); 
                aFilters.push(new Filter({
                        path: "timestamp",
                        operator: FilterOperator.BT,
                        value1: oStart.toISOString(),
                        value2: oEnd.toISOString()
                    }));
            }


            console.log(aFilters)
            this.byId("logTable").getBinding("items").filter(aFilters);
        }

        
    });
});