import { Component, OnInit } from "@angular/core";
import { RouterExtensions } from "nativescript-angular/router";

@Component({
    selector: "TableGuests",
    moduleId: module.id,
    templateUrl: "./table-guests.component.html",
    styleUrls: ['./table-guests.component.css']
})
export class TableGuestsComponent implements OnInit {
    tableGuestsTitle: string = 'Choose the number of guests for table ';
    numberOfGuests: number = 0;
    normalStyle: string = "color: black;background-image: linear-gradient(gold, yellow);";
    activeStyle: string = "color: black;background-image: linear-gradient(darkred, red);";
    styles: string[] = [this.normalStyle, this.normalStyle, this.normalStyle, this.normalStyle, this.normalStyle, this.normalStyle];
   
    setNormalStyle() {        
        for (let i = 0; i < this.styles.length; i++) {
            this.styles[i] = this.normalStyle;
        }       
    }

    setGuests(numberOfGuests: number) {
        if (numberOfGuests > 9) {
            this.numberOfGuests = numberOfGuests;
            this.setNormalStyle();
            this.styles[(numberOfGuests / 10) - 1] = this.activeStyle;            
        }
        else {
            if (this.numberOfGuests > 9) {
                this.numberOfGuests += numberOfGuests;
                this.router.navigate(['/home/menu'])
            }
            else {
                this.numberOfGuests = numberOfGuests;
                this.router.navigate(['/home/menu'])
            }
        }

        localStorage.setItem('guests', this.numberOfGuests.toString());
    }

    goBack() {
        this.router.back();
    }

    constructor(private router: RouterExtensions) {        
    }

    ngOnInit(): void {
        this.tableGuestsTitle += localStorage.getItem('table');
    }
}