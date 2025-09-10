# Commun Printing - Technická dokumentace

Vítejte v technické dokumentaci projektu **Commun Printing**, platformy pro sdílený 3D tisk na zakázku.

## 1. Architektura

Platforma je postavena na moderním monorepo-like přístupu s využitím Dockeru pro kontejnerizaci jednotlivých služeb.

### Přehled služeb:

-   **`frontend`**: Next.js (React) aplikace poskytující uživatelské rozhraní pro zákazníky, majitele tiskáren a administrátory. Komunikuje s backendem přes REST API.
-   **`backend`**: NestJS (Node.js, TypeScript) aplikace, která obsluhuje veškerou business logiku, spravuje databázi a komunikuje s externími službami. Vystavuje REST API zdokumentované pomocí OpenAPI.
-   **`db`**: PostgreSQL databáze pro ukládání veškerých persistentních dat (uživatelé, objednávky, tiskárny atd.).
-   **`redis`**: In-memory databáze využívaná jako message broker pro frontu asynchronních úloh (BullMQ).
-   **`minio`**: S3-kompatibilní objektové úložiště pro ukládání nahraných 3D modelů a fotografií tiskáren.

### Tok dat (zjednodušeně):

1.  **Upload modelu**: Uživatel přes `frontend` nahraje 3D model. Frontend pošle soubor na `backend`.
2.  **Uložení a analýza**: `Backend` soubor uloží do `Minio` a vytvoří záznam v `PostgreSQL`. Následně přidá úlohu do `Redis` fronty.
3.  **Asynchronní Job**: Worker proces běžící na `backendu` si vezme úlohu z `Redis`, provede analýzu modelu (výpočet objemu, bbox) a uloží výsledky zpět do `PostgreSQL`.
4.  **Zobrazení výsledků**: `Frontend` se dotazuje `backendu` na stav analýzy a po dokončení zobrazí uživateli odhad ceny.
5.  **Platba**: Checkout proces je směrován přes Stripe. `Backend` zpracovává notifikace (webhooks) od Stripe pro potvrzení platby.

---

## 2. Spuštění vývojového prostředí

Pro spuštění kompletního prostředí lokálně je potřeba mít nainstalovaný **Docker** a **Docker Compose**.

### Kroky ke spuštění:

1.  **Klonujte repozitář:**
    ```bash
    git clone <URL_REPOZITARE>
    cd commun-printing
    ```

2.  **Vytvořte `.env` soubor:**
    Zkopírujte vzorový soubor `infrastructure/.env.example` a vytvořte z něj `infrastructure/.env`. Doplňte potřebné tajné klíče (především pro Stripe).
    ```bash
    cp infrastructure/.env.example infrastructure/.env
    ```

3.  **Spusťte Docker Compose:**
    Tento příkaz postaví a spustí všechny potřebné kontejnery.
    ```bash
    docker-compose -f infrastructure/docker-compose.yml up --build
    ```
    -   `--build` zajistí, že se obrazy postaví nanovo, pokud dojde ke změnám v `Dockerfile` nebo kódu.

4.  **Přístup k aplikaci:**
    -   **Frontend:** `http://localhost:3000`
    -   **Backend API:** `http://localhost:8000/api`
    -   **OpenAPI dokumentace:** `http://localhost:8000/api-docs` (po implementaci v NestJS)
    -   **Minio Console:** `http://localhost:9001` (přihlašovací údaje z `.env` souboru)

### Inicializace databáze:
Při prvním spuštění kontejneru `db` se automaticky aplikují všechny SQL skripty z adresáře `migrations/`. Následně se spustí skripty z adresáře `seed/` pro naplnění databáze ukázkovými daty.

---

## 3. Seznam klíčových artefaktů

-   `infrastructure/docker-compose.yml`: Definuje všechny služby a jejich konfiguraci.
-   `openapi.yaml`: Kompletní specifikace REST API.
-   `migrations/`: SQL skripty pro správu databázového schématu.
-   `frontend/`: Zdrojový kód Next.js aplikace.
-   `backend/`: Zdrojový kód NestJS aplikace.

## 4. Acceptance Criteria (MVP)

-   [ ] Uživatel úspěšně nahrál 3D model a do 60 s má základní odhad ceny.
-   [ ] Zákazník může vybrat tiskárnu ručně nebo zvolit autoassign a dokončit checkout (test mode Stripe).
-   [ ] Owner se může zaregistrovat, přidat tiskárnu, získat referral kód a vidět alespoň jednu dokončenou provizi v dashboardu.
-   [ ] Admin vidí objednávky a může manuálně přiřadit tiskárnu.
-   [ ] Dodány: OpenAPI, SQL migrace, docker-compose a README s přesnými kroky na spuštění dev prostředí.
-   [ ] Veškeré UI copy v CZ.
