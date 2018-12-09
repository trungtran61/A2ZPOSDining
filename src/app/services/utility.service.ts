import { Injectable, NgZone } from "@angular/core";
import { interval, Observable } from 'rxjs'
import { RouterExtensions } from "nativescript-angular";
import { SQLiteService } from "./sqlite.service";
import { Order, OrderItem } from "../models/orders";
//import { EventData } from "tns-core-modules/data/observable";
import { topmost } from "tns-core-modules/ui/frame";
import { isIOS } from "tns-core-modules/platform";
//import { SocketIO } from "nativescript-socketio/socketio";
//require("nativescript-websockets");

@Injectable()
export class UtilityService {
    timeoutInSecs: number = 15;
    idleTimer: number;
    public socket: any;

    public constructor(private router: RouterExtensions, 
        private DBService: SQLiteService, 
        //private socketIO: SocketIO
        ) 
    {
        
    }

    public print(message: string) {
        this.socket.send(message);        
    }

    startTimer() {
        this.idleTimer = 0;
        const subscription = interval(1000)
            .subscribe(() => {
                this.idleTimer++;
                if (this.idleTimer >= this.timeoutInSecs) {
                    subscription.unsubscribe();
                    this.DBService.logoff().subscribe(res => {
                        this.router.navigate(['/home/']);
                    });
                }
            });
    }

    resetIdleTImer() {
        this.idleTimer = 0;
    }

    sendToPrinter(eventName: string, payload: any)
    {
        /*
        this.socketIO.emit('hello', {
            username: 'someone',
          });
          */
    }
     /*
   ColorLuminance("#69c", 0);		// returns "#6699cc"
   ColorLuminance("6699CC", 0.2);	// "#7ab8f5" - 20% lighter
   ColorLuminance("69C", -0.5);	// "#334d66" - 50% darker
   */

  colorLuminance(hex, lum) {

    // validate hex string
    hex = String(hex).replace(/[^0-9a-f]/gi, '');
    if (hex.length < 6) {
        hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    }
    lum = lum || 0;

    // convert to decimal and change luminosity
    var rgb = "#", c, i;
    for (i = 0; i < 3; i++) {
        c = parseInt(hex.substr(i * 2, 2), 16);
        c = Math.round(Math.min(Math.max(0, c + (c * lum)), 255)).toString(16);
        rgb += ("00" + c).substr(c.length);
    }

    return rgb;
}

    getTaxTotal(order: Order): number {
        let taxTotal: number = 0.00;
        if (order.TaxExempt || order.OrderItems.length == 0) return taxTotal;

        let orderDetails: OrderItem[] = order.OrderItems.filter(od => od.Tag == null);
        let discount: number = order.Discount;
        let itemTotal: number = orderDetails
            .map(item => !item.Refund && !item.Voided && !item.Comped && item.Price ? item.Price : 0)
            .reduce((sum, current) => sum + current);

        if (itemTotal == 0) return 0;

        let lineDiscounts: OrderItem[] = order.OrderItems;
        let sumLineDiscounts: number = 0;
        let lineDiscount: number = 0;

        if (this.DBService.systemSettings.SmartTax) {
            let itemCount = order.OrderItems.filter(od => !od.Refund && !od.Voided && !od.Comped
                && od.Product.ProductCode != 4 && od.Product.ProductCode != 5 && od.Product.Taxable == 0).length;
            if (itemCount > 0) {
                lineDiscounts = lineDiscounts.filter(ld => !ld.Refund && !ld.IgnoreTax && !ld.Voided && !ld.Comped
                    && ld.Product.ProductCode != 4 && ld.Product.ProductCode != 5 && ld.Product.Taxable != 2 && ld.Price && ld.Price > 0)
                if (lineDiscounts.length == 0)
                    return taxTotal;
                else {
                    sumLineDiscounts = lineDiscounts
                        .map(ld => ld.Price > 0 ? ld.Price : 0)
                        .reduce((sum, current) => sum + current);
                    lineDiscount = ((sumLineDiscounts / itemTotal) * discount) / itemCount;
                    taxTotal = lineDiscounts
                        .map(ld => (ld.Price - lineDiscount) * ld.Product.TaxRate)
                        .reduce((sum, current) => sum + current);
                }
            }
            else {
                lineDiscounts = lineDiscounts.filter(ld => !ld.Refund && !ld.IgnoreTax && !ld.Voided && !ld.Comped && ld.Product.Taxable == 0)
                sumLineDiscounts = lineDiscounts
                    .map(ld => ld.Price > 0 ? ld.Price : 0)
                    .reduce((sum, current) => sum + current);
                lineDiscount = ((sumLineDiscounts / itemTotal) * discount) / lineDiscounts.length;
                taxTotal = lineDiscounts
                    .map(ld => (ld.Price - lineDiscount) * ld.Product.TaxRate)
                    .reduce((sum, current) => sum + current);
            }
        }
        else
        {
            lineDiscounts = lineDiscounts.filter(ld => !ld.Refund && !ld.IgnoreTax && !ld.Voided && !ld.Comped && ld.Product.Taxable == 0 && ld.Price && ld.Price > 0);
            sumLineDiscounts = lineDiscounts
                .map(ld => ld.Price > 0 ? ld.Price : 0)
                .reduce((sum, current) => sum + current);
            lineDiscount = ((sumLineDiscounts / itemTotal) * discount) / lineDiscounts.length;   
            taxTotal = lineDiscounts
                    .map(ld => (ld.Price - lineDiscount) * ld.Product.TaxRate)
                    .reduce((sum, current) => sum + current);
        }

        if (this.DBService.systemSettings.TaxGratuity)
            taxTotal += order.Gratuity * this.DBService.systemSettings.GratuityTaxRate;

        //taxTotal = parseFloat(Math.round((taxTotal * 100) / 100).toFixed(2));
        //taxTotal = Math.round((taxTotal * 100) / 100);
        return taxTotal;
    }
    /*
        convertToBoolean(textBoolean: string)
        {
            return (textBoolean.toLowerCase() == 'true');
        }
    */
    getJSONDate(jsonDate: string): Date {
        return new Date(parseInt(jsonDate.substr(6)))
    }

    padLeft(text:string, padChar:string, size:number): string {
        return (String(padChar).repeat(size) + text).substr( (size * -1), size) ;
    }

    public setTopBarStyle(){
     if (isIOS) {
        let navigationBar = topmost().ios.controller.navigationBar;
        navigationBar.barStyle = UIBarStyle.Black;
    }
}

}
