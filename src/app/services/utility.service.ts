import { Injectable, NgZone } from "@angular/core";
import { interval, Observable } from 'rxjs'
import { RouterExtensions } from "nativescript-angular";
import { SQLiteService } from "./sqlite.service";
import { OrderDetail, OrderHeader, OrderType } from "../models/orders";
//import { EventData } from "tns-core-modules/data/observable";
import { topmost } from "tns-core-modules/ui/frame";
import { isIOS } from "tns-core-modules/platform";
import { TaxRate, MenuOption } from "../models/products";

const TIMEZONE_OFFSET: number = new Date().getTimezoneOffset() * 60 * 1000; // offset from UTC in millisetseconds

@Injectable()
export class UtilityService {
    timeoutInSecs: number = 15;
    idleTimer: number;
    startTime: number = 0;
    public currentDateTime: Date;
    public socket: any;
    public blinkingInterval: number = null;
    private readStream: NSInputStream;
    private writeStream: NSOutputStream;
    public taxRates: TaxRate[] = [];
    orderItems: OrderDetail[] = [];
    orderHeader: OrderHeader = null;
    subTotal: number = 0;
    tax: number = 0;
    checkTotal: number = 0;
    tips: number = 0;
    discount: number = 0;
    table: string;
    server: string;
    checkNumber: number;
    ticketNumber: number;
    guests: number;    
    orderFilter: number = null;    
    area: number;    
    orderType: number = OrderType.DineIn;
    checkTotalAll: number = 0;
    taxAll: number = 0;
    reason: string;

    public constructor(private router: RouterExtensions,
        private DBService: SQLiteService,
    ) {

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

    resetIdleTimer() {
        this.idleTimer = 0;
    }

    getCurrentTime(): string {
        //offSet = new Date().getTimezoneOffset() * 60 * 1000;
        let timeStamp: string = (Date.now() - TIMEZONE_OFFSET).toString();
        return "\/Date(" + timeStamp + ")\/";
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

    getTaxTotal(order: OrderHeader, orderItems: OrderDetail[]): number {
        let taxTotal: number = 0.00;
        if (order.TaxExempt || orderItems.length == 0) return taxTotal;

        let orderDetails: OrderDetail[] = orderItems.filter(od => od.tag == null);
        let discount: number = order.Discount;
        let itemTotal: number = orderDetails
            .map(item => !item.Refund && !item.Voided && !item.Comped && item.ExtPrice ? item.ExtPrice : 0)
            .reduce((sum, current) => sum + current);

        if (itemTotal == 0) return 0;

        let lineDiscounts: OrderDetail[] = orderItems;
        let sumLineDiscounts: number = 0;
        let lineDiscount: number = 0;

        if (this.DBService.systemSettings.SmartTax) {
            let itemCount = orderItems.filter(od => !od.Refund && !od.Voided && !od.Comped
                && od.ProductCode != 4 && od.ProductCode != 5 && od.Taxable == 0).length;
            if (itemCount > 0) {
                lineDiscounts = lineDiscounts.filter(ld => !ld.Refund && !ld.IgnoreTax && !ld.Voided && !ld.Comped
                    && ld.ProductCode != 4 && ld.ProductCode != 5 && ld.Taxable != 2 && ld.ExtPrice && ld.ExtPrice > 0)
                if (lineDiscounts.length == 0)
                    return taxTotal;
                else {
                    sumLineDiscounts = lineDiscounts
                        .map(ld => ld.ExtPrice > 0 ? ld.ExtPrice : 0)
                        .reduce((sum, current) => sum + current);
                    lineDiscount = ((sumLineDiscounts / itemTotal) * discount) / itemCount;
                    taxTotal = lineDiscounts
                        .map(ld => (ld.ExtPrice - lineDiscount) * this.getEffectiveTaxRate(ld.TaxRate))
                        .reduce((sum, current) => sum + current);
                }
            }
            else {
                lineDiscounts = lineDiscounts.filter(ld => !ld.Refund && !ld.IgnoreTax && !ld.Voided && !ld.Comped && ld.Taxable == 0)
                sumLineDiscounts = lineDiscounts
                    .map(ld => ld.ExtPrice > 0 ? ld.ExtPrice : 0)
                    .reduce((sum, current) => sum + current);
                lineDiscount = ((sumLineDiscounts / itemTotal) * discount) / lineDiscounts.length;
                taxTotal = lineDiscounts
                    .map(ld => (ld.ExtPrice - lineDiscount) * this.getEffectiveTaxRate(ld.TaxRate))
                    .reduce((sum, current) => sum + current);
            }
        }
        else {
            lineDiscounts = lineDiscounts.filter(ld => !ld.Refund && !ld.IgnoreTax && !ld.Voided && !ld.Comped && ld.Taxable == 0 && ld.ExtPrice && ld.ExtPrice > 0);
            sumLineDiscounts = lineDiscounts
                .map(ld => ld.ExtPrice > 0 ? ld.ExtPrice : 0)
                .reduce((sum, current) => sum + current);
            lineDiscount = ((sumLineDiscounts / itemTotal) * discount) / lineDiscounts.length;
            taxTotal = lineDiscounts
                .map(ld => (ld.ExtPrice - lineDiscount) * this.getEffectiveTaxRate(ld.TaxRate))
                .reduce((sum, current) => sum + current);
        }

        if (this.DBService.systemSettings.TaxGratuity)
            taxTotal += order.Gratuity * this.DBService.systemSettings.GratuityTaxRate;

        taxTotal = this.roundTo2Decimal(taxTotal);
        //taxTotal = Math.round((taxTotal * 100) / 100);
        return taxTotal;
    }

    roundTo2Decimal(value: number) {
        return Number((value + .000001).toFixed(2));
        //return Number(Number((value + .000001).toExponential(2)).toFixed(2));
    }
    /*
        convertToBoolean(textBoolean: string)
        {
            return (textBoolean.toLowerCase() == 'true');
        }
    */
    getJSONDate(jsonDate: string): Date {

        let longDate: number = parseInt(jsonDate.substr(6));
        return new Date(longDate + TIMEZONE_OFFSET)
    }

    padLeft(text: string, padChar: string, size: number): string {
        return (String(padChar).repeat(size) + text).substr((size * -1), size);
    }

    public setTopBarStyle() {
        if (isIOS) {
            let navigationBar = topmost().ios.controller.navigationBar;
            navigationBar.barStyle = UIBarStyle.Black;
        }
    }

    public getTaxRates() {
        let that = this;
        this.DBService.getLocalTaxRates().then(taxRates => {
            if (taxRates.length == 0) {
                alert("Missing Tax Rates");
            }
            else {
                this.taxRates = taxRates;
                console.log('got tax rates');
            }
        });
    }

    private getEffectiveTaxRate(taxRateID: number): number {
        if (taxRateID == null)
            return 0;

        if (this.taxRates !== null && this.taxRates.length > 0)
            return this.taxRates.find(tr => tr.TaxID == taxRateID).EffectiveRate;
        else
            return .08;
    }

    processFilterNumber() {
        let i: number = 1;
        this.orderItems.forEach(oi => {
            oi.FilterNumber = i;
            i++;
        })       
    }    

    getOrderHeader(voided: boolean): OrderHeader
    {
        let currentDate: string = this.getCurrentTime();

        let orderHeader: OrderHeader =
         {
            OrderFilter: this.orderFilter == null ? 0 : this.orderFilter,
            Name: this.table,
            OrderID: 0,
            TableNumber: this.table,
            CheckNumber: 1,
            Total: this.checkTotalAll,
            Discount: 0,
            EmployeeID: this.DBService.loggedInUser.PriKey,
            TotalCash: 0,
            TotalCheck: 0,
            CurrentDate: currentDate,
            CurrentTime: currentDate,
            VoidedBy: this.DBService.loggedInUser.PriKey,
            NumberGuests: this.guests,
            Tax: this.taxAll,
            TimeOrder: currentDate,
            Area: this.area,
            TransType: this.orderType,
            CompAmount: 0,
            DiscountAmountOriginal: 0.0000,
            DiscountAmountRecall: 0.0000,
            CouponTypeOriginal: 0,
            CouponTypeRecall: 0,
            DiscountIDOriginal: 0,
            DiscountIDRecall: 0,
            Gratuity: 0.0000,
            CollectorID: 0,
            OriginalAmount: 0.0000,
            VoidServerID: this.DBService.loggedInUser.PriKey,
            DiscountServerID: 0,
            DiscountServerIDRecall: 0,
            ReopenedTicket: false,
            SendToRegister: false,
            Deposit: 0.0000,
            DeliverID: 0,
            MessageReceived: false,
            Transmedia: 0.0000,
            ReTender: false,
            GratuityManual: false,
            ChangeAmount: 0.0000,
            TenderType: 0,
            Transferred: false,
            ClosedRecorded: false,
            VoidRecorded: false,
            ClientName: this.DBService.systemSettings.DeviceName,
            OrderCreationTime: currentDate,
            TaxExempt: false,
            OLOOrderID: 0,
            OLOMessageSent: false,
            VoidReason: voided ? this.reason : null,
            Void: voided ? 'Void' : null,
            VoidTime: voided ? currentDate : null,
            Credit: 0
        }

        return orderHeader;
    }

    openPrinterSocket() {
        let readStream = new interop.Reference<NSInputStream>();
        let writeStream = new interop.Reference<NSOutputStream>(); //new interop.Reference(CFWriteStreamCreateWithBuffer(null,'',1000));        
        CFStreamCreatePairWithSocketToHost(kCFAllocatorDefault, "192.168.0.125", 9100, readStream, writeStream);

        if (!(readStream && writeStream)) {
            console.log("Failed to create read&write stream");
            return;
        } else {
            console.log("Successfully create read&write stream");
        }

        //this.readStream = readStream.value;
        this.writeStream = writeStream.value;
        //this.readStream.open();
        this.writeStream.open();
        /*
        [self scheduleInRunLoop];
        [self openStreams];
        
        telnet = telnet_init(telopts, _event_handler, 0, (__bridge void *)(self)
        */
    }

    sendToPrinter(textData: NSString) {
        this.writeStream.writeMaxLength(textData + '\r\n', 255);
    }

    closePrinterSocket() {
        this.writeStream.close();
    }
}
