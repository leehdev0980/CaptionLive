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
      $resp = $_.Exception.Response
      try {
        Write-Host ("HTTP " + $resp.StatusCode)
      } catch {}

      try {
        $stream = $resp.GetResponseStream()
        if ($stream -ne $null) {
          $sr = New-Object System.IO.StreamReader($stream)
          $content = $sr.ReadToEnd()
          Write-Host "RESPONSE BODY:"
          Write-Host $content
        }
      } catch {
        Write-Host "Could not read response stream: $($_.Exception.Message)"
      }
    }

    throw
  }
}

Write-Host "== STEP 1: Create session =="
$createdSession = $null
$sessionPayloads = @(
  @{ sessionId = $null; title = "Smoke Session" },
  @{ sessionId = [guid]::Empty; title = "Smoke Session" },
  @{ SessionId = $null; Title = "Smoke Session" },
  @{ SessionId = [guid]::Empty; Title = "Smoke Session" }
)

foreach ($p in $sessionPayloads) {
  Write-Host ("Trying payload: " + ($p | ConvertTo-Json -Compress))
  try {
    $resp = Invoke-JsonRaw -Method Post -Uri ($base + "/api/sessions") -Body $p
    $createdSession = ($resp.Content | ConvertFrom-Json)
    break
  } catch {
    # keep trying
  }
}

if ($null -eq $createdSession) {
  throw "Failed to create session via POST /api/sessions with all payload variants."
}

$sessionId = $createdSession.sessionId
Write-Host ("Created sessionId=" + $sessionId)

Write-Host "== STEP 2: Generate audience join code =="
$genReq = @{ Role = "listener"; MaxUses = 2 }
$gen = Invoke-Json -Method Post -Uri ($base + "/api/audience-codes/generate?sessionId=" + $sessionId) -Body $genReq
Write-Host ("Generated code=" + $gen.code + " role=" + $gen.role + " expiresAt=" + $gen.expiresAt)

Write-Host "== STEP 3: Validate code =="
$val = Invoke-Json -Method Get -Uri ($base + "/api/audience-codes/validate/" + $gen.code)
Write-Host ("Validate response=" + ($val | ConvertTo-Json -Compress))

Write-Host "== STEP 4: Join with code up to maxUses =="
$join1 = Invoke-Json -Method Post -Uri ($base + "/api/audience-codes/join/" + $gen.code)
Write-Host ("join1=" + ($join1 | ConvertTo-Json -Compress))

$join2 = Invoke-Json -Method Post -Uri ($base + "/api/audience-codes/join/" + $gen.code)
Write-Host ("join2=" + ($join2 | ConvertTo-Json -Compress))

Write-Host "Expected failure on join3 (max uses reached):"
try {
  $null = Invoke-Json -Method Post -Uri ($base + "/api/audience-codes/join/" + $gen.code)
  throw "join3 unexpectedly succeeded"
} catch {
  Write-Host "join3 failed as expected."
}

Write-Host "== STEP 5: Invites =="
$inv = Invoke-Json -Method Post -Uri ($base + "/api/invites") -Body @{
  SessionId = $sessionId
  InvitedEmail = "test@example.com"
  Role = "speaker"
  ExpiresHours = 1
}
Write-Host ("Invite created code=" + $inv.code + " expiresAt=" + $inv.expiresAt)

Write-Host "== STEP 6: Accept invite =="
$acc1 = Invoke-Json -Method Post -Uri ($base + "/api/invites/accept/" + $inv.code)
Write-Host ("accept1=" + ($acc1 | ConvertTo-Json -Compress))

Write-Host "Expected failure on accept2 (already accepted):"
try {
  $null = Invoke-Json -Method Post -Uri ($base + "/api/invites/accept/" + $inv.code)
  throw "accept2 unexpectedly succeeded"
} catch {
  Write-Host "accept2 failed as expected."
}

Write-Host "SMOKE TEST DONE"
