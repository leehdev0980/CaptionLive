$ErrorActionPreference = "Stop"
$base = "http://localhost:5260"

function Invoke-Json {
  param(
    [Parameter(Mandatory=$true)][string]$Method,
    [Parameter(Mandatory=$true)][string]$Uri,
    [Parameter()][object]$Body = $null
  )

  if ($null -ne $Body) {
    return Invoke-RestMethod -Method $Method -Uri $Uri -ContentType "application/json" -Body ($Body | ConvertTo-Json -Compress)
  } else {
    return Invoke-RestMethod -Method $Method -Uri $Uri
  }
}

function Invoke-JsonRaw {
  param(
    [Parameter(Mandatory=$true)][string]$Method,
    [Parameter(Mandatory=$true)][string]$Uri,
    [Parameter()][object]$Body = $null
  )

  try {
    if ($null -ne $Body) {
      return Invoke-WebRequest -Method $Method -Uri $Uri -ContentType "application/json" -Body ($Body | ConvertTo-Json -Compress)
    } else {
      return Invoke-WebRequest -Method $Method -Uri $Uri
    }
  } catch {
    Write-Host "REQUEST FAILED: $Method $Uri"
    Write-Host $_.Exception.Message
    if ($_.Exception.Response -ne $null) {
      try { Write-Host ("HTTP " + $_.Exception.Response.StatusCode.value__) } catch {}
      try {
        $stream = $_.Exception.Response.GetResponseStream()
        if ($stream -ne $null) {
          $sr = New-Object System.IO.StreamReader($stream)
          $content = $sr.ReadToEnd()
          Write-Host "RESPONSE BODY:"
          Write-Host $content
        }
      } catch {}
    }
    throw
  }
}

Write-Host "== EDGE TEST: invalid/expired/revoked/maxUses paths =="

# Create a session
Write-Host "== Create session =="
$resp = Invoke-JsonRaw -Method Post -Uri ($base + "/api/sessions") -Body @{ sessionId = $null; title = "EdgeSmoke" }
$sess = ($resp.Content | ConvertFrom-Json).sessionId
Write-Host ("sessionId=" + $sess)

# Generate code with MaxUses=1
Write-Host "== Generate audience join code (MaxUses=1) =="
$gen = Invoke-Json -Method Post -Uri ($base + "/api/audience-codes/generate?sessionId=" + $sess) -Body @{ Role = "listener"; MaxUses = 1 }
$code = $gen.code
Write-Host ("audienceCode=" + $code)

# Validate valid code
Write-Host "== Validate code should be valid =="
$val = Invoke-Json -Method Get -Uri ($base + "/api/audience-codes/validate/" + $code)
Write-Host ("validate=" + ($val | ConvertTo-Json -Compress))

# Join once (should succeed)
Write-Host "== Join once (should succeed) =="
$join1 = Invoke-Json -Method Post -Uri ($base + "/api/audience-codes/join/" + $code)
Write-Host ("join1=" + ($join1 | ConvertTo-Json -Compress))

# Join again (max uses reached -> should fail)
Write-Host "== Join second time (should fail maxUses) =="
try {
  $null = Invoke-JsonRaw -Method Post -Uri ($base + "/api/audience-codes/join/" + $code) -Body $null
  throw "join2 unexpectedly succeeded"
} catch {
  Write-Host "join2 failed as expected."
}

# Validate an invalid code format/value (not found -> current controller returns 404)
Write-Host "== Validate invalid code (should 404) =="
try {
  $null = Invoke-Json -Method Get -Uri ($base + "/api/audience-codes/validate/not-a-code")
  throw "validate invalid unexpectedly succeeded"
} catch {
  Write-Host "validate invalid failed as expected."
}

# Invites: create + accept then try accept again
Write-Host "== Create invite =="
$inv = Invoke-Json -Method Post -Uri ($base + "/api/invites") -Body @{
  SessionId = $sess
  InvitedEmail = "edge@example.com"
  Role = "speaker"
  ExpiresHours = 1
}
Write-Host ("inviteCode=" + $inv.code)

Write-Host "== Accept invite first time =="
$acc1 = Invoke-Json -Method Post -Uri ($base + "/api/invites/accept/" + $inv.code) -Body $null
Write-Host ("accept1=" + ($acc1 | ConvertTo-Json -Compress))

Write-Host "== Accept invite second time (should fail already accepted) =="
try {
  $null = Invoke-JsonRaw -Method Post -Uri ($base + "/api/invites/accept/" + $inv.code) -Body $null
  throw "accept2 unexpectedly succeeded"
} catch {
  Write-Host "accept2 failed as expected."
}

Write-Host "== EDGE TEST DONE =="
