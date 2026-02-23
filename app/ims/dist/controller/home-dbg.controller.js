sap.ui.define(["sap/ui/core/mvc/Controller", "sap/ui/model/json/JSONModel", "sap/ui/model/FilterOperator", "sap/ui/model/Filter", "sap/ui/core/Fragment", "sap/m/MessageBox", "sap/ui/core/BusyIndicator", "sap/m/MessageToast"], function (Controller, JSONModel, FilterOperator, Filter, Fragment, MessageBox, BusyIndicator, MessageToast) {
  "use strict";

  /**
   * @namespace ims.controller
   */
  const home = Controller.extend("ims.controller.home", {
    constructor: function constructor() {
      Controller.prototype.constructor.apply(this, arguments);
      this._popovers = {};
    },
    /*eslint-disable @typescript-eslint/no-empty-function*/onInit: function _onInit() {
      var oUiModel = new JSONModel({
        totalRestockCost: 0,
        totalRepairCost: 0,
        totalEvalCost: 0
      });
      var secModel = this.getOwnerComponent().getModel("security");
      console.log("here i am:");
      console.log(secModel.getData());
      this.getView().setModel(oUiModel, "ui");
      var oVizFrame = this.byId("idVizFramePie");
      var oVizFrame1 = this.byId("idVizFramePie1");
      oVizFrame.setVizProperties({
        legend: {
          title: {
            visible: true
          }
        },
        title: {
          visible: true,
          text: 'Asset Status Distribution'
        },
        plotArea: {
          dataLabel: {
            visible: true,
            type: 'percentage'
          },
          colorPalette: ['#2b7d2b', '#bb0000', '#e69a00', '#5d66d4'] // Custom Colors
        }
      });
      oVizFrame1.setVizProperties({
        legend: {
          title: {
            visible: true
          }
        },
        plotArea: {
          dataLabel: {
            visible: true,
            type: 'percentage'
          }
          //colorPalette: ['#89d089ff', '#e3a5a5ff', '#d9b671ff', '#aeb2dfff'] // Custom Colors
        }
      });
      var oMessageManager = sap.ui.getCore().getMessageManager();
      this.getView().setModel(oMessageManager.getMessageModel(), "message");
      oMessageManager.registerObject(this.getView(), true);
      var oRouter = this.getOwnerComponent().getRouter();
      oRouter.getRoute("Routehome").attachPatternMatched(this._onObjectMatched, this);
    },
    _onObjectMatched: function _onObjectMatched() {
      this.getView().setBusy(true);
      this.getView().getModel().refresh();
      this._loadAnalyticalData();
      //this._applyFilters();
      this._applyDistributionFilter("available");
    },
    onToggleDistribution: function _onToggleDistribution(oEvent) {
      var iIndex = oEvent.getParameter("selectedIndex");
      var sStatus = iIndex === 0 ? "available" : null;
      this._applyDistributionFilter(sStatus);
    },
    _applyDistributionFilter: function _applyDistributionFilter(sStatus) {
      var oVizFrame = this.byId("idVizFramePie1");
      var oBinding = oVizFrame.getDataset().getBinding("data");
      if (oBinding) {
        oBinding.attachEventOnce("dataReceived", () => {
          this.getView().setBusy(false);
        });
        oBinding.filter([new Filter("unit_type", FilterOperator.NE, null),
        // Basic data check
        new Filter("status", FilterOperator.EQ, sStatus)]);
      } else {
        oVizFrame.addEventDelegate({
          onAfterRendering: () => {
            this._applyDistributionFilter(sStatus);
          }
        });
      }
    },
    _loadAnalyticalData: function _loadAnalyticalData() {
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
    onSearchCategory: function _onSearchCategory(oEvent) {
      var sQuery = oEvent.getParameter("query");
      var oBinding = this.byId("categoryHBox").getBinding("items");
      if (sQuery && sQuery.length > 0) {
        var oFilter = new Filter("unit_type", FilterOperator.Contains, sQuery);
        oBinding.filter([oFilter]);
      } else {
        oBinding.filter([]);
      }
    },
    onShowRestockPopover: function _onShowRestockPopover(oEvent) {
      this._openPopover(oEvent.getSource(), "ims.view.fragments.RestockBreakdown");
    },
    onShowRepairPopover: function _onShowRepairPopover(oEvent) {
      this._openPopover(oEvent.getSource(), "ims.view.fragments.RepairBreakdown");
    },
    onShowValuationPopover: function _onShowValuationPopover(oEvent) {
      this._openPopover(oEvent.getSource(), "ims.view.fragments.ValuationBreakdown");
    },
    _openPopover: function _openPopover(oControl, sFragmentName) {
      if (!this._popovers) {
        this._popovers = {};
      }
      if (!this._popovers[sFragmentName]) {
        Fragment.load({
          id: this.getView().getId(),
          name: sFragmentName,
          controller: this
        }).then(oPopover => {
          this.getView().addDependent(oPopover);
          this._popovers[sFragmentName] = oPopover;
          oPopover.openBy(oControl);
        });
      } else {
        this._popovers[sFragmentName].openBy(oControl);
      }
    },
    onCardPress: function _onCardPress(oEvent) {
      const oContext = oEvent.getSource().getBindingContext();
      const sCategory = oContext.getProperty("unit_type");
      console.log("Navigating for Category: " + sCategory);
      var oRouter = this.getOwnerComponent().getRouter();
      oRouter.navTo("ProductsList", {
        unitType: sCategory
      });
    },
    onNavToRequests: function _onNavToRequests() {
      this.getOwnerComponent().getRouter().navTo("RequestList");
    },
    onNavToLogs: function _onNavToLogs() {
      this.getOwnerComponent().getRouter().navTo("LogList");
    },
    onNavToPossessions: function _onNavToPossessions() {
      const sUserID = this.getOwnerComponent().getModel("security").getProperty("/ID");
      this.getOwnerComponent().getRouter().navTo("PossessionList", {
        userID: sUserID
      });
    },
    onCategorySelectionChange: function _onCategorySelectionChange(oEvent) {
      const sSelected = oEvent.getParameter("newValue");
      const oCustomInput = this.byId("customCategory");
      if (sSelected) {
        oCustomInput.setValue("");
        oCustomInput.setEnabled(false);
      } else {
        oCustomInput.setEnabled(true);
      }
    },
    onCustomCategoryChange: function _onCustomCategoryChange(oEvent) {
      const sValue = oEvent.getParameter("newValue");
      const oCombo = this.byId("newCategoryCombo");
      if (sValue && sValue.trim().length > 0) {
        oCombo.setSelectedKey("");
        oCombo.setEnabled(false);
      } else {
        oCombo.setEnabled(true);
      }
    },
    onOpenCreateDialog: function _onOpenCreateDialog() {
      const oView = this.getView();
      if (!this._pDialog) {
        this._pDialog = Fragment.load({
          id: oView.getId(),
          name: "ims.view.fragments.CreateModel",
          controller: this
        }).then(oDialog => {
          oView.addDependent(oDialog);
          return oDialog;
        });
      }
      this._pDialog.then(oDialog => oDialog.open());
    },
    onCloseDialog: function _onCloseDialog() {
      this.byId("createModelDialog").close();
    },
    onSaveNewModel: function _onSaveNewModel() {
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
        var aExistingCategories = oCombo.getBinding("items").getContexts().map(function (oCtx) {
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
      });
      var oNewContext = oListBinding.create({
        name: this.byId("newName").getValue(),
        unit_type: sFinalCategory,
        unit_price: parseFloat(this.byId("newPrice").getValue()) || 0,
        reorder_level: parseInt(this.byId("newReorder").getValue()) || 2
      });
      var oDialog = this.byId("createModelDialog");
      BusyIndicator.show(0);
      oModel.submitBatch(sGroupId).then(() => {
        oDialog.close();
        MessageToast.show("Creation attempted. Check Message Popover in the footer.");
        this.getView().getModel().getAllBindings().forEach(oBinding => {
          if (oBinding.getPath() === "/DashboardCards") {
            oBinding.refresh();
          }
        });
      }).catch(() => {
        console.log("Request failed, check Message Popover");
      }).finally(() => {
        BusyIndicator.hide();
      });
    },
    formatCurrencyShort: function _formatCurrencyShort(fValue) {
      if (!fValue) return "0";
      var fNum = parseFloat(fValue);
      if (fNum >= 1000000) {
        return (fNum / 1000000).toFixed(1); // Returns 1.2 for 1,200,000
      } else if (fNum >= 1000) {
        return (fNum / 1000).toFixed(1); // Returns 150.5 for 150,500
      }
      return fNum.toFixed(0);
    },
    formatScale: function _formatScale(fValue) {
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
  return home;
});
//# sourceMappingURL=home-dbg.controller.js.map
