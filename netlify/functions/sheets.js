// netlify/functions/sheets.js

import fetch from "node-fetch";

exports.handler = async (event, context) => {
  // Solo permitir GET requests
  if (event.httpMethod !== "GET") {
    return {
      statusCode: 405,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "GET",
      },
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  // Rate limiting básico - logging del IP para debug
  const clientIP =
    event.headers["x-forwarded-for"] || event.headers["client-ip"] || "unknown";

  console.log(`Request from IP: ${clientIP} at ${new Date().toISOString()}`);

  try {
    // Tu URL real de Google Sheets (debe estar configurada en variables de entorno de Netlify)
    const SHEET_URL = process.env.SHEET_URL;

    if (!SHEET_URL) {
      console.error("SHEET_URL environment variable not configured");
      throw new Error("SHEET_URL not configured");
    }

    console.log("Fetching data from Google Sheets...");

    // Fetch con timeout y headers apropiados
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 segundos timeout

    const response = await fetch(SHEET_URL, {
      method: "GET",
      headers: {
        Accept: "text/csv, text/plain, */*",
        "User-Agent": "Netlify-Function/1.0 (Physics-Material-Finder)",
        "Cache-Control": "no-cache",
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(
        `HTTP error! status: ${response.status} - ${response.statusText}`
      );
    }

    const csvData = await response.text();

    console.log(
      `Successfully fetched ${csvData.length} characters of CSV data`
    );

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "GET",
        "Content-Type": "text/csv; charset=utf-8",
        "Cache-Control": "public, max-age=300, s-maxage=300", // 5 minutos de cache
        "X-Robots-Tag": "noindex, nofollow", // Evitar indexación
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "DENY",
      },
      body: csvData,
    };
  } catch (error) {
    console.error("Error in sheets function:", {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      clientIP: clientIP,
    });

    // Diferentes tipos de error
    let errorMessage = "Failed to fetch data";
    let statusCode = 500;

    if (error.name === "AbortError") {
      errorMessage = "Request timeout";
      statusCode = 504;
    } else if (error.message.includes("SHEET_URL not configured")) {
      errorMessage = "Server configuration error";
      statusCode = 500;
    } else if (error.message.includes("HTTP error!")) {
      errorMessage = "External service error";
      statusCode = 502;
    }

    return {
      statusCode: statusCode,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "GET",
        "Content-Type": "application/json",
        "X-Robots-Tag": "noindex, nofollow",
      },
      body: JSON.stringify({
        error: errorMessage,
        timestamp: new Date().toISOString(),
        // No incluir detalles sensibles en producción
        ...(process.env.NODE_ENV === "development" && {
          details: error.message,
        }),
      }),
    };
  }
};
