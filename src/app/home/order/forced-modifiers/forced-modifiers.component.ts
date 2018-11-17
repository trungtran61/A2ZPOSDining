import { Component, OnInit, ViewContainerRef } from "@angular/core";
import * as dialogs from "tns-core-modules/ui/dialogs";

import { MenuChoice, ForcedModifier, MenuSubOption, ChoiceLayer } from "~/app/models/products";
import { SQLiteService } from "~/app/services/sqlite.service";
import { ModalDialogParams } from "nativescript-angular";

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
    activeLayerIndex: number = 0;
    currentChoice: MenuChoice = null;

    subOptionsActiveText: string = String.fromCharCode(0xf00c) + ' Sub Options'
    subOptionsInactiveText: string = 'Sub Options'
    subOptionsText: string = this.subOptionsInactiveText;
    subOptionsActive: boolean = false;

    showSubChoices: boolean = false;

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

        choiceLayer.Class = 'choiceLayerActive';
    }

    choiceLayerSelected(choiceLayer: ChoiceLayer) {
        let that = this;

        this.DBService.getLocalMenuChoiceItems(choiceLayer, this.productCode).then((items) => {
            if (items.length == 0) {
                dialogs.alert("Menu Choice Items not loaded.");
            }
            else {
                this.choiceItems = items;
                console.log(items);
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
        this.choiceLayers[this.activeLayerIndex].Choice = choice; 
       
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
                    console.log(items);
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
       
        return;
        }

        this.setChoice(choice);
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

        // all layers choice made?
        if (this.currentChoices.length == this.choiceLayers.length)
        {
            this.close(this.currentChoices);
        }

        this.activeLayerIndex++;

        if (this.activeLayerIndex >= this.choiceLayers.length)
        {                        
            this.activeLayerIndex = 0;
        }
        
        this.setActiveLayer(choice);  
        this.showSubChoices = false;
        this.choiceLayerSelected(this.choiceLayers[this.activeLayerIndex]);

    }

    subChoiceSelected(subChoice: MenuSubOption) {
        subChoice.Selected = !subChoice.Selected;

        if (subChoice.Selected)
            this.currentChoice.SubOptions.push(subChoice);
        else
            this.currentChoice.SubOptions = this.currentChoice.SubOptions.filter(obj => obj !== subChoice);           
        
    }

    doneSubOptions(subChoice: MenuSubOption) {
        this.setChoice(this.currentChoice);
        this.subOptionsActive = false;        
    }

    close(currentChoices: any) {
        this.params.closeCallback(currentChoices);
    }

    constructor(private DBService: SQLiteService, private params: ModalDialogParams, private viewContainerRef: ViewContainerRef) { }

    ngOnInit() {
        this.productCode = this.params.context.productCode;
        this.currentChoices = this.params.context.currentChoices;
        this.getChoiceLayers();
    }   
}
