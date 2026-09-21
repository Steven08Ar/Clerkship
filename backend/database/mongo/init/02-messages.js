// Seleccionar la base de datos
db = db.getSiblingDB(process.env.MONGO_INITDB_DATABASE);

// Crear la colección de mensajes de Chats.
// La metadata de la conversación (participantes, tipo DIRECT/GROUP/PUBLIC,
// curso, agente IA) vive en PostgreSQL, tabla "conversations". El contenido
// de cada mensaje vive aquí, ligado por conversation_id.
//
// Forma esperada del documento:
// {
//   conversation_id: "uuid-de-postgres-conversations.id",
//   sender_type: "student" | "teacher" | "ai_agent",
//   sender_id: "uuid-de-postgres-users.id o ai_agents.id",
//   content: "Texto del mensaje",
//   file_attachment: { name, size_str, type } | null,
//   audio_duration: "0:23" | null,
//   created_at: ISODate("...")
// }
db.createCollection("messages");

// Índice principal: traer los mensajes de una conversación ordenados por fecha
db.messages.createIndex(
    { conversation_id: 1, created_at: 1 },
    {
        name: "idx_conversation_created_at"
    }
);

// Índice para distinguir rápido mensajes de humanos vs. agentes IA
db.messages.createIndex(
    { sender_type: 1 },
    {
        name: "idx_sender_type"
    }
);

print("Colección messages inicializada correctamente.");
