# UC E2E test runner — verify all endpoints in each module
$base = "http://localhost:4001/api/v1"

# Login
$login = Invoke-RestMethod -Uri "$base/auth/login" -Method POST -ContentType "application/json" -Body '{"email":"admin@demo.local","password":"Password123!"}'
if (-not $login.success) { Write-Host "LOGIN FAILED: $($login.message)"; exit 1 }
$token = $login.data.token
$h = @{ "Authorization" = "Bearer $token"; "Content-Type" = "application/json" }

$results = @()
$errors = 0

function Test-Endpoint {
    param(
        [string]$Name,
        [string]$Method,
        [string]$Path,
        [hashtable]$Headers = $h,
        [string]$Body = $null
    )
    try {
        $args = @{
            Uri = "$base$Path"
            Method = $Method
            Headers = $Headers
            UseBasicParsing = $true
            TimeoutSec = 30
            ErrorAction = "Stop"
        }
        if ($Body) { $args.Body = $Body }
        $r = Invoke-WebRequest @args
        $code = $r.StatusCode
        $status = if ($code -ge 200 -and $code -lt 300) { "OK" } else { "FAIL" }
        "{0,-50} {1,-7} {2,-4}" -f $Name, $Method, $code
    } catch {
        $resp = $_.Exception.Response
        $code = if ($resp) { [int]$resp.StatusCode } else { "ERR" }
        $body = ""
        try {
            $stream = $_.Exception.Response.GetResponseStream()
            $reader = New-Object System.IO.StreamReader($stream)
            $body = $reader.ReadToEnd()
        } catch {}
        "{0,-50} {1,-7} {2,-4} (body={3})" -f $Name, $Method, $code, ($body.Substring(0, [Math]::Min(120, $body.Length)))
    }
}

Write-Host "`n===== 1. AUTH UC =====" -ForegroundColor Cyan
Test-Endpoint "UC-AUTH-01: login"                "POST" "/auth/login"                   @{ "Content-Type" = "application/json" } '{"email":"admin@demo.local","password":"Password123!"}'
Test-Endpoint "UC-AUTH-02: login wrong pass"     "POST" "/auth/login"                   @{ "Content-Type" = "application/json" } '{"email":"admin@demo.local","password":"Wrong"}'
Test-Endpoint "UC-AUTH-03: refresh token"        "POST" "/auth/refresh"                 @{ "Content-Type" = "application/json" } "{\"refreshToken\":\"$($login.data.refreshToken)\"}"
Test-Endpoint "UC-AUTH-04: logout"               "POST" "/auth/logout"                  @{ "Content-Type" = "application/json" } "{\"refreshToken\":\"$($login.data.refreshToken)\"}"
# Re-login after logout
$login = Invoke-RestMethod -Uri "$base/auth/login" -Method POST -ContentType "application/json" -Body '{"email":"admin@demo.local","password":"Password123!"}'
$token = $login.data.token
$h = @{ "Authorization" = "Bearer $token"; "Content-Type" = "application/json" }
Test-Endpoint "UC-AUTH-05: list sessions"        "GET"  "/auth/sessions"
Test-Endpoint "UC-AUTH-06: sessions/list"         "POST" "/auth/sessions/list"

Write-Host "`n===== 2. CUSTOMERS + CONTACTS UC =====" -ForegroundColor Cyan
$customers = (Invoke-RestMethod -Uri "$base/customers" -Headers $h -UseBasicParsing).data
$custId = $customers[0].id
Test-Endpoint "UC-CUST-01: list customers"        "GET"    "/customers"
Test-Endpoint "UC-CUST-02: list paginated"        "GET"    "/customers?page=1&pageSize=5"
Test-Endpoint "UC-CUST-03: get detail"            "GET"    "/customers/$custId"
Test-Endpoint "UC-CUST-04: search by name"        "GET"    "/customers?search=VTX"
$newCust = @{ name = "UC-Test-Cust"; shortName = "UCT"; taxCode = "999999999" } | ConvertTo-Json
$r = Invoke-WebRequest -Uri "$base/customers" -Method POST -Headers $h -Body $newCust -UseBasicParsing
$newCustId = (Invoke-RestMethod -Uri "$base/customers/$($r.Content | ConvertFrom-Json).data?._id" -UseBasicParsing -Headers $h -ErrorAction SilentlyContinue)
$created = Invoke-RestMethod -Uri "$base/customers" -Method POST -Headers $h -Body $newCust -UseBasicParsing
$crCustId = $created.data.id
Test-Endpoint "UC-CUST-05: create"               "POST"   "/customers" @{ "Content-Type" = "application/json" } $newCust
Test-Endpoint "UC-CUST-06: update"               "PUT"    "/customers/$crCustId"         @{ "Content-Type" = "application/json" } '{"shortName":"UPD"}'
Test-Endpoint "UC-CUST-07: delete"               "DELETE" "/customers/$crCustId"
Test-Endpoint "UC-CONT-01: list contacts"        "GET"    "/contacts"
Test-Endpoint "UC-CONT-02: get contact by cust"   "GET"    "/contacts?customerId=$custId"

Write-Host "`n===== 3. CONTRACTS UC =====" -ForegroundColor Cyan
Test-Endpoint "UC-CTT-01: list"                  "GET"    "/contracts"
Test-Endpoint "UC-CTT-02: list with filter"       "GET"    "/contracts?status=draft"
$contracts = (Invoke-RestMethod -Uri "$base/contracts" -Headers $h -UseBasicParsing).data
Test-Endpoint "UC-CTT-03: get detail"            "GET"    "/contracts/$($contracts[0].id)"
$newContract = @{ customerId = $custId; title = "UC-Contract"; value = 5000000; startDate = "2026-07-01"; endDate = "2026-12-31"; status = "draft" } | ConvertTo-Json
$r = Invoke-WebRequest -Uri "$base/contracts" -Method POST -Headers $h -Body $newContract -UseBasicParsing
$newContractId = (($r.Content | ConvertFrom-Json).data.id)
Test-Endpoint "UC-CTT-04: create"                "POST"   "/contracts" @{ "Content-Type" = "application/json" } $newContract
Test-Endpoint "UC-CTT-05: update"                "PUT"    "/contracts/$newContractId" @{ "Content-Type" = "application/json" } '{"title":"UC-Contract-Updated"}'
Test-Endpoint "UC-CTT-06: change status"         "PATCH"  "/contracts/$newContractId/status" @{ "Content-Type" = "application/json" } '{"status":"signed"}'
Test-Endpoint "UC-CTT-07: get products"          "GET"    "/contracts/$newContractId/products"
Test-Endpoint "UC-CLAUSE-01: list clauses"       "GET"    "/contract-clauses"
Test-Endpoint "UC-CLAUSE-02: list groups"        "GET"    "/contract-clause-groups"
Test-Endpoint "UC-CTT-08: delete contract"       "DELETE" "/contracts/$newContractId"

Write-Host "`n===== 4. HANDOVER + WARRANTY UC =====" -ForegroundColor Cyan
Test-Endpoint "UC-HO-01: list"                   "GET"    "/handovers"
$hoBody = @{ contractId = $contracts[0].id; handoverDate = "2026-07-15"; receiverName = "Receiver UCT"; status = "draft" } | ConvertTo-Json
Test-Endpoint "UC-HO-02: list with filter"       "GET"    "/handovers?status=draft"
Test-Endpoint "UC-WAR-01: list warranties"       "GET"    "/warranties"
Test-Endpoint "UC-WAR-02: filter by status"      "GET"    "/warranties?status=active"
Test-Endpoint "UC-WAR-03: filter expired"        "GET"    "/warranties?status=expired"

Write-Host "`n===== 5. MATERIALS + PRODUCTS + TASKS UC =====" -ForegroundColor Cyan
Test-Endpoint "UC-MAT-01: list materials"        "GET"    "/materials"
Test-Endpoint "UC-MAT-02: list paginated"        "GET"    "/materials?page=1&pageSize=3"
Test-Endpoint "UC-MAT-03: low-stock"             "GET"    "/materials?lowStock=true"
Test-Endpoint "UC-MAT-04: list transfers"        "GET"    "/materials/transfers"
Test-Endpoint "UC-PROD-01: list products"        "GET"    "/products"
$products = (Invoke-RestMethod -Uri "$base/products" -Headers $h -UseBasicParsing).data
Test-Endpoint "UC-PROD-02: get detail"           "GET"    "/products/$($products[0].id)"
Test-Endpoint "UC-PROD-03: search by code"       "GET"    "/products?search=$($products[0].code)"
Test-Endpoint "UC-TASK-01: list tasks"           "GET"    "/tasks"
Test-Endpoint "UC-TASK-02: filter my tasks"      "GET"    "/tasks?assignee=me"
Test-Endpoint "UC-RP-01: list research"          "GET"    "/research-projects"

Write-Host "`n===== 6. TRAINING + DOCUMENTS + REPORTS UC =====" -ForegroundColor Cyan
Test-Endpoint "UC-TR-01: list courses"           "GET"    "/training"
Test-Endpoint "UC-TR-02: alias training-courses" "GET"    "/training-courses"
Test-Endpoint "UC-DOC-01: list documents"        "GET"    "/documents"
Test-Endpoint "UC-DOC-02: by category"           "GET"    "/documents?category=contract"
Test-Endpoint "UC-RPT-01: badges"                "GET"    "/reports/badges"
Test-Endpoint "UC-RPT-02: dashboard summary"     "GET"    "/reports/dashboard-summary"
Test-Endpoint "UC-RPT-03: by product line"       "GET"    "/reports/by-product-line"
Test-Endpoint "UC-RPT-04: feedback by customer"  "GET"    "/reports/feedback/by-customer"
Test-Endpoint "UC-RPT-05: material defects"      "GET"    "/reports/material-defects"

Write-Host "`n===== 7. CRM + FEEDBACKS + EXECUTION UNITS UC =====" -ForegroundColor Cyan
Test-Endpoint "UC-CRM-01: list activities"       "GET"    "/crm-activities"
Test-Endpoint "UC-CRM-02: filter by customer"    "GET"    "/crm-activities?customerId=$custId"
Test-Endpoint "UC-FB-01: list feedbacks"         "GET"    "/customer-feedbacks"
Test-Endpoint "UC-FB-02: summary"                "GET"    "/customer-feedbacks/summary"
Test-Endpoint "UC-FB-03: linkage options"        "GET"    "/customer-feedbacks/linkage-options"
Test-Endpoint "UC-FB-04: routing preview"        "GET"    "/customer-feedbacks/routing-preview"
Test-Endpoint "UC-FB-05: analytics by-customer"   "GET"    "/customer-feedbacks/analytics/by-customer"
Test-Endpoint "UC-FB-06: analytics by-product"   "GET"    "/customer-feedbacks/analytics/by-product"
Test-Endpoint "UC-FB-07: analytics by-material"  "GET"    "/customer-feedbacks/analytics/by-material"
Test-Endpoint "UC-FE-01: list execution units"   "GET"    "/feedback-execution-units"
Test-Endpoint "UC-FE-02: routing rules"          "GET"    "/feedback-execution-units/routing-rules/list"

Write-Host "`n===== 8. WORKFLOWS + WF DOCUMENTS UC =====" -ForegroundColor Cyan
Test-Endpoint "UC-WF-01: list"                   "GET"    "/workflows"
Test-Endpoint "UC-WF-02: list instances"         "GET"    "/workflows/instances"
Test-Endpoint "UC-WF-IN-01: list instances root" "GET"    "/workflow-instances"
Test-Endpoint "UC-ANN-01: anniversary subs"      "GET"    "/anniversary-subscriptions"
Test-Endpoint "UC-ANN-02: customer-anniversaries" "GET"   "/customer-anniversaries"

Write-Host "`n===== 9. NOTIFICATIONS + PREFERENCES + ANNIVERSARIES UC =====" -ForegroundColor Cyan
Test-Endpoint "UC-NOT-01: list notif"            "GET"    "/notifications"
Test-Endpoint "UC-NOT-02: unread count"          "GET"    "/notifications/unread-count"
Test-Endpoint "UC-NOT-03: mark all read"         "POST"   "/notifications/read-all"
Test-Endpoint "UC-NP-01: get prefs"              "GET"    "/notification-preferences"
Test-Endpoint "UC-NP-02: update prefs"           "PUT"    "/notification-preferences" @{ "Content-Type" = "application/json" } '{"emailEnabled":true,"inAppEnabled":true}'

Write-Host "`n===== 10. ADMIN: USERS + ROLES + AUDIT-LOGS + SETTINGS + DEFINITIONS UC =====" -ForegroundColor Cyan
Test-Endpoint "UC-USR-01: list users"            "GET"    "/users"
Test-Endpoint "UC-USR-02: get by id"             "GET"    "/users/$($login.data.user.id)"
Test-Endpoint "UC-USR-03: create user"           "POST"   "/users" @{ "Content-Type" = "application/json" } '{"email":"uct@demo.local","password":"Password123!","fullName":"UC Test","role":"viewer"}'
$users = (Invoke-RestMethod -Uri "$base/users" -Headers $h -UseBasicParsing).data
$viewUser = $users | Where-Object { $_.email -eq "uct@demo.local" } | Select-Object -First 1
if ($viewUser) {
    Test-Endpoint "UC-USR-04: update user"       "PUT"    "/users/$($viewUser.id)" @{ "Content-Type" = "application/json" } '{"fullName":"UC Test Updated"}'
    Test-Endpoint "UC-USR-05: delete user"       "DELETE" "/users/$($viewUser.id)"
}
Test-Endpoint "UC-ROLE-01: list roles"           "GET"    "/roles"
Test-Endpoint "UC-ROLE-02: get role admin"       "GET"    "/roles/admin"
Test-Endpoint "UC-AUD-01: audit logs"            "GET"    "/audit-logs"
Test-Endpoint "UC-AUD-02: audit by user"         "GET"    "/audit-logs?actorId=$($login.data.user.id)"
Test-Endpoint "UC-SS-01: list settings"          "GET"    "/system-settings"
Test-Endpoint "UC-SS-02: update setting"         "PUT"    "/system-settings" @{ "Content-Type" = "application/json" } '{"key":"test_key","value":"test_val","type":"string"}'
Test-Endpoint "UC-DEF-01: list definitions"      "GET"    "/definitions"
Test-Endpoint "UC-DEF-02: def by category"       "GET"    "/definitions?category=customer_type"
Test-Endpoint "UC-RP-02: list role perms"        "GET"    "/role-permissions"

Write-Host "`n===== DONE =====" -ForegroundColor Cyan
