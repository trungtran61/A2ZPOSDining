import { Component, OnInit, ViewContainerRef } from "@angular/core";
import * as dialogs from "tns-core-modules/ui/dialogs";

import { MenuChoice, ForcedModifier, MenuSubOption, ChoiceLayer, ForcedChoiceItemDetail, ChoiceItem, Product } from "~/app/models/products";
import { SQLiteService } from "~/app/services/sqlite.service";
import { ModalDialogParams } from "nativescript-angular";
import { OrderDetail, ItemType } from "~/app/models/orders";
import { UtilityService } from "~/app/services/utility.service";

@Component({
    selector: "forced-modifiers",
    moduleId: module.id,
    templateUrl: "./forced-modifiers.component.html",
    styleUrls: ['./forced-modifiers.component.css']
})
export class ForcedModifiersComponent implements OnInit {
    currentChoices: OrderDetail[] = [];
    choiceLayers: ChoiceLayer[] = [];
    choiceItems: ForcedModifier[] = [];
    choiceItem: ChoiceItem = { ForcedChoiceItems: [] };

    subChoiceItems: MenuSubOption[] = [];
    activeLayer: ChoiceLayer = {};
    currentChoice: MenuChoice = null;
    orderProduct: OrderDetail;
    orderItem: OrderDetail;
    orderItems: OrderDetail[];
    subOptions: OrderDetail[];
    product: Product;

    subOptionsActiveText: string = String.fromCharCode(0xf00c) + ' Sub Options'
    subOptionsInactiveText: string = 'Sub Options'
    subOptionsText: string = this.subOptionsInactiveText;
    subOptionsActive: boolean = false;

    selectedSubOptions: MenuSubOption[] = [];

    showSubChoices: boolean = false;
    changingChoices: boolean = false;
    isAdding: boolean = false;

    getChoiceLayers() {
        let that = this;

        this.DBService.getLocalChoiceLayers(this.orderProduct.ProductCode).then((choiceLayers) => {
            if (choiceLayers.length == 0) {
                dialogs.alert("Menu Choices Layers not loaded.");
            }
            else {
                this.choiceLayers = choiceLayers;

                if (!this.isAdding) {
                    this.choiceLayers.forEach(cl => {
                        let choice: MenuChoice = {
                            Name: this.orderItems.find(oi => oi.IndexDataSub == cl.Layer && oi.ItemType == ItemType.ForcedChoice).ProductName,
                            SubOptions: []
                        }
                        this.subOptions.filter(so => so.IndexDataSub == cl.Layer).forEach(function (od) {
                            choice.SubOptions.push(
                                {
                                    Name: od.ProductName
                                }
                            )
                            that.selectedSubOptions.push(
                                {
                                    Name: od.ProductName,
                                    Layer: cl.Layer
                                }
                            )
                        });

                        cl.Choice = choice;
                    }
                    );
                }
                let choiceLayer: ChoiceLayer = this.choiceLayers[0];
                
                if (this.orderItem.ItemType != ItemType.Product)
                {
                    choiceLayer = this.choiceLayers.find(cl => cl.Layer == this.orderItem.IndexDataSub);
                }    

                this.choiceLayerSelected(choiceLayer);
            }
            //this.setActiveLayer(0);   
        });
    }

    activateSubOptions() {
        this.subOptionsActive = !this.subOptionsActive;
        this.subOptionsText = this.subOptionsActive ? this.subOptionsActiveText : this.subOptionsInactiveText;
    }

    setActiveLayer(choiceLayer: ChoiceLayer) {
        this.choiceLayers.forEach(function (choiceLayer: ChoiceLayer) {
            choiceLayer.Class = 'choiceLayer';
        });
        this.activeLayer = choiceLayer;
        choiceLayer.Class = 'choiceLayerActive';
        this.showSubChoices = false;
    }

    choiceLayerSelected(choiceLayer: ChoiceLayer) {
        // if new layer selected, set choice for previous layer
        if (this.currentChoice != null)
            this.setChoice(this.currentChoice);

        let that = this;

        this.DBService.getLocalMenuChoiceItems(choiceLayer, this.orderProduct.ProductCode).then((items) => {
            if (items.length == 0) {
                dialogs.alert("Menu Choice Items not loaded.");
            }
            else {
                this.choiceItems = items;
                this.choiceItems.forEach(function (menuChoice: MenuChoice) {
                    menuChoice.Row = Math.floor((menuChoice.Position - 1) / 4);
                    // 4 columns so use 4
                    menuChoice.Col = menuChoice.Position - (menuChoice.Row * 4) - 1;
                });
                this.setActiveLayer(choiceLayer);
            }
        });
    }
   
    choiceSelected(choice: MenuChoice) {
        // if changing choices - check if choice made is not one of the current choice, if so remove the layer's previous choice
        if (!this.isAdding && this.currentChoices.find(cc => cc.IndexDataSub == choice.Layer && cc.ProductName == choice.Name) == null) {
            this.currentChoices = this.currentChoices.filter(cc => cc.IndexDataSub != choice.Layer)
        }

        this.currentChoice = choice;
        this.currentChoice.SubOptions = [];
        this.activeLayer.Choice = choice;
       
        if (choice.ForcedChoice || this.subOptionsActive) {
            this.subOptionsActive = false;
            this.DBService.getLocalMenuSubOptions(choice.ChoiceID).then((items) => {
                if (items.length == 0) {
                    // choice has no sub choices
                    this.setChoice(choice);
                }
                else {
                    this.subChoiceItems = items;
                    this.subChoiceItems.forEach(function (item: MenuSubOption) {
                        item.Row = Math.floor((item.Position - 1) / 4);
                        // 4 columns so use 4
                        item.Col = item.Position - (item.Row * 4) - 1;
                        item.Selected = false;
                    });
                    this.showSubChoices = true;
                    this.currentChoice = choice;
                }
            });
        }
        else {
            this.setChoice(choice);
        }
    }

    setChoice(choice: MenuChoice) {
        // find current choice and set to new choice
        let currentDate: string = this.utilSvc.getCurrentTime();
        let that = this;
        let qty: number = this.orderProduct.Quantity;
        let od: OrderDetail = Object.assign({}, this.product);
        od = Object.assign({}, this.orderProduct);
        od.PriKey = 0;
        od.OrderTime = currentDate;
        od.IndexDataOption = choice.Key;
        od.Quantity = null;
        od.IndexDataSub = choice.Layer;        
        od.ItemType = ItemType.ForcedChoice;
        od.ProductName = '   ' + choice.Name;
        od.PrintName = '   ' + choice.PrintName;
        od.ReportProductMix = choice.ReportProductMix;        
        od.UnitPrice = 0;
        od.ExtPrice = null;
        
        if (choice.Charge > 0) {
            od.UnitPrice = choice.Charge;
            od.ExtPrice = choice.Charge * qty;
            od.TaxRate = this.orderProduct.TaxRate;
        }

        // replace current layer's choice with new choice
        if (this.currentChoices.length > 0)
            this.currentChoices = this.currentChoices.filter(cc => cc.IndexDataSub != choice.Layer);

        this.currentChoices.push(od);
 
        choice.SubOptions.forEach(so => {
            let osi: OrderDetail = Object.assign({}, this.product);
            osi = Object.assign({}, this.orderProduct);
            osi.ProductName = '      ' + so.Name;
            osi.PrintName = '      ' + so.PrintName;
            osi.Quantity = null;
            osi.IndexDataOption = so.ChoiceID;
            osi.IndexDataSub = so.Layer;
            osi.IndexData = that.orderProduct.IndexData;
            osi.ItemType = ItemType.SubOption;
            osi.ReportProductMix = so.ReportProductMix;
            osi.UnitPrice = 0;
            osi.ExtPrice = null;

            if (so.ApplyCharge && so.Charge > 0) {
                osi.UnitPrice = so.Charge;
                osi.ExtPrice = so.Charge * qty;
                osi.TaxRate = this.orderProduct.TaxRate;
            }            

            this.currentChoices.push(osi);
        });

        // reset current choice
        this.currentChoice = null;

        if (this.changingChoices)
            return;

        this.activeLayer.ChoiceMade = true;

        // all layers choice made?
        let firstUnselectedLayer: ChoiceLayer = this.choiceLayers.find(cl => cl.ChoiceMade == false);

        if (firstUnselectedLayer == null) {
            this.close();
        }
        else {
            this.showSubChoices = false;
            this.choiceLayerSelected(firstUnselectedLayer);
        }
    }

    subChoiceSelected(subChoice: MenuSubOption) {
        subChoice.Selected = !subChoice.Selected;

        if (subChoice.Selected) {
            this.currentChoice.SubOptions.push(subChoice);
            this.activeLayer.ChoiceMade = true;
        }
        else
            this.currentChoice.SubOptions = this.currentChoice.SubOptions.filter(obj => obj !== subChoice);

    }

    doneSubOptions(subChoice: MenuSubOption) {
        this.setChoice(this.currentChoice);
        this.subOptionsActive = false;
        let choiceLayer: ChoiceLayer = this.choiceLayers.find(choiceLayer => choiceLayer.Layer != this.activeLayer.Layer)

        this.setActiveLayer(choiceLayer);
        this.choiceLayerSelected(this.activeLayer);
    }

    close() {
        // if changing choices, re-sort choices by layer
        this.currentChoices.sort((a, b) => a.IndexDataSub > b.IndexDataSub
                ? 1 : a.IndexDataSub < b.IndexDataSub  ? -1 : 0);
        
        this.params.closeCallback(this.currentChoices);
    }

    accept() {
        if (this.currentChoice != null)
            this.setChoice(this.currentChoice);

        this.close();
    }

    cancel() {
        this.params.closeCallback(null);
    }

    constructor(private DBService: SQLiteService, private params: ModalDialogParams, private utilSvc: UtilityService) { }

    ngOnInit() {
        this.isAdding = this.params.context.isAdding;
        this.orderItems = this.params.context.orderItems;
        this.orderProduct = this.orderItems.find(oi => oi.ItemType == ItemType.Product);
        this.subOptions = this.orderItems.filter(od => od.ItemType == ItemType.SubOption);
        this.product = this.params.context.product;
        this.orderItem = this.params.context.orderItem; 

        if (!this.isAdding)
        {
            this.currentChoices = this.orderItems.filter(od => (od.ItemType != ItemType.Option && od.ItemType != ItemType.Product && od.IndexDataSub != null));
        }

        this.getChoiceLayers();
    }
}
