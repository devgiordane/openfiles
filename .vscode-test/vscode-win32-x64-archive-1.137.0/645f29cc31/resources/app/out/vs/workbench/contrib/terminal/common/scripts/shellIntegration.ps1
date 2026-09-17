# ---------------------------------------------------------------------------------------------
#   Copyright (c) Microsoft Corporation. All rights reserved.
#   Licensed under the MIT License. See License.txt in the project root for license information.
# ---------------------------------------------------------------------------------------------

# Prevent installing more than once per session
if ((Test-Path variable:global:__VSCodeState) -and $null -ne $Global:__VSCodeState.OriginalPrompt) {
	return;
}

# Disable shell integration when the language mode is restricted
if ($ExecutionContext.SessionState.LanguageMode -ne "FullLanguage") {
	return;
}

$Global:__VSCodeState = @{
	OriginalPrompt = $function:Prompt
	LastHistoryId = -1
	IsInExecution = $false
	EnvVarsToReport = @()
	Nonce = $null
	IsStable = $null
	IsA11yMode = $null
	IsWindows10 = $false
}

# Store the nonce in a regular variable and unset the environment variable. It's by design that
# anything that can execute PowerShell code can read the nonce, as it's basically impossible to hide
# in PowerShell. The most important thing is getting it out of the environment.
$Global:__VSCodeState.Nonce = $env:VSCODE_NONCE
$env:VSCODE_NONCE = $null

$Global:__VSCodeState.IsStable = $env:VSCODE_STABLE
$env:VSCODE_STABLE = $null

$Global:__VSCodeState.IsA11yMode = $env:VSCODE_A11Y_MODE
$env:VSCODE_A11Y_MODE = $null

$__vscode_shell_env_reporting = $env:VSCODE_SHELL_ENV_REPORTING
$env:VSCODE_SHELL_ENV_REPORTING = $null
if ($__vscode_shell_env_reporting) {
	$Global:__VSCodeState.EnvVarsToReport = $__vscode_shell_env_reporting.Split(',')
}
Remove-Variable -Name __vscode_shell_env_reporting -ErrorAction SilentlyContinue

$osVersion = [System.Environment]::OSVersion.Version
$Global:__VSCodeState.IsWindows10 = $IsWindows -and $osVersion.Major -eq 10 -and $osVersion.Minor -eq 0 -and $osVersion.Build -lt 22000
Remove-Variable -Name osVersion -ErrorAction SilentlyContinue

if ($env:VSCODE_ENV_REPLACE) {
	$Split = $env:VSCODE_ENV_REPLACE.Split(":")
	foreach ($Item in $Split) {
		$Inner = $Item.Split('=', 2)
		[Environment]::SetEnvironmentVariable($Inner[0], $Inner[1].Replace('\x3a', ':'))
	}
	$env:VSCODE_ENV_REPLACE = $null
}
if ($env:VSCODE_ENV_PREPEND) {
	$Split = $env:VSCODE_ENV_PREPEND.Split(":")
	foreach ($Item in $Split) {
		$Inner = $Item.Split('=', 2)
		[Environment]::SetEnvironmentVariable($Inner[0], $Inner[1].Replace('\x3a', ':') + [Environment]::GetEnvironmentVariable($Inner[0]))
	}
	$env:VSCODE_ENV_PREPEND = $null
}
if ($env:VSCODE_ENV_APPEND) {
	$Split = $env:VSCODE_ENV_APPEND.Split(":")
	foreach ($Item in $Split) {
		$Inner = $Item.Split('=', 2)
		[Environment]::SetEnvironmentVariable($Inner[0], [Environment]::GetEnvironmentVariable($Inner[0]) + $Inner[1].Replace('\x3a', ':'))
	}
	$env:VSCODE_ENV_APPEND = $null
}

# Register Python shell activate hooks
# Prevent multiple activation with guard
if (-not $env:VSCODE_PYTHON_AUTOACTIVATE_GUARD) {
	$env:VSCODE_PYTHON_AUTOACTIVATE_GUARD = '1'
	if ($env:VSCODE_PYTHON_PWSH_ACTIVATE -and $env:TERM_PROGRAM -eq 'vscode') {
		$activateScript = $env:VSCODE_PYTHON_PWSH_ACTIVATE

		try {
			Invoke-Expression $activateScript
			$Global:__VSCodeState.OriginalPrompt = $function:Prompt
		}
		catch {
			$activationError = $_
			Write-Host "`e[0m`e[7m * `e[0;103m VS Code Python powershell activation failed with exit code $($activationError.Exception.Message) `e[0m"
		}
	}
	# Remove any leftover Python activation env vars.
	Get-ChildItem Env:VSCODE_PYTHON_*_ACTIVATE | Remove-Item -ErrorAction SilentlyContinue
}

function Global:__VSCode-Escape-Value([string]$value) {
	# NOTE: In PowerShell v6.1+, this can be written `$value -replace '…', { … }` instead of `[regex]::Replace`.
	# Replace any non-alphanumeric characters.
	[regex]::Replace($value, "[$([char]0x00)-$([char]0x1f)\\\n;]", { param($match)
			# Encode the (ascii) matches as `\x<hex>`
			-Join (
				[System.Text.Encoding]::UTF8.GetBytes($match.Value) | ForEach-Object { '\x{0:x2}' -f $_ }
			)
		})
}

function Global:Prompt() {
	$FakeCode = [int]!$global:?
	# NOTE: We disable strict mode for the scope of this function because it unhelpfully throws an
	# error when $LastHistoryEntry is null, and is not otherwise useful.
	Set-StrictMode -Off
	$LastHistoryEntry = Get-History -Count 1
	$Result = ""
	# Skip finishing the command if the first command has not yet started or an execution has not
	# yet begun
	if ($Global:__VSCodeState.LastHistoryId -ne -1 -and ($Global:__VSCodeState.HasPSReadLine -eq $false -or $Global:__VSCodeState.IsInExecution -eq $true)) {
		$Global:__VSCodeState.IsInExecution = $false
		if ($LastHistoryEntry.Id -eq $Global:__VSCodeState.LastHistoryId) {
			# Don't provide a command line or exit code if there was no history entry (eg. ctrl+c, enter on no command)
			$Result += "$([char]0x1b)]633;D`a"
		}
		else {
			# Command finished exit code
			# OSC 633 ; D [; <ExitCode>] ST
			$Result += "$([char]0x1b)]633;D;$FakeCode`a"
		}
	}
	# Prompt started
	# OSC 633 ; A ST
	$Result += "$([char]0x1b)]633;A`a"
	# Current working directory
	# OSC 633 ; <Property>=<Value> ST
	$Result += if ($pwd.Provider.Name -eq 'FileSystem') { "$([char]0x1b)]633;P;Cwd=$(__VSCode-Escape-Value $pwd.ProviderPath)`a" }

	# Send current environment variables as JSON
	# OSC 633 ; EnvJson ; <Environment> ; <Nonce>
	if ($Global:__VSCodeState.EnvVarsToReport.Count -gt 0) {
		$envMap = @{}
        foreach ($varName in $Global:__VSCodeState.EnvVarsToReport) {
            if (Test-Path "env:$varName") {
                $envMap[$varName] = (Get-Item "env:$varName").Value
            }
        }
        $envJson = $envMap | ConvertTo-Json -Compress
        $Result += "$([char]0x1b)]633;EnvJson;$(__VSCode-Escape-Value $envJson);$($Global:__VSCodeState.Nonce)`a"
	}

	# Before running the original prompt, put $? back to what it was:
	if ($FakeCode -ne 0) {
		Write-Error "failure" -ea ignore
	}
	# Run the original prompt
	$OriginalPrompt += $Global:__VSCodeState.OriginalPrompt.Invoke()
	$Result += $OriginalPrompt

	# Prompt
	# OSC 633 ; <Property>=<Value> ST
	if ($Global:__VSCodeState.IsStable -eq "0") {
		$Result += "$([char]0x1b)]633;P;Prompt=$(__VSCode-Escape-Value $OriginalPrompt)`a"
	}

	# Write command started
	$Result += "$([char]0x1b)]633;B`a"
	$Global:__VSCodeState.LastHistoryId = $LastHistoryEntry.Id
	return $Result
}

# Report prompt type
if ($env:STARSHIP_SESSION_KEY) {
	[Console]::Write("$([char]0x1b)]633;P;PromptType=starship`a")
}
elseif ($env:POSH_SESSION_ID) {
	[Console]::Write("$([char]0x1b)]633;P;PromptType=oh-my-posh`a")
}
elseif ((Test-Path variable:global:GitPromptSettings) -and $Global:GitPromptSettings) {
	[Console]::Write("$([char]0x1b)]633;P;PromptType=posh-git`a")
}

if ($Global:__VSCodeState.IsA11yMode -eq "1") {
	# Check if the loaded PSReadLine already supports EnableScreenReaderMode
	$hasScreenReaderParam = (Get-Module -Name PSReadLine) -and (Get-Command Set-PSReadLineOption).Parameters.ContainsKey('EnableScreenReaderMode')

	if (-not $hasScreenReaderParam -and $PSVersionTable.PSVersion -ge "7.0") {
		# The loaded PSReadLine lacks EnableScreenReaderMode (only available in 2.4.4-beta4+).
		# PowerShell 7.0+ skips autoloading PSReadLine when the OS reports a screen reader active.
		# When only VS Code's accessibility mode is enabled (no OS screen reader),
		# it's still loaded and must be removed to load our bundled copy.
		# Skip this on Windows PowerShell 5.1 where removing the built-in PSReadLine 2.0.0
		# and replacing it can cause input handling issues (e.g. repeated Enter key presses).
		if (Get-Module -Name PSReadLine) {
			Remove-Module PSReadLine -Force
		}

		# Import VS Code's bundled PSReadLine 2.4.3 which has EnableScreenReaderMode
		$specialPsrlPath = Join-Path (Split-Path -Parent $MyInvocation.MyCommand.Path) 'psreadline'
		if (Test-Path $specialPsrlPath) {
			Import-Module $specialPsrlPath
		}

		$hasScreenReaderParam = (Get-Module -Name PSReadLine) -and (Get-Command Set-PSReadLineOption).Parameters.ContainsKey('EnableScreenReaderMode')
	}

	if ($hasScreenReaderParam) {
		Set-PSReadLineOption -EnableScreenReaderMode
	}
}

# Only send the command executed sequence when PSReadLine is loaded, if not shell integration should
# still work thanks to the command line sequence
$Global:__VSCodeState.HasPSReadLine = $false
if (Get-Module -Name PSReadLine) {
	$Global:__VSCodeState.HasPSReadLine = $true
	[Console]::Write("$([char]0x1b)]633;P;HasRichCommandDetection=True`a")

	$Global:__VSCodeState.OriginalPSConsoleHostReadLine = $function:PSConsoleHostReadLine
	function Global:PSConsoleHostReadLine {
		$CommandLine = $Global:__VSCodeState.OriginalPSConsoleHostReadLine.Invoke()
		$Global:__VSCodeState.IsInExecution = $true

		# Command line
		# OSC 633 ; E [; <CommandLine> [; <Nonce>]] ST
		$Result = "$([char]0x1b)]633;E;"
		$Result += $(__VSCode-Escape-Value $CommandLine)
		# Only send the nonce if the OS is not Windows 10 as it seems to echo to the terminal
		# sometimes
		if ($Global:__VSCodeState.IsWindows10 -eq $false) {
			$Result += ";$($Global:__VSCodeState.Nonce)"
		}
		$Result += "`a"

		# Command executed
		# OSC 633 ; C ST
		$Result += "$([char]0x1b)]633;C`a"

		# Write command executed sequence directly to Console to avoid the new line from Write-Host
		[Console]::Write($Result)

		$CommandLine
	}

	# Set ContinuationPrompt property
	$Global:__VSCodeState.ContinuationPrompt = (Get-PSReadLineOption).ContinuationPrompt
	if ($Global:__VSCodeState.ContinuationPrompt) {
		[Console]::Write("$([char]0x1b)]633;P;ContinuationPrompt=$(__VSCode-Escape-Value $Global:__VSCodeState.ContinuationPrompt)`a")
	}
}

# Set IsWindows property
if ($PSVersionTable.PSVersion -lt "6.0") {
	# Windows PowerShell is only available on Windows
	[Console]::Write("$([char]0x1b)]633;P;IsWindows=$true`a")
}
else {
	[Console]::Write("$([char]0x1b)]633;P;IsWindows=$IsWindows`a")
}

# Set always on key handlers which map to default VS Code keybindings
function Set-MappedKeyHandler {
	param ([string[]] $Chord, [string[]]$Sequence)
	try {
		$Handler = Get-PSReadLineKeyHandler -Chord $Chord | Select-Object -First 1
	}
 catch [System.Management.Automation.ParameterBindingException] {
		# PowerShell 5.1 ships with PSReadLine 2.0.0 which does not have -Chord,
		# so we check what's bound and filter it.
		$Handler = Get-PSReadLineKeyHandler -Bound | Where-Object -FilterScript { $_.Key -eq $Chord } | Select-Object -First 1
	}
	if ($Handler) {
		Set-PSReadLineKeyHandler -Chord $Sequence -Function $Handler.Function
	}
}

function Set-MappedKeyHandlers {
	Set-MappedKeyHandler -Chord Ctrl+Spacebar -Sequence 'F12,a'
	Set-MappedKeyHandler -Chord Alt+Spacebar -Sequence 'F12,b'
	Set-MappedKeyHandler -Chord Shift+Enter -Sequence 'F12,c'
	Set-MappedKeyHandler -Chord Shift+End -Sequence 'F12,d'
}

if ($Global:__VSCodeState.HasPSReadLine) {
	Set-MappedKeyHandlers

	# Prevent AI-executed commands from polluting shell history
	if ($env:VSCODE_PREVENT_SHELL_HISTORY -eq "1") {
		Set-PSReadLineOption -AddToHistoryHandler {
			param([string]$line)
			return $false
		}
		$env:VSCODE_PREVENT_SHELL_HISTORY = $null
	}
}

# SIG # Begin signature block
# MIIu8wYJKoZIhvcNAQcCoIIu5DCCLuACAQExDzANBglghkgBZQMEAgEFADB5Bgor
# BgEEAYI3AgEEoGswaTA0BgorBgEEAYI3AgEeMCYCAwEAAAQQH8w7YFlLCE63JNLG
# KX7zUQIBAAIBAAIBAAIBAAIBADAxMA0GCWCGSAFlAwQCAQUABCAfGrwqijsIoxub
# jHYHcEKgTrE2cVfuLVugyXdXVzgN8aCCFBcwggYxMIIEGaADAgECAhMzAAAAPN7h
# 8kv+pQH8AAEAAAA8MA0GCSqGSIb3DQEBCwUAMIGHMQswCQYDVQQGEwJVUzETMBEG
# A1UECBMKV2FzaGluZ3RvbjEQMA4GA1UEBxMHUmVkbW9uZDEeMBwGA1UEChMVTWlj
# cm9zb2Z0IENvcnBvcmF0aW9uMTEwLwYDVQQDEyhNaWNyb3NvZnQgTWFya2V0cGxh
# Y2UgUHJvZHVjdGlvbiBDQSAyMDExMB4XDTI2MDQyNDAwMDAyN1oXDTI3MDQyMTAw
# MDAyN1owdDELMAkGA1UEBhMCVVMxEzARBgNVBAgTCldhc2hpbmd0b24xEDAOBgNV
# BAcTB1JlZG1vbmQxHjAcBgNVBAoTFU1pY3Jvc29mdCBDb3Jwb3JhdGlvbjEeMBwG
# A1UEAxMVTWljcm9zb2Z0IENvcnBvcmF0aW9uMIIBIjANBgkqhkiG9w0BAQEFAAOC
# AQ8AMIIBCgKCAQEAyqsyxrqZ1cTP4L7geY5ZZAaJ67ccYeq62lPpsssiyvhiQkwT
# yluKvVKPYPzKHnTfAbRpdFzGTIPmst9LNNxAddhwErCnk/9guQhlfG8nfmOUXk3f
# XjkSoxlz/76adqxZKzqUnwrFw+GVd26AkvLXkbUfjaljEFJbbg8hZsR6u+JgI7pB
# LYKXbRX0MD0FjuUtkcxab9+71wTvmAFPc55n0iKX5D+RbIh0ljjEDBz8D3w4Jpkj
# JB9DIDO6y1Bww0DRTpirVAZ1Fnif1rtBzff6pBZZwbtnTYWwG+GUpDtYAcmmuYn2
# V0t2OUMrO6OZfFhrGMofua1WENFEI2tbgIQ2mQIDAQABo4IBpjCCAaIwEwYDVR0l
# BAwwCgYIKwYBBQUHAwMwHQYDVR0OBBYEFBTe20ceOMMsm5IouE/rlbc6Q8ySMFQG
# A1UdEQRNMEukSTBHMS0wKwYDVQQLEyRNaWNyb3NvZnQgSXJlbGFuZCBPcGVyYXRp
# b25zIExpbWl0ZWQxFjAUBgNVBAUTDTIyOTk3OSs1MDc3ODYwHwYDVR0jBBgwFoAU
# nqf5oCNwnxHFaeOhjQr68bD01YAwbAYDVR0fBGUwYzBhoF+gXYZbaHR0cDovL3d3
# dy5taWNyb3NvZnQuY29tL3BraW9wcy9jcmwvTWljcm9zb2Z0JTIwTWFya2V0cGxh
# Y2UlMjBQcm9kdWN0aW9uJTIwQ0ElMjAyMDExKDEpLmNybDB5BggrBgEFBQcBAQRt
# MGswaQYIKwYBBQUHMAKGXWh0dHA6Ly93d3cubWljcm9zb2Z0LmNvbS9wa2lvcHMv
# Y2VydHMvTWljcm9zb2Z0JTIwTWFya2V0cGxhY2UlMjBQcm9kdWN0aW9uJTIwQ0El
# MjAyMDExKDEpLmNydDAMBgNVHRMBAf8EAjAAMA0GCSqGSIb3DQEBCwUAA4ICAQAi
# 042INA7bDb9hnoCIGC7RhwSuGxgQZLOxvQQ6FYv+iswSYNoFi0jZXizUEbuMpcH8
# Wqco+sXXBtCyOea2F384gWfnX8n7k6/IazkdHjkfwQlJTbzTd+Jgy2m2HhuIal3m
# la3Ivuf9QH60/YBGvMA9yj9XYmlfBskQ627ouHKsmt1eH+sHJbeK3BkQCqDKI511
# vu3yUEHFFNBlK9KJH6qtmXneFP9nijpJx6x37tt5uyMFP4kQW+vgg8HUCQ/C81Zk
# uFHldV+XR8pVmX4u+xKrf7If30vD66VBfEq/LLlMiT1N6EPd43udOLjwDg89m/kn
# n7n027xgcuXh+7axWaB0DKzLfRTpGtMzVQDjtLGCnuXVz8ufXBXANTlGGDQH0SQk
# 4DbzN+Tfj7k6XwabRZUAEFo5NuAtydbEuZ51Gau664MOS7987x2s9tAY4/s9vj2D
# Vn39i6mSXhpZyzE/yJG3ozZP9M5ozK+CYdD2bhd+R1PAn+PnE7tM5HugJGRjUcVV
# pf4TbQw8uzUxWS03yTyu3iA97q6YmwjU8dNGOYjNNwl71TEhmBTNDKu+jZ+ndMXq
# N9npGgOzDXf1oM7x0miT0QwKGcpZf7Z6iCMqnWyvtwJ2itm96PFAVzX7MSzlLKqs
# WM9uKjzrqJMi8vZmOh/vKIXx4F0DQjU9xOeCi92ccDCCBtcwggS/oAMCAQICCmES
# RKIAAAAAAAIwDQYJKoZIhvcNAQELBQAwgYgxCzAJBgNVBAYTAlVTMRMwEQYDVQQI
# EwpXYXNoaW5ndG9uMRAwDgYDVQQHEwdSZWRtb25kMR4wHAYDVQQKExVNaWNyb3Nv
# ZnQgQ29ycG9yYXRpb24xMjAwBgNVBAMTKU1pY3Jvc29mdCBSb290IENlcnRpZmlj
# YXRlIEF1dGhvcml0eSAyMDExMB4XDTExMDMyODIxMDkzOVoXDTMxMDMyODIxMTkz
# OVowfTELMAkGA1UEBhMCVVMxEzARBgNVBAgTCldhc2hpbmd0b24xEDAOBgNVBAcT
# B1JlZG1vbmQxHjAcBgNVBAoTFU1pY3Jvc29mdCBDb3Jwb3JhdGlvbjEnMCUGA1UE
# AxMeTWljcm9zb2Z0IE1hcmtldFBsYWNlIFBDQSAyMDExMIICIjANBgkqhkiG9w0B
# AQEFAAOCAg8AMIICCgKCAgEAubUaSwGYVsE3MAnPfvmozUhAB3qxBABgJRW1vDp4
# +tVinXxD32f7k1K89JQ6zDOgS/iDgULC+yFK1K/1Qjac/0M7P6c8v5LSjnWGlERL
# a/qY32j46S7SLQcit3g2jgoTTO03eUG+9yHZUTGV/FJdRYB8uXhrznJBa+Y+yGwi
# QKF+m6XFeBH/KORoKFx+dmMoy9EWJ/m/o9IiUj2kzm9C691+vZ/I2w0Bj93W9SPP
# kV2PCNHlzgfIAoeajWpHmi38Wi3xZHonkzAVBHxPsCBppOoNsWvmAfUM7eBthkSP
# vFruekyDCPNEYhfGqgqtqLkoBebXLZCOVybF7wTQaLvse60//3P003icRcCoQYgY
# 4NAqrF7j80o5U7DkeXxcB0xvengsaKgiAaV1DKkRbpe98wCqr1AASvm5rAJUYMU+
# mXmOieV2EelY2jGrenWe9FQpNXYV1NoWBh0WKoFxttoWYAnF705bIWtSZsz08ZfK
# 6WLX4GXNLcPBlgCzfTm1sdKYASWdBbH2haaNhPapFhQQBJHKwnVW2iXErImhuPi4
# 5W3MVTZ5D9ASshZx69cLYY6xAdIa+89Kf/uRrsGOVZfahDuDw+NI183iAyzC8z/Q
# Rt2P32LYxP0xrCdqVh+DJo2i4NoE8Uk1usCdbVRuBMBQl/AwpOTq7IMvHGElf65C
# qzUCAwEAAaOCAUswggFHMBAGCSsGAQQBgjcVAQQDAgEAMB0GA1UdDgQWBBQPU8s/
# FmEl/mCJHdO5fOiQrbOU0TAZBgkrBgEEAYI3FAIEDB4KAFMAdQBiAEMAQTALBgNV
# HQ8EBAMCAYYwDwYDVR0TAQH/BAUwAwEB/zAfBgNVHSMEGDAWgBRyLToCMZBDuRQF
# TuHqp8cx0SOJNDBaBgNVHR8EUzBRME+gTaBLhklodHRwOi8vY3JsLm1pY3Jvc29m
# dC5jb20vcGtpL2NybC9wcm9kdWN0cy9NaWNSb29DZXJBdXQyMDExXzIwMTFfMDNf
# MjIuY3JsMF4GCCsGAQUFBwEBBFIwUDBOBggrBgEFBQcwAoZCaHR0cDovL3d3dy5t
# aWNyb3NvZnQuY29tL3BraS9jZXJ0cy9NaWNSb29DZXJBdXQyMDExXzIwMTFfMDNf
# MjIuY3J0MA0GCSqGSIb3DQEBCwUAA4ICAQCjuZmM8ZVNDgp9wHsL4RY8KJ8nLinv
# xFTphNGCrxaLknkYG5pmMhVlX+UB/tSiW8W13W60nggz9u5xwMx7v/1t/Tgm6g2b
# rVyOKI5A7u6/2SIJwkJKFw953K0YIKVT28w9zl8dSJnmRnyR0G86ncWbF6CLQ6A6
# lBQ9o2mTGVqDr4m35WKAnc6YxUUM1y74mbzFFZr63VHsCcOp3pXWnUqAY1rb6Q6N
# X1b3clncKqLFm0EjKHcQ56grTbwuuB7pMdh/IFCJR01MQzQbDtpEisbOeZUi43YV
# AAHKqI1EO9bRwg3frCjwAbml9MmI4utMW94gWFgvrMxIX+n42RBDIjf3Ot3jkT6g
# t3XeTTmO9bptgblZimhERdkFRUFpVtkocJeLoGuuzP93uH/Yp032wzRH+XmMgujf
# Zv+vnfllJqxdowoQLx55FxLLeTeYfwi/xMSjZO2gNven3U/3KeSCd1kUOFS3AOrw
# Z0UNOXJeW5JQC6Vfd1BavFZ6FAta1fMLu3WFvNB+FqeHUaU3ya7rmtxJnzk29DeS
# qXgGNmVSywBS4NajI5jJIKAA6UhNJlsg8CHYwUOKf5ej8OoQCkbadUxXygAfxCfW
# 2YBbujtI+PoyejRFxWUjYFWO5LeTI62UMyqfOEiqugoYjNxmQZla2s4YHVuqIC34
# R85FQlg9pKQBsDCCBwMwggTroAMCAQICEzMAAABVyAZrOCOXKQkAAAAAAFUwDQYJ
# KoZIhvcNAQELBQAwfTELMAkGA1UEBhMCVVMxEzARBgNVBAgTCldhc2hpbmd0b24x
# EDAOBgNVBAcTB1JlZG1vbmQxHjAcBgNVBAoTFU1pY3Jvc29mdCBDb3Jwb3JhdGlv
# bjEnMCUGA1UEAxMeTWljcm9zb2Z0IE1hcmtldFBsYWNlIFBDQSAyMDExMB4XDTIx
# MDkwOTIyNDIzMFoXDTMwMDkwOTIyNTIzMFowgYcxCzAJBgNVBAYTAlVTMRMwEQYD
# VQQIEwpXYXNoaW5ndG9uMRAwDgYDVQQHEwdSZWRtb25kMR4wHAYDVQQKExVNaWNy
# b3NvZnQgQ29ycG9yYXRpb24xMTAvBgNVBAMTKE1pY3Jvc29mdCBNYXJrZXRwbGFj
# ZSBQcm9kdWN0aW9uIENBIDIwMTEwggIiMA0GCSqGSIb3DQEBAQUAA4ICDwAwggIK
# AoICAQDHfQ3P+L0El1S6JNYAz70y3e1i7EZAYcCDVXde/nQdpOKtVr6H4QkBkROv
# 7HBxY0U8lR9C3bUUZKn6CCcN3v3bQuYKu1Ff2G4nIIr8a1cB4iOU8i4YSN7bRr+5
# LvD5hyCfJHqXrJe5LRRGjws5aRAxYuGhQ3ypWPEZYfrIXmmYK+e+udApgxahHUPB
# qcbI2PT1PpkKDgqR7hyzW0CfWzRUwh+YoZpsVvDaEkxcHQe/yGJB5BluYyRm5K9z
# +YQqBvYJkNUisTE/9OImnaZqoujkEuhM5bBV/dNjw7YN37OcBuH0NvlQomLQo+V7
# PA519HVVE1kRQ8pFad6i4YdRWpj/+1yFskRZ5m7y+dEdGyXAiFeIgaM6O1CFrA1L
# bMAvyaZpQwBkrT/etC0hw4BPmW70zSmSubMoHpx/UUTNo3fMUVqx6r2H1xsc4aXT
# pPN5IxjkGIQhPN6h3q5JC+JOPnsfDRg3Ive2Q22jj3tkNiOXrYpmkILk7v+4XUxD
# Erdc/WLZ3sbF27hug7HSVbTCNA46scIqE7ZkgH3M7+8aP3iUBDNcYUWjO1u+P1Q6
# UUzFdShSbGbKf+Z3xpqlwdxQq9kuUahACRQLMFjRUfmAqGXUdMXECRaFPTxl6SB/
# 7IAcuK855beqNPcexVEpkSZxZJbnqjKWbyTk/GA1abW8zgfH2QIDAQABo4IBbzCC
# AWswEgYJKwYBBAGCNxUBBAUCAwEAATAjBgkrBgEEAYI3FQIEFgQUeBlfau2VIfkw
# k2K+EoAD6hZ05ccwHQYDVR0OBBYEFJ6n+aAjcJ8RxWnjoY0K+vGw9NWAMBkGCSsG
# AQQBgjcUAgQMHgoAUwB1AGIAQwBBMAsGA1UdDwQEAwIBhjASBgNVHRMBAf8ECDAG
# AQH/AgEAMB8GA1UdIwQYMBaAFA9Tyz8WYSX+YIkd07l86JCts5TRMFcGA1UdHwRQ
# ME4wTKBKoEiGRmh0dHA6Ly9jcmwubWljcm9zb2Z0LmNvbS9wa2kvY3JsL3Byb2R1
# Y3RzL01pY01hclBDQTIwMTFfMjAxMS0wMy0yOC5jcmwwWwYIKwYBBQUHAQEETzBN
# MEsGCCsGAQUFBzAChj9odHRwOi8vd3d3Lm1pY3Jvc29mdC5jb20vcGtpL2NlcnRz
# L01pY01hclBDQTIwMTFfMjAxMS0wMy0yOC5jcnQwDQYJKoZIhvcNAQELBQADggIB
# ACY4RaglNFzKOO+3zgazCsgCvXca79D573wDc0DAj6KzBX9m4rHhAZqzBkfSWvan
# LFilDibWmbGUGbkuH0y29NEoLVHfY64PXmXcBWEWd1xK4QxyKx2VVDq9P9494Z/v
# Xy9OsifTP8Gt2UkhftAQMcvKgGiAHtyRHda8r7oU4cc4ITZnMsgXv6GnMDVuIk+C
# q0Eh93rgzKF2rJ1sJcraH/kgSkgawBYYdJlXXHTkOrfEPKU82BDT5h8SGsXVt5L1
# mwRzjVQRLs1FNPkA+Kqyz0L+UEXJZWldNtHC79XtYh/ysRov4Yu/wLF+c8Pm15IC
# n8EYJUL4ZKmk9ZM7ZcaUV/2XvBpufWE2rcMnS/dPHWIojQ1FTToqM+Ag2jZZ33fl
# 8rJwnnIF/Ku4OZEN24wQLYsOMHh6WKADxkXJhiYUwBe2vCMHDVLpbCY7CbPpQdtB
# YHEkto0MFADdyX50sNVgTKboPyCxPW6GLiR5R+qqzNRzpYru2pTsM6EodSTgcMbe
# aDZI7ssnv+NYMyWstE1IXQCUywLQohNDo6H7/HNwC8HtdsGd5j0j+WOIEO5PyCbj
# n5viNWWCUu7Ko6Qx68NuxHf++swe9YQhufh0hzJnixidTRPkBUgYQ6xubG6I5g/2
# OO1BByOu9/jt5vMTTvctq2YWOhUjoOZPe53eYSzjvNydMYIaMjCCGi4CAQEwgZ8w
# gYcxCzAJBgNVBAYTAlVTMRMwEQYDVQQIEwpXYXNoaW5ndG9uMRAwDgYDVQQHEwdS
# ZWRtb25kMR4wHAYDVQQKExVNaWNyb3NvZnQgQ29ycG9yYXRpb24xMTAvBgNVBAMT
# KE1pY3Jvc29mdCBNYXJrZXRwbGFjZSBQcm9kdWN0aW9uIENBIDIwMTECEzMAAAA8
# 3uHyS/6lAfwAAQAAADwwDQYJYIZIAWUDBAIBBQCggbAwGQYJKoZIhvcNAQkDMQwG
# CisGAQQBgjcCAQQwHAYKKwYBBAGCNwIBCzEOMAwGCisGAQQBgjcCARUwLwYJKoZI
# hvcNAQkEMSIEIIHqws2g6cn0S7TNrQRrd8fHZs3usGlRT+9DpCUFIbPfMEQGCisG
# AQQBgjcCAQwxNjA0oBCADgBWAFMAIABDAG8AZABloSCAHmh0dHBzOi8vY29kZS52
# aXN1YWxzdHVkaW8uY29tLzANBgkqhkiG9w0BAQEFAASCAQCnmQpMjtVvsjCL+vQx
# O8I6G5r6Rhsivk96jFFFA2Jv2ZyUO8syCAzv4ntvip4Ji/Q9N9wisDV6a6GGt/Az
# HiwNxIk3mRUgrCeSmOCYWTQleCewXkivqcMhx+2D3GJXpBJMHH8Vv097QqRl/tEz
# BNU5vzFtf1XwQ0Od+Y/7GvF40aCArgU13WBkf5rzjxCRG1zp3V0g7RaSSn+Iod01
# UitSghIwhTqnDwm5SyY9OPAwbhuzj+kHtpUqKvnXN/SKxdNrjYb2Jxa/t807LtlM
# kBAJETplrSyVtTZ1ig9kR8awRFmom4cQfzxWmCgirBKrTrsVusEPRhavFnQ4DkiD
# kQ74oYIXsDCCF6wGCisGAQQBgjcDAwExghecMIIXmAYJKoZIhvcNAQcCoIIXiTCC
# F4UCAQMxDzANBglghkgBZQMEAgEFADCCAVoGCyqGSIb3DQEJEAEEoIIBSQSCAUUw
# ggFBAgEBBgorBgEEAYRZCgMBMDEwDQYJYIZIAWUDBAIBBQAEIBMyvWZvTH3b0KJ5
# jFiSy0W6wE9WcEtG5RAh3jJQ2UAWAgZqif7WL8sYEzIwMjYwOTA4MjExMjQ1LjA1
# NlowBIACAfSggdmkgdYwgdMxCzAJBgNVBAYTAlVTMRMwEQYDVQQIEwpXYXNoaW5n
# dG9uMRAwDgYDVQQHEwdSZWRtb25kMR4wHAYDVQQKExVNaWNyb3NvZnQgQ29ycG9y
# YXRpb24xLTArBgNVBAsTJE1pY3Jvc29mdCBJcmVsYW5kIE9wZXJhdGlvbnMgTGlt
# aXRlZDEnMCUGA1UECxMeblNoaWVsZCBUU1MgRVNOOjZGMUEtMDVFMC1EOTQ3MSUw
# IwYDVQQDExxNaWNyb3NvZnQgVGltZS1TdGFtcCBTZXJ2aWNloIIR/jCCBygwggUQ
# oAMCAQICEzMAAAIcCVUV18NZB9EAAQAAAhwwDQYJKoZIhvcNAQELBQAwfDELMAkG
# A1UEBhMCVVMxEzARBgNVBAgTCldhc2hpbmd0b24xEDAOBgNVBAcTB1JlZG1vbmQx
# HjAcBgNVBAoTFU1pY3Jvc29mdCBDb3Jwb3JhdGlvbjEmMCQGA1UEAxMdTWljcm9z
# b2Z0IFRpbWUtU3RhbXAgUENBIDIwMTAwHhcNMjUwODE0MTg0ODMxWhcNMjYxMTEz
# MTg0ODMxWjCB0zELMAkGA1UEBhMCVVMxEzARBgNVBAgTCldhc2hpbmd0b24xEDAO
# BgNVBAcTB1JlZG1vbmQxHjAcBgNVBAoTFU1pY3Jvc29mdCBDb3Jwb3JhdGlvbjEt
# MCsGA1UECxMkTWljcm9zb2Z0IElyZWxhbmQgT3BlcmF0aW9ucyBMaW1pdGVkMScw
# JQYDVQQLEx5uU2hpZWxkIFRTUyBFU046NkYxQS0wNUUwLUQ5NDcxJTAjBgNVBAMT
# HE1pY3Jvc29mdCBUaW1lLVN0YW1wIFNlcnZpY2UwggIiMA0GCSqGSIb3DQEBAQUA
# A4ICDwAwggIKAoICAQCjDTEQBRoUjLIshd4XN4jwgrIE43a7QOvTYhITmn0bkJRd
# +cW7ZLQTWBYIy8NamilfqVHGOaCepovcG2daUFVOjzFQ1Fm7beJ7hgEwAkHtS3qa
# eqcdXC8MnEY7hMPdKesJ37KDfkH1AV6Orejj44HK9ePKdrKlnK6RxBouwpC+jETw
# SUcfvNw5cQlaZTeudfNpb9LhIfc4+GhRtNNzLqdSArHmlFaJDbhQQ8tjNzEYmOqO
# TP4aIJYY8UcMx1bzqVpa+YKyWi5A+w3Z4GTx3ElwRmZbiXqnhO2Ghdx97EQD1h1h
# ozPXRoyFk2l2w1oO0NBQwMQLeTUPUzLr0xdI+VSYP3EXIOWReJVrsEISnddxW2pO
# DMcbCvbwkPqgTvMQ9h65k6K4IFdNlKj/CTe1sOWwRJsg9XqKdiqvPGIxiqXF8J3M
# LcKKaH381P8uT39pT4jLJz1vc5pPR1nzCAtpUMIYQtEyurIiZ0Ue/Qy51y3Nb+Q+
# xXclr25+kpa6MSI3cJb/9fyEVr2PkiY15DNwyK3cyhJqgbCduJklfUjKJsimGWpx
# xcWTihNNI5AGwBTDxTSDA6czlQkPyYFQF3rk2no0GTHZy+IngjfgbJcUJbLLkW3V
# CwFjJV8Abco6EJ88dB/yVDMm8uvnthbRsP/FWzgCDiBNLopk3IUR9f2MV1GWvQID
# AQABo4IBSTCCAUUwHQYDVR0OBBYEFFreY4LMHy7vOm8OHwwYpVgsKTtkMB8GA1Ud
# IwQYMBaAFJ+nFV0AXmJdg/Tl0mWnG1M1GelyMF8GA1UdHwRYMFYwVKBSoFCGTmh0
# dHA6Ly93d3cubWljcm9zb2Z0LmNvbS9wa2lvcHMvY3JsL01pY3Jvc29mdCUyMFRp
# bWUtU3RhbXAlMjBQQ0ElMjAyMDEwKDEpLmNybDBsBggrBgEFBQcBAQRgMF4wXAYI
# KwYBBQUHMAKGUGh0dHA6Ly93d3cubWljcm9zb2Z0LmNvbS9wa2lvcHMvY2VydHMv
# TWljcm9zb2Z0JTIwVGltZS1TdGFtcCUyMFBDQSUyMDIwMTAoMSkuY3J0MAwGA1Ud
# EwEB/wQCMAAwFgYDVR0lAQH/BAwwCgYIKwYBBQUHAwgwDgYDVR0PAQH/BAQDAgeA
# MA0GCSqGSIb3DQEBCwUAA4ICAQCSVvrD915qJ3cG6NAK1YUF7Sf2mTJHL7LJYSDv
# SIPCgnm7R7Q77gZ6s3N1lvXNM+wcnwQYzKjUrvK0vbX6mZ0UxOXX08Lw4nljan5c
# pRDLZ0P6GCBEyYmANCyBs4LEdh476ODi36+DrXBSui/PMuQffPQ8lde+g24GP0t1
# r0KI0x3rTjnUq5t730CtJ/pkyPe3SnisVuBJrMOz7xMn7woDkZVpiM8eP2uUy4jd
# aOiERz1qmdDqEyMxyTeOUdkjCW5Vh5RATSqOYCl8y1MATNsxR1jywtO6cvUaRsNJ
# 4qf07uWUEac23IzW4z0x2/VXJaHTP8iuJAoiOe2qobKgXQe8Mc4VkLJQME8t+XKK
# 7tjXND+w+i6exv3poF9B2reHcs6fq36b0Sc3P8bozPNa+kmTpiBMdMip5A38X9em
# I+9t96Teer89hsvdq76QF9FQeIIVdK+3qWivQcLrbq9SbP1k087HARYu5xyibGzL
# cnBYfv2+wz/sBGqgbmHp3o1qF9o65E/hcj3G10fc9r80IvJCPEpfIvHPBDON12Rf
# YSlMmeXKm6E+YR15rn1TPYTfTcvHJdKcoG8awCfJZgB+d6OvdgCIv1is3aXZ2fX3
# xGkDgMKb1C1liLALSrZ+5S+6Lfg988hRkHJ/vAe65a7nSFj1YvHWQ4wjzHKjsAjp
# No2ucjCCB3EwggVZoAMCAQICEzMAAAAVxedrngKbSZkAAAAAABUwDQYJKoZIhvcN
# AQELBQAwgYgxCzAJBgNVBAYTAlVTMRMwEQYDVQQIEwpXYXNoaW5ndG9uMRAwDgYD
# VQQHEwdSZWRtb25kMR4wHAYDVQQKExVNaWNyb3NvZnQgQ29ycG9yYXRpb24xMjAw
# BgNVBAMTKU1pY3Jvc29mdCBSb290IENlcnRpZmljYXRlIEF1dGhvcml0eSAyMDEw
# MB4XDTIxMDkzMDE4MjIyNVoXDTMwMDkzMDE4MzIyNVowfDELMAkGA1UEBhMCVVMx
# EzARBgNVBAgTCldhc2hpbmd0b24xEDAOBgNVBAcTB1JlZG1vbmQxHjAcBgNVBAoT
# FU1pY3Jvc29mdCBDb3Jwb3JhdGlvbjEmMCQGA1UEAxMdTWljcm9zb2Z0IFRpbWUt
# U3RhbXAgUENBIDIwMTAwggIiMA0GCSqGSIb3DQEBAQUAA4ICDwAwggIKAoICAQDk
# 4aZM57RyIQt5osvXJHm9DtWC0/3unAcH0qlsTnXIyjVX9gF/bErg4r25PhdgM/9c
# T8dm95VTcVrifkpa/rg2Z4VGIwy1jRPPdzLAEBjoYH1qUoNEt6aORmsHFPPFdvWG
# UNzBRMhxXFExN6AKOG6N7dcP2CZTfDlhAnrEqv1yaa8dq6z2Nr41JmTamDu6Gnsz
# rYBbfowQHJ1S/rboYiXcag/PXfT+jlPP1uyFVk3v3byNpOORj7I5LFGc6XBpDco2
# LXCOMcg1KL3jtIckw+DJj361VI/c+gVVmG1oO5pGve2krnopN6zL64NF50ZuyjLV
# wIYwXE8s4mKyzbnijYjklqwBSru+cakXW2dg3viSkR4dPf0gz3N9QZpGdc3EXzTd
# EonW/aUgfX782Z5F37ZyL9t9X4C626p+Nuw2TPYrbqgSUei/BQOj0XOmTTd0lBw0
# gg/wEPK3Rxjtp+iZfD9M269ewvPV2HM9Q07BMzlMjgK8QmguEOqEUUbi0b1qGFph
# AXPKZ6Je1yh2AuIzGHLXpyDwwvoSCtdjbwzJNmSLW6CmgyFdXzB0kZSU2LlQ+QuJ
# YfM2BjUYhEfb3BvR/bLUHMVr9lxSUV0S2yW6r1AFemzFER1y7435UsSFF5PAPBXb
# GjfHCBUYP3irRbb1Hode2o+eFnJpxq57t7c+auIurQIDAQABo4IB3TCCAdkwEgYJ
# KwYBBAGCNxUBBAUCAwEAATAjBgkrBgEEAYI3FQIEFgQUKqdS/mTEmr6CkTxGNSnP
# EP8vBO4wHQYDVR0OBBYEFJ+nFV0AXmJdg/Tl0mWnG1M1GelyMFwGA1UdIARVMFMw
# UQYMKwYBBAGCN0yDfQEBMEEwPwYIKwYBBQUHAgEWM2h0dHA6Ly93d3cubWljcm9z
# b2Z0LmNvbS9wa2lvcHMvRG9jcy9SZXBvc2l0b3J5Lmh0bTATBgNVHSUEDDAKBggr
# BgEFBQcDCDAZBgkrBgEEAYI3FAIEDB4KAFMAdQBiAEMAQTALBgNVHQ8EBAMCAYYw
# DwYDVR0TAQH/BAUwAwEB/zAfBgNVHSMEGDAWgBTV9lbLj+iiXGJo0T2UkFvXzpoY
# xDBWBgNVHR8ETzBNMEugSaBHhkVodHRwOi8vY3JsLm1pY3Jvc29mdC5jb20vcGtp
# L2NybC9wcm9kdWN0cy9NaWNSb29DZXJBdXRfMjAxMC0wNi0yMy5jcmwwWgYIKwYB
# BQUHAQEETjBMMEoGCCsGAQUFBzAChj5odHRwOi8vd3d3Lm1pY3Jvc29mdC5jb20v
# cGtpL2NlcnRzL01pY1Jvb0NlckF1dF8yMDEwLTA2LTIzLmNydDANBgkqhkiG9w0B
# AQsFAAOCAgEAnVV9/Cqt4SwfZwExJFvhnnJL/Klv6lwUtj5OR2R4sQaTlz0xM7U5
# 18JxNj/aZGx80HU5bbsPMeTCj/ts0aGUGCLu6WZnOlNN3Zi6th542DYunKmCVgAD
# sAW+iehp4LoJ7nvfam++Kctu2D9IdQHZGN5tggz1bSNU5HhTdSRXud2f8449xvNo
# 32X2pFaq95W2KFUn0CS9QKC/GbYSEhFdPSfgQJY4rPf5KYnDvBewVIVCs/wMnosZ
# iefwC2qBwoEZQhlSdYo2wh3DYXMuLGt7bj8sCXgU6ZGyqVvfSaN0DLzskYDSPeZK
# PmY7T7uG+jIa2Zb0j/aRAfbOxnT99kxybxCrdTDFNLB62FD+CljdQDzHVG2dY3RI
# LLFORy3BFARxv2T5JL5zbcqOCb2zAVdJVGTZc9d/HltEAY5aGZFrDZ+kKNxnGSgk
# ujhLmm77IVRrakURR6nxt67I6IleT53S0Ex2tVdUCbFpAUR+fKFhbHP+CrvsQWY9
# af3LwUFJfn6Tvsv4O+S3Fb+0zj6lMVGEvL8CwYKiexcdFYmNcP7ntdAoGokLjzba
# ukz5m/8K6TT4JDVnK+ANuOaMmdbhIurwJ0I9JZTmdHRbatGePu1+oDEzfbzL6Xu/
# OHBE0ZDxyKs6ijoIYn/ZcGNTTY3ugm2lBRDBcQZqELQdVTNYs6FwZvKhggNZMIIC
# QQIBATCCAQGhgdmkgdYwgdMxCzAJBgNVBAYTAlVTMRMwEQYDVQQIEwpXYXNoaW5n
# dG9uMRAwDgYDVQQHEwdSZWRtb25kMR4wHAYDVQQKExVNaWNyb3NvZnQgQ29ycG9y
# YXRpb24xLTArBgNVBAsTJE1pY3Jvc29mdCBJcmVsYW5kIE9wZXJhdGlvbnMgTGlt
# aXRlZDEnMCUGA1UECxMeblNoaWVsZCBUU1MgRVNOOjZGMUEtMDVFMC1EOTQ3MSUw
# IwYDVQQDExxNaWNyb3NvZnQgVGltZS1TdGFtcCBTZXJ2aWNloiMKAQEwBwYFKw4D
# AhoDFQBaZOIDTW7mbGr+dXGJEksw6yRUZ6CBgzCBgKR+MHwxCzAJBgNVBAYTAlVT
# MRMwEQYDVQQIEwpXYXNoaW5ndG9uMRAwDgYDVQQHEwdSZWRtb25kMR4wHAYDVQQK
# ExVNaWNyb3NvZnQgQ29ycG9yYXRpb24xJjAkBgNVBAMTHU1pY3Jvc29mdCBUaW1l
# LVN0YW1wIFBDQSAyMDEwMA0GCSqGSIb3DQEBCwUAAgUA7krlDzAiGA8yMDI2MDkw
# ODE5NDgzMVoYDzIwMjYwOTA5MTk0ODMxWjB3MD0GCisGAQQBhFkKBAExLzAtMAoC
# BQDuSuUPAgEAMAoCAQACAhTlAgH/MAcCAQACAhPcMAoCBQDuTDaPAgEAMDYGCisG
# AQQBhFkKBAIxKDAmMAwGCisGAQQBhFkKAwKgCjAIAgEAAgMHoSChCjAIAgEAAgMB
# hqAwDQYJKoZIhvcNAQELBQADggEBAA1BYkdCWwYsbYyvjKXzBmoZz5aPY6x0SwNN
# X229U2etPIDytUEiUc02nMCmkE8GLIwW/pjd8cSiuHx0yGZMojI9w3v5+pQzCFjv
# qpcoNGeYq8yUrY5RexSGQSoppT26QFY3I1DE8nQa5s0xSxVcWLLULRVEdmxuZqMZ
# RY3qpYoSDeD/HuougbrJqmZb4ywAoIW+uUEdXVspR1DMKktUzep6RYxNtsTfwvT+
# cdEhGjGRwOXww6r8T90Dx1iBj8s0EMRMRcAKs8JUCGQXMRehcK4q+OVIgRbo7Yuo
# rGh2KtOTsGaE6vnUZ4IASTqHSTbs+9brq2FQunadh54GcyAthxsxggQNMIIECQIB
# ATCBkzB8MQswCQYDVQQGEwJVUzETMBEGA1UECBMKV2FzaGluZ3RvbjEQMA4GA1UE
# BxMHUmVkbW9uZDEeMBwGA1UEChMVTWljcm9zb2Z0IENvcnBvcmF0aW9uMSYwJAYD
# VQQDEx1NaWNyb3NvZnQgVGltZS1TdGFtcCBQQ0EgMjAxMAITMwAAAhwJVRXXw1kH
# 0QABAAACHDANBglghkgBZQMEAgEFAKCCAUowGgYJKoZIhvcNAQkDMQ0GCyqGSIb3
# DQEJEAEEMC8GCSqGSIb3DQEJBDEiBCDVeM6Kkx7L1quIAK/C3VWRiDuiqkHWBpcQ
# jG5TrxtZ3DCB+gYLKoZIhvcNAQkQAi8xgeowgecwgeQwgb0EIKAgaSY2F2jv4oTt
# 1aEj4TYK3HZEtahi+8mh0IhyIcdoMIGYMIGApH4wfDELMAkGA1UEBhMCVVMxEzAR
# BgNVBAgTCldhc2hpbmd0b24xEDAOBgNVBAcTB1JlZG1vbmQxHjAcBgNVBAoTFU1p
# Y3Jvc29mdCBDb3Jwb3JhdGlvbjEmMCQGA1UEAxMdTWljcm9zb2Z0IFRpbWUtU3Rh
# bXAgUENBIDIwMTACEzMAAAIcCVUV18NZB9EAAQAAAhwwIgQgDffsW28YAMENbD6p
# Y75jhp22GqXN9byGKaZTziKeeAEwDQYJKoZIhvcNAQELBQAEggIAIozssMVtxc4/
# BN5X8ykS2F5fvuNQm1uWKxYCxvV6dbSKQu35lV0asrJlwcrgBbk13ooRPg3BTR1+
# j11n8nvQxquCrKkDFikH8FvgiY7ntzSITM3X1EzHqX7CsJ6pOLF3Sb5IKW2HkMaB
# /j/LfxKzCRUMhFQ/1Rtzp8AvKRGgyUhhsZ7rgO6MWKpp9eKXVzda7lbEC4D/ADBg
# mrg4l91pzzC5vb2sqvhvd3nc9CTygLsAN12fNJiQPhOtylAWi1Ba5LAqNPTrDgLV
# eGsxyF+qui5KsAHFngIyTKxXw3jrIyi8iPplaS5DXE4KblXEzhhYysPm4HUC6CXX
# yvs0RwQ2xoAGDrc6EM27CfqNEYv3PlEWF8cl9KwV1OHQ4vULTgPWTad+hRawmtta
# Mm+0ey7JB4cLUt1zMerfvIY34O2YMHysYCaXtdVnaAHXNwPOda8eYE77UMN/lkCb
# Dkvs/4YXVGqgbXgVs7rQjO8NDs8oE9sGVAW647FnXuZbKjf4C7Rzdb8LpTqzDlQW
# oFf2pFROkJAv55it8rXalM10f9FACQhPeUuiOAlPGjWf+1n9gSTrrlrGrvzSztrZ
# dDmjNEbj3m9bec4WIw/eijp9a/32TJnU8mPyskApWKmXDHMdE1yVDS/a6a1Z7537
# HHZCespFdIRQn/uxwKkNTVUtqFV7PDU=
# SIG # End signature block
