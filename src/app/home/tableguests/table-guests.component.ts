import { Component, OnInit, ViewChild, ElementRef } from "@angular/core";
import { RouterExtensions } from "nativescript-angular/router";
import { Page } from "tns-core-modules/ui/page/page";
import { UtilityService } from "~/app/services/utility.service";

@Component({
    selector: "TableGuests",
    moduleId: module.id,
    templateUrl: "./table-guests.component.html",
    styleUrls: ['./table-guests.component.css']
})
export class TableGuestsComponent implements OnInit {
    @ViewChild('guests') guests: ElementRef; 
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
        this.utilSvc.startTime = new Date().getTime();
        this.router.navigate(['/home/order']);       
    }

    saveEnteredGuests()
    {
        localStorage.setItem('guests', this.guestsEntered);
        this.router.navigate(['/home/order'])
    }

    goBack() {
        //this.router.navigate(['/home/area'])       
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
        this.guests.nativeElement.focus();
        this.isNormalChoice = false;
    }

    ngOnInit(): void {       
        this.tableGuestsTitle += localStorage.getItem('table');      
        //console.log('elapsed ms: ' +  (new Date().getTime() - this.utilSvc.startTime));            
    }

    constructor(private router: RouterExtensions, private page: Page, private utilSvc: UtilityService) {       
        //page.actionBarHidden = true;                
    }

}