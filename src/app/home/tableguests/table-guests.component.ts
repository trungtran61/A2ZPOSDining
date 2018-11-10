import { Component, OnInit } from "@angular/core";
import { RouterExtensions } from "nativescript-angular/router";
//import { ModalDialogOptions, ModalDialogService } from "nativescript-angular/modal-dialog";
//import { ForcedModifiersComponent } from "../menu/forced-modifiers/forced-modifiers.component";
//import { OtherQtyComponent } from "../menu/other-qty.component";

@Component({
    selector: "TableGuests",
    moduleId: module.id,
    templateUrl: "./table-guests.component.html",
    styleUrls: ['./table-guests.component.css']
})
export class TableGuestsComponent implements OnInit {
    tableGuestsTitle: string = 'Choose the number of guests for table ';
    normalStyle: string = "color: black;background-image: linear-gradient(gold, yellow);";
    activeStyle: string = "color: black;background-image: linear-gradient(darkred, red);";
    styles: string[] = [this.normalStyle, this.normalStyle, this.normalStyle, this.normalStyle, this.normalStyle, this.normalStyle];
    digits: number[] = [1,2,3,4,5,6,7,8,9];
    digitRows: number[] = [];
    digitCols: number[] = [];
    isNormalChoice: boolean = true;
    guestsEntered: string = '';

    setNormalStyle() {        
        for (let i = 0; i < this.styles.length; i++) {
            this.styles[i] = this.normalStyle;
        }       
    }

    setGuests(numberOfGuests: number) {
        localStorage.setItem('guests', numberOfGuests.toString());
        this.router.navigate(['/home/order']);       
    }

    saveEnteredGuests()
    {
        localStorage.setItem('guests', this.guestsEntered);
        this.router.navigate(['/home/order'])
    }

    goBack() {
        this.router.back();
    }

    addDigit(digit: string)
    {
        if (parseInt(digit) || (digit == '0' && parseInt(this.guestsEntered)))
            this.guestsEntered = this.guestsEntered + digit;          
    }

    backSpace()
    {
        if (this.guestsEntered.length > 0)
            this.guestsEntered = this.guestsEntered.substring(0, this.guestsEntered.length - 1); 
    }
    
    otherQty()
    {
        this.digitRows = []; 
        this.digitCols = []; 
        let that = this;
        this.digits.forEach(function (digit: number) {
            that.digitRows.push(Math.floor((digit -1 ) / 3)+1);
            that.digitCols.push((digit - 1) % 3);
        });
       this.isNormalChoice = false;
    }

    ngOnInit(): void {
        this.tableGuestsTitle += localStorage.getItem('table');  
        let that = this;
        this.digits.forEach(function (digit: number) {
            that.digitRows.push(Math.floor((digit -1 ) / 3));
            that.digitCols.push((digit - 1) % 3);
        });
    }

    constructor(private router: RouterExtensions) {        
    }

}