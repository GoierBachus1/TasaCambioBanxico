import axios from 'axios';
import { Client } from 'pg';

// Configura la conexión a la base de datos
const client = new Client({
  user: 'goier',
  host: 'localhost',
  database: 'prueba_db',
  password: 'x',
  port: 5432,
});

const API_KEY = 'ecc6cb2c1fab9f7e8f796b4d6b65a72c8c7b9c0710992274d1d15c979dc29690';
const USD_SERIES_ID = 'SF43718';
const EUR_SERIES_ID = 'SF46410';

function formatDateString(dateString: string): string {
  const [day, month, year] = dateString.split('/');
  return `${year}-${month}-${day}`;
}

async function getExchangeRates() {
  try {
    const urls = [
      `https://www.banxico.org.mx/SieAPIRest/service/v1/series/${USD_SERIES_ID}/datos/oportuno?token=${API_KEY}`,
      `https://www.banxico.org.mx/SieAPIRest/service/v1/series/${EUR_SERIES_ID}/datos/oportuno?token=${API_KEY}`
    ];

    const [usdResponse, eurResponse] = await Promise.all(urls.map(url => axios.get(url)));

    const usdRate = usdResponse.data.bmx.series[0].datos[0];
    const eurRate = eurResponse.data.bmx.series[0].datos[0];

    return [
      { fecha: formatDateString(usdRate.fecha), tipodecambio: parseFloat(usdRate.dato) },
      { fecha: formatDateString(eurRate.fecha), tipodecambio: parseFloat(eurRate.dato) }
    ];
  } catch (error) {
    console.error('Error al obtener las tasas de cambio:', error);
    return null;
  }
}

async function storeExchangeRates(rates: any) {
  const query = 'INSERT INTO taza_cambio (fecha, tipodecambio) VALUES ($1, $2)';
  
  for (const rate of rates) {
    await client.query(query, [rate.fecha, rate.tipodecambio]);
  }
}

async function main() {
  try {
    await client.connect();

    const rates = await getExchangeRates();

    if (rates) {
      await storeExchangeRates(rates);

      console.log('Tasas de cambio obtenidas y almacenadas:');
      console.log(rates);
    }
  } catch (error) {
    console.error('Error en la ejecución del programa:', error);
  } finally {
    await client.end();
  }
}

main();
