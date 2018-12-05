import { Injectable } from "@angular/core";
import { Employee } from "~/app/models/employees";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { CategoryCode, Product, ProductCategory, Area, Table, MenuCategory, MenuSubCategory, MenuProduct, TableDetail, Option, MenuChoice, OptionCategory, MenuSubOption, ProductGroup, MenuTimer, MenuOption, TaxRate, UserModifier, ChoiceLayer } from "~/app/models/products";
import { Observable, throwError } from 'rxjs';
import { map, count } from 'rxjs/operators';
import { forkJoin } from "rxjs";
import { catchError } from 'rxjs/operators';
import { SystemSettings, Logos } from "~/app/models/settings";
import { APIService } from "./api.service";
import { Countdown, Reason } from "~/app/models/orders";
import { UtilityService } from "./utility.service";

var Sqlite = require("nativescript-sqlite");

@Injectable()
export class SQLiteService {

    private static database: any;
    public categories: Array<any>;
    public products: Array<any>;
    private apiUrl = "http://a2zpos.azurewebsites.net/DBService.svc/";
    public loggedInUser: Employee = Object();
    public systemSettings: SystemSettings = null;

    public static isInstantiated: boolean;

    public constructor(private http: HttpClient, private ApiSvc: APIService) {
        /*
        require("nativescript-localstorage");
        let loggedInUser: string = localStorage.getItem("loggedInUser");
        if (loggedInUser != null)
            this.loggedInUser = JSON.parse(loggedInUser);
        */
        if (!SQLiteService.isInstantiated) {
            (new Sqlite("FullServiceDining.db")).then(db => {
                SQLiteService.database = db;
                SQLiteService.isInstantiated = true;
                console.log("FullServiceDining DB opened.");
                //this.createTables(db);
            }, error => {
                console.log("OPEN DB ERROR", error);
            });
        }
    }

    createTables(db) {
        if (db == null) {
            db = SQLiteService.database;
        }

        forkJoin([
            this.loadSystemSettings(db),
            this.loadLogos(db),
            this.loadEmployees(db),
            this.loadAreas(db),
            this.loadProductGroups(db),
            this.loadCategoryCodes(db),
            this.loadProducts(db),
            this.loadTables(db),
            this.loadMenuCategories(db),
            this.loadMenuProducts(db),
            this.loadMenuSubCategories(db),
            this.loadMenuChoices(db),
            this.loadMenuOptions(db),
            this.loadMenuSubOptions(db),
            this.loadOptionCategories(db),
            this.loadProductCategories(db),
            this.loadMenuTimers(db),
            this.loadOptions(db),
        ])
            .subscribe(results => {
                console.log(results);
            });

    }


    padZeroes(num: string, size: number): string {
        let s = num;
        while (s.length < size) s = "0" + s;
        return s;
    }

    public loadMenuCategories(db) {
        let that = this;
        let promise = new Promise(function (resolve, reject) {
            if (db == null) {
                db = SQLiteService.database;
            }

            db.execSQL("DROP TABLE IF EXISTS MenuCategories;").then(id => {
                db.execSQL("CREATE TABLE IF NOT EXISTS MenuCategories (CategoryID INTEGER, Name , Position INTEGER, ButtonColor INTEGER, ButtonColorHex TEXT, ButtonForeColor INTEGER, ButtonForeColorHex TEXT);").then(id => {
                    let headers = that.createRequestHeader();
                    that.http.get(that.apiUrl + 'GetMenuCategory', { headers: headers })
                        .subscribe(
                            data => {
                                let menuCategories = <MenuCategory[]>data;
                                menuCategories.forEach(function (menuCategory: MenuCategory) {
                                    SQLiteService.database.execSQL("INSERT INTO MenuCategories (CategoryID, Name, Position, ButtonColor, ButtonForeColor) VALUES (?, ?, ?, ?, ?)",
                                        [menuCategory.CategoryID, menuCategory.Name, menuCategory.Position,
                                        menuCategory.ButtonColor, menuCategory.ButtonForeColor]).then(id => {
                                            resolve("Added MenuCategories records.")
                                        },
                                            err => {
                                                reject("Failed to add MenuCategories records.")
                                            }
                                        );
                                });
                            },
                            err => {
                                reject("Error occurred while retrieving MenuCategories from API.");
                            }
                        );
                }, error => {
                    reject("CREATE TABLE MenuCategories ERROR" + error);
                });
            });
        });
        return promise;
    }

    public getLocalMenuCategories(): Promise<MenuCategory[]> {
        let that = this;
        return SQLiteService.database.all("SELECT CategoryID, Name, Position, ButtonColor, ButtonColorHex, ButtonForeColor, ButtonForeColorHex FROM MenuCategories ORDER BY Position")
            .then(function (rows) {
                let menuCategories: MenuCategory[] = [];
                for (var row in rows) {
                    menuCategories.push({
                        CategoryID: rows[row][0],
                        Name: rows[row][1],
                        Position: rows[row][2],
                        ButtonColor: rows[row][3],
                        ButtonColorHex: that.padZeroes(parseInt(rows[row][3]).toString(16), 6),
                        ButtonForeColor: rows[row][5],
                        ButtonForeColorHex: that.padZeroes(parseInt(rows[row][5]).toString(16), 6)
                    });
                }
                return (menuCategories);
            });
    }

    public loadMenuSubCategories(db) {
        let that = this;
        let promise = new Promise(function (resolve, reject) {
            if (db == null) {
                db = SQLiteService.database;
            }

            db.execSQL("DROP TABLE IF EXISTS MenuSubCategories;").then(id => {
                db.execSQL("CREATE TABLE IF NOT EXISTS MenuSubCategories (CategoryID INTEGER, SubCategoryID INTEGER, Name TEXT, Position INTEGER, ButtonColor INTEGER, ButtonColorHex TEXT, ButtonForeColor INTEGER, ButtonForeColorHex TEXT);").then(id => {
                    let headers = that.createRequestHeader();
                    that.http.get(that.apiUrl + 'GetMenuSubCategory', { headers: headers })
                        .subscribe(
                            data => {
                                let MenuSubCategories = <MenuSubCategory[]>data;
                                MenuSubCategories.forEach(function (menuSubCategory: MenuSubCategory) {
                                    SQLiteService.database.execSQL("INSERT INTO MenuSubCategories (CategoryID, SubCategoryID, Name, Position, ButtonColor, ButtonForeColor) VALUES (?, ?, ?, ?, ?, ?)",
                                        [menuSubCategory.CategoryID, menuSubCategory.SubCategoryID, menuSubCategory.Name,
                                        menuSubCategory.Position, menuSubCategory.ButtonColor, menuSubCategory.ButtonForeColor]).then(id => {
                                            resolve("Added MenuSubCategories records.")
                                        },
                                            err => {
                                                reject("Failed to add MenuSubCategories records.")
                                            }
                                        );
                                });
                            },
                            err => {
                                reject("Error occurred while retrieving MenuSubCategories from API.");
                            }
                        );
                }, error => {
                    reject("CREATE TABLE MenuSubCategories ERROR" + error);
                });
            });
        });
        return promise;
    }

    public getLocalMenuSubCategories(categoryID: number): Promise<MenuSubCategory[]> {

        let that = this;
        //SQLiteService.database.execSQL("DROP TABLE IF EXISTS MenuSubCategories;");

        return SQLiteService.database.all("SELECT CategoryID, SubCategoryID, Name, Position, ButtonColor, ButtonColorHex, ButtonForeColor, ButtonForeColorHex " +
            "FROM MenuSubCategories WHERE CategoryID=? ORDER BY Position", [categoryID])
            .then(function (rows) {
                let menuSubCategories: MenuSubCategory[] = [];
                for (var row in rows) {
                    menuSubCategories.push({
                        CategoryID: rows[row][0],
                        SubCategoryID: rows[row][1],
                        Name: rows[row][2],
                        Position: rows[row][3],
                        ButtonColor: rows[row][4],
                        ButtonColorHex: that.padZeroes(parseInt(rows[row][4]).toString(16), 6),
                        ButtonForeColor: rows[row][6],
                        ButtonForeColorHex: that.padZeroes(parseInt(rows[row][6]).toString(16), 6)
                    });
                }
                return (menuSubCategories);
            });
    }

    public loadMenuProducts(db) {

        let that = this;
        let promise = new Promise(function (resolve, reject) {
            if (db == null) {
                db = SQLiteService.database;
            }

            db.execSQL("DROP TABLE IF EXISTS MenuProducts;").then(id => {
                db.execSQL("CREATE TABLE IF NOT EXISTS MenuProducts (CategoryID INTEGER, SubCategoryID INTEGER,ProductID INTEGER,Name TEXT,Position INTEGER,ProductCode INTEGER," +
                    "ButtonColor INTEGER,ButtonColorHex TEXT,ButtonForeColor INTEGER, ButtonForeColorHex TEXT);").then(id => {
                        let headers = that.createRequestHeader();
                        that.http.get(that.apiUrl + 'GetMenuProduct', { headers: headers })
                            .subscribe(
                                data => {
                                    let menuProducts = <MenuProduct[]>data;
                                    menuProducts.forEach(function (menuProduct: MenuProduct) {
                                        SQLiteService.database.execSQL("INSERT INTO MenuProducts (CategoryID, SubCategoryID, ProductID, Name, ProductCode, Position, ButtonColor, ButtonColorHex, ButtonForeColor, ButtonForeColorHex) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                                            [menuProduct.CategoryID, menuProduct.SubCategoryID, menuProduct.ProductID, menuProduct.Name, menuProduct.ProductCode, menuProduct.Position,
                                            menuProduct.ButtonColor, that.padZeroes(parseInt(menuProduct.ButtonColor.toString()).toString(16), 6),
                                            menuProduct.ButtonForeColor, that.padZeroes(parseInt(menuProduct.ButtonForeColor.toString()).toString(16), 6)]).then(id => {
                                                resolve("Added MenuProducts records.")
                                            },
                                                err => {
                                                    reject("Failed to add MenuProducts records.")
                                                }
                                            );
                                    });
                                },
                                err => {
                                    reject("Error occurred while retrieving MenuProducts from API.");
                                }
                            );
                    }, error => {
                        reject("CREATE TABLE MenuProducts ERROR" + error);
                    });
            });
        });
        return promise;
    }
    
    public getLocalMenuProducts(categoryID: number, subCategoryID: number): Promise<MenuProduct[]> {
        let that = this;

        return SQLiteService.database.all("SELECT mp.CategoryID, mp.SubCategoryID, mp.ProductId, mp.Name, mp.Position, mp.ProductCode, mp.ButtonColor, mp.ButtonColorHex," +
            " mp.ButtonForeColor, mp.ButtonForeColorHex, p.UnitPrice, p.ForcedModifier, p.UseForcedModifier, p.ProductType, p.Taxable, tr.EffectiveRate" +
            " FROM MenuProducts AS mp INNER JOIN Products AS p ON mp.ProductId=p.ProductFilter " + 
            " LEFT JOIN TaxRates AS tr ON p.TaxRate=tr.TaxID " +
            " WHERE mp.CategoryID=? AND mp.SubCategoryID=? ORDER BY mp.Position", [categoryID, subCategoryID])
            .then(function (rows) {
                let menuProducts: MenuProduct[] = [];
                for (var row in rows) {
                    menuProducts.push({
                        CategoryID: rows[row][0],
                        SubCategoryID: rows[row][1],
                        ProductID: rows[row][2],
                        Name: rows[row][3],
                        Position: rows[row][4],
                        ProductCode: rows[row][5],
                        ButtonColor: rows[row][6],
                        ButtonColorHex: rows[row][7],
                        ButtonForeColor: rows[row][8],
                        ButtonForeColorHex: rows[row][9],
                        UnitPrice: rows[row][10],
                        UseModifier: rows[row][11] == "true",
                        UseForcedModifier: rows[row][12] == "true",
                        ProductType: rows[row][13],
                        Taxable: rows[row][14],
                        TaxRate: rows[row][15],
                        Style: '',
                        Col: 0,
                        Row: 0
                    });
                }

                //let countDowns: CountDown[] = [];               
                return menuProducts;
            });
    }

    public getOptionCategories() {
        let headers = this.createRequestHeader();
        this.http.get(this.apiUrl + 'GetOptionCategories', { headers: headers })
            .subscribe(
                data => {
                    console.log('got OptionCategories from API: ' + data);
                    this.loadOptionCategories(<OptionCategory[]>data);
                },
                err => {
                    console.log("Error occurred while retrieving OptionCategories from API.");
                    console.log(err);
                }
            );

    }

    public loadOptionCategories(db) {
        let that = this;
        let promise = new Promise(function (resolve, reject) {
            if (db == null) {
                db = SQLiteService.database;
            }

            db.execSQL("DROP TABLE IF EXISTS OptionCategories;").then(id => {
                db.execSQL("CREATE TABLE IF NOT EXISTS OptionCategories (PriKey INTEGER, Name TEXT);").then(id => {
                    let headers = that.createRequestHeader();
                    that.http.get(that.apiUrl + 'GetOptionCategories', { headers: headers })
                        .subscribe(
                            data => {
                                let optionCategories = <OptionCategory[]>data;
                                optionCategories.forEach(function (optionCategory: OptionCategory) {
                                    SQLiteService.database.execSQL("INSERT INTO OptionCategories (PriKey, Name) VALUES (?, ?)",
                                        [optionCategory.PriKey, optionCategory.Name]).then(id => {
                                            resolve("Added OptionCategories records.")
                                        },
                                            err => {
                                                reject("Failed to add OptionCategories records.")
                                            }
                                        );
                                });
                            },
                            err => {
                                reject("Error occurred while retrieving OptionCategories from API.");
                            }
                        );
                }, error => {
                    reject("CREATE TABLE OptionCategories ERROR" + error);
                });
            });
        });
        return promise;
    }

    public loadMenuOptions(db) {
        let that = this;
        let promise = new Promise(function (resolve, reject) {
            if (db == null) {
                db = SQLiteService.database;
            }

            db.execSQL("DROP TABLE IF EXISTS MenuOptions;").then(id => {
                db.execSQL("CREATE TABLE IF NOT EXISTS MenuOptions (ApplyCharge INTEGER, Charge REAL, Name TEXT, Position INTEGER, ProductCode INTEGER, ReportProductMix INTEGER);").then(id => {
                    let headers = that.createRequestHeader();
                    that.http.get(that.apiUrl + 'GetMenuOption', { headers: headers })
                        .subscribe(
                            data => {
                                let menuOptions = <MenuOption[]>data;
                                menuOptions.forEach(function (menuOption: MenuOption) {
                                    SQLiteService.database.execSQL("INSERT INTO MenuOptions (ApplyCharge, Charge, Name, Position, ProductCode, ReportProductMix) VALUES (?,?,?,?,?,?)",
                                        [menuOption.ApplyCharge, menuOption.Charge, menuOption.Name, menuOption.Position,
                                        menuOption.ProductCode, menuOption.ReportProductMix]).then(id => {
                                            resolve("Added MenuOptions records.")
                                        },
                                            err => {
                                                reject("Failed to add MenuOptions records.")
                                            }
                                        );
                                });
                            },
                            err => {
                                reject("Error occurred while retrieving MenuOptions from API.");
                            }
                        );
                }, error => {
                    reject("CREATE TABLE MenuOptions ERROR" + error);
                });
            });
        });
        return promise;
    }

    public getLocalMenuOptions(productCode: number): Promise<MenuOption[]> {
        return SQLiteService.database.all("SELECT ApplyCharge, Charge, Name, Position FROM MenuOptions WHERE ProductCode=? ORDER BY Position",
            [productCode])
            .then(function (rows) {
                let items: MenuOption[] = [];
                for (var row in rows) {
                    items.push({
                        ApplyCharge: rows[row][0],
                        Charge: rows[row][1],
                        Name: rows[row][2],
                        Position: rows[row][3]
                    });
                }
                return (items);
            });
    }

    public loadMenuSubOptions(db) {

        let that = this;
        let promise = new Promise(function (resolve, reject) {
            if (db == null) {
                db = SQLiteService.database;
            }

            db.execSQL("DROP TABLE IF EXISTS MenuSubOptions;").then(id => {
                db.execSQL("CREATE TABLE IF NOT EXISTS MenuSubOptions (ApplyCharge INTEGER, Charge REAL, ChoiceID INTEGER, Layer INTEGER, Name TEXT, Position INTEGER, ReportProductMix INTEGER);").then(id => {
                    let headers = that.createRequestHeader();
                    that.http.get(that.apiUrl + 'GetMenuSubOption', { headers: headers })
                        .subscribe(
                            data => {
                                let menuSubOptions = <MenuSubOption[]>data;
                                menuSubOptions.forEach(function (menuSubOption: MenuSubOption) {
                                    SQLiteService.database.execSQL("INSERT INTO MenuSubOptions (ApplyCharge, Charge, ChoiceID, Layer, Name, Position, ReportProductMix) VALUES (?,?,?,?,?,?,?)",
                                        [menuSubOption.ApplyCharge, menuSubOption.Charge, menuSubOption.ChoiceID, menuSubOption.Layer,
                                        menuSubOption.Name, menuSubOption.Position, menuSubOption.ReportProductMix]).then(id => {
                                            resolve("Added MenuSubOptions records.")
                                        },
                                            err => {
                                                reject("Failed to add MenuSubOptions records.")
                                            }
                                        );
                                });
                            },
                            err => {
                                reject("Error occurred while retrieving MenuSubOptions from API.");
                            }
                        );
                }, error => {
                    reject("CREATE TABLE MenuSubOptions ERROR" + error);
                });
            });
        });
        return promise;
    }

    public getLocalMenuSubOptions(choiceID: number): Promise<MenuSubOption[]> {
        return SQLiteService.database.all("SELECT ApplyCharge, Charge, Name, Position, Layer, ReportProductMix " + 
            "FROM MenuSubOptions WHERE ChoiceID=? ORDER BY Position",
            [choiceID])
            .then(function (rows) {
                let items: MenuSubOption[] = [];
                for (var row in rows) {
                    items.push({
                        ApplyCharge: rows[row][0],
                        Charge: rows[row][1],
                        Name: rows[row][2],
                        Position: rows[row][3],
                        Layer: rows[row][4],
                        ReportProductMix: rows[row][5],
                        
                    });
                }
                return (items);
            });
    }

    public loadOptions(db) {

        let that = this;
        let promise = new Promise(function (resolve, reject) {
            if (db == null) {
                db = SQLiteService.database;
            }

            db.execSQL("DROP TABLE IF EXISTS Options;").then(id => {
                db.execSQL("CREATE TABLE IF NOT EXISTS Options (PriKey INTEGER, Name TEXT, Price REAL, PrintName TEXT, CategoryCode INTEGER);").then(id => {
                    let headers = that.createRequestHeader();
                    that.http.get(that.apiUrl + 'GetOptions', { headers: headers })
                        .subscribe(
                            data => {
                                let Options = <Option[]>data;
                                Options.forEach(function (option: Option) {
                                    SQLiteService.database.execSQL("INSERT INTO Options (PriKey, Name,Price,PrintName,CategoryCode) VALUES (?, ?, ?, ?, ?)",
                                        [option.PriKey, option.Name, option.Price, option.PrintName, option.CategoryCode]).then(id => {
                                            resolve("Added Options records.")
                                        },
                                            err => {
                                                reject("Failed to add Options records.")
                                            }
                                        );
                                });
                            },
                            err => {
                                reject("Error occurred while retrieving Options from API.");
                            }
                        );
                }, error => {
                    reject("CREATE TABLE Options ERROR" + error);
                });
            });
        });
        return promise;
    }

    public loadUserModifiers(db) {

        let that = this;
        let promise = new Promise(function (resolve, reject) {
            if (db == null) {
                db = SQLiteService.database;
            }

            db.execSQL("DROP TABLE IF EXISTS UserModifiers;").then(id => {
                db.execSQL("CREATE TABLE IF NOT EXISTS UserModifiers (PriKey INTEGER,Position INTEGER,Modifier TEXT," +
                    "ApplyCharge INTEGER,Price INTEGER,ButtonFunction INTEGER,StampPrice INTEGER,TextPosition INTEGER," +
                    "FontSize INTEGER,ItemName TEXT);").then(id => {
                    let headers = that.createRequestHeader();
                    that.http.get(that.apiUrl + 'GetModifiers', { headers: headers })
                        .subscribe(
                            data => {
                                let userModifiers = <UserModifier[]>data;
                                userModifiers.forEach(function (userModifier: UserModifier) {
                                    SQLiteService.database.execSQL("INSERT INTO UserModifiers (PriKey ,Position ,Modifier, ApplyCharge ,Price" + 
                                        ",ButtonFunction ,StampPrice ,TextPosition , FontSize ,ItemName)" + 
                                        " VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                                          [userModifier.PriKey, userModifier.Position, userModifier.Modifier, userModifier.ApplyCharge,  userModifier.Price,
                                           userModifier.ButtonFunction, userModifier.StampPrice, userModifier.TextPosition, userModifier.FontSize, userModifier.ItemName]).then(id => {
                                            resolve("Added UserModifiers records.")
                                        },
                                            err => {
                                                reject("Failed to add UserModifiers records.")
                                            }
                                        );
                                });
                            },
                            err => {
                                reject("Error occurred while retrieving UserModifiers from API.");
                            }
                        );
                }, error => {
                    reject("CREATE TABLE UserModifiers ERROR" + error);
                });
            });
        });
        return promise;
    }

    public getLocalUserModifiers() {
        return SQLiteService.database.all("SELECT PriKey,Position,Modifier,ApplyCharge,Price,ButtonFunction,StampPrice,TextPosition,FontSize,ItemName FROM UserModifiers ORDER BY Position")
            .then(function (rows) {
                let items: UserModifier[] = [];
                for (var row in rows) {
                    items.push({
                        PriKey: rows[row][0],
                        Position: rows[row][1],
                        Modifier: rows[row][2],
                        ApplyCharge: rows[row][3],
                        Price: rows[row][4],
                        ButtonFunction: rows[row][5],
                        StampPrice: rows[row][6],
                        TextPosition: rows[row][7],
                        FontSize: rows[row][8],
                        ItemName: rows[row][9]
                    });
                }
                return (items);
            });
    }

    public loadMenuChoices(db) {

        let that = this;
        let promise = new Promise(function (resolve, reject) {
            if (db == null) {
                db = SQLiteService.database;
            }

            db.execSQL("DROP TABLE IF EXISTS MenuChoices;").then(id => {
                db.execSQL("CREATE TABLE IF NOT EXISTS MenuChoices (Charge REAL, ChoiceID INTEGER, ChoiceName TEXT, ForcedChoice INTEGER, Layer INTEGER, Name TEXT, Position INTEGER, ProductCode INTEGER, ReportProductMix INTEGER);").then(id => {
                    let headers = that.createRequestHeader();
                    that.http.get(that.apiUrl + 'GetMenuChoice', { headers: headers })
                        .subscribe(
                            data => {
                                let menuChoices = <MenuChoice[]>data;
                                menuChoices.forEach(function (menuChoice: MenuChoice) {
                                    SQLiteService.database.execSQL("INSERT INTO MenuChoices (Charge, ChoiceID, ChoiceName, ForcedChoice, Layer, Name, Position, ProductCode, ReportProductMix) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ? )",
                                        [menuChoice.Charge, menuChoice.ChoiceID, menuChoice.ChoiceName, menuChoice.ForcedChoice, menuChoice.Layer,
                                        menuChoice.Name, menuChoice.Position, menuChoice.ProductCode, menuChoice.ReportProductMix]).then(id => {
                                            resolve("Added MenuChoices records.")
                                        },
                                            err => {
                                                reject("Failed to add MenuChoices records.")
                                            }
                                        );
                                });
                            },
                            err => {
                                reject("Error occurred while retrieving MenuChoices from API.");
                            }
                        );
                }, error => {
                    reject("CREATE TABLE MenuChoices ERROR" + error);
                });
            });
        });
        return promise;
    }

    public getLocalChoiceLayers(productCode: number) {
        return SQLiteService.database.all("SELECT DISTINCT ChoiceName, Layer FROM MenuChoices WHERE ProductCode=?", [productCode])
            .then(function (rows) {
                let choices: ChoiceLayer[] = [];
                for (var row in rows) {
                    choices.push(
                        {
                            Name: rows[row][0],
                            Layer: rows[row][1],
                            ChoiceMade: false
                        }
                    );
                }
                return (choices);
            });
    }

    public getLocalMenuChoiceItems(choiceLayer: ChoiceLayer, productCode: number) {
        return SQLiteService.database.all("SELECT ChoiceID, Charge, Name, Position, Layer, ForcedChoice FROM MenuChoices WHERE ProductCode=? AND ChoiceName=? AND Layer=? ORDER BY Position",
            [productCode, choiceLayer.Name, choiceLayer.Layer])
            .then(function (rows) {
                let items: MenuChoice[] = [];
                for (var row in rows) {
                    items.push({
                        ChoiceID: rows[row][0],
                        Charge: rows[row][1],
                        Name: rows[row][2],
                        Position: rows[row][3],
                        Layer: rows[row][4],
                        ForcedChoice: rows[row][5] == "true"
                    });
                }
                return (items);
            });
    }


    public loadEmployees(db) {
        let that = this;
        let promise = new Promise(function (resolve, reject) {
            if (db == null) {
                db = SQLiteService.database;
            }

            db.execSQL("DROP TABLE IF EXISTS Employees;").then(id => {
                db.execSQL("CREATE TABLE IF NOT EXISTS Employees (PriKey INTEGER PRIMARY KEY, EmployeeID TEXT, FirstName TEXT);").then(id => {
                    let headers = that.createRequestHeader();
                    that.http.get(that.apiUrl + 'GetEmployees', { headers: headers })
                        .subscribe(
                            data => {
                                let employees = <Employee[]>data;
                                employees.forEach(function (emp: Employee) {
                                    SQLiteService.database.execSQL("INSERT INTO Employees (PriKey, EmployeeID, FirstName) VALUES (?,?,?)",
                                        [emp.PriKey, emp.EmployeeID, emp.FirstName]).then(id => {
                                            resolve("Added Employees records.")
                                        },
                                            err => {
                                                reject("Failed to add Employee records.")
                                            }
                                        );
                                });
                            },
                            err => {
                                reject("Error occurred while retrieving Employees from API.");
                            }
                        );
                }, error => {
                    reject("CREATE TABLE Employees ERROR" + error);
                });
            });
        });
        return promise;
    }

    public loadCategoryCodes(db) {
        let that = this;
        let promise = new Promise(function (resolve, reject) {
            if (db == null) {
                db = SQLiteService.database;
            }

            db.execSQL("DROP TABLE IF EXISTS CategoryCodes;").then(id => {
                db.execSQL("CREATE TABLE IF NOT EXISTS CategoryCodes (PriKey INTEGER PRIMARY KEY, CategoryCode1 TEXT, Description TEXT, PrintGroup INTEGER);").then(id => {
                    let headers = that.createRequestHeader();
                    that.http.get(that.apiUrl + 'GetCategoryCodes', { headers: headers })
                        .subscribe(
                            data => {
                                let categoryCodes = <CategoryCode[]>data;
                                categoryCodes.forEach(function (categoryCode: CategoryCode) {
                                    SQLiteService.database.execSQL("INSERT INTO CategoryCodes (PriKey, CategoryCode1, Description, PrintGroup) VALUES (?, ?, ?, ?)",
                                        [categoryCode.PriKey, categoryCode.CategoryCode1, categoryCode.Description, categoryCode.PrintGroup]).then(id => {
                                            resolve("Added CategoryCodes records.")
                                        },
                                            err => {
                                                reject("Failed to add CategoryCode records.")
                                            }
                                        );
                                });
                            },
                            err => {
                                reject("Error occurred while retrieving CategoryCodes from API.");
                            }
                        );
                }, error => {
                    reject("CREATE TABLE CategoryCodes ERROR" + error);
                });
            });
        });
        return promise;
    }

    public loadProducts(db) {

        let that = this;
        let promise = new Promise(function (resolve, reject) {
            if (db == null) {
                db = SQLiteService.database;
            }

            db.execSQL("DROP TABLE IF EXISTS Products;").then(id => {
                db.execSQL("CREATE TABLE IF NOT EXISTS Products (ProductName TEXT, ProductFilter INTEGER, UnitPrice REAL ,PrintCode TEXT,Taxable INTEGER,CategoryCode INTEGER," +
                    "ProductGroup INTEGER,PrintCode1 TEXT,CouponCode TEXT,GeneralCode TEXT,Description TEXT,AutoOption TEXT,PrintName TEXT,ForcedModifier INTEGER," + 
                    "UseForcedModifier INTEGER,ShowAutoOption INTEGER,UseUnitPrice2 INTEGER,UnitPrice2 REAL,Toppings INTEGER,Pizza INTEGER,ProductType TEXT,TaxRate TEXT," + 
                    "PromptQuantity TEXT,ModifierIgnoreQuantity TEXT,FractionalQuantity INTEGER);").then(id => {
                        let headers = that.createRequestHeader();
                        that.http.get(that.apiUrl + 'GetProducts', { headers: headers })
                            .subscribe(
                                data => {
                                    let products = <Product[]>data;
                                    products.forEach(function (product: Product) {
                                        SQLiteService.database.execSQL("INSERT INTO Products (ProductName, ProductFilter,UnitPrice,PrintCode,Taxable,CategoryCode,ProductGroup,PrintCode1,CouponCode," +
                                            "GeneralCode,Description,AutoOption,PrintName,ForcedModifier,UseForcedModifier,ShowAutoOption,UseUnitPrice2,UnitPrice2,Toppings," +
                                            "Pizza,ProductType,TaxRate,PromptQuantity,ModifierIgnoreQuantity,FractionalQuantity) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
                                            [product.ProductName,
                                            product.ProductFilter,
                                            product.UnitPrice,
                                            product.PrintCode,
                                            product.Taxable,
                                            product.CategoryCode,
                                            product.ProductGroup,
                                            product.PrintCode1,
                                            product.CouponCode,
                                            product.GeneralCode,
                                            product.Description,
                                            product.AutoOption,
                                            product.PrintName,
                                            product.ForcedModifier,
                                            product.UseForcedModifier,
                                            product.ShowAutoOption,
                                            product.UseUnitPrice2,
                                            product.UnitPrice2,
                                            product.Toppings,
                                            product.Pizza,
                                            product.ProductType,
                                            product.TaxRate,
                                            product.PromptQuantity,
                                            product.ModifierIgnoreQuantity,
                                            product.FractionalQuantity]).then(id => {
                                                resolve("Added Products records.")
                                            },
                                                err => {
                                                    reject("Failed to add Products records.")
                                                }
                                            );
                                    });
                                },
                                err => {
                                    reject("Error occurred while retrieving Products from API.");
                                }
                            );
                    }, error => {
                        reject("CREATE TABLE Products ERROR" + error);
                    });
            });
        });
        return promise;
    }

    public loadAreas(db) {

        let that = this;
        let promise = new Promise(function (resolve, reject) {
            if (db == null) {
                db = SQLiteService.database;
            }

            db.execSQL("DROP TABLE IF EXISTS Areas;").then(id => {
                db.execSQL("CREATE TABLE IF NOT EXISTS Areas (AreaID INTEGER PRIMARY KEY, Name TEXT, Position INTEGER, ImageURL TEXT);").then(id => {
                    let headers = that.createRequestHeader();
                    that.http.get(that.apiUrl + 'GetAreas2', { headers: headers })
                        .subscribe(
                            data => {
                                let areas = <Area[]>data;
                                areas.forEach(function (area: Area) {
                                    SQLiteService.database.execSQL("INSERT INTO Areas (AreaID, Name, Position, ImageURL) VALUES (?,?,?,?)",
                                        [area.AreaID, area.Name, area.Position, area.ImageURL]).then(id => {
                                            resolve("Added Areas records.")
                                        },
                                            err => {
                                                reject("Failed to add Areas records.")
                                            }
                                        );
                                });
                            },
                            err => {
                                reject("Error occurred while retrieving Areas from API.");
                            }
                        );
                }, error => {
                    reject("CREATE TABLE Areas ERROR" + error);
                });
            });
        });
        return promise;
    }

    public getLocalAreas(): Promise<Area[]> {
        let sql: string = "SELECT AreaID, Name, Position, ImageURL FROM Areas;"
        return SQLiteService.database.all(sql)
            .then(function (rows) {
                console.log("SELECT * FROM Areas;");
                let areas: Area[] = [];
                for (var row in rows) {
                    areas.push({
                        AreaID: rows[row][0],
                        Name: rows[row][1],
                        Position: rows[row][2],
                        ImageURL: rows[row][3],
                    });
                }
                areas.push({
                    AreaID: 99,
                    Name: 'Take Out',
                    Position: '99',
                    ImageURL: ''
                });
                return (areas);
            });
    }

    public loadProductGroups(db) {

        let that = this;
        let promise = new Promise(function (resolve, reject) {
            if (db == null) {
                db = SQLiteService.database;
            }

            db.execSQL("DROP TABLE IF EXISTS ProductGroups;").then(id => {
                db.execSQL("CREATE TABLE IF NOT EXISTS ProductGroups (PriKey INTEGER,Code TEXT,Description TEXT,TipShare INTEGER," +
                    "TipSharePercentage INTEGER,Printer TEXT,OpenProduct INTEGER,ProductType INTEGER,TaxRate REAL,Taxable INTEGER);").then(id => {
                        let headers = that.createRequestHeader();
                        that.http.get(that.apiUrl + 'GetProductGroups', { headers: headers })
                            .subscribe(
                                data => {
                                    let productGroups = <ProductGroup[]>data;
                                    productGroups.forEach(function (productGroup: ProductGroup) {
                                        SQLiteService.database.execSQL("INSERT INTO ProductGroups (PriKey, Code, Description, OpenProduct, Printer, ProductType," +
                                            "Taxable, TaxRate, TipShare, TipSharePercentage) VALUES (?,?,?,?,?,?,?,?,?,?)",
                                            [productGroup.PriKey, productGroup.Code, productGroup.Description, productGroup.OpenProduct, productGroup.Printer, productGroup.ProductType,
                                            productGroup.Taxable, productGroup.TaxRate, productGroup.TipShare, productGroup.TipSharePercentage]).then(id => {
                                                resolve("Added ProductGroups records.")
                                            },
                                                err => {
                                                    reject("Failed to add ProductGroups records.")
                                                }
                                            );
                                    });
                                },
                                err => {
                                    reject("Error occurred while retrieving ProductGroups from API.");
                                }
                            );
                    }, error => {
                        reject("CREATE TABLE ProductGroups ERROR" + error);
                    });
            });
        });
        return promise;
    }

    public getLocalProductGroups(): Promise<ProductGroup[]> {
        let sql: string = "SELECT * FROM ProductGroups ORDER BY Description;"
        return SQLiteService.database.all(sql)
            .then(function (rows) {
                let productGroups: ProductGroup[] = [];
                for (var row in rows) {
                    productGroups.push({
                        PriKey: rows[row][0], Code: rows[row][1], Description: rows[row][2], OpenProduct: rows[row][3],
                        Printer: rows[row][4], ProductType: rows[row][5], Taxable: rows[row][7], TaxRate: rows[row][8], TipShare: rows[row][8],
                        TipSharePercentage: rows[row][8]
                    });
                }

                return (productGroups);
            });
    }
    getBase64IntArray(arr: number[]) {
        return btoa(JSON.stringify(arr))
    }

    public loadTables(db) {
        let that = this;
        let promise = new Promise(function (resolve, reject) {
            if (db == null) {
                db = SQLiteService.database;
            }

            db.execSQL("DROP TABLE IF EXISTS Tables;").then(id => {
                db.execSQL("CREATE TABLE IF NOT EXISTS Tables (AreaID INTEGER, Name TEXT, Height INTEGER, Width INTEGER, PosX INTEGER, PosY INTEGER, TableType INTEGER)").then(id => {
                    let headers = that.createRequestHeader();
                    that.http.get(that.apiUrl + 'GetTableLayout', { headers: headers })
                        .subscribe(
                            data => {
                                let Tables = <Table[]>data;
                                Tables.forEach(function (table: Table) {
                                    SQLiteService.database.execSQL("INSERT INTO Tables (AreaID,  Name, Height, Width, PosX, PosY, TableType) VALUES (?, ?, ?, ?, ?, ?, ?)",
                                        [table.AreaID, table.Name, table.Height, table.Width, table.PosX, table.PosY, table.TableType]).then(id => {
                                            resolve("Added Tables records.")
                                        },
                                            err => {
                                                reject("Failed to add Table records.")
                                            }
                                        );
                                });
                            },
                            err => {
                                reject("Error occurred while retrieving Tables from API.");
                            }
                        );
                }, error => {
                    reject("CREATE TABLE Tables ERROR" + error);
                });
            });
        });
        return promise;
    }
   
    public getLocalTables(areaID: number): Promise<Table[]> {

        return SQLiteService.database.all("SELECT AreaID, Name, Height, Width, PosX, PosY FROM Tables WHERE AreaID =?", [areaID])
            .then(function (rows) {
                let tables: Table[] = [];
                for (var row in rows) {
                    tables.push({
                        AreaID: rows[row][0],
                        Name: rows[row][1],
                        Height: rows[row][2],
                        Width: rows[row][3],
                        PosX: rows[row][4],
                        PosY: rows[row][5]
                    });
                }
                return (tables);
            });
    }

    public loadProductCategories(db) {
        let sql: string = "";

        let that = this;
        let promise = new Promise(function (resolve, reject) {
            if (db == null) {
                db = SQLiteService.database;
            }

            db.execSQL("DROP TABLE IF EXISTS ProductCategories;").then(id => {
                db.execSQL("CREATE TABLE IF NOT EXISTS ProductCategories (PriKey INTEGER PRIMARY KEY, ProductFilter INTEGER, Category INTEGER, SubCategory INTEGER, Position INTEGER, ButtonColor TEXT, ButtonForeColor TEXT);").then(id => {
                    let headers = that.createRequestHeader();
                    that.http.get(that.apiUrl + 'GetProductCategories', { headers: headers })
                        .subscribe(
                            data => {
                                let ProductCategories = <ProductCategory[]>data;
                                ProductCategories.forEach(function (productCategory: ProductCategory) {
                                    SQLiteService.database.execSQL("INSERT INTO ProductCategories (PriKey, ProductFilter, Category, SubCategory, Position, ButtonColor, ButtonForeColor) VALUES (?, ?, ?, ?, ?, ?, ?)",
                                        [productCategory.PriKey, productCategory.Category, productCategory.SubCategory, productCategory.Position,
                                        parseInt(productCategory.ButtonColor).toString(16), parseInt(productCategory.ButtonForeColor).toString(16)]).then(id => {
                                            resolve("Added ProductCategories records.")
                                        },
                                            err => {
                                                reject("Failed to add ProductCategories records.")
                                            }
                                        );
                                });
                            },
                            err => {
                                reject("Error occurred while retrieving ProductCategories from API.");
                            }
                        );
                }, error => {
                    reject("CREATE TABLE ProductCategories ERROR" + error);
                });
            });
        });
        return promise;
    }

    public getLocalEmployee(priKey: number): Promise<Employee> {
        return SQLiteService.database.get("SELECT PriKey, EmployeeID, FirstName FROM Employees WHERE PriKey=?", [priKey])
            .then(function (res) {
                let employee: Employee = { PriKey: [res][0][0], EmployeeID: [res][0][1], FirstName: [res][0][2] }
                return (employee);
            });
    }

    public loadMenuTimers(db) {

        let that = this;
        let promise = new Promise(function (resolve, reject) {
            if (db == null) {
                db = SQLiteService.database;
            }

            db.execSQL("DROP TABLE IF EXISTS MenuTimers;").then(id => {
                db.execSQL("CREATE TABLE IF NOT EXISTS MenuTimers " +
                    "(PriKey INTEGER,Name TEXT,Enabled INTEGER,HappyHourType INTEGER,PriceLevel INTEGER,StartTime TEXT,EndTime TEXT,CategoryToLock INTEGER," +
                    "OverRideCategoryBar INTEGER,OverRideCategoryDineIn INTEGER,Mon INTEGER,Tue INTEGER,Wed INTEGER,Thu INTEGER,Fri INTEGER,Sat INTEGER,Sun INTEGER," +
                    "TableService INTEGER,WalkIn INTEGER,TakeOut INTEGER,Bar INTEGER,PhoneIn INTEGER,QuickSale INTEGER,DefaultCategory TEXT);").then(id => {
                        let headers = that.createRequestHeader();
                        that.http.get(that.apiUrl + 'GetMenuTimers', { headers: headers })
                            .subscribe(
                                data => {
                                    let menuTimers = <MenuTimer[]>data;
                                    menuTimers.forEach(function (menuTimer: MenuTimer) {
                                        SQLiteService.database.execSQL("INSERT INTO MenuTimers (PriKey,Name,Enabled,HappyHourType,PriceLevel,StartTime,EndTime,CategoryToLock" +
                                            ",OverRideCategoryBar,OverRideCategoryDineIn,Mon,Tue,Wed,Thu,Fri,Sat,Sun" +
                                            ",TableService,WalkIn,TakeOut,Bar,PhoneIn,QuickSale,DefaultCategory) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
                                            [menuTimer.PriKey, menuTimer.Name, menuTimer.Enabled, menuTimer.HappyHourType, menuTimer.PriceLevel, that.converTimestampToDate(menuTimer.StartTime),
                                            that.converTimestampToDate(menuTimer.EndTime), menuTimer.CategoryToLock
                                                , menuTimer.OverRideCategoryBar, menuTimer.OverRideCategoryDineIn, menuTimer.Mon, menuTimer.Tue, menuTimer.Wed, menuTimer.Thu, menuTimer.Fri, menuTimer.Sat, menuTimer.Sun
                                                , menuTimer.TableService, menuTimer.WalkIn, menuTimer.TakeOut, menuTimer.Bar, menuTimer.PhoneIn, menuTimer.QuickSale, menuTimer.DefaultCategory]).then(id => {
                                                    resolve("Added MenuTimers records.")
                                                },
                                                    err => {
                                                        reject("Failed to add MenuTimers records.")
                                                    }
                                                );
                                    });
                                },
                                err => {
                                    reject("Error occurred while retrieving MenuTimers from API.");
                                }
                            );
                    }, error => {
                        reject("CREATE TABLE MenuTimers ERROR" + error);
                    });
            });
        });
        return promise;
    }

    converTimestampToDate(timestamp: string) {
        var dateString = timestamp.substr(6, timestamp.indexOf('+') - 7);
        var currentTime = new Date(parseInt(dateString));
        var month = currentTime.getMonth() + 1;
        var day = currentTime.getDate();
        var year = currentTime.getFullYear();
        var date = day + "/" + month + "/" + year;
        return date;
    }

    public getLocalMenuTimers() {

        return SQLiteService.database.all("SELECT * FROM MenuTimer")
            .then(function (rows) {
                let timers: MenuTimer[] = [];
                for (var row in rows) {
                    timers.push(
                        {
                            Name: rows[row][0]
                        }
                    );
                }
                return (timers);
            },
                err => {
                    return null;
                });
    }

    public login(employeeID: string): Observable<any> {
        let headers = this.createRequestHeader();
        return this.http.get(this.apiUrl + 'login?EmployeeID=' + employeeID,
            { headers: headers }).pipe(map(res => res));
    }

    public logoff(): Observable<any> {
        let headers = this.createRequestHeader();
        return this.http.get(this.apiUrl + 'logoff?EmployeeID=' + this.loggedInUser.PriKey,
            { headers: headers }).pipe(map(res => res));
    }

    public getLocalCategoryCodes(): Promise<CategoryCode[]> {
        return SQLiteService.database.all("SELECT PriKey, Description FROM CategoryCodes;")
            .then(function (rows) {
                let categoryCodes: CategoryCode[] = [];
                for (var row in rows) {
                    categoryCodes.push({
                        PriKey: rows[row][0],
                        Description: rows[row][1]
                    });
                }
                return (categoryCodes);
            });
    }

    public getLocalProducts(categoryCodeKey: number): Promise<Product[]> {
        return SQLiteService.database.all("SELECT ProductName, UnitPrice, Product, ForcedModifier, UseForcedModifier FROM Products WHERE CategoryCode =?", [categoryCodeKey])
            .then(function (rows) {
                let products: Product[] = [];
                for (var row in rows) {
                    products.push({
                        ProductName: rows[row][0],
                        UnitPrice: rows[row][1],
                        ProductCode: rows[row][2],
                        ForcedModifier: rows[row][3],
                        UseForcedModifier: rows[row][4],
                    });
                }
                return (products);
            });
    }

    public loadSystemSettings(db) {
        let that = this;

        let promise = new Promise(function (resolve, reject) {
            if (db == null) {
                db = SQLiteService.database;
            }

            db.execSQL("DROP TABLE IF EXISTS SystemSettings;").then(id => {
                db.execSQL("CREATE TABLE IF NOT EXISTS SystemSettings (PriKey, OrderScreenLogOffTimer INTEGER, DineInTimerInterval INTEGER, LoginTableLayout INTEGER" +
                    ",AutoCategory INTEGER, CategoryName INTEGER, TaxExempt TEXT, SmartTax TEXT, TaxGratuity TEXT, GratuityTaxRate REAL, ServerViewAll TEXT" +
                    ");").then(id => {
                        let headers = that.createRequestHeader();
                        that.http.get(that.apiUrl + 'GetSettings', { headers: headers })
                            .subscribe(
                                data => {
                                    console.log('got Settings from API');
                                    let ss: SystemSettings = data;
                                    SQLiteService.database.execSQL("INSERT INTO SystemSettings (PriKey, OrderScreenLogOffTimer, DineInTimerInterval, LoginTableLayout" +
                                        ",AutoCategory, CategoryName, TaxExempt, SmartTax, TaxGratuity, GratuityTaxRate, ServerViewAll) VALUES (?,?,?,?,?,?,?,?,?,?,?)",
                                        [ss.PriKey, ss.OrderScreenLogOffTimer, ss.DineInTimerInterval, ss.LoginTableLayout, 
                                        ss.AutoCategory, ss.CategoryName, ss.TaxExempt, ss.SmartTax, ss.TaxGratuity, ss.GratuityTaxRate, ss.ServerViewAll]).then(id => {
                                            console.log("Added SystemSettings records.");
                                            resolve("Added SystemSettings records.")
                                        },
                                            err => {
                                                reject("Failed to add SystemSettings records.")
                                            }
                                        );
                                },
                                err => {
                                    reject("Error occurred while retrieving Settings from API.");
                                    console.log(err);
                                }
                            );

                    }, error => {
                        console.log("CREATE TABLE SystemSettings ERROR", error);
                        reject("CREATE TABLE SystemSettings ERROR");
                    });
            });
        });
        return promise;
    }

    public getLocalSystemSettings(): Promise<SystemSettings> {
        let that = this;

        return SQLiteService.database.get("SELECT PriKey, OrderScreenLogOffTimer, DineInTimerInterval, LoginTableLayout, " + 
            "AutoCategory, CategoryName, TaxExempt, SmartTax,TaxGratuity, GratuityTaxRate, ServerViewAll FROM SystemSettings;")
            .then(function (row) {
                let systemSettings: SystemSettings = {
                    PriKey: row[0],
                    OrderScreenLogOffTimer: row[1],
                    DineInTimerInterval: row[2],
                    LoginTableLayout: row[3],
                    AutoCategory:  row[4].toLowerCase() == 'true',
                    CategoryName: row[5],
                    TaxExempt: row[6].toLowerCase() == 'true',
                    SmartTax: row[7].toLowerCase() == 'true',
                    TaxGratuity: row[8].toLowerCase() == 'true',
                    GratuityTaxRate: row[9],
                    ServerViewAll: row[10].toLowerCase() == 'true'
                };
                that.systemSettings = systemSettings;
                return (systemSettings);
            });
    }

    public loadLogos(db) {
        let that = this;
        let promise = new Promise(function (resolve, reject) {
            if (db == null) {
                db = SQLiteService.database;
            }

            db.execSQL("DROP TABLE IF EXISTS Logos;").then(id => {
                db.execSQL("CREATE TABLE IF NOT EXISTS Logos (LoginLogo, MyChecksLogo);").then(id => {
                    let headers = that.createRequestHeader();
                    that.http.get(that.apiUrl + 'GetLogos', { headers: headers })
                        .subscribe(
                            data => {
                                let logos: Logos = data;
                                SQLiteService.database.execSQL("INSERT INTO Logos (LoginLogo, MyChecksLogo) VALUES (?,?)",
                                    [logos.LoginLogo, logos.MyChecksLogo]).then(id => {
                                        console.log("Added Logos records.");
                                        resolve("Added Logos records.")
                                    },
                                        err => {
                                            reject("Failed to add Logos records.")
                                        }
                                    );
                            },
                            err => {
                                reject("Error occurred while retrieving Logos from API.");
                            }
                        );

                }, error => {
                    reject("CREATE TABLE Logos ERROR" + error);
                });
            });
        });
        return promise;
    }

    public getLocalLogos(): Promise<Logos> {
        return SQLiteService.database.get("SELECT LoginLogo, MyChecksLogo FROM Logos;")
            .then(function (row) {
                let logos: Logos = {
                    LoginLogo: row[0],
                    MyChecksLogo: row[1]
                };
                return (logos);
            });
    }
    // new Date(parseInt("\/Date(628318530718)\/".slice(6,18)))
    public loadTaxRates(db) {

        let that = this;
        let promise = new Promise(function (resolve, reject) {
            if (db == null) {
                db = SQLiteService.database;
            }

            db.execSQL("DROP TABLE IF EXISTS TaxRates;").then(id => {
                db.execSQL("CREATE TABLE IF NOT EXISTS TaxRates(TaxID INTEGER,Name TEXT, RateType INTEGER, EffectiveRate REAL,Disabled INTEGER,DateEntered TEXT);").then(id => {
                    let headers = that.createRequestHeader();
                    that.http.get(that.apiUrl + 'GetTaxRates', { headers: headers })
                        .subscribe(
                            data => {
                                let reasons = <TaxRate[]>data;
                                reasons.forEach(function (reason: TaxRate) {
                                    SQLiteService.database.execSQL(
                                        "INSERT INTO TaxRates (TaxID,Name,RateType,EffectiveRate,Disabled,DateEntered) VALUES (?,?,?,?,?,?)",
                                        [reason.TaxID, reason.Name, reason.RateType, reason.EffectiveRate,
                                        reason.Disabled, that.converTimestampToDate(reason.DateEntered)]).then(id => {
                                            resolve("Added TaxRates records.")
                                        },
                                            err => {
                                                reject("Failed to add TaxRates records.")
                                            }
                                        );
                                });
                            },
                            err => {
                                reject("Error occurred while retrieving TaxRates from API.");
                            }
                        );
                }, error => {
                    reject("CREATE TABLE TaxRates ERROR" + error);
                });
            });
        });
        return promise;
    }

    public getLocalTaxRates(): Promise<TaxRate> {
        return SQLiteService.database.get("SELECT TaxID,Name, RateType, EffectiveRate, RateType,Disabled,DateEntered FROM TaxRates;")
            .then(function (row) {
                let taxRate: TaxRate = {
                    TaxID: row[0],
                    Name: row[1],
                    RateType: row[2],
                    EffectiveRate: row[3],
                    Disabled: row[4],
                    DateEntered: row[5]
                };
                return (taxRate);
            });
    }
    
    public loadCountdowns(db) {

        let that = this;
        let promise = new Promise(function (resolve, reject) {
            if (db == null) {
                db = SQLiteService.database;
            }

            db.execSQL("DROP TABLE IF EXISTS Countdowns;").then(id => {
                db.execSQL("CREATE TABLE IF NOT EXISTS Countdowns(ProductFilter INTEGER,Quantity INTEGER, QuantityChange INTEGER);").then(id => {
                    let headers = that.createRequestHeader();
                    that.http.get(that.apiUrl + 'GetCountdowns', { headers: headers })
                        .subscribe(
                            data => {
                                let countdowns = <Countdown[]>data;
                                countdowns.forEach(function (countdown: Countdown) {
                                    SQLiteService.database.execSQL(
                                        "INSERT INTO Countdowns (ProductFilter,Quantity, QuantityChange) VALUES (?,?,?)",
                                        [countdown.ProductFilter, countdown.Quantity, countdown.QuantityChange]).then(id => {
                                            resolve("Added Countdowns records.")
                                        },
                                            err => {
                                                reject("Failed to add Countdowns records.")
                                            }
                                        );
                                });
                            },
                            err => {
                                reject("Error occurred while retrieving Countdowns from API.");
                            }
                        );
                }, error => {
                    reject("CREATE TABLE Countdowns ERROR" + error);
                });
            });
        });
        return promise;
    }

    public reloadCountdowns(db) {

        let that = this;
        let promise = new Promise(function (resolve, reject) {
            if (db == null) {
                db = SQLiteService.database;
            }

            db.execSQL("DELETE FROM Countdowns").then(id => {
                let headers = that.createRequestHeader();
                that.http.get(that.apiUrl + 'GetCountdowns', { headers: headers })
                    .subscribe(
                        data => {
                            let countdowns = <Countdown[]>data;
                            countdowns.forEach(function (countdown: Countdown) {
                                SQLiteService.database.execSQL(
                                    "INSERT INTO Countdowns (Activated ,ItemName,PriKey ," +
                                    "Quantity , QuantityChange ,TimeStamp) VALUES (?,?,?)",
                                    [countdown.ProductFilter, countdown.Quantity, countdown.QuantityChange]).then(id => {
                                        resolve("Added Countdowns records.")
                                    },
                                        err => {
                                            reject("Failed to add Countdowns records.")
                                        }
                                    );
                            });
                        },
                        err => {
                            reject("Error occurred while retrieving Countdowns from API.");
                        }
                    );
            }, error => {
                reject("Delete TABLE Countdowns ERROR" + error);
            });
        });

        return promise;
    }

    public getAllEmployees() {
        var promise = SQLiteService.database.all('SELECT * FROM Employees;');
        promise.then(function (resultSet) {
            console.log("Result set is:", resultSet);
        });
    }

    public loadReasons(db) {

        let that = this;
        let promise = new Promise(function (resolve, reject) {
            if (db == null) {
                db = SQLiteService.database;
            }

            db.execSQL("DROP TABLE IF EXISTS Reasons;").then(id => {
                db.execSQL("CREATE TABLE IF NOT EXISTS Reasons (PriKey INTEGER PRIMARY KEY, Reason TEXT);").then(id => {
                    let headers = that.createRequestHeader();
                    that.http.get(that.apiUrl + 'GetReasons', { headers: headers })
                        .subscribe(
                            data => {
                                let reasons = <Reason[]>data;
                                reasons.forEach(function (reason: Reason) {
                                    SQLiteService.database.execSQL("INSERT INTO Reasons (PriKey, Reason) VALUES (?,?)",
                                        [reason.PriKey, reason.Reason]).then(id => {
                                            resolve("Added Reasons records.")
                                        },
                                            err => {
                                                reject("Failed to add Reasons records.")
                                            }
                                        );
                                });
                            },
                            err => {
                                reject("Error occurred while retrieving Reasons from API.");
                            }
                        );
                }, error => {
                    reject("CREATE TABLE Reasons ERROR" + error);
                });
            });
        });
        return promise;
    }

    public getLocalReasons(): Promise<Reason[]> {
        return SQLiteService.database.all("SELECT PriKey, Reason FROM Reasons")
            .then(function (rows) {
                let reasons: Reason[] = [];
                for (var row in rows) {
                    reasons.push({
                        PriKey: rows[row][0],
                        Reason: rows[row][1]
                    });
                }
                return (reasons);
            });
    }


    public dropTables() {
        SQLiteService.database.execSQL('DROP TABLE IF EXISTS MenuCategories;').then(function (resultSet) {
            console.log("Result set is:", resultSet);
        });
    }

    getTableInfo(tableName: string) {
        SQLiteService.database.all("SELECT Name, ProductCode, Position FROM MenuProducts")
            .then(function (rows) {
                console.log(rows);
            });

    }

    private createRequestHeader() {
        let headers = new HttpHeaders({
            "AuthKey": "my-key",
            "AuthToken": "my-token",
            "Content-Type": "application/json"
        });

        return headers;
    }
}