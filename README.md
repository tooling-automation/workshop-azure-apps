# Azure Web Apps Workshop

## Introduction
Het doel van deze workshop is om een web app, function app en static web app te deployen naar Azure.
De web app zal een fun fact ophalen van de function app en deze tonen.
De static web app zal de function app aanroepen en de fun fact tonen.

### Function App

Eerst maken we een function app aan waarin we een HTTP trigger aanmaken die een fun fact teruggeeft.

Alle onderstaande commando's kan je terugvinden in: https://learn.microsoft.com/en-us/azure/azure-functions/create-first-function-cli-node?tabs=linux%2Cazure-cli%2Cbrowser&pivots=nodejs-model-v4

Open een nieuwe terminal en ga naar de functionapp folder.

Initialiseer een function app met de volgende commando's:
```bash
cd functionapp
func init --javascript 
```

Maak een HTTP trigger aan met het volgende commando:
```bash
func new --name funfact --template "HTTP trigger" --authlevel "anonymous"
```

Zorg ervoor dat de HTTP jouw favoriete funfact teruggeeft. Bijvoorbeeld:

```javascript
return {
  jsonBody: {
    funFact: "Did you know that the first computer virus was created in 1983?",
  }
}
```

Draai de function app met het volgende commando:
```bash
func start
```

Test de function app door in je browser naar `http://localhost:7071/api/funfact` te gaan.

### Static Web App

Nu we de function app hebben gedeployed, gaan we een static web app aanmaken die de function app aanroept.

Onderstaande commands kan je terugvinden in: https://azure.github.io/static-web-apps-cli/docs/use/install

Open een nieuwe terminal en ga naar de staticwebapp folder.

Zorg dat je in de root van de staticwebapp folder zit en voer de volgende commando's uit:

```bash
cd staticwebapp
npm install -g @azure/static-web-apps-cli
```

Validatie van de installatie:

```bash
swa --version
```

Zorg dat 
Voor het lokaal draaien van de static web app geef je de URL van de function app mee.
De SWA cli zal dan automatisch een proxy aanmaken zodat de static web app de function app kan aanroepen.

```bash
swa start src --api-devserver-url http://localhost:7071
```

Klik op de knop "Get Fun Fact from Function App" en je zou de fun fact moeten zien.

De volgende stap is om een zelfde API op te zetten in de vorm van een Azure Web App.

### Web App

Open een nieuwe terminal en ga naar de webapp folder.

Run de web app lokaal:

```bash
cd webapp
npm install
node app.js
```

Ga in je browser naar `http://localhost:3000/api/funfact` en je zou een nieuwe fun fact moeten zien.

Ga naar je function app en open het bestand local.settings.json. Voeg de volgende key-value pair toe:

```json
{
  "IsEncrypted": false,
  "Values": {
    "FUNCTIONS_WORKER_RUNTIME": "node",
    "AzureWebJobsFeatureFlags": "EnableWorkerIndexing",
    "AzureWebJobsStorage": "",
    "FUNFACT_WEBAPP_API_URL": "http://localhost:3000"
  }
}
```

Maak nu een nieuwe http trigger aan in de function app die de web app aanroept:

```bash
func new --name funfactwa --template "HTTP trigger" --authlevel "anonymous"
```

De http trigger zou er als volgt uit kunnen zien:

```javascript
const { app } = require('@azure/functions')

app.http('funfactwa', {
  methods: ['GET'],
  authLevel: 'anonymous',
  handler: async (request, context) => {
    context.log(`Http function processed request for url "${request.url}"`)

    const response = await fetch(`${process.env.FUNFACT_WEBAPP_API_URL}/api/funfact`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      return {
        status: response.status,
        body: {
          message: 'Failed to fetch fun fact from web app'
        }
      }
    }

    const responseBody = await response.json()

    return {
      jsonBody: {
        funfact: responseBody.funfact
      }
    }
  }
})
```

Herstart de function app:

```bash
func start
```

Ga nu in je browser naar je static web app en klik op de knop "Get Fun Fact from Web App". Je zou nu de fun fact van de web app moeten zien.

Nu gaan we het geheel deployen naar Azure.

Definieer eerst een aantal environment variabelen zodat je deze kan hergebruiken.

```bash
az login

export RESOURCE_GROUP_NAME=rg-workshop-<jouw-ruisnaam>
export STORAGE_NAME=stworkshop<jouw-ruisnaam>
export FUNCTION_APP_NAME=fn-workshop-<jouw-ruisnaam>
export STATIC_WEB_APP_NAME=swa-workshop-<jouw-ruisnaam>
export WEB_APP_NAME=wa-workshop-<jouw-ruisnaam>
```

Maak een nieuwe Resource Group aan:

```bash
az group create --name $RESOURCE_GROUP_NAME --location westeurope
```

Maak een general-purpose storage account aan:

```bash
az storage account create --name $STORAGE_NAME --location westeurope --resource-group $RESOURCE_GROUP_NAME --sku Standard_LRS --allow-blob-public-access false
```

Creeer een Static Web App in Azure:

```bash
az staticwebapp create \
    --name $STATIC_WEB_APP_NAME \
    --resource-group $RESOURCE_GROUP_NAME \
    --location westeurope
```

Upgrade to Standard Plan:

```bash
az staticwebapp update --name $STATIC_WEB_APP_NAME --resource-group $RESOURCE_GROUP_NAME --sku Standard
```

Haal de url op van de static web app:

```bash
az staticwebapp show --name $STATIC_WEB_APP_NAME --resource-group $RESOURCE_GROUP_NAME --query "defaultHostname" -o tsv
```

Ga in je browser naar de url die je hebt opgehaald en verifieer dat de static web app werkt.

Deploy de static web app naar Azure:

```bash
cd staticwebapp
swa deploy ./src --env production --app-name $STATIC_WEB_APP_NAME
```

Link de static web app aan de function app: https://learn.microsoft.com/en-us/azure/static-web-apps/functions-bring-your-own#link-an-existing-azure-functions-app

Azure portal > Static Web App > APIs -> Link de Function app aan de Production environment

Verifieer dat de static web app de function app aanroept door op de knop "Get Fun Fact from Function App" te klikken.

Je zou nu het bericht "No fun fact found" moeten zien.

We gaan eerst de function app deployen naar Azure.

Maak de functie app in Azure aan:

```bash
az functionapp create --resource-group $RESOURCE_GROUP_NAME --consumption-plan-location westeurope --runtime node --runtime-version 20 --functions-version 4 --name $FUNCTION_APP_NAME --storage-account $STORAGE_NAME --os-type Linux
```

Deploy de function app naar Azure:

```bash
cd functionapp
func azure functionapp publish $FUNCTION_APP_NAME
```

Kopieer de URL die je krijgt als output van de publish commando en plak deze in je browser. Je zou dezelfde output moeten zien als wanneer je de function lokaal draait.

Voeg de environment variable `FUNFACT_WEBAPP_API_URL` toe aan de function app, zodat de function app de web app kan aanroepen:

```bash
az functionapp config appsettings set --name $FUNCTION_APP_NAME --resource-group $RESOURCE_GROUP_NAME --settings FUNFACT_WEBAPP_API_URL="https://$WEB_APP_NAME.azurewebsites.net"
```

Herstart de function app:

```bash
az functionapp restart --name $FUNCTION_APP_NAME --resource-group $RESOURCE_GROUP_NAME
```

Deploy de web app naar Azure met de volgende commando's:

```bash
cd webapp 
az webapp up --sku F1 --name $WEB_APP_NAME --location westeurope --resource-group $RESOURCE_GROUP_NAME
```
