sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/core/Fragment",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "sap/ui/core/routing/History",
], function (Controller, Filter, FilterOperator, Fragment, JSONModel, MessageToast, MessageBox, History) {
    "use strict";

    return Controller.extend("inventorysample.controller.ProductObjectPage", {

        onInit: function () {
            var oRouter = this.getOwnerComponent().getRouter();
            oRouter.getRoute("RequestObjectPage").attachPatternMatched(this._onObjectMatched, this);
            
            this.getView().setModel(new JSONModel({}), "pendingActions");
            this.getView().setModel(new JSONModel({
                approved: 0,
                rejected: 0,
                pending: 0
                }), "chartModel");
        },

        _onObjectMatched: function (oEvent) {
            var sID = oEvent.getParameter("arguments").ID;
            var oView = this.getView();
            this.getView().getModel("pendingActions").setData({});
            this.getView().getModel("chartModel").setData({ approved: 0, rejected: 0, pending: 0, percentage: 0 });

            oView.bindElement({
                path: "/Requests(" + sID + ")",
                parameters: {
                    "$expand": "requestedBy,items($expand=product($expand=details))"
                }
                
            });

            var oTable = this.byId("adminItemsTable");
            var oBinding = oTable.getBinding("items");

            if (oBinding) {
                oBinding.attachEvent("dataReceived", function() {
                    this._updateChart();
                }.bind(this));
        
            oBinding.attachEvent("change", function() {
                    this._updateChart();
                }.bind(this));
            }
        },

        _updateChart: function() {
            var oTable = this.byId("adminItemsTable");
            var oBinding = oTable.getBinding("items");

            if (oBinding) {
                var aContexts = oBinding.getContexts(0, 100);
                var iApp = 0, iRej = 0, iPen = 0;
            
                aContexts.forEach(function(oCtx) {
                    var sStatus = oCtx.getProperty("status");
                    if (sStatus === "APPROVED") iApp++;
                    else if (sStatus === "REJECTED") iRej++;
                    else iPen++;
                });
                var iTotal = iApp + iRej + iPen;
                var iPercent = iTotal > 0 ? Math.round(((iApp) / iTotal) * 100) : 0;
            
                this.getView().getModel("chartModel").setData({
                    approved: iApp, rejected: iRej, pending: iPen, percentage: iPercent
                });
            }
        },

        onNavBack: function () {
            var oHistory = History.getInstance();
            var sPreviousHash = oHistory.getPreviousHash();

            if (sPreviousHash !== undefined) {
                window.history.go(-1);
            } else {
                this.getOwnerComponent().getRouter().navTo("RequestList", {}, true);
            }
        },

        onApproveItem: function (oEvent) {
            this._processSelection(oEvent, "APPROVED");
        },

        onRejectItem: function (oEvent) {
            this._processSelection(oEvent, "REJECTED");
        },

        _processSelection: function(oEvent, sStatus) {
            var oContext = oEvent.getSource().getBindingContext();
            var sPath = oContext.getPath();
            
            oContext.setProperty("status", sStatus);

            var oData = this.getView().getModel("pendingActions").getData();
            oData[sPath] = sStatus;

            this._updateChart();
            
            MessageToast.show("Decision updated to: " + sStatus);
        },

        // _updateChart: function() {
        //     var oTable = this.byId("adminItemsTable");
        //     var oBinding = oTable.getBinding("items");

        //     if (!oBinding) return;
        //     var aContexts = oBinding.getContexts();
        //     var iApproved = 0, iRejected = 0, iPending = 0;

        //     aContexts.forEach(function(oCtx) {
        //         var sStatus = oCtx.getProperty("status");
        //         if (sStatus === "APPROVED") iApproved++;
        //         else if (sStatus === "REJECTED") iRejected++;
        //         else iPending++;
        //     });
        
        //     this.getView().getModel("chartModel").setProperty("/approved", iApproved);
        //     this.getView().getModel("chartModel").setProperty("/rejected", iRejected);
        //     this.getView().getModel("chartModel").setProperty("/pending", iPending);
        // },

        onConfirmFinalDecision: function () {
            var oModel = this.getView().getModel();
            var oPendingModel = this.getView().getModel("pendingActions");
            var oPending = oPendingModel.getData();
            var adminID = this.getOwnerComponent().getModel("security").getProperty("/ID");
            var oTable = this.byId("adminItemsTable");
            var aItems = oTable.getBinding("items").getContexts(); 

            if (Object.keys(oPending).length === 0) {
                return MessageBox.information("No changes to sync.");
            }
        
            MessageBox.confirm("Are you sure you want to finalize these decisions?", {
                onClose: function(sAction) {
                    if (sAction !== "OK") return;
                
                    this.getView().setBusy(true);
                    Object.keys(oPending).forEach(function(sPath) {
                        var oItemCtx = aItems.find(ctx => ctx.getPath() === sPath);

                        if (oItemCtx) {
                            var sStatus = oPending[sPath];
                            var sProductID = oItemCtx.getProperty("product/ID");
                            console.log(sProductID)
                            var sRequestType = this.getView().getBindingContext().getProperty("type");
                            var sRequestID = this.getView().getBindingContext().getProperty("ID");
                            var sRequesterID = this.getView().getBindingContext().getProperty("requestedBy/ID");
                        
                            var oLogBinding = oModel.bindList("/Logs", null, null, null, {$$updateGroupId: "updateGroup"});
                            oLogBinding.create({
                                action: sStatus === "APPROVED" ? (sRequestType === "return" ? "CHECKED_IN" : "CHECKED_OUT") : "REJECTED",
                                performedBy_ID: adminID,
                                timestamp: new Date().toISOString(),
                                product_ID: sProductID,
                                request_ID: sRequestID
                            });
                        
                            var oProdCtx = oModel.bindContext("/Products(" + sProductID + ")").getBoundContext();
                            if (sStatus === "APPROVED") {
                                if (sRequestType === "return") {
                                    oProdCtx.setProperty("status", "available");
                                    oProdCtx.setProperty("currentPossession_ID", null);
                                } else {
                                    
                                    oProdCtx.setProperty("status", null); 
                                    oProdCtx.setProperty("currentPossession_ID", sRequesterID);
                                }
                            } else if (sRequestType === "request") {
                                oProdCtx.setProperty("status", "available");
                                oProdCtx.setProperty("currentPossession_ID", null);
                            }
                        }
                    }.bind(this));
                
                  
                    oModel.submitBatch("updateGroup").then(function() {
                        this.getView().setBusy(false);
                        MessageBox.success("Database successfully updated.");
                        oPendingModel.setData({}); 
                    }.bind(this)).catch(function(oError) {
                        this.getView().setBusy(false);
                        MessageBox.error("Sync failed: " + oError.message);
                    }.bind(this));
                }.bind(this)
            });
        }
        // onInit: function () {
        //     var oRouter = this.getOwnerComponent().getRouter();
        //     oRouter.getRoute("RequestObjectPage").attachPatternMatched(this._onObjectMatched, this);
        // },

        // _onObjectMatched: function (oEvent) {
        //     var sID = oEvent.getParameter("arguments").ID;
        //     var oView = this.getView();
        //     oView.bindElement({
        //         path: "/Requests(" + sID + ")",
        //         parameters: {
        //             "$expand": "items($expand=product)"
        //         },
        //         events: {
        //             dataRequested: function () { oView.setBusy(true); },
        //             dataReceived: function () {
        //                 oView.setBusy(false);
        //             }.bind(this)
        //         }
        //     });
             
        // },


        // onApproveItem: function (oEvent) {
        //     var oItemContext = oEvent.getSource().getBindingContext();
        //     var oModel = this.getView().getModel();
        //     var adminID = (this.getOwnerComponent().getModel("security").getProperty("/ID"));

        //     var sProductID = oItemContext.getProperty("product/ID")
        //     var srequestID = oItemContext.getProperty("parent/ID")
        //     var sRequestType = oItemContext.getProperty("parent/type")
        //     var srequesterID = oItemContext.getProperty("parent/requestedBy/ID")
        //     console.log(sProductID)
        //     oItemContext.setProperty("status", "APPROVED")
        //     console.log("Type of request: " + sRequestType)

        //     var oProduct = oModel.bindContext("/Products("+ sProductID +")");
        //     var oProductContext = oProduct.getBoundContext();
        //     console.log(sProductID)

        //     var actionPerformed;
            
        //     if (sRequestType == "return")
        //     {
        //         oProductContext.setProperty("status", "available");
        //         oProductContext.setProperty("currentPossession_ID", null);
        //         actionPerformed = "CHECKED_IN"
        //     }
        //     else if (sRequestType == "repair")
        //     {
        //         oProductContext.setProperty("status", "repair");
        //         actionPerformed = "CHECKED_IN"
        //     }
        //     else
        //     {
        //         oProductContext.setProperty("status", null);
        //         oProductContext.setProperty("currentPossession_ID", srequesterID);
        //         actionPerformed = "CHECKED_OUT"
        //     }
        

        //     // var oPosBinding = oModel.bindList("/Possessions", null, null, null, {$$updateGroupId: "updateGroup"})
        //     // oPosBinding.create({
        //     //     product_ID: sProductID,
        //     //     user_ID: srequester,
        //     //     assginedBy_ID: adminID,
        //     //     requestID: srequestNo
        //     // })


        //     var oLogBinding = oModel.bindList("/Logs", null, null, null, {$$updateGroupId: "updateGroup"})
        //     oLogBinding.create({
        //         action: actionPerformed,
        //         performedBy_ID: adminID,
        //         timestamp: new Date().toISOString(),
        //         product_ID: sProductID,
        //         request_ID: srequestID
        //     })

        //     MessageToast.show("Request approved");
        
        // },

        // onRejectItem: function (oEvent) {
        //     var oItemContext = oEvent.getSource().getBindingContext();
        //     var oModel = this.getView().getModel();
        //     var adminID = (this.getOwnerComponent().getModel("security").getProperty("/ID"));

        //     var sProductID = oItemContext.getProperty("product/ID")
        //     var srequestID = oItemContext.getProperty("parent/ID")
        //     var sRequestType = oItemContext.getProperty("parent/type")
        //     // var srequester = oItemContext.getProperty("parent/requestedBy/ID")

        //     oItemContext.setProperty("status", "REJECTED")

        //     var oProduct = oModel.bindContext("/Products("+ sProductID +")");
        //     var oProductContext = oProduct.getBoundContext();
        //     console.log(oProductContext)
        //     if (sRequestType == "request")
        //     { 
        //         oProductContext.setProperty("status", "available");
        //     }
           
        //     var oLogBinding = oModel.bindList("/Logs")
        //     oLogBinding.create({
        //         action: "REJECTED",
        //         performedBy_ID: adminID,
        //         timestamp: new Date().toISOString(),
        //         product_ID: sProductID,
        //         request_ID: srequestID
        //     })

        //     MessageToast.show("Request rejected");
        // },

        // onConfirmFinalDecision: function () {
        //     var oModel = this.getView().getModel()
        //     this.getView().setBusy(true);

        //     oModel.submitBatch("updateGroup").then(function() {
        //         this.getView().setBusy(false);
        //         MessageToast.show("Synced everything")
        //     }.bind(this)).catch(function(oError){
        //         this.getView().setBusy(false);
        //         console.error(oError);
        //     }.bind(this));
        // }

    
        
    });
});