# Définir le répertoire racine du projet Next.js (modifiez si nécessaire)
$rootDir = Get-Location  # Changez ceci si le projet est ailleurs
$appDir = "$rootDir\app"

# Vérifier si le dossier 'app' existe
if (-Not (Test-Path $appDir)) {
    Write-Host "Erreur: Le dossier 'app' est introuvable dans $rootDir" -ForegroundColor Red
    exit
}

# Fonction pour récupérer les routes Next.js
function Get-NextJsRoutes {
    param (
        [string]$directory,
        [string]$basePath = "/"
    )

    # Récupérer les fichiers et dossiers du répertoire actuel
    $items = Get-ChildItem -Path $directory

    foreach ($item in $items) {
        # Ignorer certains dossiers
        if ($item.Name -match '^(\.\w+|node_modules|public|dist|out)$') {
            continue
        }

        $relativePath = "$basePath$($item.Name)"

        # Si c'est un dossier, rechercher récursivement
        if ($item.PSIsContainer) {
            # Gérer les routes dynamiques comme [id] -> :id
            if ($item.Name -match '^\[(.+)\]$') {
                $paramName = $item.Name -replace '\[|\]', ':'
                $relativePath = "$basePath$paramName"
            }
            Get-NextJsRoutes -directory $item.FullName -basePath "$relativePath/"
        }
        else {
            # Vérifier si c'est une route API ou page (App Router)
            if ($item.Name -match '^(page|route)\.(js|ts|jsx|tsx)$') {
                # Nettoyer le chemin pour retirer "page.js" ou "route.ts"
                $cleanedPath = $relativePath -replace '(\/page|\/route)\.\w+$', '/'
                Write-Host "$cleanedPath" -ForegroundColor Green
            }
        }
    }
}

# Affichage des routes trouvées
Write-Host "`n📌 Scan des routes Next.js App Router dans: $appDir`n" -ForegroundColor Cyan
Get-NextJsRoutes -directory $appDir
Write-Host "`nScan terminé avec succès !" -ForegroundColor Yellow
