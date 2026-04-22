# infra/database

Camada de **infraestrutura** do banco. Responsável por abrir e expor o pool de conexões do SQL Server. Não contém regra de negócio.

## Arquivos
- `connection.ts` — cria um `ConnectionPool` do pacote `mssql` usando `dbConfig` de `config/database.ts`.

## Decisões
- **Pool lazy**: o `ConnectionPool` só é instanciado na primeira chamada de `getPool()`. Permite que o processo suba mesmo se o DB estiver temporariamente fora (erro só aparece na primeira query).
- **Pool singleton**: uma única `Promise<ConnectionPool>` é reutilizada por todo o processo. Não criamos pools por request.
- **Reset em erro de conexão**: se o primeiro `.connect()` falhar, a Promise é descartada para permitir uma retentativa.
- **Parâmetros sempre tipados**: qualquer repository que usa o pool deve chamar `request.input('nome', sql.TipoDeDado, valor)` — nunca concatenar strings no SQL (anti-SQLi).
- **`options.useUTC: false`**: o SQL Server grava `datetime` sem timezone. Com o default (`useUTC: true`) o driver `tedious` interpreta o valor como UTC e o converte pra hora local, o que gera um offset de 3h (ex.: DB tem `10:23:32`, Node entrega `07:23:32`). Com `useUTC: false`, o driver lê como hora local do processo Node — exige que o servidor Node rode na mesma timezone em que o SQL Server grava (Brasil UTC-3).

## Como usar em um repository

```ts
import { getPool, sql } from '../../../infra/database/connection';

export class MeuRepository {
  async find(id: number) {
    const pool = await getPool();
    const result = await pool
      .request()
      .input('id', sql.Int, id)
      .query('SELECT * FROM dbo.TABELA WHERE ID = @id');
    return result.recordset[0] ?? null;
  }
}
```

## Encerramento
`closePool()` é chamado no shutdown do processo (SIGINT/SIGTERM em `infra/http/server.ts`).
