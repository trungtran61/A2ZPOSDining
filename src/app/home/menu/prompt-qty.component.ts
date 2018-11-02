import { Component, OnInit, ViewContainerRef } from "@angular/core";
import { ModalDialogParams} from "nativescript-angular/modal-dialog";
import { MenuProduct } from "~/app/models/products";

@Component({
    selector: "prompt-qty",   
    moduleId: module.id,
    templateUrl: "./prompt-qty.component.html",
    styleUrls: ['./prompt-qty.component.css']
})
export class PromptQtyComponent implements OnInit {
    enterQty: string = '';
    product: MenuProduct = null;
    
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

    setQty()
    {
        this.params.closeCallback(this.enterQty); 
    }

    close() {  
        this.params.closeCallback(null);
    }

    constructor(private params: ModalDialogParams, private viewContainerRef: ViewContainerRef) { 
        
    }

    ngOnInit() {         
        this.product = this.params.context.product;
    } 
}
