<#
.SYNOPSIS
  Refreshes the OneDrive-lock-avoiding build mirror used for Android Gradle builds
  (mobile-architecture.md's mirror-build workaround; see docs/mobile/tooling-setup-log.md).

.DESCRIPTION
  code-review-round9.md R2: the previously *documented* refresh procedure was an
  unquoted `robocopy` command meant to be pasted into whatever shell was at hand. Run
  from the Bash tool (this pipeline's normal shell, not cmd.exe/PowerShell), an
  unquoted Windows destination path is corrupted by bash's own backslash-escape
  handling before robocopy ever sees it - which is exactly what silently wrote a full
  copy of the repo tree into the git working directory during the round-9 batch
  (see the tooling log's dated "mirror-refresh and fold-profile corrections" entry).

  This script is the one canonical copy of the refresh procedure. Run it with:

    powershell.exe -NoProfile -File 'C:\path\to\scaffold\scripts\refresh-android-mirror.ps1'

  (single-quoted, so the Bash tool's own shell never re-interprets the path) and,
  optionally, `-RepoRoot`/`-MirrorPath` if the defaults below don't match your
  checkout. It stops any stale node process holding a mirror file open
  (code-review-round4 I4), clears the Gradle output directories `/XD` cannot reliably
  exclude by name alone (code-review-round3/4 I4), runs the `/MIR` copy, and then -
  R2's actual required fix - runs a MANDATORY post-refresh parity check that FAILS
  LOUDLY (non-zero exit, `throw`) if the mirror does not hash-match the repo, or if the
  refresh left any new trace in `git status --porcelain`. Robocopy's own exit code is
  not treated as evidence of anything (that is exactly what went wrong last time - it
  reported "success" while writing to the wrong place).
#>

param(
  [string]$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path,
  [string]$MirrorPath = 'C:\Users\aaron\dev-build\shield-vs-robots'
)

$ErrorActionPreference = 'Stop'

# code-review-round10.md R1: validate the destination BEFORE anything destructive
# (stale-process kill, Remove-Item, robocopy /MIR) can touch it. The round-9 incident
# and this review's own reproduction both wrote into the repo because validation only
# ran *after* the copy. This block only reads the filesystem and git - nothing here
# deletes or copies anything.
$MirrorMarkerFile = '.svr-build-mirror'

# code-review-round11.md L2/R1(b): a small, shared wrapper around
# `git rev-parse --is-inside-work-tree` that never throws on the *expected*
# "not a repo"/"path doesn't exist" outcome. A plain `2>$null` redirect is not
# enough on its own: with `$ErrorActionPreference = 'Stop'` in effect (set below,
# script-wide), PowerShell turns a *redirected* native-command stderr line into a
# terminating error the moment the command also exits non-zero - which is exactly
# git's normal, non-exceptional response to "this isn't a repo". Suppress the error
# stream and restore the caller's preference immediately after, so only the
# genuinely unexpected case (git not on PATH at all) still throws.
function Test-InsideGitWorkTree {
  param([string]$Path)
  if (-not (Test-Path $Path)) { return $false }
  $previousEap = $ErrorActionPreference
  $ErrorActionPreference = 'SilentlyContinue'
  try {
    $result = & git -C $Path rev-parse --is-inside-work-tree 2>$null
    return ($LASTEXITCODE -eq 0 -and $result -eq 'true')
  } finally {
    $ErrorActionPreference = $previousEap
  }
}

function Assert-SafeMirrorPath {
  param([string]$RawMirrorPath, [string]$RawRepoRoot)

  # 1. Fully qualified. Reject drive-relative (`C:foo`, the round-9/round-10 incident
  # form), relative (`foo`) and rooted-but-driveless (`\foo`) forms outright, before
  # any .NET path normalization gets a chance to resolve them against the current
  # drive/directory (which is exactly how `C:mangled-mirror` silently became a path
  # under the repo last time).
  if ($RawMirrorPath -notmatch '^[A-Za-z]:\\') {
    # code-review-round11.md S2: forward slashes are rejected here too (this pattern
    # requires a literal backslash after the drive letter), which is safe but easy to
    # trip over since the Bash tool naturally produces forward-slash paths. Say so.
    throw "-MirrorPath '$RawMirrorPath' is not a fully qualified path (expected 'X:\...', with backslashes - not 'X:/...'). Refusing to touch it."
  }

  # code-review-round11.md R1(a): every PowerShell path cmdlet below uses -Path (the
  # default), which treats `[`, `]`, `*` and `?` as wildcard characters even though
  # they are legal in Windows directory names. A literal directory named e.g. `[m]`
  # then makes `Test-Path`/`Get-ChildItem` look for a directory named `m`, so check 4
  # below sees "does not exist" for a real, non-empty, unrelated directory and
  # `/MIR` purges it. Reject both path parameters outright if they contain any of
  # these characters, rather than switching every call to -LiteralPath (round-11's
  # simpler, equally-acceptable option 2).
  foreach ($pair in @(@{ Name = '-MirrorPath'; Value = $RawMirrorPath }, @{ Name = '-RepoRoot'; Value = $RawRepoRoot })) {
    if ($pair.Value -match '[\[\]\*\?]') {
      throw "$($pair.Name) '$($pair.Value)' contains a wildcard-like character ('[', ']', '*' or '?'). This script rejects such paths outright rather than risk a wildcard match against the wrong directory. Rename the directory or pass a different path."
    }
  }

  $mirrorFull = [System.IO.Path]::GetFullPath($RawMirrorPath).TrimEnd('\')
  $repoFull = [System.IO.Path]::GetFullPath($RawRepoRoot).TrimEnd('\')

  # 2. No overlap with the repo, in either direction. Trailing-\ comparison so
  # '...\scaffold2' is not mistaken for being inside '...\scaffold'.
  $mirrorWithSep = "$mirrorFull\"
  $repoWithSep = "$repoFull\"
  $same = $mirrorFull.Equals($repoFull, [System.StringComparison]::OrdinalIgnoreCase)
  $mirrorInsideRepo = $mirrorWithSep.StartsWith($repoWithSep, [System.StringComparison]::OrdinalIgnoreCase)
  $repoInsideMirror = $repoWithSep.StartsWith($mirrorWithSep, [System.StringComparison]::OrdinalIgnoreCase)
  if ($same -or $mirrorInsideRepo -or $repoInsideMirror) {
    throw "-MirrorPath '$mirrorFull' overlaps the repo '$repoFull'. Refusing to touch it."
  }

  # 3. Not a drive root, and not $env:USERPROFILE or one of its ancestors. A drive
  # root or a USERPROFILE ancestor under /MIR or Remove-Item would purge unrelated
  # projects, not just a wrong mirror.
  $driveRoot = [System.IO.Path]::GetPathRoot($mirrorFull).TrimEnd('\')
  if ($mirrorFull.Equals($driveRoot, [System.StringComparison]::OrdinalIgnoreCase)) {
    throw "-MirrorPath '$mirrorFull' is a drive root. Refusing to touch it."
  }
  $userProfile = $env:USERPROFILE
  if ($userProfile) {
    $userProfileFull = [System.IO.Path]::GetFullPath($userProfile).TrimEnd('\')
    $userProfileWithSep = "$userProfileFull\"
    $isUserProfileOrAncestor = $userProfileFull.Equals($mirrorFull, [System.StringComparison]::OrdinalIgnoreCase) -or
      $userProfileWithSep.StartsWith($mirrorWithSep, [System.StringComparison]::OrdinalIgnoreCase)
    if ($isUserProfileOrAncestor) {
      throw "-MirrorPath '$mirrorFull' is `$env:USERPROFILE ('$userProfileFull') or one of its ancestors. Refusing to touch it."
    }
  }

  # 4. An existing, non-empty directory must be recognisably the mirror: either it
  # already carries this script's own marker file (written on first successful
  # creation, below), or it looks like a prior mirror by containing both
  # capacitor.config.ts and android\app\build.gradle. This is what stops a wrong-but-
  # absolute, already-existing directory (someone else's checkout, a downloads folder)
  # from being silently purged by /MIR.
  if (Test-Path $mirrorFull) {
    # code-review-round11.md R1(a): no -ErrorAction SilentlyContinue here. An
    # access-denied error while listing a non-empty directory must surface as a
    # thrown error, not be swallowed into an empty $entries that makes the directory
    # look empty (and therefore safe to purge) when it is not.
    $entries = @(Get-ChildItem -Path $mirrorFull -Force)
    if ($entries.Count -gt 0) {
      $hasMarker = Test-Path (Join-Path $mirrorFull $MirrorMarkerFile)
      $looksLikeMirror = (Test-Path (Join-Path $mirrorFull 'capacitor.config.ts')) -and
        (Test-Path (Join-Path $mirrorFull 'android\app\build.gradle'))
      if (-not ($hasMarker -or $looksLikeMirror)) {
        throw "-MirrorPath '$mirrorFull' already exists, is non-empty, and is not recognisably a prior mirror (no '$MirrorMarkerFile' marker, and missing capacitor.config.ts/android\app\build.gradle). Refusing to touch it."
      }
    }
  }

  # 5. code-review-round11.md R1(b): refuse any -MirrorPath that is itself inside a
  # git working tree. A junction, symlink or `subst` alias of the repo (or a second
  # real clone of this or any other repo) passes checks 2-4 above, because the
  # overlap check (2) is a plain string comparison that an alias bypasses, and a real
  # clone/checkout naturally contains capacitor.config.ts/android\app\build.gradle
  # (4). A genuine mirror is never inside a working tree, because robocopy's /XD
  # always excludes `.git` - so this check is safe for every real mirror and catches
  # every alias/clone case above.
  #
  # `git rev-parse --is-inside-work-tree` (not a literal `Test-Path` for a child
  # `.git`) because this repo itself is a checkout inside a larger monorepo - the
  # real `.git` is several directories above `-RepoRoot`, not a direct child of it -
  # so an alias of `-RepoRoot` would have no *literal* child `.git` either, and a
  # literal check would miss it. Asking git the same question it already answers
  # for every other git call in this script (by searching upward) catches both an
  # alias of a full repo root and an alias of a subdirectory like this one.
  if (Test-InsideGitWorkTree -Path $mirrorFull) {
    throw "-MirrorPath '$mirrorFull' is inside a git working tree, so it is a real repo checkout (or an alias of one), not a build mirror. Refusing to touch it."
  }

  return $mirrorFull
}

# code-review-round11.md L2: normalize -RepoRoot the same way -MirrorPath is
# normalized, and verify it. Previously a relative -RepoRoot was resolved once by
# `Push-Location` and then *again*, relative to that new location, by robocopy at
# the call site below - which happened to fail safely (robocopy exit 16) but only
# by accident. Resolve it once, up front, with GetFullPath, and use that normalized
# value everywhere from here on.
$RepoRoot = [System.IO.Path]::GetFullPath($RepoRoot).TrimEnd('\')
# Deviation from code-review-round11.md L2's literal suggestion (a plain
# `Test-Path -LiteralPath (Join-Path $repo '.git')`): this checkout lives inside a
# larger monorepo (scaffold/ has no '.git' of its own - the real `.git` is several
# directories up, at the ahogancamp_portfolio root), which every other git call in
# this script already relies on git's own upward directory search to find. A literal
# child-`.git` check would wrongly refuse the real, working -RepoRoot default.
# `git rev-parse --is-inside-work-tree` asks git the same underlying question
# ("is this a valid working tree?") without assuming `.git` is a direct child, so it
# accepts both a repo root and a subdirectory of one - exactly what L2 asked for
# (fail fast on a bad -RepoRoot before anything destructive), just verified the way
# git itself defines "is this a repo" rather than by a specific file's location.
if (-not (Test-InsideGitWorkTree -Path $RepoRoot)) {
  throw "-RepoRoot '$RepoRoot' is not inside a git working tree (git rev-parse --is-inside-work-tree failed). Refusing to treat it as the repo."
}

$MirrorPath = Assert-SafeMirrorPath -RawMirrorPath $MirrorPath -RawRepoRoot $RepoRoot

Write-Host "Repo:   $RepoRoot"
Write-Host "Mirror: $MirrorPath"

Push-Location $RepoRoot
try {
  # R2 guard (step 4): snapshot the repo's own git status before touching anything, so
  # the refresh's effect on the working tree - if any - is verifiable, not assumed.
  # R1/L4: `$ErrorActionPreference = 'Stop'` does not cover native-command failures, so
  # a missing/broken git would otherwise leave both snapshots empty and let the guard
  # pass silently. Check $LASTEXITCODE explicitly.
  $statusBefore = git status --porcelain
  if ($LASTEXITCODE -ne 0) {
    throw "git status --porcelain failed (exit $LASTEXITCODE) before the refresh. Not safe to proceed without a working git status baseline."
  }

  # code-review-round4 I4: a stale node process (e.g. a leftover `vite preview`) can
  # hold an open handle on a file under the mirror's `node_modules`, which makes a
  # later `npm ci` fail with no obvious connection to the real cause.
  # L3 (code-review-round10.md): match on the full normalized mirror path, not just its
  # leaf name - a non-default `-MirrorPath` with a generic leaf (e.g. `build`) could
  # otherwise match and kill unrelated node.exe processes that merely mention that word.
  Get-CimInstance Win32_Process -Filter "Name = 'node.exe'" |
    Where-Object { $_.CommandLine -and $_.CommandLine -like "*$MirrorPath*" } |
    ForEach-Object {
      Write-Host "Stopping stale node.exe (pid $($_.ProcessId)) referencing the mirror"
      Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue
    }

  # code-review-round3/4: robocopy's /XD only matches a directory by its bare NAME, so
  # these Gradle output directories are cleared explicitly every refresh rather than
  # trusted to /XD alone (code-review-round4 L5: if a future source directory is ever
  # named `build`, this bare-name /XD pattern would silently drop it - it is not
  # meant to generalize beyond the three paths below).
  foreach ($rel in @(
    'android\build',
    'android\app\build',
    'android\capacitor-cordova-android-plugins\build'
  )) {
    Remove-Item -Recurse -Force (Join-Path $MirrorPath $rel) -ErrorAction SilentlyContinue
  }

  $xd = @('node_modules', '.git', 'build', '.gradle', '.terraform')
  # R1: the marker file lives only at the mirror (never in the repo, so it is never a
  # source file to copy), and it must survive /MIR, which deletes any destination file
  # that is not present in the source. Exclude it explicitly.
  $xf = @(
    'terraform-deploy_accessKeys.csv', '*.csv', '.env', '.env.*',
    '*.tfstate', '*.tfstate.*', 'terraform.tfvars', $MirrorMarkerFile
  )

  # R2 fix (step 1): both paths are PowerShell parameters, single-quoted at the call
  # site - never string-built inside a Bash/cmd invocation.
  & robocopy $RepoRoot $MirrorPath /MIR /XD $xd /XF $xf /NFL /NDL /NJH
  $copyExit = $LASTEXITCODE
  # Robocopy exit-code bits: 0/1/2/3 are all "successful copy" outcomes (some
  # combination of files copied / extra files present, both expected on a normal
  # refresh); 8+ indicates at least one failure.
  if ($copyExit -ge 8) {
    throw "robocopy reported failures (exit $copyExit) copying '$RepoRoot' -> '$MirrorPath'. Not verified further - fix the robocopy failure first."
  }
  Write-Host "robocopy exit $copyExit (informational only - see the parity check below for the actual verification)."

  # R1 step 4: stamp the marker on first successful creation, so a future run's
  # pre-flight check recognises this directory as the mirror even before it has
  # capacitor.config.ts/android\app\build.gradle in place (e.g. a first refresh that
  # is interrupted before the parity check).
  $markerPath = Join-Path $MirrorPath $MirrorMarkerFile
  if (-not (Test-Path $markerPath)) {
    Set-Content -Path $markerPath -Value "Created by scripts/refresh-android-mirror.ps1 on $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss'). Do not delete - this marks the directory as a build mirror safe for /MIR refreshes."
  }

  # R2 fix (step 3, the actual required fix): robocopy's exit code is NOT evidence the
  # mirror matches the repo - it only proves robocopy did SOMETHING at the destination
  # path it was given, which is precisely what went wrong last time. Hash-compare the
  # paths that actually matter for a real APK build, independently of the copy step.
  $checkDirs = @('src', 'tests', 'scripts', 'public', 'android\app\src')
  $checkFiles = @(
    'package.json', 'package-lock.json', 'capacitor.config.ts', 'vite.config.ts',
    'playwright.mobile.config.ts', 'android\app\build.gradle'
  )

  function Get-RelativeHashes {
    param([string]$Root, [string[]]$Dirs)
    $result = @{}
    foreach ($dir in $Dirs) {
      $full = Join-Path $Root $dir
      if (-not (Test-Path $full)) { continue }
      Get-ChildItem -Path $full -Recurse -File | ForEach-Object {
        $rel = $_.FullName.Substring($full.Length).TrimStart('\')
        $result["$dir\$rel"] = (Get-FileHash -Path $_.FullName -Algorithm SHA1).Hash
      }
    }
    return $result
  }

  $repoHashes = Get-RelativeHashes -Root $RepoRoot -Dirs $checkDirs
  $mirrorHashes = Get-RelativeHashes -Root $MirrorPath -Dirs $checkDirs

  $mismatches = New-Object System.Collections.Generic.List[string]
  foreach ($rel in $repoHashes.Keys) {
    if (-not $mirrorHashes.ContainsKey($rel)) { $mismatches.Add("missing in mirror: $rel"); continue }
    if ($mirrorHashes[$rel] -ne $repoHashes[$rel]) { $mismatches.Add("hash mismatch: $rel") }
  }
  foreach ($rel in $mirrorHashes.Keys) {
    if (-not $repoHashes.ContainsKey($rel)) { $mismatches.Add("extra in mirror (not in repo): $rel") }
  }

  foreach ($rel in $checkFiles) {
    $repoFile = Join-Path $RepoRoot $rel
    $mirrorFile = Join-Path $MirrorPath $rel
    $repoExists = Test-Path $repoFile
    $mirrorExists = Test-Path $mirrorFile
    if ($repoExists -ne $mirrorExists) { $mismatches.Add("presence mismatch: $rel"); continue }
    if (-not $repoExists) { continue }
    $repoHash = (Get-FileHash -Path $repoFile -Algorithm SHA1).Hash
    $mirrorHash = (Get-FileHash -Path $mirrorFile -Algorithm SHA1).Hash
    if ($repoHash -ne $mirrorHash) { $mismatches.Add("hash mismatch: $rel") }
  }

  if ($mismatches.Count -gt 0) {
    Write-Host 'PARITY CHECK FAILED - the mirror does not match the repo:' -ForegroundColor Red
    $mismatches | ForEach-Object { Write-Host "  $_" -ForegroundColor Red }
    throw "Mirror refresh parity check failed ($($mismatches.Count) difference(s)). Do not build from this mirror."
  }
  Write-Host "Parity check passed: $($repoHashes.Count) file(s) under $($checkDirs -join ', ') and $($checkFiles.Count) named file(s) are identical." -ForegroundColor Green

  # R2 fix (step 4): the refresh must not have changed the git working directory
  # itself - the round-9 incident's stray copy landed INSIDE the repo and would have
  # shown up here immediately if this guard had existed at the time. `Compare-Object`
  # (not PowerShell's `-ne`, which filters element-by-element against a scalar and is
  # not a whole-array equality check) is the correct way to diff two string arrays.
  $statusAfter = git status --porcelain
  if ($LASTEXITCODE -ne 0) {
    throw "git status --porcelain failed (exit $LASTEXITCODE) after the refresh. Cannot confirm the working tree is unchanged - investigate before trusting this mirror."
  }
  $statusDiff = Compare-Object -ReferenceObject @($statusBefore) -DifferenceObject @($statusAfter)
  if ($statusDiff) {
    Write-Host 'git status --porcelain changed during the refresh:' -ForegroundColor Red
    $statusDiff | ForEach-Object {
      $marker = if ($_.SideIndicator -eq '=>') { '+ (new after)' } else { '- (gone after)' }
      Write-Host "  $marker $($_.InputObject)"
    }
    throw 'Mirror refresh changed the repo working tree (see the git status diff above). Investigate before trusting this mirror.'
  }

  Write-Host "Mirror refresh complete and verified: $MirrorPath" -ForegroundColor Green
}
finally {
  Pop-Location
}
