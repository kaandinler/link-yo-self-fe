try {
    npm run lint:fix:quiet
} catch {
    Write-Host "Ignoring ESLint errors"
}
