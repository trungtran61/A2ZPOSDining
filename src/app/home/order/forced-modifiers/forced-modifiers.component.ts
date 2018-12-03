import { Component, OnInit, ViewContainerRef } from "@angular/core";
import * as dialogs from "tns-core-modules/ui/dialogs";

import { MenuChoice, ForcedModifier, MenuSubOption, ChoiceLayer } from "~/app/models/products";
import { SQLiteService } from "~/app/services/sqlite.service";
import { ModalDialogParams } from "nativescript-angular";
import { OrderDetail } from "~/app/models/orders";

@Component({
    selector: "forced-modifiers",
    moduleId: module.id,
    templateUrl: "./forced-modifiers.component.html",
    styleUrls: ['./forced-modifiers.component.css']
})
export class ForcedModifiersComponent implements OnInit {
    currentChoices: MenuChoice[] = [];
    choiceLayers: ChoiceLayer[] = [];
    choiceItems: ForcedModifier[] = [];
    subChoiceItems: MenuSubOption[] = [];
    productCode: number = parseInt(localStorage.getItem("ProductCode"));
    activeLayer: ChoiceLayer = {};
    currentChoice: MenuChoice = null;
    orderItem: OrderDetail;

    subOptionsActiveText: string = String.fromCharCode(0xf00c) + ' Sub Options'
    subOptionsInactiveText: string = 'Sub Options'
    subOptionsText: string = this.subOptionsInactiveText;
    subOptionsActive: boolean = false;

    showSubChoices: boolean = false;
    changingChoices: boolean = false;

    getChoiceLayers() {
        let that = this;

        this.DBService.getLocalChoiceLayers(this.productCode).then((choiceLayers) => {
            if (choiceLayers.length == 0) {
                dialogs.alert("Menu Choices Layers not loaded.");
            }
            else {
                this.choiceLayers = choiceLayers;
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

        this.DBService.getLocalMenuChoiceItems(choiceLayer, this.productCode).then((items) => {
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

    choiceSelected(choice: MenuChoice)
    {
        this.currentChoice = choice;
        this.currentChoice.SubOptions = [];
        this.activeLayer.Choice = choice;                
             
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
        if (this.currentChoices.length > 0)
        {
           let _choice  =  this.currentChoices.find(x => x.Layer == choice.Layer);
            if (_choice != null)
            {
                _choice.Name = choice.Name;
            }
            else
            {
                this.currentChoices.push(choice)
            }
        }
        else
        {
            this.currentChoices.push(choice)
        }         
        // reset current choice
        this.currentChoice = null;
        
        if (this.changingChoices)
            return;

        this.activeLayer.ChoiceMade = true;

        // all layers choice made?
        let firstUnselectedLayer: ChoiceLayer = this.choiceLayers.find(cl => cl.ChoiceMade == false);

        if (firstUnselectedLayer == null)
        {
            this.close(this.currentChoices);
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

    close(currentChoices: any) {
        this.params.closeCallback(currentChoices);
    }

    constructor(private DBService: SQLiteService, private params: ModalDialogParams, private viewContainerRef: ViewContainerRef) { }

    ngOnInit() {
        this.productCode = this.params.context.productCode;
        this.currentChoices = this.params.context.currentChoices;
        this.orderItem = this.params.context.orderItem;

        if (this.orderItem != null)
            this.productCode = this.orderItem.ProductCode;
            
        this.getChoiceLayers();
    }   
}
