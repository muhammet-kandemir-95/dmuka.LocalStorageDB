// Create namespace
if (window["dmuka"] === undefined) {
    window["dmuka"] = {};
}

dmuka.LocalStorageDB = function (parameters) {
    var me = this;

    // Declare Access Modifiers
    var private = {
        variable: {},
        event: {},
        function: {
            getTableStorageName: function (dbName, tableName) {
                return "dmuka.LocalStorageDB_" + dbName + "_" + tableName;
            }
        },
        class: {}
    };
    var public = this;

    /* Check parameter rules --BEGIN */
    if (parameters.dbName === undefined || parameters.dbName === null) {
        throw "dbName must fill!";
    }
    if (parameters.dbName.indexOf("_") >= 0) {
        throw "dbName can't have '_' char!";
    }
    if (parameters.dbSchema === undefined || parameters.dbSchema === null) {
        throw "dbSchema must fill!";
    }
    /* Check parameter rules --END */

    /* Classes --BEGIN */

    // Declare IQueryable class
    private.class.iQueryable = function (toArrayFnc) {
        // If parameter is array then we should change to function
        if (toArrayFnc.constructor.name === "Array") {
            var originalArray = toArrayFnc;
            toArrayFnc = function (fnc) {
                return iQueryableAccessModifiers.private.function.filterByFunction(originalArray, fnc);
            };
        }

        // Declare Access Modifiers
        var iQueryableAccessModifiers = {
            me: this,
            public: this,
            private: {
                function: {}
            }
        };

        // Sort function
        // array is Array object
        // prop function example : o => o.name
        iQueryableAccessModifiers.private.function.sort = function (array, propFnc) {
            array.sort(function (aItem, bItem) {
                var a = propFnc(aItem);
                var b = propFnc(bItem);

                if (a == null && b == null) {
                    return 0;
                }
                else if (a == null && b != null) {
                    return -1;
                }
                else if (a != null && b == null) {
                    return 1;
                }
                else if (a.constructor.name === "Date") {
                    var aTime = a.getTime();
                    var bTime = b.getTime();
                    return aTime == bTime ? 0 : aTime < bTime ? -1 : 1;
                }
                else {
                    return a == b ? 0 : a < b ? -1 : 1;
                }
            });
            return array;
        };

        // Filter Array function
        // This function actually is a filter
        // array is Array object
        // fnc function example : o => o.name === "Muhammed" another example : o => o.name.indexOf("k") >= 0
        iQueryableAccessModifiers.private.function.filterByFunction = function (array, fnc) {
            if (fnc === undefined || fnc === null) {
                return array;
            }

            var result = [];
            for (var arrayItemIndex = 0; arrayItemIndex < array.length; arrayItemIndex++) {
                var arrayItem = array[arrayItemIndex];
                var resultFnc = fnc(arrayItem, arrayItemIndex);
                if (resultFnc.stop === true) {
                    break;
                }
                if (resultFnc.accept === true) {
                    result.push(resultFnc.item);
                }
            }
            return result;
        };

        // Return result
        // Only this function can to this
        // Another function in the class only can return iQuerylable and can not return Array
        iQueryableAccessModifiers.public.toArray = function (fnc) {
            return toArrayFnc(fnc);
        };

        // Select function
        // fnc example => function(o) { return { Name: o.name, Id: o.id } }
        iQueryableAccessModifiers.public.select = function (fnc) {
            return new private.class.iQueryable(function (parentFnc) {
                return iQueryableAccessModifiers.private.function.filterByFunction(iQueryableAccessModifiers.public.toArray(function (row, rowIndex) {
                    var result = {
                        stop: false,
                        accept: true,
                        item: fnc(row)
                    };

                    return result;
                }), parentFnc);
            });
        };

        // Where function
        // This function is like filterByFunction, but have different algorithm
        // fnc function example : o => o.name === "Muhammed" another example : o => o.name.indexOf("k") >= 0
        iQueryableAccessModifiers.public.where = function (fnc) {
            return new private.class.iQueryable(function (parentFnc) {
                return iQueryableAccessModifiers.private.function.filterByFunction(iQueryableAccessModifiers.public.toArray(function (row, rowIndex) {
                    var result = {
                        stop: false,
                        accept: fnc(row, rowIndex),
                        item: row
                    };

                    return result;
                }), parentFnc);
            });
        };

        // Any function
        // This function is same filterByFunction, but if found any row then exit loop. So this function have performance than where
        // fnc function example : o => o.name === "Muhammed" another example : o => o.name.indexOf("k") >= 0
        iQueryableAccessModifiers.public.any = function (fnc) {
            var exists = false;
            iQueryableAccessModifiers.public.toArray(function (row, rowIndex) {
                exists = fnc(row, rowIndex);

                var result = {
                    stop: exists,
                    accept: false,
                    item: row
                };

                return result;
            });

            return exists;
        };

        // Take function
        // count is row count
        iQueryableAccessModifiers.public.take = function (count) {
            return new private.class.iQueryable(function (parentFnc) {
                return iQueryableAccessModifiers.private.function.filterByFunction(iQueryableAccessModifiers.public.toArray(function (row, rowIndex) {
                    var result = {
                        stop: rowIndex + 1 > count,
                        accept: true,
                        item: row
                    };

                    return result;
                }), parentFnc);
            });
        };

        // FirstOrDefault function
        // Only take 1 row and return object
        iQueryableAccessModifiers.public.firstOrDefault = function () {
            return iQueryableAccessModifiers.public.take(1).toArray()[0];
        };

        // Skip function
        iQueryableAccessModifiers.public.skip = function (index) {
            return new private.class.iQueryable(function (parentFnc) {
                return iQueryableAccessModifiers.private.function.filterByFunction(iQueryableAccessModifiers.public.toArray(function (row, rowIndex) {
                    var result = {
                        stop: false,
                        accept: rowIndex >= index,
                        item: row
                    };

                    return result;
                }), parentFnc);
            });
        };

        // Join function
        // This function can join(inner, left, right, full)
        // type is enum -> "inner", "left", "right", "full"
        // joinSource another iQueryable, it don't have to be table, maybe iQueryable that may have where, order, etc..
        // joinSource example : db.users.join("inner", db.users.where(o => o.name === "Muhammed"), ...)  
        // joinFnc join prop codes. Example : (table1, table2) => table1.name === table2.name
        // joinSelect iw what select do you want? Example :  function(table1, table2) { return { table1Name: table1.name, table2Id : table2.Id } }
        iQueryableAccessModifiers.private.function.join = function (type, joinSource, joinFnc, joinSelect) {
            return new private.class.iQueryable(function (parentFnc) {
                var source1 = iQueryableAccessModifiers.public.toArray();
                var source2 = joinSource.toArray();

                var processSource1 = null;
                var processSource2 = null;
                switch (type) {
                    case "inner":
                    case "full":
                    case "left":
                        processSource1 = source1;
                        processSource2 = source2;
                        break;
                    case "right":
                        processSource2 = source1;
                        processSource1 = source2;
                        break;
                }

                var existsProcessItems2 = [];
                var rows = [];
                for (var processItem1Index = 0; processItem1Index < processSource1.length; processItem1Index++) {
                    var processItem1 = processSource1[processItem1Index];

                    var existsProcessItem1 = false;

                    for (var processItem2Index = 0; processItem2Index < processSource2.length; processItem2Index++) {
                        var processItem2 = processSource2[processItem2Index];

                        if (joinFnc(processItem1, processItem2) === true) {
                            existsProcessItem1 = true;

                            var source1Item = null;
                            var source2Item = null;
                            switch (type) {
                                case "inner":
                                case "full":
                                case "left":
                                    source1Item = processItem1;
                                    source2Item = processItem2;
                                    break;
                                case "right":
                                    source2Item = processItem1;
                                    source1Item = processItem2;
                                    break;
                            }

                            existsProcessItems2.push(processItem2Index);
                            rows.push(joinSelect(source1Item, source2Item));
                        }
                    }

                    if (existsProcessItem1 === false && type !== "inner") {
                        var source1Item = null;
                        var source2Item = null;

                        switch (type) {
                            case "full":
                            case "left":
                                source1Item = processItem1;
                                source2Item = {};
                                break;
                            case "right":
                                source2Item = processItem1;
                                source1Item = {};
                                break;
                        }

                        rows.push(joinSelect(source1Item, source2Item));
                    }
                }

                if (type === "full") {
                    for (var processItem2Index = 0; processItem2Index < processSource2.length; processItem2Index++) {
                        var processItem2 = processSource2[processItem2Index];

                        var existsProcessItem2 = false;
                        for (var existsProcessItems2Index = 0; existsProcessItems2Index < existsProcessItems2.length; existsProcessItems2Index++) {
                            if (existsProcessItems2[existsProcessItems2Index] === processItem2Index) {
                                existsProcessItem2 = true;
                                break;
                            }
                        }

                        if (existsProcessItem2 === false) {
                            existsProcessItems2.push(processItem2Index);
                            rows.push(joinSelect({}, processItem2));
                        }
                    }
                }

                return iQueryableAccessModifiers.private.function.filterByFunction(rows, parentFnc);
            });
        };

        iQueryableAccessModifiers.public.innerJoin = function (joinSource, joinFnc, joinSelect) {
            return iQueryableAccessModifiers.private.function.join("inner", joinSource, joinFnc, joinSelect);
        };

        iQueryableAccessModifiers.public.leftJoin = function (joinSource, joinFnc, joinSelect) {
            return iQueryableAccessModifiers.private.function.join("left", joinSource, joinFnc, joinSelect);
        };

        iQueryableAccessModifiers.public.rightJoin = function (joinSource, joinFnc, joinSelect) {
            return iQueryableAccessModifiers.private.function.join("right", joinSource, joinFnc, joinSelect);
        };

        iQueryableAccessModifiers.public.fullJoin = function (joinSource, joinFnc, joinSelect) {
            return iQueryableAccessModifiers.private.function.join("full", joinSource, joinFnc, joinSelect);
        };

        // Order By function
        // prop function example : o => o.name
        iQueryableAccessModifiers.public.orderBy = function (propFnc) {
            return new private.class.iQueryable(function (parentFnc) {
                var rows = iQueryableAccessModifiers.public.toArray();
                rows = iQueryableAccessModifiers.private.function.sort(rows, propFnc);

                return iQueryableAccessModifiers.private.function.filterByFunction(rows, parentFnc);
            });
        };

        // Order By Descending function
        // prop function example : o => o.name
        iQueryableAccessModifiers.public.orderByDescending = function (propFnc) {
            return new private.class.iQueryable(function (parentFnc) {
                var rows = iQueryableAccessModifiers.public.toArray();
                rows = iQueryableAccessModifiers.private.function.sort(rows, propFnc);
                rows.reverse();

                return iQueryableAccessModifiers.private.function.filterByFunction(rows, parentFnc);
            });
        };

        // Group By function
        // prop function example : o => o.name
        iQueryableAccessModifiers.public.groupBy = function (propFnc) {
            return new private.class.iQueryable(function (parentFnc) {
                var rows = iQueryableAccessModifiers.public.toArray();
                var groupByRows = rows.reduce(function (rv, x) {
                    (rv[propFnc(x)] = rv[propFnc(x)] || []).push(x);
                    return rv;
                }, {});

                rows = [];
                for (var groupByRowKey in groupByRows) {
                    rows.push({
                        key: groupByRowKey,
                        value: groupByRows[groupByRowKey]
                    });
                }

                return iQueryableAccessModifiers.private.function.filterByFunction(rows, parentFnc);
            });
        };
    }

    /* Classes --END */

    /* Variables --BEGIN */

    private.variable.dbName = parameters.dbName;
    /*
        private.variable.dbSchema = {
                tables: {
                    name: [] --default data
                },
                // Schema :
                //     name : <function(db)>
                views: {}
            };
    */
    private.variable.dbSchema = parameters.dbSchema;

    // Declare all tables and read datas from localstorage or from default value
    private.variable.dbTables = {};
    for (var tableName in private.variable.dbSchema.tables) {
        var tableData = JSON.parse(localStorage.getItem(private.function.getTableStorageName(private.variable.dbName, tableName)));
        if (tableData === null) {
            tableData = private.variable.dbSchema.tables[tableName];
        }
        private.variable.dbTables[tableName] = tableData;
        (function (tableName, tableData) {
            public[tableName] = new private.class.iQueryable(tableData);

            // Added insert function for a row
            public[tableName].insert = function (row) {
                tableData.push(row);
            };

            // Added insert function for much row
            public[tableName].insertRange = function (row) {
                for (var rowIndex = 0; rowIndex < rows.length; rowIndex++) {
                    tableData.push(rows[rowIndex]);
                }
            };

            // Added delete function for a row
            public[tableName].delete = function (fnc) {
                for (var rowIndex = 0; rowIndex < tableData.length; rowIndex++) {
                    if (fnc(tableData[rowIndex]) === true) {
                        tableData.splice(rowIndex, 1);
                        return true;
                    }
                }

                return false;
            };

            // Added delete function for much row
            public[tableName].deleteRange = function (fnc) {
                for (var rowIndex = 0; rowIndex < tableData.length; rowIndex++) {
                    if (fnc(tableData[rowIndex]) === true) {
                        tableData.splice(rowIndex, 1);
                        rowIndex--;
                    }
                }
            };

            // Added clear function for clear all datas
            public[tableName].clear = function () {
                tableData.splice(0, tableData.length);
            };

            // Added save function for update localstorage only for this table
            public[tableName].saveChanges = function () {
                localStorage.setItem(private.function.getTableStorageName(private.variable.dbName, tableName), JSON.stringify(tableData));
            };
        })(tableName, tableData);
    }

    // Added views
    for (var viewName in private.variable.dbSchema.views) {
        var view = private.variable.dbSchema.views[viewName];

        (function (view) {
            public[viewName] = {
                query: function () {
                    return view(me);
                }
            };
        })(view);
    }

    /* Variables --END */

    /* Functions --BEGIN */
    public.guid = function() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    /* Functions --END */
};