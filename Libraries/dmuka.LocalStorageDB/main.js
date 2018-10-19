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

    private.class.iQueryable = function (toArrayFnc) {
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

        iQueryableAccessModifiers.public.toArray = function (fnc) {
            return toArrayFnc(fnc);
        };

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

        iQueryableAccessModifiers.public.firstOrDefault = function () {
            return iQueryableAccessModifiers.public.take(1).toArray()[0];
        };

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

        iQueryableAccessModifiers.public.orderBy = function (propFnc) {
            return new private.class.iQueryable(function (parentFnc) {
                var rows = iQueryableAccessModifiers.public.toArray();
                rows = iQueryableAccessModifiers.private.function.sort(rows, propFnc);

                return iQueryableAccessModifiers.private.function.filterByFunction(rows, parentFnc);
            });
        };

        iQueryableAccessModifiers.public.orderByDescending = function (propFnc) {
            return new private.class.iQueryable(function (parentFnc) {
                var rows = iQueryableAccessModifiers.public.toArray();
                rows = iQueryableAccessModifiers.private.function.sort(rows, propFnc);
                rows.reverse();

                return iQueryableAccessModifiers.private.function.filterByFunction(rows, parentFnc);
            });
        };

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

    private.variable.dbTables = {};
    for (var tableName in private.variable.dbSchema.tables) {
        var tableData = JSON.parse(localStorage.getItem(private.function.getTableStorageName(private.variable.dbName, tableName)));
        if (tableData === null) {
            tableData = private.variable.dbSchema.tables[tableName];
        }
        private.variable.dbTables[tableName] = tableData;
        (function (tableName, tableData) {
            public[tableName] = new private.class.iQueryable(tableData);
            public[tableName].insert = function (row) {
                tableData.push(row);
            };
            public[tableName].insertRange = function (row) {
                for(var rowIndex = 0;rowIndex < rows.length; rowIndex++){
                    tableData.push(rows[rowIndex]);
                }
            };
            public[tableName].delete = function (fnc) {
                for (var rowIndex = 0; rowIndex < tableData.length; rowIndex++) {
                    if (fnc(tableData[rowIndex]) === true) {
                        tableData.splice(rowIndex, 1);
                        return true;
                    }
                }

                return false;
            };
            public[tableName].deleteRange = function (fnc) {
                for (var rowIndex = 0; rowIndex < tableData.length; rowIndex++) {
                    if (fnc(tableData[rowIndex]) === true) {
                        tableData.splice(rowIndex, 1);
                        rowIndex--;
                    }
                }
            };
            public[tableName].saveChanges = function () {
                localStorage.setItem(private.function.getTableStorageName(private.variable.dbName, tableName), JSON.stringify(tableData));
            };
        })(tableName, tableData);
    }

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
};