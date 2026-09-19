import json
import time

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

if __name__ == "__main__":
    demo_user = {"nombre": "Dana Vargas", "rol": "Líder de Sistema", "id_unico": "DECOX-001"}
    clase = generar_clase_credencial("3388000000022211111", "chalamandra_pass_v1")
    objeto = generar_objeto_pase("3388000000022211111", "chalamandra_pass_v1", "user_001", demo_user)
    
    print("--- PASE DIGITAL GENÉRICO GENERADO ---")
    print(json.dumps(objeto, indent=2, ensure_ascii=False))
