sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/core/routing/History",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "sap/ui/model/json/JSONModel",
    "sap/ui/core/Fragment",
    "inventorysample/controller/ErrorHandler"
], function (Controller, Filter, FilterOperator, History, MessageToast, MessageBox, JSONModel, Fragment,ErrorHandler) {
    "use strict";

    return ErrorHandler.extend("inventorysample.controller.ProductsList", {
        onInit: function () {
            var oRouter = this.getOwnerComponent().getRouter();
            oRouter.getRoute("ProductsList").attachPatternMatched(this._onObjectMatched, this);
            var oLocalModel = new JSONModel({
                newSerials: []
            });
            this.getView().setModel(oLocalModel, "bulk");
        },

        _onObjectMatched: function (oEvent) {
            var sUnitType = oEvent.getParameter("arguments").unitType;
            this.getView().byId("filterUnitType").setValue(sUnitType);

            var oTable = this.byId("productsTable");
            var oBinding = oTable.getBinding("items");
            if (oBinding) {
                oBinding.refresh();
            }
            var aFilters = [];

            if (sUnitType && sUnitType !== "All") {
                aFilters.push(new Filter("unit_type", FilterOperator.EQ, sUnitType));
            }

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

        onRowPress: function (oEvent) {
            var oItem = oEvent.getSource();
            var sPath = oItem.getBindingContext().getPath();
            var sID = sPath.split("(")[1].replace(")", "");
            this.getOwnerComponent().getRouter().navTo("ProductObjectPage", {
                ID: sID
            });
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

            // Get the path of the row that was clicked (e.g., "/newSerials/2")
            var sPath = oEvent.getSource().getBindingContext("bulk").getPath();
            var iIndex = parseInt(sPath.split("/").pop());

            // Remove the item and refresh the model
            aSerials.splice(iIndex, 1);
            oBulkModel.setProperty("/newSerials", aSerials);
        },

        onOpenBulkDialog: function () {
            var oView = this.getView();
            if (!this._pBulkDialog) {
                this._pBulkDialog = Fragment.load({
                    id: oView.getId(),
                    name: "inventorysample.view.fragments.CreateBulkProducts",
                    controller: this
                }).then(function (oDialog) {
                    oView.addDependent(oDialog);
                    return oDialog;
                });
            }
            this._pBulkDialog.then(function (oDialog) {

                this.getView().getModel("bulk").setProperty("/newSerials", [{ code: "" }]);
                oDialog.open();
            }.bind(this));
        },

        onSaveBulkProducts: function () {
            const oModel = this.getOwnerComponent().getModel();
            const oBulkModel = this.getView().getModel("bulk");
            const sUnitType = this.byId("filterUnitType").getValue();

            const oDetailsBinding = oModel.bindList("/Details");
            const oNewDetailsContext = oDetailsBinding.create({
                name: this.byId("bulkName").getValue(),
                description: this.byId("bulkDesc").getValue(),
                unit_price: parseFloat(this.byId("bulkPrice").getValue()) || 0,
                unit_type: sUnitType,
                reorder_level: this.byId("bulkReorder").getValue() || 2
            });

            this.byId("bulkCreateDialog").setBusy(true);

            // 2. First Submit: This pushes the Header to SQLite to generate the UUID
            oModel.submitBatch(oModel.getUpdateGroupId()).then(function () {
                // Wait for the 'created' promise to ensure the ID is back from the server
                return oNewDetailsContext.created();
            }).then(function () {
                // SUCCESS: The Header now has a real ID
                const sGeneratedID = oNewDetailsContext.getProperty("ID");
                const aSerials = oBulkModel.getProperty("/newSerials");
                const oProductsBinding = oModel.bindList("/Products");

                // 3. Create the Products using the newly generated ID as the link
                aSerials.forEach(function (oRow) {
                    if (oRow.code && oRow.code.trim() !== "") {
                        oProductsBinding.create({
                            code: oRow.code,
                            status: "available",
                            details_ID: sGeneratedID // Linking the Foreign Key
                        });
                    }
                });
                this.byId("bulkCreateDialog").setBusy(false);
                sap.m.MessageToast.show("Model and Serial Numbers created!");
                this.onCloseBulkDialog();
                // Refresh table to show new counts
                this.byId("productsTable").getBinding("items").refresh();

                // 4. Second Submit: Push all serial numbers
                return oModel.submitBatch(oModel.getUpdateGroupId());

            }).catch(function (oError) {
                this.byId("bulkCreateDialog").setBusy(false);
                // Fix for the TypeError: Check if oError exists and has a message
                if (oNewDetailsContext.getPath()) {
                    oNewDetailsContext.delete(sGroupId); // Remove the header we just created
                    oModel.submitBatch(sGroupId);
                }

                console.error("Transaction Failed. Changes rolled back. Error: ");
            }).finally(function () {
                    // --- NUCLEAR UN-FREEZE ---
                    // This runs 100% of the time. Success or Fail.
                    this.byId("bulkCreateDialog").setBusy(false);
            });
        },

        onCloseBulkDialog: function () {
            this.byId("bulkCreateDialog").close();
        },

        onTableSelectionChange: function () {
            alert("Delete'er jonno daba diya")
        },

        onTableSelectionChange: function (oEvent) {
            var oTable = oEvent.getSource();
            var iSelectedItems = oTable.getSelectedItems().length;
            var oDeleteButton = this.byId("deleteProduct");

            oDeleteButton.setEnabled(iSelectedItems > 0);

            if (iSelectedItems > 0) {
                
                oDeleteButton.setText("Delete Selected (" + iSelectedItems + ")");
            } else {
                
                oDeleteButton.setText("Delete");
            }
        },

        onDeleteSelected: function () {
            var oTable = this.byId("productsTable");
            var aSelectedContexts = oTable.getSelectedContexts();
            var oModel = this.getView().getModel();

            console.log(aSelectedContexts.length);

            if (aSelectedContexts.length == 0)
            {
                MessageBox.alert("No items selected!")
            }
            else {
            MessageBox.confirm("Delete " + aSelectedContexts.length + " items?", {
                onClose: function (sAction) {
                    if (sAction === "OK") {
                        this.getView().setBusy(true);

                        aSelectedContexts.forEach(function (oContext) {
                            oContext.delete();
                        });

                        oModel.submitBatch(oModel.getUpdateGroupId()).then(function () {
                            this.getView().setBusy(false);
                            MessageToast.show("Deleted successfully.");
                            this.byId("deleteProduct").setEnabled(false);
                            this.byId("deleteProduct").setText("Delete");
                            oTable.removeSelections();
                        }.bind(this));
                    }}.bind(this)
                });
            }
        },

        onTableSearch: function (oEvent) {
            var sQuery = oEvent.getParameter("newValue");
            var sUnitType = this.getView().byId("filterUnitType").getValue();
            var oFilterType = new Filter("unit_type", FilterOperator.EQ, sUnitType);

            var aFilters = [];
            aFilters.push(oFilterType);

            if (sQuery && sQuery.length > 0) {
                var oFilterName = new Filter("name", FilterOperator.Contains, sQuery);
                var oFilterDesc = new Filter("description", FilterOperator.Contains, sQuery);
                var oCombinedFilter = new Filter({
                    filters: [oFilterName, oFilterDesc],
                    and: false
                });
                aFilters.push(oCombinedFilter);
            }

            var oTable = this.byId("productsTable");
            var oBinding = oTable.getBinding("items");
            oBinding.filter(aFilters);
            oTable.removeSelections();
            this.onTableSelectionChange({ getSource: function() { return oTable; } });
        }
    });
});