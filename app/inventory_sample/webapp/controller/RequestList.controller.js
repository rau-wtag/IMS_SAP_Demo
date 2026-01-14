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
            this.getView().setModel(new sap.ui.model.json.JSONModel({
                statusData: [],
                typeData: [],
                totalCount: 0,
                pendingCount: 0
            }), "requestAnalytics");
            var oRouter = this.getOwnerComponent().getRouter();
            oRouter.getRoute("RequestList").attachPatternMatched(this._onObjectMatched, this);

        },

        _onObjectMatched: function () {

            var oTable = this.byId("requestTable");
            var oBinding = oTable.getBinding("items");
            if (oBinding) {
                // Essential for OData v4: Listen for data arrival
                oBinding.attachDataReceived(function () {
                    this._updateRequestAnalytics();
                }.bind(this));

                // Listen for filtering changes
                oBinding.attachChange(function () {
                    this._updateRequestAnalytics();
                }.bind(this));
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

        _updateRequestAnalytics: function () {
            var oBinding = this.byId("requestTable").getBinding("items");
            if (!oBinding) return;

            var aContexts = oBinding.getContexts(0, 200);
            if (aContexts.length === 0) return;

            var mStatusGroups = { "APPROVED": 0, "REJECTED": 0, "PENDING": 0, "PARTIAL": 0 };
            var mTypeGroups = {};
            var iTotal = aContexts.length;

            aContexts.forEach(function (oCtx) {
                var sStatus = oCtx.getProperty("status");
                if (mStatusGroups[sStatus] !== undefined) mStatusGroups[sStatus]++;

                var sType = oCtx.getProperty("type");
                if (sType) {
                    mTypeGroups[sType] = (mTypeGroups[sType] || 0) + 1;
                }
            });

            this.getView().getModel("requestAnalytics").setData({
                statusData: Object.keys(mStatusGroups).map(k => ({ status: k, count: mStatusGroups[k] })),
                typeData: Object.keys(mTypeGroups).map(k => ({ type: k, count: mTypeGroups[k] })),
                totalCount: iTotal,
                pendingCount: mStatusGroups["PENDING"]
            });

            // Fiori Standard Colors: Green, Red, Grey, Orange
            this.byId("idStatusDonut").setVizProperties({
                plotArea: { colorPalette: ['#2b7d2b', '#bb0000', '#d5d5d5', '#f0ab00'] }
            });
        },

        onNavToDetails: function (oEvent) {
            // console.log("hoyna keno")
            // var oItem = oEvent.getSource();
            // var sPath = oItem.getBindingContext().getPath();
            // var sID = sPath.split("(")[1].replace(")", "");
            // console.log(sID)
            var oContext = oEvent.getSource().getBindingContext();
            if (!oContext) return;
            var sID = oContext.getProperty("ID");
            this.getOwnerComponent().getRouter().navTo("RequestObjectPage", {
                ID: sID
            });
        },

        onSearch: function () {
            var aFilters = [];
            var sUser = this.byId("filterUser").getSelectedKeys();
            var sStatus = this.byId("filterStatus").getSelectedKeys();
            var sRequestNo = this.byId("filterRequestNo").getSelectedKey();
            var sRequestType = this.byId("filterRequestType").getSelectedKeys();

            if (sUser.length > 0) {
                var sSelectedUsers = sUser.map(function (aKey) {
                    return new Filter("requestedBy/ID", FilterOperator.EQ, aKey)
                });
                aFilters.push(new Filter({ filters: sSelectedUsers, and: false }));

            }

            if (sStatus.length > 0) {
                var sSelectedStatus = sStatus.map(function (aKey) {
                    return new Filter("status", FilterOperator.EQ, aKey)
                });
                aFilters.push(new Filter({ filters: sSelectedStatus, and: false }));
            }

            if (sRequestNo) {
                aFilters.push(new Filter("requestNo", FilterOperator.EQ, sRequestNo));
            }

            if (sRequestType.length > 0) {
                var sSelectedStatus = sRequestType.map(function (aKey) {
                    return new Filter("type", FilterOperator.EQ, aKey)
                });
                aFilters.push(new Filter({ filters: sSelectedStatus, and: false }));
            }

            console.log(aFilters)
            this.byId("requestTable").getBinding("items").filter(aFilters);
        }


    });
});