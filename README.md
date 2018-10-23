# dmuka.LocalStorageDB

 Demo : http://www.bilgisayarafisildayanadam.com/dmuka.LocalStorageDB/
 
 Bu proje ile tarayıcı tarafında kendi veritabanınızı yönetebilirsiniz. Verilerin tamamı sadece LocalStorage üzerinde saklanmaktadır. Linq sorguları ile erişim sağlanmaktadır. Örnek kullanımlar;
 
 * Kullanıcı bazlı ayarların saklanması
 * Wizard kullanılan sayfalardaki verilerin saklanması
 
## Create Instance

### Variables
Name | Type | Default Value | Description
---- | ---- | ------------- | -----------
  **dbName** | _string_ | Must fill! | LocalStorage DB name.
  **dbSchema** | _[object](#dbschema-schema)_ | Must fill! | Tables, views, functions on database.
  
#### dbSchema Schema
```javascript
{
    tables: {
        "table1": function (db) {
            // Return default rows for first instance when it's not exist on localstorage
            return [];
        },
        "table2": function (db) {
            // Return default rows for first instance when it's not exist on localstorage
            return [];
        },
        // ...
    },
    views: {
        "view1": function (db) {
            return db.table1.where(o => o.column1 === "column-value");
        },
        "view2": function (db) {
            return db.table2.where(o => o.column1 === "column-value");
        },
        // ...
    },
    functions: {
        function1: function (db, columnValue1) {
            return db.table1.where(o => o.column1 === columnValue1).firstOrDefault();
        },
        function2: function (db, columnValue1, takeCount) {
            return db.table2.where(o => o.column1 === columnValue).take(takeCount).toArray();
        },
        // ...
    }
}
```

### Example Usage
```javascript
var defaultRows = {
    users: [
        { user_id: "b4e365c0-b008-40e0-bb51-18495484a67c", name: "Muhammed", surname: "Kandemir" },
        { user_id: "f85017cd-db46-4b9d-8625-ed73bb4f90a1", name: "Baran", surname: "Altay" },
        { user_id: "315d5812-cb91-45d4-9516-47ba624a842e", name: "Özkan", surname: "Doğu" }
    ],
    user_addresses: [
        { user_id: "5868bd41-9d55-4f76-a51f-73eb625ca72d", user_id: "b4e365c0-b008-40e0-bb51-18495484a67c", address: "Address 1" },
        { user_id: "48254515-e1ac-4a7f-bc27-b341414ed765", user_id: "b4e365c0-b008-40e0-bb51-18495484a67c", address: "Address 2" },
        { user_id: "ddbb1945-605e-41bc-8d14-99a4dba8a9fb", user_id: "b4e365c0-b008-40e0-bb51-18495484a67c", address: "Address 3" },
        { user_id: "3a230d15-3326-4b89-9192-41b4169f343b", user_id: "f85017cd-db46-4b9d-8625-ed73bb4f90a1", address: "Address 4" },
        { user_id: "a9e075c9-9c04-4bb7-9337-173ae0f1e2ce", user_id: "f85017cd-db46-4b9d-8625-ed73bb4f90a1", address: "Address 5" }
    ]
};

var db = new dmuka.LocalStorageDB({
    dbName: "MuhammedDB",
    dbSchema: {
        tables: {
            /*
            {
                user_id: guid,
                name: string,
                surname: string
            }
            */
            users: function (db) {
                return defaultRows.users;
            },
            /*
            {
                user_address_id: guid,
                user_id: guid,
                address: string
            }
            */
            user_addresses: function (db) {
                return defaultRows.user_addresses;
            }
        },
        views: {
            view_user_address: function (db) {
                return db.users.innerJoin(
                    db.user_addresses,
                    (usr, adr) => usr.user_id === adr.user_id,
                    function (usr, adr) {
                        return {
                            user_id: usr.user_id,
                            name: usr.name,
                            address: adr.address
                        };
                    },
                );
            }
        },
        functions: {
            fnc_get_user_by_name: function (db, name) {
                return db.users.where(o => o.name === name).firstOrDefault();
            },
            fnc_get_user_addresses_by_name: function (db, name) {
                return db.view_user_address().where(o => o.name === name).select(o => o.address).toArray();
            }
        }
    }
});
```

## dmuka.LocalStorageDB Public Variables

### db["tableName"], db.tableName
Bu değer "[dmuka.LocalStorageDB.iQueryable](#dmukalocalstoragedbiqueryable)" olarak dönecektir. Ekstradan fonksiyonlara sahiptir.

#### Public Functions

##### insert
```javascript
function (row)
```
 Row add to table.
 
###### Example Usage
```javascript
db.users.insert({ user_id: "b4e365c0-b008-40e0-bb51-18495484a67c", name: "Muhammed", surname: "Kandemir" });
```

##### insertRange
```javascript
function (rows)
```
 Rows add to table.
 
###### Example Usage
```javascript
db.users.insert([
 { user_id: "b4e365c0-b008-40e0-bb51-18495484a67c", name: "Muhammed", surname: "Kandemir" },
 { user_id: "f85017cd-db46-4b9d-8625-ed73bb4f90a1", name: "Baran", surname: "Altay" }
]);
```

##### delete
```javascript
function (fnc)
```
 Row delete on table.
 
###### Example Usage
```javascript
db.users.delete(o => o.user_id === "b4e365c0-b008-40e0-bb51-18495484a67c");
```

##### deleteRange
```javascript
function (fnc)
```
 Rows delete on table.
 
###### Example Usage
```javascript
db.users.deleteRange(o => o.user_id === "b4e365c0-b008-40e0-bb51-18495484a67c");
```

##### clear
```javascript
function ()
```
 All rows clear on table.
 
###### Example Usage
```javascript
db.users.clear();
```

##### saveChanges
```javascript
function ()
```
 Table save to local storage.
 
###### Example Usage
```javascript
db.users.saveChanges();
```

### db["viewName"], db.viewName
Bu değer "[dmuka.LocalStorageDB.iQueryable](#dmukalocalstoragedbiqueryable)" olarak dönecektir.

#### Example Usage 
```javascript
var result = db.view_user_address().where(o => o.name === "Muhammed").toArray();
```

### db["functionName"], db.functionName
Bu değer herhangi bir değişken türünde dönecektir.

#### Example Usage 
```javascript
var result = db.fnc_get_user_by_name("Muhammed");
```
  
## Classes

### dmuka.LocalStorageDB.iQueryable

#### Constructor
```javascript
new function (toArrayFnc)
```

Name | Type | Default Value | Description
---- | ---- | ------------- | -----------
  **toArrayFnc** | _Array_ or _Function():Array_ | Must fill! | Source array.
 
###### Example Usage 1
```javascript
var iQueryableObject = new dmuka.LocalStorageDB.iQueryable([ { id: 1, name: "Muhammed", surname: "Kandemir" } ]);
```

###### Example Usage 2
```javascript
var iQueryableObject = new dmuka.LocalStorageDB.iQueryable(function() {
  return [ { id: 1, name: "Muhammed", surname: "Kandemir" } ];
});
```
  
#### Public Variables

##### toArray
```javascript
function ()
```
 Return result as Array.
 
###### Example Usage
```javascript
db.users.toArray();
```
 
##### select
```javascript
function (fnc)
```
 Linq select function. Return result as iQueryable.
 
###### Example Usage 1
```javascript
db.users.select(o => o.name);
```

###### Example Usage 2
```javascript
db.users.select(function(o) {
  return {
    name: o.name,
    surname: o.surname
  };
});
```
 
##### where
```javascript
function (fnc)
```
 Linq where function. Return result as iQueryable.
 
###### Example Usage 1
```javascript
db.users.where(o => o.name === "Muhammed");
```

###### Example Usage 2
```javascript
db.users.where(function(o) {
  return o.name === "Muhammed";
});
```
 
##### any
```javascript
function (fnc)
```
 Linq any function. Return result as boolean.
 
###### Example Usage 1
```javascript
db.users.any(o => o.name === "Muhammed");
```

###### Example Usage 2
```javascript
db.users.any(function(o) {
  return o.name === "Muhammed";
});
```

###### Example Usage 3
```javascript
db.users.where(o => o.name === "Muhammed").any();
```
 
##### take
```javascript
function (count)
```
 Linq take function. Return result as iQueryable.
 
###### Example Usage 1
```javascript
db.users.take(5);
```

##### skip
```javascript
function (index)
```
 Linq skip function. Return result as iQueryable.
 
###### Example Usage 1
```javascript
db.users.skip(2);
```

##### firstOrDefault
```javascript
function (fnc)
```
 Linq firstOrDefault function. Return result as selected object.
 
###### Example Usage 1
```javascript
db.users.firstOrDefault();
```

###### Example Usage 2
```javascript
db.users.firstOrDefault(o => o.name === "Muhammed");
```

###### Example Usage 3
```javascript
db.users.firstOrDefault(function(o) {
  return o.name === "Muhammed";
});
```

###### Example Usage 4
```javascript
db.users.where(o => o.name === "Muhammed").firstOrDefault();
```

##### orderBy
```javascript
function (propFnc)
```
 Linq orderBy function. Return result as iQueryable.
 
###### Example Usage 1
```javascript
db.users.orderBy(o => o.name);
```

###### Example Usage 2
```javascript
db.users.orderBy(function(o) {
  return o.name;
});
```

##### orderByDescending
```javascript
function (propFnc)
```
 Linq orderByDescending function. Return result as iQueryable.
 
###### Example Usage 1
```javascript
db.users.orderByDescending(o => o.name);
```

###### Example Usage 2
```javascript
db.users.orderByDescending(function(o) {
  return o.name;
});
```

##### groupBy
```javascript
function (propFnc)
```
 Linq groupBy function. Return result as iQueryable.
 
###### Example Usage 1
```javascript
db.users.groupBy(o => o.name).select(function(o) {
  return {
    group_key_data: o.key,
    group_items: o.value
  };
});
```

###### Example Usage 2
```javascript
db.users.groupBy(function(o) {
  return o.name;
}).select(function(o) {
  return {
    group_name_data: o.key,
    group_items: o.value
  };
});
```

##### innerJoin
```javascript
function (joinSource, joinFnc, joinSelect)
```
 Linq innerJoin function. Return result as iQueryable.
 
###### Example Usage 1
```javascript
db.users.innerJoin(db.user_addresses, (user, address) => user.user_id === address.user_id, function(user, address) {
  return {
    name: user.name,
    address: address.address
  };
});
```

###### Example Usage 2
```javascript
db.users.innerJoin(db.user_addresses, (user, address) => user.user_id === address.user_id, function(user, address) {
  return {
    name: user.name,
    address: address.address
  };
}).groupBy(o => o.name).select(function(o) {
  return {
    name: o.name,
    addresses: o.value.iQueryable().select(a => a.address).toArray()
  };
});
```

##### leftJoin
```javascript
function (joinSource, joinFnc, joinSelect)
```
 Linq leftJoin function. Return result as iQueryable.
 
###### Example Usage 1
```javascript
db.users.leftJoin(db.user_addresses, (user, address) => user.user_id === address.user_id, function(user, address) {
  return {
    name: user.name,
    address: address.address
  };
});
```

###### Example Usage 2
```javascript
db.users.leftJoin(db.user_addresses, (user, address) => user.user_id === address.user_id, function(user, address) {
  return {
    name: user.name,
    address: address.address
  };
}).groupBy(o => o.name).select(function(o) {
  return {
    name: o.name,
    addresses: o.value.iQueryable().select(a => a.address).where(a => a != null).toArray()
  };
});
```

##### rightJoin
```javascript
function (joinSource, joinFnc, joinSelect)
```
 Linq rightJoin function. Return result as iQueryable.
 
###### Example Usage 1
```javascript
db.users.rightJoin(db.user_addresses, (user, address) => user.user_id === address.user_id, function(user, address) {
  return {
    name: user.name,
    address: address.address
  };
});
```

###### Example Usage 2
```javascript
db.users.rightJoin(db.user_addresses, (user, address) => user.user_id === address.user_id, function(user, address) {
  return {
    name: user.name,
    address: address.address
  };
}).groupBy(o => o.name).select(function(o) {
  return {
    name: o.name,
    addresses: o.value.iQueryable().select(a => a.address).toArray()
  };
});
```

##### fullJoin
```javascript
function (joinSource, joinFnc, joinSelect)
```
 Linq fullJoin function. Return result as iQueryable.
 
###### Example Usage 1
```javascript
db.users.fullJoin(db.user_addresses, (user, address) => user.user_id === address.user_id, function(user, address) {
  return {
    name: user.name,
    address: address.address
  };
});
```

###### Example Usage 2
```javascript
db.users.fullJoin(db.user_addresses, (user, address) => user.user_id === address.user_id, function(user, address) {
  return {
    name: user.name,
    address: address.address
  };
}).groupBy(o => o.name).select(function(o) {
  return {
    name: o.name,
    addresses: o.value.iQueryable().select(a => a.address).where(a => a != null).toArray()
  };
});
```
