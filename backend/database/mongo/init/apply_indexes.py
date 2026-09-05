"""
Crea las colecciones de Mongo y sus índices, replicando exactamente lo que
definen 01-init.js y 02-messages.js de esta misma carpeta.

Se usa este script (en vez de pegar los .js en Atlas) porque esos archivos
están escritos para el patrón de inicialización de Docker
(docker-entrypoint-initdb.d, con process.env.MONGO_INITDB_DATABASE), que no
existe todavía en este proyecto ni aplica a un cluster de Atlas.

Uso: parado en flask-api/ o fastapi-service/ (donde ya existe el .env con
MONGODB_URI y MONGODB_DB_NAME, y pymongo instalado en el venv):

    python ../../db/mongodb/apply_indexes.py
"""
import os

from dotenv import find_dotenv, load_dotenv
from pymongo import ASCENDING, MongoClient

# usecwd=True: busca el .env a partir del directorio desde donde se EJECUTA
# el script (flask-api/ o fastapi-service/), no de donde vive este archivo.
load_dotenv(find_dotenv(usecwd=True))

MONGODB_URI = os.environ["MONGODB_URI"]
MONGODB_DB_NAME = os.environ["MONGODB_DB_NAME"]


def main():
    client = MongoClient(MONGODB_URI)
    db = client[MONGODB_DB_NAME]

    existing = set(db.list_collection_names())

    # --- consultations (de 01-init.js) ---
    if "consultations" not in existing:
        db.create_collection("consultations")
    db.consultations.create_index([("consultation_id", ASCENDING)], unique=True, name="idx_consultation_id")
    db.consultations.create_index([("status", ASCENDING)], name="idx_status")
    db.consultations.create_index([("case.specialty", ASCENDING)], name="idx_specialty")

    # --- messages (de 02-messages.js) ---
    if "messages" not in existing:
        db.create_collection("messages")
    db.messages.create_index([("conversation_id", ASCENDING), ("created_at", ASCENDING)], name="idx_conversation_created_at")
    db.messages.create_index([("sender_type", ASCENDING)], name="idx_sender_type")

    print(f"Base '{MONGODB_DB_NAME}' lista. Colecciones:", db.list_collection_names())
    for coll_name in db.list_collection_names():
        print(f"--- {coll_name} ---")
        for idx in db[coll_name].list_indexes():
            print(" ", idx["name"], dict(idx["key"]), "unique=" + str(idx.get("unique", False)))


if __name__ == "__main__":
    main()
