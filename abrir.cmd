@echo off
rem Copiloto de reunião: sobe o servidor local e abre a página no Chrome. Fechar esta janela desliga.
cd /d "%~dp0"
start "" chrome http://localhost:3030
node servidor.mjs
