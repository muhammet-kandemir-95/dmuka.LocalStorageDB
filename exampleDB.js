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
