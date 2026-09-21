// Seleccionar la base de datos
db = db.getSiblingDB(process.env.MONGO_INITDB_DATABASE);

// Crear la colección principal
db.createCollection("consultations");

// Índice principal para relacionar MongoDB con PostgreSQL
db.consultations.createIndex(
    { consultation_id: 1 },
    {
        unique: true,
        name: "idx_consultation_id"
    }
);

// Índice para búsquedas por estado de la simulación
db.consultations.createIndex(
    { "status": 1 },
    {
        name: "idx_status"
    }
);

// Índice para búsquedas por especialidad
db.consultations.createIndex(
    { "case.specialty": 1 },
    {
        name: "idx_specialty"
    }
);

print("MongoDB initialized successfully.");