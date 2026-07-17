# Plataforma clinica educativa

## Iniciar contenedores
cd docker  
docker compose up -d  
docker compose down -v  

## Entrar a base de datos postgres
docker exec -it medical_postgres bash    
psql -U postgres_admin -h localhost -d medical_simulator  
\l  
\c medical_simulator  
\dt  
\q  