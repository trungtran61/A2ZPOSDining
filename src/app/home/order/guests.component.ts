import { Component, OnInit, ViewChild, ElementRef } from "@angular/core";
import { TextField } from "tns-core-modules/ui/text-field/text-field";
import { ModalDialogParams } from "nativescript-angular/modal-dialog";
import { RouterExtensions } from "nativescript-angular/router";

@Component({
    selector: "guests",
    moduleId: module.id,
    templateUrl: "./guests.component.html",
    styleUrls: ['./guests.component.css']
})
export class GuestsComponent implements OnInit {
    @ViewChild('guests') guests: ElementRef; 
    tableGuestsTitle: string = 'Choose the number of guests for table ';
    normalStyle: string = "color: black;background-image: linear-gradient(gold, yellow);";
    activeStyle: string = "color: black;background-image: linear-gradient(darkred, red);";
    styles: string[] = [this.normalStyle, this.normalStyle, this.normalStyle, this.normalStyle, this.normalStyle, this.normalStyle];    
    isNormalChoice: boolean = true;   
    guestsEntered: string = '';       
 
    setNormalStyle() {        
        for (let i = 0; i < this.styles.length; i++) {
            this.styles[i] = this.normalStyle;
        }       
    }

    keyPressed() {
       
    }  

    setGuests(numberOfGuests: string) {
        this.params.closeCallback(numberOfGuests);      
    }     
 
    saveEnteredGuests()
    {        
        this.params.closeCallback(this.guestsEntered);
    }

    cancel() {
        this.params.closeCallback(null);       
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
        this.guests.nativeElement.focus();
        this.isNormalChoice = false;
    }

    ngOnInit(): void {        
        this.tableGuestsTitle += localStorage.getItem('table');  
        let that = this;
        /*
        this.digits.forEach(function (digit: number) {
            that.digitRows.push(Math.floor((digit -1 ) / 3));
            that.digitCols.push((digit - 1) % 3);
        });
       */
    }

    constructor(private params: ModalDialogParams, private router: RouterExtensions) {       
        //page.actionBarHidden = true;    
    }

}