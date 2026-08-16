# One-command navigation and favicon fix

This package does NOT create duplicate files and does NOT change image quality, dimensions, URLs or media.

## Use in VS Code
1. Extract this ZIP directly inside the cloned repository folder.
2. Open VS Code Terminal in the repository root.
3. Run:

```powershell
Set-ExecutionPolicy -Scope Process Bypass
.\one-command-navigation-fix\apply-fix.ps1
```

4. If it says success, run:

```powershell
git status
git add src
git commit -m "Fix navigation and favicon"
git push origin main
```

The patch updates existing source files in place, so there is no duplicate-file upload step.
