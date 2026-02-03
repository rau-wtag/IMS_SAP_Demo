sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/core/Fragment",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast",
    "sap/m/MessageBox"
], function (Controller, Filter, FilterOperator, Fragment, JSONModel, MessageToast, MessageBox) {
    "use strict";

    return Controller.extend("inventorysample.controller.ProductObjectPage", {
        onInit: function () {
            var oBulkModel = new JSONModel({
                newSerials: [{ code: "" }]
            });
            this.getView().setModel(oBulkModel, "bulk");
            var oEditModel = new sap.ui.model.json.JSONModel({
                isEditMode: false
            });
            this.getView().setModel(oEditModel, "ui");
            var oRouter = this.getOwnerComponent().getRouter();
            oRouter.getRoute("ProductObjectPage").attachPatternMatched(this._onObjectMatched, this);
            var oCartModel = this.getOwnerComponent().getModel("cart");
            oCartModel.attachPropertyChange(this._syncCheckboxes, this);
        },

        _onObjectMatched: function (oEvent) {
            var sID = oEvent.getParameter("arguments").ID;
            var oView = this.getView();
            var oUiModel = oView.getModel("ui");
        
            if (oUiModel) 
            {
                oUiModel.setProperty("/isEditMode", false);
            }
            oView.setBusy(true);
            oView.bindElement({
                path: "/Details(" + sID + ")",
                parameters: {
                    "$expand": "items($expand=currentPossession)"
                },
                events: {
                    dataReceived: function (oData) {
                        oView.setBusy(false);
                        this._applyTableFilters(sID);
                        setTimeout(function() {
                            this._updateValueChart();
                        }.bind(this), 200);
                    }.bind(this),
                    change: function() {
                        if (!oView.getElementBinding().getBoundContext()) {
                            this.getOwnerComponent().getRouter().navTo("ProductList");
                        }
                    }.bind(this)
                }
            });
            var oTable = this.byId("availableTable");
            
            var oBinding = oTable.getBinding("items");
            if (oBinding) {
                oBinding.attachEvent("change", this._syncCheckboxes, this);
            }

            //oView.setBusy(false);

            // oView.getElementBinding().refresh(); 
            // this.byId("availableTable").getBinding("items").refresh();
            // this.byId("inUseTable").getBinding("items").refresh();
            // this.byId("requestedTable").getBinding("items").refresh();
            // this.byId("repairTable").getBinding("items").refresh();

        },

        _syncCheckboxes: function() {
            var oTable = this.byId("availableTable");
            if (!oTable) return;

            var aRows = oTable.getItems();
            var oCartModel = this.getOwnerComponent().getModel("cart");
            var aCartItems = oCartModel.getProperty("/items") || [];

            aRows.forEach(function(oRow) {
                var oCtx = oRow.getBindingContext();
                if (oCtx) {
                    var sId = oCtx.getProperty("ID");
                    
                    var bInCart = aCartItems.some(function(item) {
                        return item.ID === sId;
                    });
                    oRow.setSelected(bInCart);
                }
            });
        },      


        _syncCartSelection: function () {
            var oTable = this.byId("availableTable");
            var aItems = oTable.getItems();
            var aCartItems = this.getOwnerComponent().getModel("cart").getProperty("/items");

            aItems.forEach(function (oRow) {
                var sRowId = oRow.getBindingContext().getProperty("ID");
                var bInCart = aCartItems.some(item => item.ID === sRowId);
                oRow.setSelected(bInCart);
            });
        },

        _applyTableFilters: function (sID) {
        
            this.byId("availableTable").getBinding("items").filter(
                new Filter("status", FilterOperator.EQ, "available")
            );

            this.byId("inUseTable").getBinding("items").filter(
                new Filter("currentPossession", FilterOperator.NE, null)
            );
            console.log(sID)

            this.byId("repairTable").getBinding("items").filter(
                new Filter("status", FilterOperator.EQ, "repair"),
            );

            this.byId("requestedTable").getBinding("items").filter([
                new Filter("product/details_ID", FilterOperator.EQ, sID), 
                new Filter("status", FilterOperator.EQ, "PENDING")
            ]);
        },

        _updateValueChart: function() {
            var oView = this.getView();
            var oPageContext = oView.getBindingContext();
            if (!oPageContext) return;

            var fUnitPrice = parseFloat(oPageContext.getProperty("unit_price")) || 0;

            var aTableIds = ["availableTable", "requestedTable", "inUseTable", "repairTable"];
            var aAllContexts = [];

            aTableIds.forEach(function(sId) {
                var oTable = oView.byId(sId);
                if (oTable) {
                    var oBinding = oTable.getBinding("items");
                    if (oBinding) {
                        var aTableContexts = oBinding.getContexts(); 
                        aAllContexts = aAllContexts.concat(aTableContexts);
                    }
                }
            });

            var mStats = {
                "Available": 0, "In Use": 0, "Repair": 0, "Requested": 0
            };
            var iGrandTotalCount = 0;
        
            aAllContexts.forEach(function(oCtx) {
                var sStatus = oCtx.getProperty("status");
                iGrandTotalCount++;
                if(!sStatus) sStatus = oCtx.getProperty("product/status");
                console.log(sStatus)
                if (sStatus === "available") mStats["Available"]++;
                else if (sStatus === "repair") mStats["Repair"]++;
                else if (sStatus === "requested") mStats["Requested"]++;
                else mStats["In Use"]++;
                
            });
        
            var aData = Object.keys(mStats).map(key => ({
                status: key,
                count: mStats[key],
                totalValue: mStats[key] * fUnitPrice
            }));

            console.log(aData)
        
            this.getView().setModel(new JSONModel({ data: aData, totalCount: iGrandTotalCount, totalRevenue: iGrandTotalCount*fUnitPrice }), "valueModel");

            this.byId("idProductValueChart").setVizProperties({
                plotArea: {
                    dataLabel: { visible: true, showActualValue: true },
                    colorPalette: ['#5cbae6', '#b6d957', '#fac364', '#8cd3ff']
                },
                legend: {
                    visible: true,
                    title: { visible: false }
                },
                legendGroup: {
                    layout: {
                        alignment: 'center',
                        position: 'right' // Legend on the right side of the bars
                    }
                },
                title: { text: "Capital Distribution by Status (BDT)" },
                interaction: { selectability: { mode: "none" } }
            });
        },

        onOpenAddSerialsDialog: function () {
            var oView = this.getView();
            if (!this._pSerialsDialog) {
                this._pSerialsDialog = Fragment.load({
                    id: oView.getId(),
                    name: "inventorysample.view.fragments.AddSerials",
                    controller: this
                }).then(function (oDialog) {
                    oView.addDependent(oDialog);
                    return oDialog;
                });
            }
            this._pSerialsDialog.then(function (oDialog) {
                this.getView().getModel("bulk").setProperty("/newSerials", [{ code: "" }]);
                oDialog.open();
            }.bind(this));
        },

        onAddSerialRow: function () {
            var oBulkModel = this.getView().getModel("bulk");
            var aSerials = oBulkModel.getProperty("/newSerials");
            aSerials.push({ code: "" });
            oBulkModel.setProperty("/newSerials", aSerials);
        },

        onDeleteSerialRow: function (oEvent) {
            var oBulkModel = this.getView().getModel("bulk");
            var aSerials = oBulkModel.getProperty("/newSerials");
            var iIndex = oEvent.getSource().getBindingContext("bulk").getPath().split("/").pop();
            aSerials.splice(iIndex, 1);
            oBulkModel.setProperty("/newSerials", aSerials);
        },

        onSaveNewSerials: function () {
    
            var oModel = this.getView().getModel();
            var sID = this.getOwnerComponent().getModel("security").getProperty("/ID");
            // Get the ID of the Detail we are currently looking at
            var sDetailID = this.getView().getBindingContext().getProperty("ID");
            var aNewItems = this.getView().getModel("bulk").getProperty("/newSerials");

            var oListBinding = oModel.bindList("/Products");

            this.byId("addSerialsDialog").setBusy(true);

            aNewItems.forEach(function (oItem) {
                if (oItem.code && oItem.code.trim() !== "") {
                    oListBinding.create({
                        code: oItem.code,
                        status: "available",
                        details_ID: sDetailID
                    });
                }
            });


            oModel.submitBatch(oModel.getUpdateGroupId()).then(function () {
                this.byId("addSerialsDialog").setBusy(false);
                MessageToast.show("New serials added! Check Message Popover in the footer. If there is no popover, then the operation was successful!");
                this.onCloseSerialsDialog();
            }.bind(this)).catch(function (oError) {
                this.byId("addSerialsDialog").setBusy(false);
                MessageBox.error("Error: " + oError.message);
            }.bind(this));
        },

        onCloseSerialsDialog: function () {
            this.byId("addSerialsDialog").close();
        },

        onEditPress: function () {
            this.getView().getModel("ui").setProperty("/isEditMode", true);
        },

        onCancelPress: function () {
            var oModel = this.getView().getModel();
            if (oModel.hasPendingChanges()) {
                oModel.resetChanges(); // Reverts UI to original values from server
            }
            this.getView().getModel("ui").setProperty("/isEditMode", false);
        },

        onSavePress: function () {
            var oModel = this.getView().getModel();
            var oView = this.getView();

            oView.setBusy(true);

            oModel.submitBatch(oModel.getUpdateGroupId()).then(function () {
                oView.setBusy(false);
                this.getView().getModel("ui").setProperty("/isEditMode", false);
                sap.m.MessageToast.show("Product updated. Check Message Popover in the footer. If there is no popover, then the operation was successful!");
            }.bind(this)).catch(function (oError) {
                oView.setBusy(false);
                sap.m.MessageBox.error("Update failed: " + oError.message);
            });
        },

        onDeletePress: function () {
            var oView = this.getView();
            var oModel = oView.getModel();
            var oContext = oView.getBindingContext();
            var oRouter = this.getOwnerComponent().getRouter();
            const sCategory = oContext.getProperty("unit_type");

            sap.m.MessageBox.confirm("Are you sure you want to delete this model? All associated assets will also be removed.", {
                title: "Confirm Deletion",
                actions: [sap.m.MessageBox.Action.OK, sap.m.MessageBox.Action.CANCEL],
                emphasizedAction: sap.m.MessageBox.Action.OK,
                onClose: function (sAction) {
                    oView.setBusy(true);

                    oContext.delete().then(function () {
                        oView.setBusy(false);
                        MessageToast.show("Product Model Deleted. Check Message Popover in the footer. If there is no popover, then the operation was successful!");
                        oRouter.navTo("ProductsList", { unitType: sCategory }).byId("productsTable").getBinding("items").refresh();
                    }).catch(function (oError) {
                        oView.setBusy(false);
                        sap.m.MessageBox.error("Delete failed: " + oError.message);
                    });

                    oModel.submitBatch(oModel.getUpdateGroupId());
                }.bind(this)
            });
        },

        onAssetSelectionChange: function (oEvent) {
            this.byId("addToCartBtn").setEnabled(oEvent.getSource().getSelectedItems().length > 0);
        },

        onAddToCart: function () {
            var oCartModel = this.getOwnerComponent().getModel("cart");
            var aCartItems = oCartModel.getProperty("/items") || [];
            var aSelectedContexts = this.byId("availableTable").getSelectedContexts();
            var sModelName = this.getView().getBindingContext().getProperty("name");

            var bAdded = false;
            var bAlreadyInCart = false;

            aSelectedContexts.forEach(function (oContext) {
                var oProduct = oContext.getObject();

                var bExists = aCartItems.some(function (item) {
                    return item.ID === oProduct.ID;
                });

                if (!bExists) {
                    aCartItems.push({
                        ID: oProduct.ID,
                        code: oProduct.code,
                        modelName: sModelName
                    });
                    bAdded = true;
                } else {
                    bAlreadyInCart = true;
                }

                // if (!aCartItems.find(item => item.ID === oProduct.ID)) {
                //     aCartItems.push({
                //         ID: oProduct.ID,
                //         code: oProduct.code,
                //         modelName: sModelName
                //     });
                // }
            }.bind(this));

            if (bAlreadyInCart && !bAdded) {
                sap.m.MessageToast.show("Notice: All selected items were already in your cart.");
            } else if (bAlreadyInCart && bAdded) {
                sap.m.MessageToast.show("Added new items; duplicates were skipped.");
            } else if (bAdded) {
                sap.m.MessageToast.show("Items added to cart successfully.");
            }

            oCartModel.setProperty("/items", aCartItems);
            oCartModel.setProperty("/count", aCartItems.length);
            //sap.m.MessageToast.show("Added to cart");
            this.byId("availableTable").removeSelections();
        }
    });
});