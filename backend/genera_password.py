"""
Executa aquest script per generar el hash de la teva contrasenya d'admin.
Posa el resultat al .env com a ADMIN_PASSWORD_HASH.

Exemple:
    python genera_password.py
"""
import bcrypt

password = input("Introdueix la nova contrasenya d'admin: ").strip()
hashed = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()
print(f"\nPosa això al teu .env:\n")
print(f'ADMIN_PASSWORD_HASH={hashed}')
