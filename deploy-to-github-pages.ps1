# Deploy to GitHub Pages Script
# This script copies all files from the frontEnd folder to the GitHub Pages repository

# ensure we are executing from the frontEnd directory
$frontEndPath = if ($PSScriptRoot) { $PSScriptRoot } else { Split-Path -Path $MyInvocation.MyCommand.Path -Parent }
if ((Get-Location).Path -ne $frontEndPath) {
    Set-Location -Path $frontEndPath
}

# Define source and destination paths
$sourcePath = Get-Location  # Current frontEnd directory
$destinationPath = "C:\Users\ninsh\FreelanceRepos\family_command_center\familycommandcenter.github.io"

# Define array of animal names for version identification
$animals = @(
    "Swift Fox", "Clever Crow", "Wise Owl", "Playful Otter", "Mighty Eagle", "Sly Fox", "Brave Lion", "Gentle Deer",
    "Curious Cat", "Loyal Dog", "Speedy Cheetah", "Majestic Tiger", "Graceful Swan", "Cunning Wolf", "Friendly Bear",
    "Dancing Flamingo", "Hopping Rabbit", "Soaring Hawk", "Swimming Dolphin", "Climbing Monkey", "Burrowing Badger",
    "Flying Bat", "Galloping Horse", "Prowling Panther", "Chattering Squirrel", "Blooming Butterfly", "Buzzing Bee",
    "Slithering Snake", "Leaping Frog", "Waddling Penguin", "Trumpeting Elephant", "Roaring Gorilla", "Spinning Spider",
    "Darting Dragonfly", "Grazing Zebra", "Hunting Shark", "Singing Nightingale", "Diving Pelican", "Running Gazelle",
    "Pouncing Leopard", "Floating Jellyfish", "Crawling Turtle", "Scurrying Mouse", "Pecking Woodpecker", "Strutting Peacock",
    "Gliding Albatross", "Barking Seal", "Howling Coyote", "Chasing Jackal", "Stalking Lynx", "Racing Antelope",
    "Camouflaged Chameleon", "Venomous Viper", "Armored Armadillo", "Prancing Antelope", "Munching Koala", "Winking Owl",
    "Grinning Hyena", "Sneaky Weasel", "Bashful Badger", "Proud Peacock", "Shy Chipmunk", "Bold Eagle", "Timid Mouse",
    "Fierce Falcon", "Calm Camel", "Witty Weasel", "Jolly Giraffe", "Merry Meerkat", "Noble Narwhal", "Quirky Quokka",
    "Radiant Raven", "Sassy Squirrel", "Tenacious Terrier", "Unique Unicorn", "Vivid Vixen", "Wild Wolf", "Xeric Xerus",
    "Youthful Yak", "Zealous Zebra", "Adventurous Aardvark", "Brilliant Bluebird", "Cheerful Chipmunk", "Daring Dingo",
    "Energetic Ermine", "Fabulous Ferret", "Glorious Goldfish", "Happy Hedgehog", "Incredible Iguana", "Jubilant Jackrabbit",
    "Kind Koala", "Lively Lemur", "Magnificent Moose", "Nifty Newt", "Optimistic Octopus", "Perky Parrot", "Quaint Quail",
    "Remarkable Raccoon", "Splendid Sparrow", "Terrific Toucan", "Ultimate Urchin", "Valiant Vole", "Wonderful Walrus",
    "Xtraordinary X-Ray Tetra", "Yawning Yeti", "Zesty Zebu"
)

# Generate deployment version/timestamp
$deployTime = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
$versionId = Get-Random -Minimum 1000 -Maximum 9999

# Try to read existing version file to get previous animal
$previousAnimal = $null
if (Test-Path "version.json") {
    try {
        $existingContent = Get-Content "version.json" -Raw | ConvertFrom-Json
        $previousAnimal = $existingContent.animal
    } catch {
        # If we can't read the existing file, just continue without a previous animal
        $previousAnimal = $null
    }
}

# Select a random animal that doesn't match the previous one
$availableAnimals = $animals | Where-Object { $_ -ne $previousAnimal }
$selectedAnimal = $availableAnimals[(Get-Random -Minimum 0 -Maximum $availableAnimals.Count)]

$versionInfo = @{
    version = "v2.$versionId"
    animal = $selectedAnimal
    deployedAt = $deployTime
    timestamp = [DateTime]::UtcNow.ToString("o")
} | ConvertTo-Json -Compress

$versionObj = $versionInfo | ConvertFrom-Json
Write-Host "Starting deployment to GitHub Pages..." -ForegroundColor Green
Write-Host "Source: $sourcePath" -ForegroundColor Cyan
Write-Host "Destination: $destinationPath" -ForegroundColor Cyan
Write-Host "Version: $($versionObj.version) - $($versionObj.animal)" -ForegroundColor Cyan

# Check if destination directory exists
if (-not (Test-Path $destinationPath)) {
    Write-Host "Error: Destination directory does not exist!" -ForegroundColor Red
    Write-Host "Please ensure the GitHub Pages repository is cloned to:" -ForegroundColor Yellow
    Write-Host "$destinationPath" -ForegroundColor Yellow
    exit 1
}

# Create version file in source directory
$versionFilePath = Join-Path $sourcePath "version.json"
$versionInfo | Out-File -FilePath $versionFilePath -Encoding UTF8

# Get all files and folders in the source directory (including the new version file)
$itemsToCopy = Get-ChildItem -Path $sourcePath -Exclude "deploy-to-github-pages.ps1"

Write-Host "Files and folders to copy:" -ForegroundColor Yellow
foreach ($item in $itemsToCopy) {
    Write-Host "  - $($item.Name)" -ForegroundColor Gray
}

# Copy each item to the destination
foreach ($item in $itemsToCopy) {
    $destination = Join-Path $destinationPath $item.Name
    
    try {
        if ($item.PSIsContainer) {
            # It's a directory - remove existing directory first to avoid nesting
            Write-Host "Copying directory: $($item.Name)..." -ForegroundColor Blue
            if (Test-Path $destination) {
                Write-Host "  Removing existing directory first..." -ForegroundColor Yellow
                Remove-Item -Path $destination -Recurse -Force
            }
            Copy-Item -Path $item.FullName -Destination $destination -Recurse -Force
        } else {
            # It's a file
            Write-Host "Copying file: $($item.Name)..." -ForegroundColor Blue
            Copy-Item -Path $item.FullName -Destination $destination -Force
        }
        Write-Host "  Success" -ForegroundColor Green
    }
    catch {
        Write-Host "  Error copying $($item.Name): $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "Deployment completed!" -ForegroundColor Green

# open a new terminal at the GitHub Pages repo and run git commands
Write-Host "Opening a new terminal for GitHub Pages repo and running git add/commit/push..." -ForegroundColor Yellow
$ghPagesCommands = "cd '$destinationPath'; git add .; git commit -m 'update'; git push"
Start-Process -FilePath "powershell.exe" -ArgumentList @("-NoExit", "-Command", $ghPagesCommands) | Out-Null

# check for changes outside the frontEnd directory in the project root and deploy backend if needed
$projectRoot = Split-Path -Path $frontEndPath -Parent

Write-Host "Checking for backend changes in project root..." -ForegroundColor Cyan

# First, commit any pending changes in the main repository
try {
    $gitStatusBefore = git -C $projectRoot status --porcelain 2>$null
    if ($gitStatusBefore) {
        Write-Host "Committing pending changes in main repository..." -ForegroundColor Yellow
        git -C $projectRoot add .
        git -C $projectRoot commit -m "Auto-commit before deployment: $deployTime"
        Write-Host "Changes committed to main repository" -ForegroundColor Green
    } else {
        Write-Host "No pending changes in main repository" -ForegroundColor Gray
    }
} catch {
    Write-Host "Warning: Could not commit changes to main repository: $($_.Exception.Message)" -ForegroundColor Yellow
}

$gitStatus = git -C $projectRoot status --porcelain 2>$null

$hasChangesOutsideFrontEnd = $false
foreach ($line in $gitStatus) {
    if (-not $line) { continue }
    if ($line.Length -lt 4) { continue }
    $path = $line.Substring(3)
    $normalized = $path -replace "\\", "/"
    # Skip frontEnd directory and all its contents
    if ($normalized -like "frontEnd*" -or $normalized -eq "frontEnd") { continue }
    # Skip version.json file that gets created during deployment
    if ($normalized -eq "version.json") { continue }
    $hasChangesOutsideFrontEnd = $true
    break
}

if ($hasChangesOutsideFrontEnd) {
    Write-Host "Detected changes outside 'frontEnd'. Deploying backend with Serverless..." -ForegroundColor Yellow
    $previousLocation = Get-Location
    Set-Location -Path $projectRoot
    try {
        Write-Host "Running serverless deploy..." -ForegroundColor Cyan
        npx --yes serverless deploy
        Write-Host "Backend deployment completed successfully" -ForegroundColor Green
    }
    catch {
        Write-Host "Serverless deploy failed: $($_.Exception.Message)" -ForegroundColor Red
    }
    finally {
        Set-Location -Path $frontEndPath
    }
} else {
    Write-Host "No changes detected outside 'frontEnd'. Skipping backend deploy." -ForegroundColor Gray
}
