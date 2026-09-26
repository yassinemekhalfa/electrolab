# ElectroLab Electrical Simulator

A browser-based educational electrical/electronics simulator UI inspired by professional training workbenches.

## Features

- 100+ electrical, electronic and industrial automation components
- Component library with search and category filters
- Drag/drop circuit canvas
- Move, rotate, delete, wire and configure components
- Basic virtual simulation state with voltage/current/load estimates
- Starter circuit templates
- Dashboard and professional simulator workspace
- Responsive layout

## Run in VS Code

1. Extract the ZIP.
2. Open the `electrolab` folder in VS Code.
3. Open Terminal > New Terminal.
4. Run:

```bash
npm install
npm run dev
```

5. Open the local URL shown by Vite, usually `http://localhost:5173`.

### Windows PowerShell execution-policy issue
If `npm.ps1 cannot be loaded because running scripts is disabled`, use Command Prompt inside VS Code, or run:

```powershell
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
```

Then close/reopen the terminal.

## Important

This version is an educational front-end simulator with simplified calculations. It is not a full SPICE/ETAP/EPLAN replacement and must not be used as the sole basis for real electrical safety or protection sizing.
