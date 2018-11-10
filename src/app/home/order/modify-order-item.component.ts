import { Component, OnInit, ViewContainerRef } from "@angular/core";
import { ModalDialogParams, ModalDialogOptions, ModalDialogService } from "nativescript-angular/modal-dialog";
import { Choice } from "~/app/models/products";
import { OrderItem } from "~/app/models/orders";

@Component({
    selector: "modify-order-item",   
    moduleId: module.id,
    templateUrl: "./modify-order-item.component.html",
    styleUrls: ['./modify-order-item.component.css']
})
export class ModifyOrderItemComponent implements OnInit {
    modifier: string;
    buttonColor:string = 'blue'
    topRowSeats: number[] = [1,2,3,4,5];
    bottomRowSeats: number[] = [1,2,3,4,5];
    modifyButtonsList: string[] = ['Add', 'Extra', 'Less', 'No'];
    column: number = 0;
    column1: number = 1;
    seat1: number = 1; seat2: number = 2; seat3: number = 3; seat4: number = 4; seat5: number = 5;   
    changeType: string = 'quantity';
    isTenPlus: boolean = false;
    selectedNumber: number;
    orderItemIndex: number;
    otherText: string = 'Other Quantity';
    isNormalChoice: boolean= true;
    enterQty: string = '';
    orderItem: OrderItem = {};
    hasModifiers: boolean = false;
    isForcedModifier: boolean = true;

    changeTypeStyle: string ="color: black;background-image: linear-gradient(gray, white); border-color: black";
    changeTypeStyleSelected: string ="color: white;background-image: linear-gradient(black, gray); border-color: white";
    qtyTypeStyle: string ="color: white;background-image: linear-gradient(black, gray); border-color: white";
    seatTypeStyle: string ="color: black;background-image: linear-gradient(gray, white); border-color: black"
    //orderItems: OrderItem[]; 

    setChoice2(digit: number)
    {
        console.log(digit);
        close();
    }

    setChoice(digit: number)
    {
        switch (digit)
        {
            case 0:                
            case 1:
            case 2:
            case 3:
            case 4:
            case 5:
            case 6:
            case 7:
            case 8:
            case 9:
                if (this.isTenPlus)                
                    this.selectedNumber = 10 + digit;                    
                else
                    this.selectedNumber = digit;     
                this.close();
                break;           
            case 10:
                this.isTenPlus = true;
                break;               
        }
    }      
    
    setChangeType(changeType: string): void {
        this.changeType = changeType; 
        this.otherText = "Other " + changeType; 
        
        this.qtyTypeStyle = changeType == "quantity" ? this.changeTypeStyleSelected : this.changeTypeStyle;
        this.seatTypeStyle = changeType == "seat" ? this.changeTypeStyleSelected : this.changeTypeStyle;

    }
   
    doAction(action:string)
    {
        this.changeType = action;   
        this.close();
    }

    otherChoice()
    {
        this.isNormalChoice = false;
    }

    setEnterQty(character: string)
    {
        if (character == "." && this.enterQty.indexOf('.') == -1 || character != ".")
            this.enterQty = this.enterQty + character;        
    }

    backSpace()
    {
        if (this.enterQty.length > 0)
            this.enterQty = this.enterQty.substring(0, this.enterQty.length - 1); 
    }

    setOtherChoice()
    {
        let choice:Choice = { ChangeType: this.changeType, SelectedNumber: this.enterQty };        
        this.params.closeCallback(choice); 
    }

    close() {  
        if (this.selectedNumber == null)      
            this.selectedNumber = 0;

        let choice:Choice = { ChangeType: this.changeType, SelectedNumber:  this.selectedNumber.toString() };        
        this.params.closeCallback(choice);
    }

    constructor(private params: ModalDialogParams, private viewContainerRef: ViewContainerRef) { 
        
    }

    ngOnInit() { 
        this.orderItem = this.params.context.orderItem;
        this.hasModifiers = this.orderItem.Product.UseModifier;
        this.isForcedModifier = this.params.context.forcedModifier != null;
    } 
}
