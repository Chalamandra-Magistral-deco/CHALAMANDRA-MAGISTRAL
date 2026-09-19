import json
import time
import os
import jwt

def generar_clase_credencial(issuer_id: str, class_id: str) -> dict:
    """Estructura base del GenericClass para Chalamandra Magistral DecoX en Google Wallet."""
    return {
        "id": f"{issuer_id}.{class_id}",
        "classTemplateInfo": {
            "cardTemplateOverride": {
                "cardRowTemplateInfos": [
                    {
                        "twoItems": {
                            "startItem": {
                                "firstValue": {
                                    "fields": [{"fieldPath": "object.textModulesData['nivel']"}]
                                }
                            },
                            "endItem": {
                                "firstValue": {
                                    "fields": [{"fieldPath": "object.textModulesData['estado']"}]
                                }
                            }
                        }
                    }
                ]
            }
        },
        "imageModulesData": [],
        "enableSmartTap": True,
        "redemptionIssuers": [issuer_id]
    }

def generar_objeto_pase(issuer_id: str, class_id: str, object_id: str, usuario_info: dict) -> dict:
    """Estructura del GenericObject (pase individual asignado a un usuario)."""
    return {
        "id": f"{issuer_id}.{object_id}",
        "classId": f"{issuer_id}.{class_id}",
        "state": "ACTIVE",
        "cardTitle": {
            "defaultValue": {"language": "es", "value": "Chalamandra Magistral DecoX"}
        },
        "header": {
            "defaultValue": {"language": "es", "value": usuario_info.get("nombre", "Miembro DecoX")}
        },
        "textModulesData": [
            {
                "id": "nivel",
                "header": "Acredita",
                "body": usuario_info.get("rol", "Estratega DecoX")
            },
            {
                "id": "estado",
                "header": "Estado",
                "body": "Activo / Verificado"
            }
        ],
        "barcode": {
            "type": "QR_CODE",
            "value": usuario_info.get("id_unico", f"DECOX-{int(time.time())}"),
            "alternateText": usuario_info.get("id_unico", "DECOX-PASS")
        },
        "hexBackgroundColor": "#0f172a"
    }

def generar_jwt_save_url(sa_key_path: str, issuer_id: str, class_id: str, object_id: str, usuario_info: dict, origins: list = None) -> str:
    """Genera la URL con JWT firmado para guardar la credencial en Google Wallet."""
    if not os.path.exists(sa_key_path):
        raise FileNotFoundError(f"Archivo Service Account no encontrado en: {sa_key_path}")

    with open(sa_key_path, 'r') as f:
        sa_data = json.load(f)

    private_key = sa_data["private_key"]
    client_email = sa_data["client_email"]

    clase = generar_clase_credencial(issuer_id, class_id)
    objeto = generar_objeto_pase(issuer_id, class_id, object_id, usuario_info)

    claims = {
        "iss": client_email,
        "aud": "google",
        "origins": origins or ["http://localhost:8000"],
        "typ": "savetowallet",
        "payload": {
            "genericClasses": [clase],
            "genericObjects": [objeto]
        },
        "iat": int(time.time())
    }

    token = jwt.encode(claims, private_key, algorithm="RS256")
    return f"https://pay.google.com/gp/v/save/{token}"

if __name__ == "__main__":
    print("Módulo wallet_service.py listo para firma JWT.")
