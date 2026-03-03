db.createCollection("audit_logs", {
    validator: {
        $jsonSchema: {
            bsonType: "object",
            required: ["entity_type", "entity_id", "action", "timestamp"],
            properties: {
                entity_type: {
                    bsonType: "string",
                    description: "must be a string and is required"
                },
                entity_id: {
                    bsonType: ["string", "int", "long"],
                    description: "must be a string or number and is required"
                },
                action: {
                    enum: ["INSERT", "UPDATE", "DELETE"],
                    description: "can only be one of the enum values and is required"
                },
                timestamp: {
                    bsonType: "date",
                    description: "must be a date and is required"
                },
                previous_data: {
                    bsonType: "object",
                    description: "must be an object"
                }
            }
        }
    }
});

db.audit_logs.createIndex({ entity_type: 1, entity_id: 1, timestamp: -1 });
