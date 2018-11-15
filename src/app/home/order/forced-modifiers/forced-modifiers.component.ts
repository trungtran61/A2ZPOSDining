import { Component, OnInit, ViewContainerRef } from "@angular/core";
import * as dialogs from "tns-core-modules/ui/dialogs";

import { MenuChoice, ForcedModifier } from "~/app/models/products";
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
    choiceLayers: MenuChoice[] = [];
    choiceItems: ForcedModifier[] = [];
    subChoiceItems: ForcedModifier[] = [];
    productCode: number = parseInt(localStorage.getItem("ProductCode"));
    choiceLayerClasses: string[] = [];
    activeLayerIndex: number = 0;

    subOptionsActiveText: string = String.fromCharCode(0xf00c) + ' Sub Options'
    subOptionsInactiveText: string = 'Sub Options'
    subOptionsText: string = this.subOptionsInactiveText;
    subOptionsActive: boolean = false;

    showChoices: boolean = true;
    showSubChoices: boolean = false;

    getChoiceLayers() {
        let that = this;

        this.DBService.getLocalMenuChoices(this.productCode).then((choiceLayers) => {
            if (choiceLayers.length == 0) {
                dialogs.alert("Menu Choices Layers not loaded.");
            }
            else {
                this.choiceLayers = choiceLayers;
                this.choiceLayerSelected(this.choiceLayers[0], 0);
            }
            //this.setActiveLayer(0);   
        });
    }

    activateSubOptions() {
        this.subOptionsActive = !this.subOptionsActive;
        this.subOptionsText = this.subOptionsActive ? this.subOptionsActiveText : this.subOptionsInactiveText;
    }

    setActiveLayer(index: number) {
        let that = this;
        this.choiceLayerClasses = [];
        this.choiceLayers.forEach(function (menuChoice: MenuChoice) {
            that.choiceLayerClasses.push('choiceLayer');
        });

        this.choiceLayerClasses[index] = 'choiceLayerActive';
    }

    choiceLayerSelected(menuChoice: MenuChoice, index: number) {
        let that = this;

        this.DBService.getLocalMenuChoiceItems(menuChoice, this.productCode).then((items) => {
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
            }
        });
        this.activeLayerIndex = index;
        this.setActiveLayer(index);
    }

    xchoiceSelected(choice: MenuChoice) {
        this.showChoices = false;
        this.showSubChoices = true;
    }

    choiceSelected(choice: MenuChoice)
    {
        if (choice.ForcedChoice)
        {
        this.showChoices = false;
        this.showSubChoices = true;
        return;
        }
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
        
        this.setActiveLayer(this.activeLayerIndex);  
        this.choiceLayerSelected(this.choiceLayers[this.activeLayerIndex], this.activeLayerIndex);

    }

    subChoiceSelected(choice: MenuChoice) {
        return;
    }

    constructor(private DBService: SQLiteService, private params: ModalDialogParams, private viewContainerRef: ViewContainerRef) { }

    ngOnInit() {
        this.productCode = this.params.context.productCode;
        this.currentChoices = this.params.context.currentChoices;
        this.getChoiceLayers();
    }

    close(currentChoices: any) {
        this.params.closeCallback(currentChoices);
    }

}
