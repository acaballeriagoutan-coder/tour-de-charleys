from fastapi import FastAPI, HTTPException, UploadFile, File, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr
from dotenv import load_dotenv
from typing import Optional
from datetime import datetime, timedelta
from jose import JWTError, jwt
import bcrypt
import os
import uuid
from supabase import create_client, Client

load_dotenv()

supabase: Client = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_SERVICE_ROLE_KEY"),
)

# ── Auth config ────────────────────────────────────────────────
SECRET_KEY = os.getenv("SECRET_KEY", "canvia-aixo-a-produccio")
ALGORITHM = "HS256"
TOKEN_EXPIRES_HOURS = 48

ADMIN_USERNAME = os.getenv("ADMIN_USERNAME", "admin")
ADMIN_PASSWORD_HASH = os.getenv("ADMIN_PASSWORD_HASH", "")

bearer = HTTPBearer()


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode(), hashed.encode())


def create_token(username: str) -> str:
    expire = datetime.utcnow() + timedelta(hours=TOKEN_EXPIRES_HOURS)
    return jwt.encode({"sub": username, "exp": expire}, SECRET_KEY, algorithm=ALGORITHM)


def get_admin(credentials: HTTPAuthorizationCredentials = Depends(bearer)):
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username != ADMIN_USERNAME:
            raise HTTPException(status_code=401, detail="No autoritzat")
        return username
    except JWTError:
        raise HTTPException(status_code=401, detail="Token invàlid o caducat")


# ── App ────────────────────────────────────────────────────────
app = FastAPI(title="Tour de Charleys API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("CORS_ORIGINS", "http://localhost:5173,http://localhost:5174").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Models ─────────────────────────────────────────────────────
class LoginInput(BaseModel):
    username: str
    password: str


class InscripcioInput(BaseModel):
    nom: str
    cognoms: str
    email: EmailStr
    telefon: str
    dni: str
    data_naixement: str
    genere: str
    contacte_emergencia_nom: str
    contacte_emergencia_telefon: str
    te_asseguranca: bool
    vol_asseguranca: Optional[bool] = None
    numero_llicencia: Optional[str] = None
    foto_url: Optional[str] = None
    accepta_reglament: bool
    cessio_imatge: bool


# ── Endpoints públics ──────────────────────────────────────────
@app.get("/")
def root():
    return {"status": "Tour de Charleys API funcionant"}


@app.post("/auth/login")
def login(data: LoginInput):
    if data.username != ADMIN_USERNAME or not ADMIN_PASSWORD_HASH:
        raise HTTPException(status_code=401, detail="Credencials incorrectes")
    if not verify_password(data.password, ADMIN_PASSWORD_HASH):
        raise HTTPException(status_code=401, detail="Credencials incorrectes")
    return {"access_token": create_token(data.username), "token_type": "bearer"}


@app.post("/ciclistes", status_code=201)
def inscriure_ciclista(data: InscripcioInput):
    if not data.accepta_reglament:
        raise HTTPException(status_code=400, detail="Cal acceptar el reglament per inscriure's")
    try:
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


# ── Endpoints protegits (requereixen token d'admin) ────────────
@app.get("/ciclistes")
def llistar_ciclistes(_: str = Depends(get_admin)):
    result = supabase.table("ciclistes").select("*").order("created_at").execute()
    return result.data


@app.get("/ciclistes/amb-dorsal")
def ciclistes_amb_dorsal(_: str = Depends(get_admin)):
    result = supabase.table("ciclistes").select("*").not_.is_("numero_dorsal", "null").order("numero_dorsal").execute()
    return result.data


@app.post("/ciclistes/assignar-dorsals")
def assignar_dorsals(_: str = Depends(get_admin)):
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
