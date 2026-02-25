import json, os

D = r"C:/Users/Darko/OneDrive/Documents/BizPilot/demo"

def w(fn, data):
    with open(D + "/" + fn, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    print("  Written:", fn)

# 1 workspace
w("demo_workspace.json", {
    "id": "demo-workspace-001",
    "name": "Lythera Demo Co.",
    "slug": "demo-co",
    "owner_id": "demo-user-001",
    "default_currency": "EUR",
    "tax_rate": 19.0
})

print("workspace written")