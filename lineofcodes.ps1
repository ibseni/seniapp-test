$directory = Get-Location  # Current directory (change if needed)
$extensions = @("*.ts", "*.tsx")  # File extensions to count
$excludeDirs = "node_modules|\.next|public|dist|out|coverage|\.turbo"  # Regex pattern for directories to exclude
$excludeFiles = "\.d\.ts$"  # Regex to exclude .d.ts files

# Get all matching files, excluding unwanted directories
$files = Get-ChildItem -Path $directory -Recurse -Include $extensions -ErrorAction SilentlyContinue |
    Where-Object { 
        $_.FullName -notmatch $excludeDirs -and
        $_.FullName -notmatch $excludeFiles
    }

$totalLines = 0
$results = @()

foreach ($file in $files) {
    try {
        if (Test-Path $file.FullName) {  # Ensure file exists
            $lineCount = (Get-Content $file.FullName -ErrorAction Stop | Measure-Object -Line).Lines
            $totalLines += $lineCount
            $results += [PSCustomObject]@{
                File = $file.FullName
                Lines = $lineCount
            }
        }
    } catch {
        Write-Host "Skipping unreadable file: $($file.FullName)" -ForegroundColor Yellow
    }
}

# Output results
$results | Sort-Object -Property Lines -Descending | Format-Table -AutoSize

Write-Host "`nTotal Lines of Code: $totalLines" -ForegroundColor Green
