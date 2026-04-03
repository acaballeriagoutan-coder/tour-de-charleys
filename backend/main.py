from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from dotenv import load_dotenv
from typing import Optional
import os
import uuid
from supabase import create_client, Client

load_dotenv()

supabase: Client = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_SERVICE_ROLE_KEY"),
)

app = FastAPI(title="Tour de Charleys API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class InscripcioInput(BaseModel):
    # Dades personals — obligatoris
    nom: str
    cognoms: str
    email: EmailStr
    telefon: str
    dni: str
    data_naixement: str
    genere: str
    # Contacte emergència — obligatoris
    contacte_emergencia_nom: str
    contacte_emergencia_telefon: str
    # Assegurança — obligatori respondre
    te_asseguranca: bool
    vol_asseguranca: Optional[bool] = None   # automàtic: True si te_asseguranca = False
    numero_llicencia: Optional[str] = None
    foto_url: Optional[str] = None
    # Legal — acceptació obligatòria
    accepta_reglament: bool
    cessio_imatge: bool


@app.get("/")
def root():
    return {"status": "Tour de Charleys API funcionant"}


@app.post("/ciclistes", status_code=201)
def inscriure_ciclista(data: InscripcioInput):
    if not data.accepta_reglament:
        raise HTTPException(status_code=400, detail="Cal acceptar el reglament per inscriure's")
    try:
        # Calcular el següent dorsal
        maxim = supabase.table("ciclistes").select("numero_dorsal").not_.is_("numero_dorsal", "null").execute()
        dorsals = [r["numero_dorsal"] for r in maxim.data]
        seguent_dorsal = max(dorsals, default=0) + 1

        result = supabase.table("ciclistes").insert({
            "nom": data.nom,
            "cognoms": data.cognoms,
            "email": data.email,
            "telefon": data.telefon,
            "dni": data.dni,
            "data_naixement": data.data_naixement,
            "genere": data.genere,
            "contacte_emergencia_nom": data.contacte_emergencia_nom,
            "contacte_emergencia_telefon": data.contacte_emergencia_telefon,
            "te_asseguranca": data.te_asseguranca,
            "vol_asseguranca": data.vol_asseguranca,
            "numero_llicencia": data.numero_llicencia if data.te_asseguranca else None,
            "foto_url": data.foto_url,
            "accepta_reglament": data.accepta_reglament,
            "cessio_imatge": data.cessio_imatge,
            "numero_dorsal": seguent_dorsal,
        }).execute()
        if not result.data:
            raise HTTPException(status_code=400, detail="Error en la inscripció")
        return result.data[0]
    except HTTPException:
        raise
    except Exception as e:
        msg = str(e)
        if "duplicate key" in msg or "unique constraint" in msg:
            if "email" in msg:
                raise HTTPException(status_code=409, detail="Aquest email ja està inscrit.")
            if "dni" in msg:
                raise HTTPException(status_code=409, detail="Aquest DNI ja està inscrit.")
            raise HTTPException(status_code=409, detail="Aquest participant ja està inscrit.")
        raise HTTPException(status_code=500, detail="Error intern del servidor")


@app.get("/ciclistes")
def llistar_ciclistes():
    result = supabase.table("ciclistes").select("*").order("created_at").execute()
    return result.data


@app.post("/ciclistes/assignar-dorsals")
def assignar_dorsals():
    maxim = supabase.table("ciclistes").select("numero_dorsal").not_.is_("numero_dorsal", "null").execute()
    dorsals_existents = [r["numero_dorsal"] for r in maxim.data]
    seguent = max(dorsals_existents, default=0) + 1

    sense_dorsal = supabase.table("ciclistes").select("id").is_("numero_dorsal", "null").order("created_at").execute()

    actualitzats = 0
    for ciclista in sense_dorsal.data:
        supabase.table("ciclistes").update({"numero_dorsal": seguent}).eq("id", ciclista["id"]).execute()
        seguent += 1
        actualitzats += 1

    return {"assignats": actualitzats}


@app.post("/upload-foto")
async def upload_foto(foto: UploadFile = File(...)):
    contingut = await foto.read()
    ext = (foto.filename or "jpg").rsplit(".", 1)[-1].lower()
    nom_fitxer = f"{uuid.uuid4()}.{ext}"
    supabase.storage.from_("fotos-ciclistes").upload(
        nom_fitxer, contingut, {"content-type": foto.content_type or "image/jpeg"}
    )
    url = supabase.storage.from_("fotos-ciclistes").get_public_url(nom_fitxer)
    return {"url": url}


@app.get("/ciclistes/amb-dorsal")
def ciclistes_amb_dorsal():
    result = supabase.table("ciclistes").select("*").not_.is_("numero_dorsal", "null").order("numero_dorsal").execute()
    return result.data
