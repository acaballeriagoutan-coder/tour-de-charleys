from fastapi import FastAPI, HTTPException, UploadFile, File, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr
from dotenv import load_dotenv
from typing import Optional
from datetime import datetime, timedelta
from jose import JWTError, jwt
import bcrypt
import anthropic
import os
from datetime import date
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


@app.get("/stats/insights")
def stats_insights(_: str = Depends(get_admin)):
    result = supabase.table("ciclistes").select("*").execute()
    ciclistes = result.data

    if not ciclistes:
        return {"stats": {}, "insights": []}

    avui = date.today()

    # Càlcul d'estadístiques
    total = len(ciclistes)

    # Gènere
    generes: dict = {}
    for c in ciclistes:
        g = c.get("genere") or "Desconegut"
        generes[g] = generes.get(g, 0) + 1

    # Franges d'edat
    franges = {"<18": 0, "18-30": 0, "31-45": 0, "46-60": 0, "+60": 0, "Desconeguda": 0}
    edats = []
    for c in ciclistes:
        dn = c.get("data_naixement")
        if dn:
            try:
                naix = date.fromisoformat(dn)
                edat = (avui - naix).days // 365
                edats.append(edat)
                if edat < 18: franges["<18"] += 1
                elif edat <= 30: franges["18-30"] += 1
                elif edat <= 45: franges["31-45"] += 1
                elif edat <= 60: franges["46-60"] += 1
                else: franges["+60"] += 1
            except Exception:
                franges["Desconeguda"] += 1
        else:
            franges["Desconeguda"] += 1
    edat_mitja = round(sum(edats) / len(edats)) if edats else 0
    edat_min = min(edats) if edats else 0
    edat_max = max(edats) if edats else 0

    # Assegurança
    amb_asseguranca = sum(1 for c in ciclistes if c.get("te_asseguranca"))
    vol_nostra = sum(1 for c in ciclistes if not c.get("te_asseguranca"))
    amb_llicencia = sum(1 for c in ciclistes if c.get("numero_llicencia"))

    # Inscripcions per dia (últims 14 dies)
    per_dia: dict = {}
    for c in ciclistes:
        created = c.get("created_at", "")[:10]
        if created:
            per_dia[created] = per_dia.get(created, 0) + 1
    per_dia_llista = sorted([{"data": k, "count": v} for k, v in per_dia.items()], key=lambda x: x["data"])

    stats = {
        "total": total,
        "genere": generes,
        "edats": {k: v for k, v in franges.items() if v > 0},
        "edat_mitja": edat_mitja,
        "edat_min": edat_min,
        "edat_max": edat_max,
        "asseguranca": {"Pròpia": amb_asseguranca, "Vol la nostra": vol_nostra},
        "amb_llicencia": amb_llicencia,
        "per_dia": per_dia_llista,
    }

    # Crida a Claude per generar insights
    try:
        client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
        prompt = f"""Ets l'agent d'anàlisi del Le Tour de Charley's 2026, una cursa ciclista amateur a Catalunya.
Tens accés a les dades d'inscripció. Analitza-les i genera exactament 5 insights útils per a l'organitzador.

DADES:
- Total inscrits: {total}
- Distribució per gènere: {generes}
- Franges d'edat: {franges}
- Edat mitjana: {edat_mitja} anys (mínim {edat_min}, màxim {edat_max})
- Amb assegurança pròpia: {amb_asseguranca} | Volen la de l'organització: {vol_nostra}
- Amb llicència federativa: {amb_llicencia}
- Inscripcions per dia: {per_dia_llista}

Respon NOMÉS amb un JSON vàlid amb aquesta estructura exacta (sense cap text fora del JSON):
[
  {{"titol": "...", "text": "...", "color": "blue"}},
  {{"titol": "...", "text": "...", "color": "yellow"}},
  {{"titol": "...", "text": "...", "color": "green"}},
  {{"titol": "...", "text": "...", "color": "orange"}},
  {{"titol": "...", "text": "...", "color": "purple"}}
]

Colors disponibles: blue, yellow, green, orange, purple.
Escriu els insights en català. Sigues concret, útil i accionable per a l'organitzador."""

        message = client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=1024,
            messages=[{"role": "user", "content": prompt}]
        )
        import json as json_module
        insights = json_module.loads(message.content[0].text)
    except Exception as e:
        insights = [{"titol": "Error", "text": f"No s'han pogut generar insights: {str(e)}", "color": "blue"}]

    return {"stats": stats, "insights": insights}
