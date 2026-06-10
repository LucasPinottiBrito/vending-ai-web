$baseUrl = "http://localhost:4000/api"
$adminEmail = "admin@example.com"
$adminPassword = "Admin@123"
$userEmail = "cliente@example.com"
$userPassword = "Cliente@123"

Write-Host "--- Starting Full Validation (PowerShell) ---" -ForegroundColor Cyan

try {
    # 1. Auth: Login Admin
    Write-Host "`n[1] Testing Admin Auth..."
    $loginAdmin = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body (@{
        email = $adminEmail
        password = $adminPassword
    } | ConvertTo-Json) -ContentType "application/json"
    
    $adminToken = $loginAdmin.data.token
    $adminHeaders = @{ Authorization = "Bearer $adminToken" }
    Write-Host "Admin logged in."

    # 2. CRUD: Create Product
    Write-Host "`n[2] Testing Product Creation..."
    $productRes = Invoke-RestMethod -Uri "$baseUrl/products" -Method Post -Headers $adminHeaders -Body (@{
        sku = "SKU-$(Get-Random)"
        name = "Test Drink"
        price_cents = 500
        category = "Drinks"
        is_active = $true
    } | ConvertTo-Json) -ContentType "application/json"
    $productId = $productRes.data.product.id
    Write-Host "Product created: ID $productId"

    # 3. CRUD: Create Machine
    Write-Host "`n[3] Testing Machine Creation..."
    $machineSlug = "mac-$(Get-Random)"
    $machineRes = Invoke-RestMethod -Uri "$baseUrl/machines" -Method Post -Headers $adminHeaders -Body (@{
        name = "Test Machine"
        slug = $machineSlug
        location = "Test Lab"
        status = "ONLINE"
    } | ConvertTo-Json) -ContentType "application/json"
    $machineId = $machineRes.data.machine.id
    Write-Host "Machine created: ID $machineId, Slug $machineSlug"

    # 4. CRUD: Create Slot
    Write-Host "`n[4] Testing Slot Creation..."
    $slotRes = Invoke-RestMethod -Uri "$baseUrl/machines/$machineId/slots" -Method Post -Headers $adminHeaders -Body (@{
        code = "A1"
        motor_id = 1
        sensor_column_id = 1
        is_enabled = $true
    } | ConvertTo-Json) -ContentType "application/json"
    $slotId = $slotRes.data.slot.id
    Write-Host "Slot created: ID $slotId"

    # 5. Inventory: Adjust Stock
    Write-Host "`n[5] Testing Inventory Adjustment..."
    $invRes = Invoke-RestMethod -Uri "$baseUrl/inventory" -Method Post -Headers $adminHeaders -Body (@{
        machine_id = $machineId
        slot_id = $slotId
        product_id = $productId
        quantity_available = 10
        min_quantity_alert = 2
    } | ConvertTo-Json) -ContentType "application/json"
    $inventoryId = $invRes.data.inventory.id
    Write-Host "Inventory created: ID $inventoryId"

    # 6. Public: View Catalog
    Write-Host "`n[6] Testing Public Catalog..."
    $catalog = Invoke-RestMethod -Uri "$baseUrl/machines/slug/$machineSlug/catalog" -Method Get
    if ($catalog.data.items.Count -gt 0) {
        Write-Host "Catalog retrieved successfully. Items: $($catalog.data.items.Count)"
    } else {
        throw "Catalog is empty"
    }

    # 7. Auth: Login User
    Write-Host "`n[7] Testing User Auth..."
    $loginUser = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body (@{
        email = $userEmail
        password = $userPassword
    } | ConvertTo-Json) -ContentType "application/json"
    
    $userToken = $loginUser.data.token
    $userHeaders = @{ Authorization = "Bearer $userToken" }
    Write-Host "User logged in."

    # 8. Wallet: Recharge Balance (Mock)
    Write-Host "`n[8] Testing Wallet Topup..."
    $topup = Invoke-RestMethod -Uri "$baseUrl/wallet/topup/mock" -Method Post -Headers $userHeaders -Body (@{
        amount_cents = 2000
    } | ConvertTo-Json) -ContentType "application/json"
    $paymentId = $topup.data.payment.id
    Invoke-RestMethod -Uri "$baseUrl/payments/$paymentId/confirm-mock" -Method Post -Headers $userHeaders
    $balance = Invoke-RestMethod -Uri "$baseUrl/wallet/balance" -Method Get -Headers $userHeaders
    Write-Host "Wallet recharged. Current balance: $($balance.data.wallet.balance_cents)"

    # 9. Checkout: Buy Product
    Write-Host "`n[9] Testing Checkout..."
    $checkout = Invoke-RestMethod -Uri "$baseUrl/sales/checkout" -Method Post -Headers $userHeaders -Body (@{
        machine_id = $machineId
        slot_id = $slotId
        product_id = $productId
    } | ConvertTo-Json) -ContentType "application/json"
    $saleId = $checkout.data.sale.id
    Write-Host "Checkout successful: Sale ID $saleId"

    # 10. Status: Check Sale Status
    Write-Host "`n[10] Testing Sale Status..."
    $status = Invoke-RestMethod -Uri "$baseUrl/sales/$saleId" -Method Get -Headers $userHeaders
    Write-Host "Current status: $($status.data.sale.status)"

    # 11. Reports: Generate Report Data
    Write-Host "`n[11] Testing Report Data..."
    $report = Invoke-RestMethod -Uri "$baseUrl/admin/reports/sales" -Method Get -Headers $adminHeaders
    Write-Host "Report data retrieved. Sales count: $($report.data.report.summary.sales_count)"

    # 12. Charts: Get Chart Data
    Write-Host "`n[12] Testing Chart Data..."
    $chart = Invoke-RestMethod -Uri "$baseUrl/admin/charts/sales-by-month?year=2026" -Method Get -Headers $adminHeaders
    Write-Host "Chart labels count: $($chart.data.chart.labels.Count)"

    # 13. Export: JSON
    Write-Host "`n[13] Testing JSON Export..."
    $exportJson = Invoke-RestMethod -Uri "$baseUrl/admin/export/json?entity=products" -Method Get -Headers $adminHeaders
    Write-Host "JSON Export successful. Records: $($exportJson.data.export.records.Count)"

    # 14. Export: XML Logs
    Write-Host "`n[14] Testing XML Log Export..."
    $exportXml = Invoke-WebRequest -Uri "$baseUrl/admin/logs/export/xml" -Method Get -Headers $adminHeaders
    if ($exportXml.Content -like "*<?xml*") {
        Write-Host "XML Export successful."
    } else {
        throw "Invalid XML response"
    }

    Write-Host "`n--- ALL INTEGRATION TESTS PASSED ---" -ForegroundColor Green
} catch {
    Write-Host "`n--- INTEGRATION TEST FAILED ---" -ForegroundColor Red
    Write-Host "Error: $_"
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $body = $reader.ReadToEnd()
        Write-Host "Response Body: $body"
    }
    exit 1
}
