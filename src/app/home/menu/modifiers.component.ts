import { Component, OnInit } from "@angular/core";
import { ModalDialogParams } from "nativescript-angular/modal-dialog";

@Component({
    selector: "modifiers",   
    moduleId: module.id,
    templateUrl: "./modifiers.component.html",
	styleUrls: ['./modifiers.component.css']
})
export class ModifiersComponent implements OnInit {
    modifiers: string[] = []; 
    selectedModifiers: string[] = [];
    currentModifiers: string[] = []; 
    modifier: string;
    buttonColor:string = 'blue'

    modifyButtonsList: string[] = ['Add', 'Extra', 'Less', 'No'];
    
    onButtonTap(modifier): void {
        this.modifier = modifier;
        //this.buttonColor = '#345465'
        console.log(modifier);
    }

    addModifierToCheckItem(modifier)
    {
        this.selectedModifiers.push(this.modifier + ' ' + modifier);
        this.currentModifiers.push(this.modifier + ' ' + modifier);
    }

    removeModifier(index: number)
    {
        this.currentModifiers.splice(index, 1);
    }

    constructor(private params: ModalDialogParams) { }

    ngOnInit() { 
        this.modifiers = this.params.context.modifiers;
        this.currentModifiers = this.params.context.currentmodifiers;
        console.log(this.params.context.currentmodifiers.length);
    }
 
    close() {
        this.params.closeCallback(this.currentModifiers);
    }
}
