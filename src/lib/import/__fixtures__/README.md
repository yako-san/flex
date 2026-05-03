# Fixtures pour les tests d'import v1

## v1-dump.json

Test e2e d'`importV1` sur le dump v1 réel yako-cyclo.

**Comment activer le test e2e** :

1. Récupérer le dump v1 via l'endpoint admin v1 :
   ```bash
   curl -H "Authorization: Bearer <NEXTAUTH_TOKEN>" \
     https://flex-rev-app.vercel.app/api/admin/export-v1 \
     > src/lib/import/__fixtures__/v1-dump.json
   ```

2. Ou coller manuellement le JSON exporté.

3. Lancer les tests :
   ```bash
   npm test
   ```

Si le fichier n'existe pas, le test e2e est skippé silencieusement (les autres
tests passent toujours).

**Ne pas commiter le dump** s'il contient des PII clients réels. Le `.gitignore`
exclut `__fixtures__/v1-dump.json` par défaut.
