import { Injectable } from "@angular/core";
import { interval, Observable } from 'rxjs'
import { RouterExtensions } from "nativescript-angular";
import { SQLiteService } from "./sqlite.service";
import { Order, OrderItem } from "../models/orders";

@Injectable()
export class UtilityService {
    timeoutInSecs: number = 15;
    idleTimer: number;

    public constructor(private router: RouterExtensions, private DBService: SQLiteService) {
    }

    startTimer() {
        this.idleTimer = 0;
        const subscription = interval(1000)
            .subscribe(() => {
                this.idleTimer++;
                if (this.idleTimer >= this.timeoutInSecs)
                {
                    subscription.unsubscribe();
                    this.DBService.logoff().subscribe(res => {
                        this.router.navigate(['/home/']);              
                    });    
                }
            });
    }

    resetIdleTImer()
    {
        this.idleTimer = 0;
    }

    getTaxTotal(order: Order): number
    {
        let taxTotal: number = 0;
        if (order.TaxExempt || order.OrderItems.length == 0) return taxTotal;
        
        let orderDetails: OrderItem[] = order.OrderItems.filter(od => od.Tag == null);
        let itemTotal: number = orderDetails
            .map(item => !item.Refund && !item.Voided && !item.Comped && item.Price)
            .reduce((sum, current) => sum + current);
        
        if (itemTotal == 0) return 0;
        
        let lineDiscounts: OrderItem[] = order.OrderItems;

        if (this.DBService.systemSettings.SmartTax)
        {
            let itemCount = order.OrderItems.filter(od => !od.Refund && !od.Voided && !od.Comped 
                && od.Product.ProductCode != 4 && od.Product.ProductCode !=5 && od.Product.Taxable == 0).length;
            if (itemCount > 0)
            {
                lineDiscounts = lineDiscounts.filter(ld => !ld.Refund && !ld.IgnoreTax && !ld.Voided && !ld.Comped 
                    && ld.Product.ProductCode != 4 && ld.Product.ProductCode !=5 && ld.Product.Taxable != 2  && ld.Price && ld.Price > 0)
                if (lineDiscounts.length == 0) return taxTotal;
            }
            else
            {
                
            }
        }

        return taxTotal;
    }
/*
    convertToBoolean(textBoolean: string)
    {
        return (textBoolean.toLowerCase() == 'true');
    }
*/    
}
