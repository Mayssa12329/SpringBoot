# VetInterop : registre des puces (SOAP)

Service SOAP *contract-first* : le XSD `src/main/resources/xsd/vetinterop.xsd` est le contrat.
Les classes Java sont générées au build (`mvn generate-sources`), le WSDL est servi par le service.

| Élément | Valeur |
|---|---|
| Port | 8087 (hôte et conteneur) |
| Endpoint SOAP | `POST http://localhost:8087/ws` |
| WSDL | `GET http://localhost:8087/ws/vetinterop.wsdl` |
| Opération | `VerifyAnimalIdentity` (puce de 15 chiffres) |
| Base | PostgreSQL dédiée `vetinterop_db` (port hôte 5436, Flyway) |

## Règle RM10
- Puce inconnue : réponse normale avec `verdict = NOT_FOUND` (**pas** de SOAP Fault).
- Puce hors format (ex. 3 chiffres) : SOAP Fault de code `Client` (rejet par le XSD).
- Puce connue : `VERIFIED`, `INCONSISTENT` ou `UNDETERMINED` selon son statut dans le registre.

## Données de démonstration
| Puce | Verdict |
|---|---|
| 250268500123456 (Rex) | VERIFIED |
| 250268500123457 (Mina) | VERIFIED |
| 250268500999001 (Kiko) | INCONSISTENT |
| 250268500999002 (Luna) | UNDETERMINED |
| toute autre puce valide | NOT_FOUND |

## Tester
```bash
curl -s -H "Content-Type: text/xml" http://localhost:8087/ws -d '<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:v="http://medivet.tn/vetinterop"><soapenv:Body><v:VerifyAnimalIdentityRequest><v:puce>250268500123456</v:puce></v:VerifyAnimalIdentityRequest></soapenv:Body></soapenv:Envelope>'
```
Ajouter une puce (administration, REST) : `POST /api/v1/registre` avec
`{"puce":"250268500111111","nomAnimal":"Rex","espece":"CHIEN","statut":"VERIFIE"}`.
