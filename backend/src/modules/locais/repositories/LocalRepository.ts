import { getPool, sql } from '../../../infra/database/connection';

export interface LocalRow {
  ID_LOCAL: number;
  CODIGO_PONTO: string | null;
  ENDERECO: string | null;
  LATITUDE: number | null;
  LONGITUDE: number | null;
  RAIO: number | null;
  PONTO_PARADA: string | number | boolean | null;
  LOCAL_GEO_WKT: string | null;
}

export interface LocalUpsertInput {
  codigoPonto: string;
  endereco: string;
  latitude: number;
  longitude: number;
  raio: number;
  pontoParada: string | null;
  poligonoWkt: string | null;
}

// LOCAL_GEO é `geography` e pode conter qualquer tipo (Point, Polygon, MultiPolygon...).
// Dados legados frequentemente vêm como Point (espelho do par LAT/LNG). Aqui
// retornamos WKT só quando for de fato polígono — assim o front sabe quando há
// área desenhável e o botão de polígono fica desabilitado para registros antigos.
const BASE_SELECT = `
  SELECT
    ID_LOCAL,
    CODIGO_PONTO,
    ENDERECO,
    LATITUDE,
    LONGITUDE,
    RAIO,
    PONTO_PARADA,
    CASE
      WHEN LOCAL_GEO IS NULL THEN NULL
      WHEN LOCAL_GEO.STGeometryType() IN ('Polygon', 'MultiPolygon')
        THEN LOCAL_GEO.STAsText()
      ELSE NULL
    END AS LOCAL_GEO_WKT
  FROM [TOP_TECHNO].[dbo].[TB_LOCAL]
`;

export class LocalRepository {
  async list(): Promise<LocalRow[]> {
    const pool = await getPool();
    const result = await pool
      .request()
      .query<LocalRow>(`${BASE_SELECT} ORDER BY ID_LOCAL DESC`);
    return result.recordset;
  }

  async findById(id: number): Promise<LocalRow | null> {
    const pool = await getPool();
    const result = await pool
      .request()
      .input('id', sql.BigInt, id)
      .query<LocalRow>(`${BASE_SELECT} WHERE ID_LOCAL = @id`);
    return result.recordset[0] ?? null;
  }

  async create(input: LocalUpsertInput): Promise<LocalRow> {
    const pool = await getPool();
    const insert = await pool
      .request()
      .input('codigoPonto', sql.VarChar(50), input.codigoPonto)
      .input('endereco', sql.VarChar(500), input.endereco)
      .input('latitude', sql.Float, input.latitude)
      .input('longitude', sql.Float, input.longitude)
      .input('raio', sql.Int, input.raio)
      .input('pontoParada', sql.VarChar(200), input.pontoParada)
      .input('wkt', sql.NVarChar(sql.MAX), input.poligonoWkt)
      .query<{ ID_LOCAL: number }>(
        `INSERT INTO [TOP_TECHNO].[dbo].[TB_LOCAL]
           (CODIGO_PONTO, ENDERECO, LATITUDE, LONGITUDE, RAIO, PONTO_PARADA, LOCAL_GEO)
         OUTPUT INSERTED.ID_LOCAL
         VALUES
           (@codigoPonto, @endereco, @latitude, @longitude, @raio, @pontoParada,
            CASE WHEN @wkt IS NULL THEN NULL ELSE geography::STGeomFromText(@wkt, 4326) END);`,
      );
    const newId = insert.recordset[0]?.ID_LOCAL;
    if (newId == null) {
      throw new Error('INSERT TB_LOCAL não retornou ID');
    }
    const row = await this.findById(newId);
    if (!row) {
      throw new Error('Local recém-criado não encontrado');
    }
    return row;
  }

  async update(id: number, input: LocalUpsertInput): Promise<LocalRow | null> {
    const pool = await getPool();
    const result = await pool
      .request()
      .input('id', sql.BigInt, id)
      .input('codigoPonto', sql.VarChar(50), input.codigoPonto)
      .input('endereco', sql.VarChar(500), input.endereco)
      .input('latitude', sql.Float, input.latitude)
      .input('longitude', sql.Float, input.longitude)
      .input('raio', sql.Int, input.raio)
      .input('pontoParada', sql.VarChar(200), input.pontoParada)
      .input('wkt', sql.NVarChar(sql.MAX), input.poligonoWkt)
      .query(
        `UPDATE [TOP_TECHNO].[dbo].[TB_LOCAL]
           SET CODIGO_PONTO = @codigoPonto,
               ENDERECO     = @endereco,
               LATITUDE     = @latitude,
               LONGITUDE    = @longitude,
               RAIO         = @raio,
               PONTO_PARADA = @pontoParada,
               LOCAL_GEO    = CASE WHEN @wkt IS NULL THEN NULL ELSE geography::STGeomFromText(@wkt, 4326) END
         WHERE ID_LOCAL = @id;`,
      );
    if (result.rowsAffected[0] === 0) return null;
    return this.findById(id);
  }

  async delete(id: number): Promise<boolean> {
    const pool = await getPool();
    const result = await pool
      .request()
      .input('id', sql.BigInt, id)
      .query('DELETE FROM [TOP_TECHNO].[dbo].[TB_LOCAL] WHERE ID_LOCAL = @id;');
    return result.rowsAffected[0] > 0;
  }
}
