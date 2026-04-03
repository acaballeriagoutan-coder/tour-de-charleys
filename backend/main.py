from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from dotenv import load_dotenv
import os
from supabase import create_client, Client

load_dotenv()

supabase: Client = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_SERVICE_ROLE_KEY"),
)

app = FastAPI(title="Tour de Charleys API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class InscripcioInput(BaseModel):
    nom: str
    cognoms: str
    email: EmailStr
    telefon: str


@app.get("/")
def root():
    return {"status": "Tour de Charleys API funcionant"}


@app.post("/ciclistes", status_code=201)
def inscriure_ciclista(data: InscripcioInput):
    result = supabase.table("ciclistes").insert({
        "nom": data.nom,
        "cognoms": data.cognoms,
        "email": data.email,
        "telefon": data.telefon,
    }).execute()
    if not result.data:
        raise HTTPException(status_code=400, detail="Error en la inscripció")
    return result.data[0]


@app.get("/ciclistes")
def llistar_ciclistes():
    result = supabase.table("ciclistes").select("*").order("created_at").execute()
    return result.data


@app.post("/ciclistes/assignar-dorsals")
def assignar_dorsals():
    # Trobar el màxim dorsal assignat fins ara
    maxim = supabase.table("ciclistes").select("numero_dorsal").not_.is_("numero_dorsal", "null").execute()
    dorsals_existents = [r["numero_dorsal"] for r in maxim.data]
    seguent = max(dorsals_existents, default=0) + 1

    # Obtenir ciclistes sense dorsal ordenats per data d'inscripció
    sense_dorsal = supabase.table("ciclistes").select("id").is_("numero_dorsal", "null").order("created_at").execute()

    actualitzats = 0
    for ciclista in sense_dorsal.data:
        supabase.table("ciclistes").update({"numero_dorsal": seguent}).eq("id", ciclista["id"]).execute()
        seguent += 1
        actualitzats += 1

    return {"assignats": actualitzats}


@app.get("/ciclistes/amb-dorsal")
def ciclistes_amb_dorsal():
    result = supabase.table("ciclistes").select("*").not_.is_("numero_dorsal", "null").order("numero_dorsal").execute()
    return result.data
