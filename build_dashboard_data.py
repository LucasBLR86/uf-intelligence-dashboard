from __future__ import annotations

import json
import sys
from pathlib import Path

import pandas as pd


REGIONS = {
    "AC": "Norte",
    "AP": "Norte",
    "AM": "Norte",
    "PA": "Norte",
    "RO": "Norte",
    "RR": "Norte",
    "TO": "Norte",
    "AL": "Nordeste",
    "BA": "Nordeste",
    "CE": "Nordeste",
    "MA": "Nordeste",
    "PB": "Nordeste",
    "PE": "Nordeste",
    "PI": "Nordeste",
    "RN": "Nordeste",
    "SE": "Nordeste",
    "DF": "Centro-Oeste",
    "GO": "Centro-Oeste",
    "MS": "Centro-Oeste",
    "MT": "Centro-Oeste",
    "ES": "Sudeste",
    "MG": "Sudeste",
    "RJ": "Sudeste",
    "SP": "Sudeste",
    "PR": "Sul",
    "RS": "Sul",
    "SC": "Sul",
}


def main() -> None:
    source = Path(sys.argv[1])
    out = Path(sys.argv[2])
    df = pd.read_excel(source, sheet_name="Sheet1")
    df["regiao"] = df["estado"].map(REGIONS)

    keep = [
        "estado",
        "regiao",
        "ano",
        "pib_bilhoes_reais",
        "idh",
        "rendimento_per_capita",
        "mortalidade_infantil",
        "percentual_superior_completo",
        "taxa_analfabetismo",
        "indice_gini",
        "percentual_pib_pd",
        "populacao",
        "total_patentes",
    ]
    records = df[keep].sort_values(["ano", "estado"]).to_dict(orient="records")
    payload = {
        "source": str(source),
        "generatedFrom": "df_base_total_derivadas.xlsx",
        "records": records,
        "regions": REGIONS,
    }
    out.write_text(
        "window.DASHBOARD_DATA = "
        + json.dumps(payload, ensure_ascii=False, separators=(",", ":"))
        + ";\n",
        encoding="utf-8",
    )


if __name__ == "__main__":
    main()
