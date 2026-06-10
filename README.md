# MicroPhotos

Frontend para consultar o historico de capturas da API `image-processing-server`.

## Como rodar

```bash
npm install
cp .env.example .env
npm run dev
```

Por padrao, o app consome:

```env
VITE_API_BASE_URL=https://image-processing-server-eight.vercel.app
```

## Scripts

- `npm run dev`: servidor local de desenvolvimento.
- `npm run build`: build de producao.
- `npm run preview`: preview local do build.
- `npm run lint`: checagem TypeScript.
