import { Component, OnInit, ViewContainerRef } from "@angular/core";
import * as dialogs from "tns-core-modules/ui/dialogs";

import { MenuChoice, ForcedModifier, MenuSubOption, ChoiceLayer, ForcedChoiceItemDetail, ChoiceItem } from "~/app/models/products";
import { SQLiteService } from "~/app/services/sqlite.service";
import { ModalDialogParams } from "nativescript-angular";
import { OrderDetail, ItemType } from "~/app/models/orders";
import { isNull } from "@angular/compiler/src/output/output_ast";

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
    //productCode: number = parseInt(localStorage.getItem("ProductCode"));
    activeLayer: ChoiceLayer = {};
    currentChoice: MenuChoice = null;
    orderProduct: OrderDetail;
    orderItems: OrderDetail[] = [];

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

                if (this.orderItems != null && this.orderItems.length > 0)
                {
                    this.choiceLayers.forEach(cl => 
                        {
                            let choice: MenuChoice = {
                                Name: this.orderItems.find(oi => oi.IndexDataSub == cl.Layer && oi.ItemType == ItemType.ForcedChoice).ProductName,
                                SubOptions: []
                            }
                            let subOptions = this.orderItems.filter(oi => oi.IndexDataSub == cl.Layer && oi.ItemType == ItemType.SubOption)
                            
                            subOptions.forEach(function (od: OrderDetail) {                                
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
                this.choiceLayerSelected(this.choiceLayers[0]);
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
             choiceLayer.Class= 'choiceLayer';
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

    choiceSelectedX(choice: MenuChoice)
    {
        let forcedChoiceItem: ForcedChoiceItemDetail = {
            ItemName: choice.Name,          // e.g. Chicken
            PrintName: choice.PrintName,
            Key: choice.Key,
            ItemType: ItemType.ForcedChoice,
            Price: choice.Charge,
            ReportProductMix: choice.ReportProductMix,            
        }

        this.choiceItem.ForcedChoiceItems.push(forcedChoiceItem);
    }

    subChoiceSelectedX(choice: MenuSubOption)
    {
        let forcedChoiceItem: ForcedChoiceItemDetail = {
            ItemName: choice.Name,          // e.g. Chicken
            PrintName: choice.PrintName,
            Key: choice.Key,
            ItemType: ItemType.SubOption,
            Price: choice.ApplyCharge ? choice.Charge : 0,
            ReportProductMix: choice.ReportProductMix,            
        }

        this.choiceItem.ForcedChoiceItems.push(forcedChoiceItem);
    }

    choiceSelected(choice: MenuChoice)
    {
        // if changing choices - check if choice made is not one of the current choice, if so remove the layer's previous choice
        if (this.orderItems != null && this.currentChoices.find (cc => cc.IndexDataSub == choice.Layer && cc.ProductName == choice.Name) == null)
        {
            this.currentChoices = this.currentChoices.filter( cc => cc.IndexDataSub != choice.Layer)
        }

        this.currentChoice = choice;
        this.currentChoice.SubOptions = [];
        this.activeLayer.Choice = choice;            
        let that = this;    
             
        if (choice.ForcedChoice || this.subOptionsActive)
        {
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
        else
        {
            this.setChoice(choice);
        }               
    }

    setChoice(choice: MenuChoice)
    {
        // find current choice and set to new choice
        let that = this;
        let qty: number = this.orderProduct.Quantity;

        let orderItem: OrderDetail  =  {
                PriKey: 0,
                OrderTime: new Date(),
                IndexDataOption: choice.Key,
                Quantity: null,                
                //IndexDataSub : choice.Layer,
                IndexData: this.orderProduct.IndexData,
                ItemType: ItemType.ForcedChoice,
                ProductName: '   ' + choice.Name,
                PrintName: '   ' + choice.PrintName,
                ReportProductMix: choice.ReportProductMix
           };

        if (choice.Charge > 0)   
        {
            orderItem.UnitPrice = choice.Charge;
            orderItem.ExtPrice = choice.Charge * qty;
        }

        // replace current layer's choice with new choice
        if (this.currentChoices.length > 0)
            this.currentChoices = this.currentChoices.filter(cc=> cc.IndexDataSub != choice.Layer);

        this.currentChoices.push(orderItem); 
            choice.SubOptions.forEach( so => {
                let orderSubItem: OrderDetail  =  { 
                    ProductName : '      ' + so.Name,
                    PrintName: '      ' + so.PrintName,
                    Quantity: null,    
                    IndexDataSub : so.Layer,
                    IndexData: that.orderProduct.IndexData,
                    ItemType: ItemType.SubOption,
                    ReportProductMix: so.ReportProductMix,
                };
           if (so.ApplyCharge && choice.Charge > 0)              
            {
                orderItem.UnitPrice = choice.Charge;
                orderItem.ExtPrice = choice.Charge * qty;
            }

            this.currentChoices.push(orderSubItem);
        } );          
        
        // reset current choice
        this.currentChoice = null;
        
        if (this.changingChoices)
            return;

        this.activeLayer.ChoiceMade = true;

        // all layers choice made?
        let firstUnselectedLayer: ChoiceLayer = this.choiceLayers.find(cl => cl.ChoiceMade == false);

        if (firstUnselectedLayer == null)
        {
            this.close();
        }                
        else
        {        
            this.showSubChoices = false;
            this.choiceLayerSelected(firstUnselectedLayer);
        }
    }

    subChoiceSelected(subChoice: MenuSubOption) {
        subChoice.Selected = !subChoice.Selected;

        if (subChoice.Selected)
        {
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
        this.params.closeCallback(this.currentChoices);
    }

    accept()
    {
        if (this.currentChoice != null)
            this.setChoice(this.currentChoice);
        
        this.close();    
    }

    cancel() {
        this.params.closeCallback(null);
    }
    
    constructor(private DBService: SQLiteService, private params: ModalDialogParams) { }

    ngOnInit() {
        //this.productCode = this.params.context.productCode;
        //this.currentChoices = this.params.context.currentChoices;
        this.orderProduct = this.params.context.orderProduct;    
        this.isAdding =  this.params.context.isAdding;   
        /*
        if (this.orderItems != null)
        {
            this.productCode = this.orderItems[0].ProductCode;
            this.indexData = this.orderItems[0].IndexData;
        } 
        */   
        this.getChoiceLayers();
    }   
}
